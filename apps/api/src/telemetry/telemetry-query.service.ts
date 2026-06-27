import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelemetryQueryService {
  constructor(private prisma: PrismaService) {}

  async getLatest(deviceId: string, workspaceId: string) {
    const rows = await this.prisma.deviceTelemetry.findMany({
      where: { deviceId, workspaceId },
      orderBy: { ts: 'desc' },
      distinct: ['portKey'],
      take: 50,
    });
    return rows;
  }

  async getTimeseries(deviceId: string, workspaceId: string, portKey: string, from: Date, to: Date) {
    const rows = await this.prisma.deviceTelemetry.findMany({
      where: { deviceId, workspaceId, portKey, ts: { gte: from, lte: to } },
      orderBy: { ts: 'asc' },
      select: { ts: true, calibratedValue: true, quality: true, unit: true },
    });

    const values = rows.map((r) => Number(r.calibratedValue));
    const stats = values.length
      ? {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
          lastValue: values[values.length - 1],
          lastTs: rows[rows.length - 1]?.ts,
        }
      : null;

    return { data: rows, stats };
  }

  async getStats(deviceId: string, workspaceId: string, portKey: string, from: Date, to: Date) {
    const rows = await this.prisma.deviceTelemetry.findMany({
      where: { deviceId, workspaceId, portKey, ts: { gte: from, lte: to } },
      select: { calibratedValue: true, ts: true },
      orderBy: { ts: 'desc' },
    });
    if (!rows.length) return { count: 0, min: null, max: null, avg: null, lastValue: null, lastTs: null };

    const values = rows.map((r) => Number(r.calibratedValue));
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      lastValue: values[0],
      lastTs: rows[0]?.ts,
    };
  }

  async getTable(deviceId: string, workspaceId: string, from: Date, to: Date, page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.deviceTelemetry.findMany({
        where: { deviceId, workspaceId, ts: { gte: from, lte: to } },
        orderBy: { ts: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deviceTelemetry.count({ where: { deviceId, workspaceId, ts: { gte: from, lte: to } } }),
    ]);
    return { data, total, page, limit };
  }
}
