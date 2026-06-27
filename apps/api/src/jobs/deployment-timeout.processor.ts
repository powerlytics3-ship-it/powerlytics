import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeploymentTimeoutJob {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTimeouts() {
    const timeoutSeconds = parseInt(process.env.DEPLOYMENT_TIMEOUT_SECONDS ?? '300', 10);
    const cutoff = new Date(Date.now() - timeoutSeconds * 1000);
    await this.prisma.configDeployment.updateMany({
      where: { status: 'SENT', sentAt: { lt: cutoff } },
      data: { status: 'TIMED_OUT' },
    });
  }
}
