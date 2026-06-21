import { Worker } from "bullmq";
import { PrismaClient, DeploymentStatus, AlertIncidentStatus, ActuationStatus, Prisma } from "@prisma/client";
import mqtt from "mqtt";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
const redis = new URL(redisUrl);
const connection = {
  host: redis.hostname,
  port: Number(redis.port || 6379),
  password: redis.password || undefined,
  username: redis.username || undefined,
  tls: redis.protocol === "rediss:" ? {} : undefined
};
const prisma = new PrismaClient();

function mqttClient() {
  if (process.env.MQTT_ENABLED !== "true") return undefined;
  // TODO: set MQTT_URL, MQTT_USERNAME, and MQTT_PASSWORD for the production MQTT broker.
  return mqtt.connect(process.env.MQTT_URL ?? "mqtt://localhost:1883", {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID ?? `powerlytic-worker-${process.pid}`
  });
}

async function publishJson(topic: string, payload: unknown) {
  const client = mqttClient();
  if (!client) return;
  await new Promise<void>((resolve, reject) => {
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => {
      client.end();
      if (error) reject(error);
      else resolve();
    });
  });
}

const deploymentWorker = new Worker(
  "config-deployments",
  async (job) => {
    const { deploymentId, deviceId, payload } = job.data as { deploymentId: string; deviceId: string; payload: unknown };
    await prisma.configDeployment.update({ where: { id: deploymentId }, data: { status: DeploymentStatus.SENT, sentAt: new Date() } });
    if (process.env.CONFIG_BRIDGE_URL) {
      // TODO: set CONFIG_BRIDGE_URL and CONFIG_BRIDGE_TOKEN if using an HTTP bridge.
      await fetch(process.env.CONFIG_BRIDGE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.CONFIG_BRIDGE_TOKEN ? { authorization: `Bearer ${process.env.CONFIG_BRIDGE_TOKEN}` } : {})
        },
        body: JSON.stringify({ deviceId, payload })
      });
    }
    await publishJson(`powerlytic/devices/${deviceId}/config`, payload);
    return { ok: true, deploymentId };
  },
  { connection }
);

const alertWorker = new Worker(
  "alert-evaluation",
  async (job) => {
    const { deviceId, workspaceId } = job.data as { deviceId: string; workspaceId: string };
    const latest = await prisma.telemetryValue.findMany({
      where: { deviceId, workspaceId },
      orderBy: { ts: "desc" },
      take: 200
    });
    const rules = await prisma.alertRule.findMany({
      where: { workspaceId, OR: [{ deviceId }, { deviceId: null }], active: true }
    });
    let created = 0;
    for (const rule of rules) {
      const row = latest.find((item) => item.portKey === rule.portKey || item.readId === rule.readId);
      if (!row || row.parsedValue === null) continue;
      const triggered =
        (rule.comparator === ">" && row.parsedValue > rule.threshold) ||
        (rule.comparator === ">=" && row.parsedValue >= rule.threshold) ||
        (rule.comparator === "<" && row.parsedValue < rule.threshold) ||
        (rule.comparator === "<=" && row.parsedValue <= rule.threshold) ||
        (rule.comparator === "==" && row.parsedValue === rule.threshold);
      if (!triggered) continue;
      await prisma.alertIncident.create({
        data: {
          workspaceId,
          deviceId,
          alertRuleId: rule.id,
          value: (row.calibratedValue ?? row.rawValue ?? {}) as Prisma.InputJsonValue,
          message: rule.message,
          severity: rule.severity,
          status: AlertIncidentStatus.NEW,
          sentTo: {}
        }
      });
      created += 1;
    }
    return { ok: true, created };
  },
  { connection }
);

const actuationWorker = new Worker(
  "actuation-delivery",
  async (job) => {
    const { actuationId, deviceId } = job.data as { actuationId: string; deviceId: string };
    const command = await prisma.actuationCommand.update({
      where: { id: actuationId },
      data: { status: ActuationStatus.SENT, sentAt: new Date() }
    });
    await publishJson(`powerlytic/devices/${deviceId}/commands`, command);
    return { ok: true, actuationId };
  },
  { connection }
);

deploymentWorker.on("failed", (job, error) => {
  console.error("deployment job failed", job?.id, error);
});

alertWorker.on("failed", (job, error) => {
  console.error("alert job failed", job?.id, error);
});

actuationWorker.on("failed", (job, error) => {
  console.error("actuation job failed", job?.id, error);
});

process.on("SIGTERM", async () => {
  await Promise.all([deploymentWorker.close(), alertWorker.close(), actuationWorker.close()]);
  await prisma.$disconnect();
  process.exit(0);
});

console.log("Powerlytic worker running");
