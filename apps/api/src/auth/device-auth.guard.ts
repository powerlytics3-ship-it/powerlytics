import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<FastifyRequest & { device?: unknown }>();
    const key = req.headers['x-device-key'] as string | undefined;

    if (!key) throw new UnauthorizedException('Missing X-Device-Key header');

    const keyHash = createHash('sha256').update(key).digest('hex');

    const credential = await this.prisma.deviceCredential.findFirst({
      where: { keyHash, revokedAt: null },
      include: { device: true },
    });

    if (!credential) throw new UnauthorizedException('Invalid device key');

    // Update lastUsedAt without blocking response
    this.prisma.deviceCredential
      .update({ where: { id: credential.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    req.device = credential.device;
    return true;
  }
}
