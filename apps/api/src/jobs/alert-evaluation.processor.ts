import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AlertsService } from '../alerts/alerts.service';

@Processor('alert-evaluation')
export class AlertEvaluationProcessor extends WorkerHost {
  constructor(private alertsService: AlertsService) {
    super();
  }

  async process(job: Job<{ deviceId: string; workspaceId: string }>) {
    await this.alertsService.evaluate(job.data.deviceId, job.data.workspaceId);
  }
}
