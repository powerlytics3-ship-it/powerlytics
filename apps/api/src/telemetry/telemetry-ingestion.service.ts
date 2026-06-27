import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { applyEndianness, calibrate } from './modbus/modbus-transformer';

interface TelemetryPayload {
  ts: string;
  values: Record<string, number | Array<{ slave_id: string; registers: Array<{ readId: string; value: number[] }> }>>;
}

@Injectable()
export class TelemetryIngestionService {
  private readonly logger = new Logger(TelemetryIngestionService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('alert-evaluation') private alertQueue: Queue,
  ) {}

  async ingest(device: { id: string; workspaceId: string }, payload: TelemetryPayload) {
    const ts = new Date(payload.ts);
    const ports = await this.prisma.devicePort.findMany({
      where: { deviceId: device.id },
      include: {
        portType: true,
        modbusSlaves: { include: { reads: true } },
      },
    });

    const portMap = new Map(ports.map((p) => [p.portKey, p]));
    const rows: any[] = [];
    const quarantined: any[] = [];

    for (const [key, val] of Object.entries(payload.values)) {
      const port = portMap.get(key);
      if (!port) {
        quarantined.push({ deviceId: device.id, reason: `Unknown portKey: ${key}`, rawPayload: { key, val } });
        continue;
      }

      if (port.portType.valueFormat === 'MODBUS' && Array.isArray(val)) {
        for (const slavePayload of val) {
          const slave = port.modbusSlaves.find((s) => s.slaveId === slavePayload.slave_id);
          if (!slave) {
            quarantined.push({ deviceId: device.id, reason: `Unknown slave_id: ${slavePayload.slave_id}`, rawPayload: slavePayload });
            continue;
          }
          for (const reg of slavePayload.registers) {
            const read = slave.reads.find((r) => r.readId === reg.readId);
            if (!read) {
              quarantined.push({ deviceId: device.id, reason: `Unknown readId: ${reg.readId}`, rawPayload: reg });
              continue;
            }
            const rawValue = applyEndianness(reg.value, read.endianness as any, read.bitsToRead);
            const readCalibrated = calibrate(rawValue, Number(read.scaling), Number(read.offset));
            const calibratedValue = calibrate(readCalibrated, Number(port.scaling), Number(port.offset));
            rows.push({
              deviceId: device.id,
              workspaceId: device.workspaceId,
              ts,
              portKey: key,
              portValueFormat: 'MODBUS',
              modbusReadId: reg.readId,
              modbusSlaveId: slavePayload.slave_id,
              rawValue: rawValue,
              calibratedValue,
              unit: read.unit ?? port.unit,
              quality: 'GOOD',
              rawPayload: reg,
            });
          }
        }
      } else if (typeof val === 'number') {
        const rawValue = val;
        const calibratedValue = calibrate(rawValue, Number(port.scaling), Number(port.offset));
        rows.push({
          deviceId: device.id,
          workspaceId: device.workspaceId,
          ts,
          portKey: key,
          portValueFormat: port.portType.valueFormat,
          rawValue,
          calibratedValue,
          unit: port.unit,
          quality: 'GOOD',
          rawPayload: { key, val },
        });
      }
    }

    if (rows.length > 0) {
      await this.prisma.deviceTelemetry.createMany({ data: rows });
    }

    if (quarantined.length > 0) {
      await this.prisma.telemetryQuarantine.createMany({
        data: quarantined.map((q) => ({ ...q, rawPayload: q.rawPayload })),
      });
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date(), connectivityStatus: 'ONLINE' },
    });

    if (rows.length > 0) {
      await this.alertQueue.add('evaluate', { deviceId: device.id, workspaceId: device.workspaceId }).catch(() => {});
    }

    return { accepted: rows.length, quarantined: quarantined.length };
  }
}
