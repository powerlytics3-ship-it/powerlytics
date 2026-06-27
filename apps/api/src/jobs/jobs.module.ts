import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AlertEvaluationProcessor } from './alert-evaluation.processor';
import { DeploymentTimeoutJob } from './deployment-timeout.processor';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'alert-evaluation' }),
    AlertsModule,
  ],
  providers: [AlertEvaluationProcessor, DeploymentTimeoutJob],
})
export class JobsModule {}
