import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── Manufacture ─────────────────────────────────────────────────────────────
  async manufacture(dto: { imei: string; serialNumber: string; deviceModelId: string; name?: string }, actorId: string) {
    const model = await this.prisma.deviceModel.findUnique({ where: { id: dto.deviceModelId, status: 'PUBLISHED' } });
    if (!model) throw new BadRequestException('Device model must be PUBLISHED');

    const device = await this.prisma.device.create({
      data: {
        imei: dto.imei,
        serialNumber: dto.serialNumber,
        name: dto.name,
        deviceModelId: dto.deviceModelId,
        lifecycleStatus: 'MANUFACTURED',
      },
    });

    // Copy model ports to device ports
    const modelPorts = await this.prisma.deviceModelPort.findMany({ where: { deviceModelId: dto.deviceModelId } });
    if (modelPorts.length > 0) {
      await this.prisma.devicePort.createMany({
        data: modelPorts.map((p) => ({
          deviceId: device.id,
          portKey: p.portKey,
          portTypeId: p.portTypeId,
          displayName: p.portKey,
        })),
      });
    }

    await this.audit.write({ actorUserId: actorId, action: 'device.manufactured', targetType: 'Device', targetId: device.id });
    return device;
  }

  // ── List ─────────────────────────────────────────────────────────────────────
  findAll(workspaceId?: string) {
    return this.prisma.device.findMany({
      where: { workspaceId: workspaceId ?? undefined, deletedAt: null },
      include: { deviceModel: true, ports: { include: { portType: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Find One ──────────────────────────────────────────────────────────────────
  async findOne(id: string, workspaceId?: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, deletedAt: null, ...(workspaceId ? { workspaceId } : {}) },
      include: {
        deviceModel: { include: { ports: { include: { portType: true } } } },
        ports: { include: { portType: true, modbusSlaves: { include: { reads: true } } } },
        credential: { select: { id: true, lastUsedAt: true, revokedAt: true, createdAt: true } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  // ── Claim ─────────────────────────────────────────────────────────────────────
  async claim(claimCode: string, workspaceId: string, userId: string) {
    const existing = await this.prisma.deviceClaim.findUnique({
      where: { claimCode },
      include: { device: true },
    });
    if (!existing) throw new BadRequestException('Invalid claim code');
    if (existing.device.workspaceId) throw new BadRequestException('Device already claimed');

    const device = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.device.update({
        where: { id: existing.deviceId },
        data: {
          workspaceId,
          lifecycleStatus: 'CLAIMED',
          claimedAt: new Date(),
        },
      });
      await tx.deviceClaim.update({ where: { id: existing.id }, data: { workspaceId, claimedById: userId, claimedAt: new Date() } });
      return updated;
    });

    await this.audit.write({
      workspaceId,
      actorUserId: userId,
      action: 'device.claimed',
      targetType: 'Device',
      targetId: device.id,
    });
    return device;
  }

  // ── Update ────────────────────────────────────────────────────────────────────
  async update(id: string, dto: { name?: string; location?: unknown; metadata?: unknown; pointOfContact?: string; alertEmails?: string[]; alertPhones?: string[] }, actorId: string, workspaceId?: string) {
    const device = await this.prisma.device.findFirst({ where: { id, deletedAt: null, ...(workspaceId ? { workspaceId } : {}) } });
    if (!device) throw new NotFoundException('Device not found');

    const updated = await this.prisma.device.update({
      where: { id },
      data: { name: dto.name, location: dto.location as any, metadata: dto.metadata as any, pointOfContact: dto.pointOfContact, alertEmails: dto.alertEmails, alertPhones: dto.alertPhones },
    });

    await this.audit.write({ workspaceId, actorUserId: actorId, action: 'device.updated', targetType: 'Device', targetId: id, afterValue: dto });
    return updated;
  }

  // ── Update Port ───────────────────────────────────────────────────────────────
  async updatePort(deviceId: string, portKey: string, dto: { displayName?: string; unit?: string; scaling?: number; offset?: number; thresholdMin?: number; thresholdMax?: number; thresholdMessage?: string; modbusSlaves?: any[] }, actorId: string, workspaceId?: string) {
    const port = await this.prisma.devicePort.findFirst({ where: { deviceId, portKey } });
    if (!port) throw new NotFoundException('Port not found');

    const { modbusSlaves, ...portData } = dto;

    await this.prisma.devicePort.update({
      where: { deviceId_portKey: { deviceId, portKey } },
      data: portData as any,
    });

    if (modbusSlaves !== undefined) {
      await this.prisma.modbusSlaveConfig.deleteMany({ where: { devicePortId: port.id } });
      for (const slave of modbusSlaves) {
        const { reads, ...slaveData } = slave;
        const created = await this.prisma.modbusSlaveConfig.create({
          data: { ...slaveData, devicePortId: port.id },
        });
        if (reads?.length) {
          await this.prisma.modbusReadConfig.createMany({
            data: reads.map((r: any) => ({ ...r, slaveConfigId: created.id })),
          });
        }
      }
    }

    await this.audit.write({ workspaceId, actorUserId: actorId, action: 'device.port_updated', targetType: 'DevicePort', targetId: port.id });
  }

  // ── Credential ────────────────────────────────────────────────────────────────
  async issueCredential(deviceId: string, actorId: string, workspaceId?: string) {
    const plaintext = randomBytes(32).toString('hex');
    const keyHash = createHash('sha256').update(plaintext).digest('hex');

    await this.prisma.deviceCredential.upsert({
      where: { deviceId },
      update: { keyHash, revokedAt: null, lastUsedAt: null },
      create: { deviceId, keyHash },
    });

    await this.audit.write({ workspaceId, actorUserId: actorId, action: 'device.credential_issued', targetType: 'Device', targetId: deviceId });

    return { apiKey: plaintext, warning: 'Store this key securely. It will never be shown again.' };
  }

  async revokeCredential(deviceId: string, actorId: string, workspaceId?: string) {
    await this.prisma.deviceCredential.update({
      where: { deviceId },
      data: { revokedAt: new Date() },
    });
    await this.audit.write({ workspaceId, actorUserId: actorId, action: 'device.credential_revoked', targetType: 'Device', targetId: deviceId });
  }

  // ── Transfer ─────────────────────────────────────────────────────────────────
  async initiateTransfer(deviceId: string, toWorkspaceId: string, reason: string, requestedById: string, fromWorkspaceId: string) {
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, workspaceId: fromWorkspaceId } });
    if (!device) throw new NotFoundException('Device not found in your workspace');

    return this.prisma.deviceTransfer.create({
      data: { deviceId, fromWorkspaceId, toWorkspaceId, reason, requestedById, status: 'PENDING' },
    });
  }

  async approveTransfer(transferId: string, approvedById: string) {
    const transfer = await this.prisma.deviceTransfer.findUnique({ where: { id: transferId } });
    if (!transfer || transfer.status !== 'PENDING') throw new BadRequestException('Transfer not found or not pending');

    await this.prisma.$transaction([
      this.prisma.device.update({
        where: { id: transfer.deviceId },
        data: { workspaceId: transfer.toWorkspaceId },
      }),
      this.prisma.deviceTransfer.update({
        where: { id: transferId },
        data: { status: 'COMPLETED', approvedById, completedAt: new Date() },
      }),
    ]);
  }

  // ── Soft Delete ───────────────────────────────────────────────────────────────
  async softDelete(id: string, actorId: string, workspaceId?: string) {
    await this.prisma.device.update({ where: { id }, data: { deletedAt: new Date(), lifecycleStatus: 'DECOMMISSIONED' } });
    await this.audit.write({ workspaceId, actorUserId: actorId, action: 'device.deleted', targetType: 'Device', targetId: id });
  }

  // ── Generate Claim Code ───────────────────────────────────────────────────────
  async generateClaimCode(deviceId: string, workspaceId: string, actorId: string) {
    const claimCode = randomBytes(8).toString('hex').toUpperCase();
    return this.prisma.deviceClaim.create({
      data: { deviceId, workspaceId, claimCode, claimedById: actorId },
    });
  }
}
