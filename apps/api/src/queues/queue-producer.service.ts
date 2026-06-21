import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

function redisConnection() {
  // TODO: set REDIS_URL to the production Redis/Elasticache/Upstash URL.
  const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = new URL(redisUrl);
  return {
    host: redis.hostname,
    port: Number(redis.port || 6379),
    password: redis.password || undefined,
    username: redis.username || undefined,
    tls: redis.protocol === "rediss:" ? {} : undefined
  };
}

@Injectable()
export class QueueProducerService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueProducerService.name);
  private readonly enabled = process.env.QUEUE_ENABLED === "true";
  private readonly configDeployments = new Queue("config-deployments", { connection: redisConnection() });
  private readonly alertEvaluation = new Queue("alert-evaluation", { connection: redisConnection() });
  private readonly actuationDelivery = new Queue("actuation-delivery", { connection: redisConnection() });

  async enqueueConfigDeployment(data: Record<string, unknown>) {
    if (!this.enabled) {
      this.logger.debug("QUEUE_ENABLED is not true; skipped config deployment enqueue");
      return;
    }
    await this.configDeployments.add("deploy-config", data, { attempts: 5, backoff: { type: "exponential", delay: 2000 } });
  }

  async enqueueAlertEvaluation(data: Record<string, unknown>) {
    if (!this.enabled) return;
    await this.alertEvaluation.add("evaluate-alerts", data, { attempts: 3, backoff: { type: "exponential", delay: 1000 } });
  }

  async enqueueActuationDelivery(data: Record<string, unknown>) {
    if (!this.enabled) return;
    await this.actuationDelivery.add("deliver-actuation", data, { attempts: 5, backoff: { type: "exponential", delay: 2000 } });
  }

  async onModuleDestroy() {
    await Promise.all([this.configDeployments.close(), this.alertEvaluation.close(), this.actuationDelivery.close()]);
  }
}
