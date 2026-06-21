import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import mqtt, { MqttClient } from "mqtt";

@Injectable()
export class MqttService implements OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client?: MqttClient;

  private getClient() {
    if (process.env.MQTT_ENABLED !== "true") return undefined;
    if (!this.client) {
      // TODO: set MQTT_URL, MQTT_USERNAME, and MQTT_PASSWORD for your production broker.
      this.client = mqtt.connect(process.env.MQTT_URL ?? "mqtt://localhost:1883", {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: process.env.MQTT_CLIENT_ID ?? `powerlytic-api-${process.pid}`
      });
      this.client.on("error", (error) => this.logger.error(error.message));
    }
    return this.client;
  }

  async publishJson(topic: string, payload: unknown) {
    const client = this.getClient();
    if (!client) {
      this.logger.debug(`MQTT_ENABLED is not true; skipped publish to ${topic}`);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async onModuleDestroy() {
    await new Promise<void>((resolve) => {
      if (!this.client) return resolve();
      this.client.end(false, {}, () => resolve());
    });
  }
}
