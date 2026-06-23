import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_PASSWORD_HASH = "$2b$10$klEJET7dYDncvdztsmQT1.FxUU8mJM4.GldLG4pG49TIXQU75rSJm";

async function main() {
  const digitalInput = await prisma.portType.upsert({
    where: { codeName: "DI" },
    update: {},
    create: {
      name: "Digital Input",
      codeName: "DI",
      category: "INPUT",
      valueFormat: "DIGITAL",
      description: "Discrete input state"
    }
  });

  const analogInput = await prisma.portType.upsert({
    where: { codeName: "AI" },
    update: {},
    create: {
      name: "Analog Input",
      codeName: "AI",
      category: "INPUT",
      valueFormat: "ANALOG",
      description: "Analog sensor input"
    }
  });

  const modbusInput = await prisma.portType.upsert({
    where: { codeName: "MI" },
    update: {},
    create: {
      name: "Modbus Input",
      codeName: "MI",
      category: "INPUT",
      valueFormat: "MODBUS",
      description: "Modbus read input"
    }
  });

  await prisma.portType.upsert({
    where: { codeName: "DO" },
    update: {},
    create: {
      name: "Digital Output",
      codeName: "DO",
      category: "OUTPUT",
      valueFormat: "DIGITAL",
      description: "Relay or digital output"
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "powerlytic" },
    update: {},
    create: {
      id: "ws-platform",
      slug: "powerlytic",
      displayName: "Powerlytic Platform",
      legalName: "Powerlytic",
      kind: "ORGANIZATION",
      status: "ACTIVE",
      timezone: "Asia/Kolkata",
      metadata: {}
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@powerlytic.com" },
    update: { password: ADMIN_PASSWORD_HASH },
    create: {
      id: "usr-admin",
      email: "admin@powerlytic.com",
      name: "Platform Admin",
      password: ADMIN_PASSWORD_HASH,
      active: true
    }
  });

  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: admin.id, workspaceId: workspace.id } },
    update: { role: "SUPER_ADMIN", status: "ACTIVE" },
    create: {
      id: "mem-admin",
      userId: admin.id,
      workspaceId: workspace.id,
      role: "SUPER_ADMIN",
      status: "ACTIVE"
    }
  });

  const model = await prisma.deviceModel.upsert({
    where: { sku: "EDGE-100" },
    update: {},
    create: {
      name: "Edge Monitor 100",
      sku: "EDGE-100",
      description: "Reference industrial monitor carrying forward DI, AI, and MI semantics."
    }
  });

  const version = await prisma.deviceModelVersion.upsert({
    where: { deviceModelId_version: { deviceModelId: model.id, version: 1 } },
    update: { status: "PUBLISHED" },
    create: {
      id: "dm-edge-100-v1",
      deviceModelId: model.id,
      version: 1,
      status: "PUBLISHED",
      microControllerType: "ESP32",
      hardwareRevision: "A",
      firmwareFamily: "edge-monitor",
      publishedAt: new Date()
    }
  });

  await prisma.deviceModelPort.upsert({
    where: { deviceModelVersionId_portKey: { deviceModelVersionId: version.id, portKey: "DI_1" } },
    update: {},
    create: { id: "dmp-di-1", deviceModelVersionId: version.id, portTypeId: digitalInput.id, portKey: "DI_1", description: "Digital input 1" }
  });
  await prisma.deviceModelPort.upsert({
    where: { deviceModelVersionId_portKey: { deviceModelVersionId: version.id, portKey: "AI_1" } },
    update: {},
    create: { id: "dmp-ai-1", deviceModelVersionId: version.id, portTypeId: analogInput.id, portKey: "AI_1", description: "Analog input 1" }
  });
  await prisma.deviceModelPort.upsert({
    where: { deviceModelVersionId_portKey: { deviceModelVersionId: version.id, portKey: "MI_1" } },
    update: {},
    create: { id: "dmp-mi-1", deviceModelVersionId: version.id, portTypeId: modbusInput.id, portKey: "MI_1", description: "Modbus input 1" }
  });

  const device = await prisma.device.upsert({
    where: { configId: "cfg-demo-1" },
    update: {},
    create: {
      id: "dev-demo-1",
      configId: "cfg-demo-1",
      imei: "867530900001",
      serialNumber: "PL-DEMO-001",
      name: "Boiler Room Monitor",
      deviceModelVersionId: version.id,
      workspaceId: workspace.id,
      lifecycleStatus: "ACTIVE",
      healthStatus: "ONLINE",
      firmwareVersion: "1.8.0",
      hardwareRevision: "A",
      lastSeenAt: new Date(),
      metadata: {}
    }
  });

  await prisma.devicePort.upsert({
    where: { deviceId_portKey: { deviceId: device.id, portKey: "DI_1" } },
    update: {},
    create: { deviceId: device.id, portTypeId: digitalInput.id, portKey: "DI_1", name: "Pump Status", status: "ACTIVE" }
  });
  await prisma.devicePort.upsert({
    where: { deviceId_portKey: { deviceId: device.id, portKey: "AI_1" } },
    update: {},
    create: { deviceId: device.id, portTypeId: analogInput.id, portKey: "AI_1", name: "Temperature", unit: "C", thresholdMax: 80, thresholdMessage: "Temperature high", status: "ACTIVE" }
  });
  await prisma.devicePort.upsert({
    where: { deviceId_portKey: { deviceId: device.id, portKey: "MI_1" } },
    update: {},
    create: { deviceId: device.id, portTypeId: modbusInput.id, portKey: "MI_1", name: "Energy Meter", status: "ACTIVE" }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
