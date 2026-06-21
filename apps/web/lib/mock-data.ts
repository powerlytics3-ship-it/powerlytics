import { Role } from "@powerlytic/types";

export const workspaces = [
  {
    id: "ws-platform",
    displayName: "Powerlytic Platform",
    slug: "powerlytic",
    kind: "ORGANIZATION",
    status: "ACTIVE",
    timezone: "Asia/Kolkata",
    industry: "Industrial IoT",
    supportEmail: "support@powerlytic.com"
  },
  {
    id: "ws-acme",
    displayName: "Acme Foundry",
    slug: "acme-foundry",
    kind: "ORGANIZATION",
    status: "ACTIVE",
    timezone: "Asia/Kolkata",
    industry: "Manufacturing",
    supportEmail: "ops@acme.example"
  }
];

export const users = [
  {
    id: "usr-admin",
    name: "Platform Admin",
    email: "admin@powerlytic.com",
    phone: "+91 90000 00001",
    role: Role.SUPER_ADMIN,
    workspaceId: "ws-platform",
    status: "ACTIVE",
    lastLogin: "2026-06-21T08:10:00Z"
  },
  {
    id: "usr-ops",
    name: "Ops Lead",
    email: "ops@acme.example",
    phone: "+91 90000 00002",
    role: Role.WORKSPACE_ADMIN,
    workspaceId: "ws-acme",
    status: "ACTIVE",
    lastLogin: "2026-06-21T07:34:00Z"
  },
  {
    id: "usr-viewer",
    name: "Plant Viewer",
    email: "viewer@acme.example",
    phone: "+91 90000 00003",
    role: Role.VIEWER,
    workspaceId: "ws-acme",
    status: "INVITED",
    lastLogin: null
  }
];

export const portTypes = [
  { id: "pt-di", name: "Digital Input", codeName: "DI", category: "INPUT", valueFormat: "DIGITAL", active: true },
  { id: "pt-ai", name: "Analog Input", codeName: "AI", category: "INPUT", valueFormat: "ANALOG", active: true },
  { id: "pt-mi", name: "Modbus Input", codeName: "MI", category: "INPUT", valueFormat: "MODBUS", active: true },
  { id: "pt-do", name: "Digital Output", codeName: "DO", category: "OUTPUT", valueFormat: "DIGITAL", active: true },
  { id: "pt-ac", name: "AC Input", codeName: "AC", category: "INPUT", valueFormat: "AC_INPUT", active: false }
];

export const deviceModels = [
  {
    id: "dm-edge-100-v1",
    name: "Edge Monitor 100",
    sku: "EDGE-100",
    version: 1,
    microControllerType: "ESP32",
    hardwareRevision: "A",
    firmwareFamily: "edge-monitor",
    status: "PUBLISHED",
    ports: [
      { portKey: "DI_1", portTypeId: "pt-di", type: "Digital Input", pin: "D12", description: "Pump status" },
      { portKey: "AI_1", portTypeId: "pt-ai", type: "Analog Input", pin: "A0", description: "Temperature" },
      { portKey: "MI_1", portTypeId: "pt-mi", type: "Modbus Input", pin: "UART1", description: "Energy meter" }
    ]
  },
  {
    id: "dm-relay-io-v2",
    name: "Relay IO",
    sku: "RELAY-IO",
    version: 2,
    microControllerType: "STM32",
    hardwareRevision: "B",
    firmwareFamily: "relay-io",
    status: "PUBLISHED",
    ports: [
      { portKey: "DI_1", portTypeId: "pt-di", type: "Digital Input", pin: "D5", description: "Panel door" },
      { portKey: "DO_1", portTypeId: "pt-do", type: "Digital Output", pin: "R1", description: "Relay 1" },
      { portKey: "DO_2", portTypeId: "pt-do", type: "Digital Output", pin: "R2", description: "Relay 2" }
    ]
  },
  {
    id: "dm-hybrid-v1",
    name: "Hybrid Meter",
    sku: "HYBRID-MTR",
    version: 1,
    microControllerType: "ESP32-S3",
    hardwareRevision: "EVT",
    firmwareFamily: "hybrid-meter",
    status: "DRAFT",
    ports: [
      { portKey: "AI_1", portTypeId: "pt-ai", type: "Analog Input", pin: "A0", description: "Pressure" },
      { portKey: "MI_1", portTypeId: "pt-mi", type: "Modbus Input", pin: "UART2", description: "Drive meter" },
      { portKey: "DO_1", portTypeId: "pt-do", type: "Digital Output", pin: "R1", description: "Trip relay" }
    ]
  }
];

