import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BridgeClient } from './bridge.client';

@Injectable()
export class ConfigDeploymentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private bridge: BridgeClient,
  ) {}

  async deploy(deviceId: string, triggeredById: string, workspaceId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, workspaceId, deletedAt: null },
      include: {
        deviceModel: true,
        ports: {
          include: {
            modbusSlaves: { include: { reads: true } },
          },
        },
      },
    });
    if (!device) throw new NotFoundException('Device not found');

    const configPayload = this.buildConfigPayload(device);
    const configHash = createHash('sha256').update(JSON.stringify(configPayload)).digest('hex');

    const deployment = await this.prisma.configDeployment.create({
      data: {
        deviceId,
        configHash,
        configSnapshot: configPayload as any,
        status: 'PENDING',
        triggeredById,
      },
    });

    try {
      await this.bridge.sendConfig({
        message: 'config',
        configId: device.configId,
        hash: configHash,
        config: configPayload,
      });

      await this.prisma.configDeployment.update({
        where: { id: deployment.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (err) {
      await this.prisma.configDeployment.update({
        where: { id: deployment.id },
        data: { status: 'ERROR', errorMessage: (err as Error).message },
      });
      throw err;
    }

    await this.audit.write({
      workspaceId,
      actorUserId: triggeredById,
      action: 'config.deployed',
      targetType: 'Device',
      targetId: deviceId,
    });

    return deployment;
  }

  private buildConfigPayload(device: any) {
    return {
      device_id: device.id,
      configId: device.configId,
      imei: device.imei,
      modbusSlaves: device.ports
        .filter((p: any) => p.modbusSlaves?.length > 0)
        .flatMap((p: any) =>
          p.modbusSlaves.map((slave: any) => ({
            unique_slave_id: slave.id,
            slave_id: parseInt(slave.slaveId, 10),
            serial: {
              baudRate: slave.baudRate,
              dataBits: slave.dataBits,
              stopBits: slave.stopBits,
              parity: slave.parity.toLowerCase(),
            },
            polling: {
              intervalMs: slave.pollIntervalMs,
              timeoutMs: slave.pollTimeoutMs,
              retries: slave.pollRetries,
            },
            registers: slave.reads.map((r: any) => ({
              readId: r.readId,
              func: r.functionCode.toLowerCase().replace('_', ''),
              start: r.startAddress,
              bits: r.bitsToRead,
            })),
          }))
        ),
    };
  }

  async handleBridgeAck(deploymentId: string, status: string, message?: string, signature?: string, rawBody?: string) {
    if (signature && rawBody) {
      if (!this.bridge.verifySignature(rawBody, signature)) {
        throw new BadRequestException('Invalid bridge signature');
      }
    }

    const deployment = await this.prisma.configDeployment.findUnique({ where: { id: deploymentId } });
    if (!deployment) throw new NotFoundException('Deployment not found');

    return this.prisma.configDeployment.update({
      where: { id: deploymentId },
      data: {
        status: status as any,
        acknowledgedAt: new Date(),
        errorMessage: message,
      },
    });
  }

  async findHistory(deviceId: string, workspaceId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.configDeployment.findMany({
        where: { deviceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { triggeredBy: { select: { name: true, email: true } } },
      }),
      this.prisma.configDeployment.count({ where: { deviceId } }),
    ]);
    return { data, total, page, limit };
  }

  findLatest(deviceId: string) {
    return this.prisma.configDeployment.findFirst({
      where: { deviceId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
