import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // ── Alert Rules ──────────────────────────────────────────────────────────────
  findRules(workspaceId: string) {
    return this.prisma.alertRule.findMany({
      where: { workspaceId, deletedAt: null },
      include: { device: { select: { name: true, imei: true } }, notificationChannels: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(workspaceId: string, createdById: string, dto: {
    deviceId: string; portKey: string; name: string; condition: string;
    thresholdValue: number; forDurationSec?: number; severity?: string;
    notificationChannelIds?: string[];
  }) {
    const rule = await this.prisma.alertRule.create({
      data: {
        workspaceId,
        createdById,
        deviceId: dto.deviceId,
        portKey: dto.portKey,
        name: dto.name,
        condition: dto.condition as any,
        thresholdValue: dto.thresholdValue,
        forDurationSec: dto.forDurationSec ?? 0,
        severity: (dto.severity ?? 'MEDIUM') as any,
        notificationChannels: dto.notificationChannelIds
          ? { connect: dto.notificationChannelIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    await this.audit.write({ workspaceId, actorUserId: createdById, action: 'alert_rule.created', targetType: 'AlertRule', targetId: rule.id });
    return rule;
  }

  async updateRule(id: string, workspaceId: string, dto: Partial<{ name: string; condition: string; thresholdValue: number; forDurationSec: number; severity: string; isEnabled: boolean }>) {
    return this.prisma.alertRule.update({ where: { id, workspaceId }, data: dto as any });
  }

  async deleteRule(id: string, workspaceId: string) {
    return this.prisma.alertRule.update({ where: { id, workspaceId }, data: { deletedAt: new Date() } });
  }

  // ── Alert Events ─────────────────────────────────────────────────────────────
  findEvents(workspaceId: string, status?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.alertEvent.findMany({
      where: { alertRule: { workspaceId }, ...(status ? { status: status as any } : {}) },
      include: { alertRule: { select: { name: true, severity: true, deviceId: true, portKey: true } } },
      orderBy: { triggeredAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async acknowledgeEvent(id: string, userId: string) {
    const ev = await this.prisma.alertEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('Alert event not found');
    return this.prisma.alertEvent.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED', acknowledgedById: userId, acknowledgedAt: new Date() },
    });
  }

  async resolveEvent(id: string) {
    return this.prisma.alertEvent.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
  }

  // ── Notification Channels ────────────────────────────────────────────────────
  findChannels(workspaceId: string) {
    return this.prisma.notificationChannel.findMany({ where: { workspaceId } });
  }

  createChannel(workspaceId: string, dto: { type: string; target: string }) {
    return this.prisma.notificationChannel.create({ data: { workspaceId, type: dto.type as any, target: dto.target } });
  }

  // ── Alert Evaluation (called from BullMQ job) ────────────────────────────────
  async evaluate(deviceId: string, workspaceId: string) {
    const rules = await this.prisma.alertRule.findMany({
      where: { deviceId, workspaceId, isEnabled: true, deletedAt: null },
    });

    const latest = await this.prisma.deviceTelemetry.findMany({
      where: { deviceId, workspaceId },
      orderBy: { ts: 'desc' },
      distinct: ['portKey'],
    });

    const latestMap = new Map(latest.map((r) => [r.portKey, Number(r.calibratedValue)]));

    for (const rule of rules) {
      const value = latestMap.get(rule.portKey);
      if (value === undefined) continue;

      const threshold = Number(rule.thresholdValue);
      let breached = false;
      switch (rule.condition) {
        case 'GREATER_THAN': breached = value > threshold; break;
        case 'LESS_THAN': breached = value < threshold; break;
        case 'EQUAL': breached = value === threshold; break;
        case 'NOT_EQUAL': breached = value !== threshold; break;
      }

      if (breached) {
        const recentEvent = await this.prisma.alertEvent.findFirst({
          where: { alertRuleId: rule.id, status: { in: ['NEW', 'ACKNOWLEDGED'] } },
          orderBy: { triggeredAt: 'desc' },
        });
        if (!recentEvent) {
          await this.prisma.alertEvent.create({
            data: {
              alertRuleId: rule.id,
              triggerValue: value,
              message: `${rule.name}: value ${value} ${rule.condition.replace('_', ' ').toLowerCase()} ${threshold}`,
            },
          });
        }
      }
    }
  }
}
