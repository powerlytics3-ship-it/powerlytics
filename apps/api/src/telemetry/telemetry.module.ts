import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TelemetryController } from './telemetry.controller';
import { TelemetryIngestionService } from './telemetry-ingestion.service';
import { TelemetryQueryService } from './telemetry-query.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'alert-evaluation' })],
  controllers: [TelemetryController],
  providers: [TelemetryIngestionService, TelemetryQueryService],
  exports: [TelemetryQueryService],
})
export class TelemetryModule {}
