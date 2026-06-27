import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { PERMISSION_KEY } from '../common/decorators/require-permission.decorator';
import { can, Resource, Action } from '@powerlytic/permissions';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  platformRole?: string | null;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<{ resource: Resource; action: Action }>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) return true;

    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthUser; activeMembership?: { role: string } }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    // Platform roles bypass workspace membership check
    if (user.platformRole) {
      if (can(user.platformRole as any, permission.resource, permission.action)) return true;
    }

    // Check workspace membership role
    const workspaceId = (req.params as Record<string, string>).workspaceId ?? (req.params as Record<string, string>).id;
    if (!workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    const membership = await this.prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
    });

    if (!membership) throw new ForbiddenException('Not a member of this workspace');

    req.activeMembership = membership;

    if (can(membership.role as any, permission.resource, permission.action)) return true;

    throw new ForbiddenException(`Permission denied: ${permission.resource}:${permission.action}`);
  }
}
