import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { MembersModule } from './members/members.module';
import { PortTypesModule } from './port-types/port-types.module';
import { DeviceModelsModule } from './device-models/device-models.module';
import { DevicesModule } from './devices/devices.module';
import { ConfigDeploymentModule } from './config-deployment/config-deployment.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { ActuationModule } from './actuation/actuation.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        // Upstash REST URL is https://HOST — derive native Redis URL: rediss://default:TOKEN@HOST:6379
        url: process.env.UPSTASH_REDIS_REST_URL
          ? `rediss://default:${process.env.UPSTASH_REDIS_REST_TOKEN}@${process.env.UPSTASH_REDIS_REST_URL.replace('https://', '')}:6379`
          : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    MembersModule,
    PortTypesModule,
    DeviceModelsModule,
    DevicesModule,
    ConfigDeploymentModule,
    TelemetryModule,
    ActuationModule,
    AlertsModule,
    AuditModule,
    AdminModule,
    JobsModule,
  ],
})
export class AppModule {}
