import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditEntry {
  workspaceId?: string;
  actorUserId?: string;
  actorType?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async write(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        workspaceId: entry.workspaceId,
        actorUserId: entry.actorUserId,
        actorType: entry.actorType ?? 'USER',
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        beforeValue: entry.beforeValue as any,
        afterValue: entry.afterValue as any,
        ipAddress: entry.ipAddress,
      },
    });
  }

  async findByWorkspace(workspaceId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { workspaceId } }),
    ]);
    return { data, total, page, limit };
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit };
  }
}