export const devices = [
  {
    id: "dev-demo-1",
    configId: "cfg-demo-1",
    name: "Boiler Room Monitor",
    imei: "867530900001",
    serialNumber: "PL-DEMO-001",
    modelId: "dm-edge-100-v1",
    model: "Edge Monitor 100 v1",
    workspaceId: "ws-platform",
    workspace: "Powerlytic Platform",
    lifecycle: "ACTIVE",
    health: "ONLINE",
    location: "Boiler room, North Plant",
    lastSeen: "2026-06-21T08:20:00Z",
    firmware: "1.8.2",
    deployment: "APPLIED",
    ports: [
      { portKey: "DI_1", name: "Pump Status", valueFormat: "DIGITAL", unit: "", scaling: 1, offset: 0, status: "ACTIVE", thresholdMin: "", thresholdMax: "" },
      { portKey: "AI_1", name: "Temperature", valueFormat: "ANALOG", unit: "C", scaling: 1, offset: 0, status: "ACTIVE", thresholdMin: "", thresholdMax: 80 },
      {
        portKey: "MI_1",
        name: "Energy Meter",
        valueFormat: "MODBUS",
        unit: "V",
        scaling: 1,
        offset: 0,
        status: "ACTIVE",
        thresholdMin: "",
        thresholdMax: "",
        modbusSlaves: [
          {
            slaveId: "1",
            name: "Main Meter",
            serial: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
            polling: { intervalMs: 1000, timeoutMs: 300, retries: 3 },
            reads: [
              { readId: "read-voltage-l1", name: "Voltage L1", functionCode: "fc_3", startAddress: 0, bitsToRead: 16, unit: "V", scaling: 1, offset: 0, endianness: "NONE" },
              { readId: "read-current-l1", name: "Current L1", functionCode: "fc_3", startAddress: 10, bitsToRead: 16, unit: "A", scaling: 0.1, offset: 0, endianness: "NONE" }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "dev-demo-2",
    configId: "cfg-demo-2",
    name: "Line 2 Energy Meter",
    imei: "867530900002",
    serialNumber: "PL-DEMO-002",
    modelId: "dm-edge-100-v1",
    model: "Edge Monitor 100 v1",
    workspaceId: "ws-acme",
    workspace: "Acme Foundry",
    lifecycle: "COMMISSIONING",
    health: "DEGRADED",
    location: "Line 2 MCC",
    lastSeen: "2026-06-21T08:04:00Z",
    firmware: "1.8.0",
    deployment: "SENT",
    ports: []
  },
  {
    id: "dev-demo-3",
    configId: "cfg-demo-3",
    name: "Warehouse Relay Panel",
    imei: "867530900003",
    serialNumber: "PL-DEMO-003",
    modelId: "dm-relay-io-v2",
    model: "Relay IO v2",
    workspaceId: "ws-acme",
    workspace: "Acme Foundry",
    lifecycle: "MAINTENANCE",
    health: "OFFLINE",
    location: "Warehouse DB",
    lastSeen: "2026-06-21T07:38:00Z",
    firmware: "2.2.1",
    deployment: "ERROR",
    ports: []
  }
];

export const telemetryRows = [
  { id: "tv-1", deviceId: "dev-demo-1", ts: "2026-06-21T08:20:00Z", portKey: "AI_1", label: "Temperature", rawValue: 72.4, calibratedValue: 72.4, unit: "C", quality: "good" },
  { id: "tv-2", deviceId: "dev-demo-1", ts: "2026-06-21T08:20:00Z", portKey: "DI_1", label: "Pump Status", rawValue: 1, calibratedValue: 1, unit: "", quality: "good" },
  { id: "tv-3", deviceId: "dev-demo-1", ts: "2026-06-21T08:20:00Z", portKey: "MI_1", readId: "read-voltage-l1", label: "Voltage L1", rawValue: 231, calibratedValue: 231, unit: "V", quality: "good" },
  { id: "tv-4", deviceId: "dev-demo-1", ts: "2026-06-21T08:19:00Z", portKey: "MI_1", readId: "read-current-l1", label: "Current L1", rawValue: 43, calibratedValue: 4.3, unit: "A", quality: "good" }
];

export const deployments = [
  { id: "dep-1", deviceId: "dev-demo-1", configId: "cfg-demo-1", hash: "7b7f8a0a", status: "APPLIED", sentAt: "2026-06-21T08:01:00Z", appliedAt: "2026-06-21T08:01:22Z", message: "" },
  { id: "dep-2", deviceId: "dev-demo-2", configId: "cfg-demo-2", hash: "aaa9c1e2", status: "SENT", sentAt: "2026-06-21T08:14:00Z", appliedAt: null, message: "Waiting for device ACK" },
  { id: "dep-3", deviceId: "dev-demo-3", configId: "cfg-demo-3", hash: "a3c90db1", status: "ERROR", sentAt: "2026-06-21T07:52:00Z", appliedAt: null, message: "Bridge timeout" }
];

export const alertRules = [
  { id: "ar-1", workspaceId: "ws-platform", deviceId: "dev-demo-1", portKey: "AI_1", comparator: "GT", threshold: 80, durationSeconds: 300, severity: "HIGH", message: "Temperature high", active: true },
  { id: "ar-2", workspaceId: "ws-acme", deviceId: "dev-demo-3", portKey: "DO_1", comparator: "EQ", threshold: 0, durationSeconds: 0, severity: "MEDIUM", message: "Relay did not ACK", active: true }
];

export const alertIncidents = [
  { id: "inc-1", workspaceId: "ws-platform", device: "Boiler Room Monitor", message: "Temperature high", severity: "HIGH", status: "NEW", triggeredAt: "2026-06-21T08:12:00Z" },
  { id: "inc-2", workspaceId: "ws-acme", device: "Warehouse Relay Panel", message: "Device offline", severity: "MEDIUM", status: "ACKNOWLEDGED", triggeredAt: "2026-06-21T07:50:00Z" }
];

export const actuations = [
  { id: "act-1", deviceId: "dev-demo-3", device: "Warehouse Relay Panel", portKey: "DO_1", command: "SET_ON", status: "PENDING_APPROVAL", requestedBy: "Ops Lead", reason: "Restore warehouse exhaust fan", createdAt: "2026-06-21T08:18:00Z" },
  { id: "act-2", deviceId: "dev-demo-3", device: "Warehouse Relay Panel", portKey: "DO_2", command: "SET_OFF", status: "ACKNOWLEDGED", requestedBy: "Platform Admin", reason: "Maintenance isolation", createdAt: "2026-06-21T07:58:00Z" }
];

export const auditLogs = [
  { id: "aud-1", action: "device_config.deployed", resource: "device", resourceId: "dev-demo-1", actor: "Platform Admin", workspace: "Powerlytic Platform", createdAt: "2026-06-21T08:01:00Z" },
  { id: "aud-2", action: "actuation.created", resource: "actuation", resourceId: "act-1", actor: "Ops Lead", workspace: "Acme Foundry", createdAt: "2026-06-21T08:18:00Z" },
  { id: "aud-3", action: "membership.invited", resource: "membership", resourceId: "usr-viewer", actor: "Ops Lead", workspace: "Acme Foundry", createdAt: "2026-06-21T07:10:00Z" }
];

export function getDevice(deviceId: string) {
  return devices.find((device) => device.id === deviceId || device.configId === deviceId || device.imei === deviceId) ?? devices[0]!;
}

export function getDeviceModel(modelId: string) {
  return deviceModels.find((model) => model.id === modelId) ?? deviceModels[0]!;
}

export function getWorkspace(workspaceId: string) {
  return workspaces.find((workspace) => workspace.id === workspaceId || workspace.slug === workspaceId) ?? workspaces[0]!;
}
