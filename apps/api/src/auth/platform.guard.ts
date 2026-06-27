import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class PlatformGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: { platformRole?: string | null } }>();
    if (!req.user?.platformRole) {
      throw new ForbiddenException('Platform role required');
    }
    return true;
  }
}
