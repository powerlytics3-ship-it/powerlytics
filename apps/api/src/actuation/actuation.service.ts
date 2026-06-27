import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BridgeClient } from '../config-deployment/bridge.client';

@Injectable()
export class ActuationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private bridge: BridgeClient,
  ) {}

  async sendCommand(deviceId: string, workspaceId: string, dto: { portKey: string; action: string; requestedValue: unknown; idempotencyKey: string }, requestedById: string) {
    const existing = await this.prisma.actuationCommand.findUnique({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) return existing;

    const device = await this.prisma.device.findFirst({ where: { id: deviceId, workspaceId, deletedAt: null } });
    if (!device) throw new NotFoundException('Device not found');

    const command = await this.prisma.actuationCommand.create({
      data: {
        deviceId,
        portKey: dto.portKey,
        action: dto.action,
        requestedValue: dto.requestedValue as any,
        idempotencyKey: dto.idempotencyKey,
        requestedById,
        status: 'PENDING',
      },
    });

    try {
      await this.bridge.sendConfig({
        message: 'actuation',
        commandId: command.id,
        deviceId,
        portKey: dto.portKey,
        action: dto.action,
        value: dto.requestedValue,
      });
      await this.prisma.actuationCommand.update({ where: { id: command.id }, data: { status: 'SENT' } });
    } catch {
      await this.prisma.actuationCommand.update({ where: { id: command.id }, data: { status: 'FAILED', failureReason: 'Bridge unreachable' } });
    }

    await this.audit.write({ workspaceId, actorUserId: requestedById, action: 'actuation.command_sent', targetType: 'Device', targetId: deviceId });
    return command;
  }

  async handleBridgeAck(commandId: string, status: string, signature?: string, rawBody?: string) {
    const command = await this.prisma.actuationCommand.findUnique({ where: { id: commandId } });
    if (!command) throw new NotFoundException('Command not found');
    return this.prisma.actuationCommand.update({
      where: { id: commandId },
      data: { status: status as any, acknowledgedAt: new Date() },
    });
  }

  findHistory(deviceId: string, workspaceId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.actuationCommand.findMany({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { requestedBy: { select: { name: true, email: true } } },
    });
  }
}
