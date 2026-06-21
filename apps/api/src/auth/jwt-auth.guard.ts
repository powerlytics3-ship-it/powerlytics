import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { Role } from "@powerlytic/types";
import { PrismaService } from "../prisma/prisma.service.js";
import { RequestUser } from "./current-user.js";
import { RequestContextService } from "./request-context.service.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly context: RequestContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_REQUIRED !== "true") {
      const request = context.switchToHttp().getRequest<{ user?: RequestUser; headers: Record<string, string | undefined> }>();
      request.user = {
        id: "usr-admin",
        email: "admin@powerlytic.com",
        roles: [Role.SUPER_ADMIN],
        workspaceId: String(request.headers["x-workspace-id"] ?? "ws-platform"),
        workspaceIds: ["ws-platform"],
        authType: "demo"
      };
      this.context.setUser(request.user);
      return true;
    }

    // TODO: set AUTH_REQUIRED=true only after OIDC_ISSUER_URL and OIDC_AUDIENCE are correct.
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: RequestUser }>();
    const header = request.headers.authorization;
    const deviceSecret = header?.startsWith("Device ") ? header.slice("Device ".length) : request.headers["x-device-key"];
    if (deviceSecret) {
      const credential = await this.prisma.deviceCredential.findFirst({
        where: { keyHash: hashDeviceSecret(deviceSecret), active: true },
        include: { device: true }
      });
      if (!credential || !credential.device.workspaceId) throw new UnauthorizedException("Invalid device credential");
      request.user = {
        id: credential.device.id,
        email: `${credential.device.id}@device.powerlytic.local`,
        roles: [],
        workspaceId: credential.device.workspaceId,
        workspaceIds: [credential.device.workspaceId],
        authType: "device",
        deviceId: credential.device.id
      };
      this.context.setUser(request.user);
      await this.prisma.deviceCredential.update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } });
      return true;
    }

    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) throw new UnauthorizedException("Missing bearer token");

    const issuer = process.env.OIDC_ISSUER_URL;
    const audience = process.env.OIDC_AUDIENCE;
    if (!issuer || !audience) {
      throw new UnauthorizedException("OIDC issuer/audience is not configured");
    }

    this.jwks ??= createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));
    const verified = await jwtVerify(token, this.jwks, { issuer, audience });
    const realmRoles = extractRoles(verified.payload);
    const sub = String(verified.payload.sub);
    const email = String(verified.payload.email ?? "");
    const dbUser = await this.prisma.user.findFirst({
      where: { OR: [{ externalSub: sub }, ...(email ? [{ email }] : [])] },
      include: { memberships: { where: { status: "ACTIVE" } } }
    });
    if (!dbUser) {
      // TODO: decide whether first-login auto-provisioning is allowed for your tenant model.
      throw new UnauthorizedException("User is authenticated but not provisioned in Powerlytic");
    }
    const selectedWorkspaceId = String(request.headers["x-workspace-id"] ?? dbUser.memberships[0]?.workspaceId ?? "");
    const platformRoles = realmRoles.filter((role) => role === Role.SUPER_ADMIN || role === Role.ENGINEERING_ADMIN || role === Role.MANUFACTURER);
    const selectedMembership = dbUser.memberships.find((membership) => membership.workspaceId === selectedWorkspaceId);
    if (!platformRoles.length && !selectedMembership) {
      throw new ForbiddenException("User does not belong to the requested workspace");
    }
    request.user = {
      id: dbUser.id,
      externalSub: sub,
      email: dbUser.email,
      roles: [...platformRoles, ...(selectedMembership ? [selectedMembership.role as Role] : [])],
      workspaceId: selectedWorkspaceId,
      workspaceIds: dbUser.memberships.map((membership) => membership.workspaceId),
      authType: "human"
    };
    this.context.setUser(request.user);
    return true;
  }
}

function hashDeviceSecret(secret: string) {
  // TODO: DEVICE_API_KEY_PEPPER must match the API value used during device provisioning.
  return createHash("sha256")
    .update(`${process.env.DEVICE_API_KEY_PEPPER ?? "dev-pepper"}:${secret}`)
    .digest("hex");
}

function extractRoles(payload: Record<string, unknown>): Role[] {
  const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
  const roles = realmAccess?.roles ?? [];
  return roles.filter((role): role is Role => Object.values(Role).includes(role as Role));
}
