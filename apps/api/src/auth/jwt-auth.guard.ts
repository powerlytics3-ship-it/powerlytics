import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Role } from "@powerlytic/types";
import jwt from "jsonwebtoken";
import { PrismaService } from "../prisma/prisma.service.js";
import { RequestUser } from "./current-user.js";
import { RequestContextService } from "./request-context.service.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
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

    const tokenSecret = process.env.AUTH_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "dev-auth-secret";
    let payload: {
      sub: string;
      roles?: Role[];
      workspaceId?: string;
      workspaceIds?: string[];
    };

    try {
      payload = jwt.verify(token, tokenSecret) as typeof payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { memberships: { where: { status: "ACTIVE" } } }
    });
    if (!dbUser) {
      throw new UnauthorizedException("User not found");
    }

    const selectedWorkspaceId = String(request.headers["x-workspace-id"] ?? payload.workspaceId ?? dbUser.memberships[0]?.workspaceId ?? "");
    const membership = dbUser.memberships.find((m) => m.workspaceId === selectedWorkspaceId);
    if (!membership) {
      throw new ForbiddenException("User does not belong to the requested workspace");
    }

    const roles: Role[] = Object.values(Role).includes(membership.role as Role) ? [membership.role as Role] : [];
    request.user = {
      id: dbUser.id,
      email: dbUser.email,
      roles,
      workspaceId: selectedWorkspaceId,
      workspaceIds: dbUser.memberships.map((m) => m.workspaceId),
      authType: "human"
    };

    this.context.setUser(request.user);
    return true;
  }
}

function hashDeviceSecret(secret: string): string {
  return createHash("sha256")
    .update(`${process.env.DEVICE_API_KEY_PEPPER ?? "dev-pepper"}:${secret}`)
    .digest("hex");
}
