import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AlertIncidentStatus,
  AlertSeverity,
  DeviceConfigPayload,
  DeviceDto,
  DeviceHealthStatus,
  DeviceLifecycleStatus,
  DeviceModelDto,
  DeviceModelPortDto,
  DeploymentStatus,
  PortTypeDto,
  PortCategory,
  PortValueFormat,
  Role,
  WorkspaceKind,
  WorkspaceStatus,
  type LegacyTelemetryPayload
} from "@powerlytic/types";
import { calculateConfigHash } from "../common/hash.js";

type Audit = {
  id: string;
  workspaceId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  reason?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

type WorkspaceRecord = {
  id: string;
  displayName: string;
  legalName?: string;
  slug: string;
  kind: WorkspaceKind;
  status: WorkspaceStatus;
  timezone: string;
  metadata: Record<string, unknown>;
};

type UserRecord = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  memberships: Array<{ id: string; workspaceId: string; role: Role }>;
};

type TelemetryValue = {
  id: string;
  deviceId: string;
  workspaceId: string;
  ts: string;
  ingestTs: string;
  portKey: string;
  portType: "DIGITAL" | "ANALOG" | "MODBUS";
  readId?: string;
  slaveId?: string;
  rawValue: unknown;
  calibratedValue?: unknown;
  rawRegisters?: string[];
  parsedValue?: number;
  unit?: string;
  quality: "good" | "bad" | "uncertain";
  rawPayload: LegacyTelemetryPayload;
};

@Injectable()
export class DemoStateService {
  private workspaces: WorkspaceRecord[] = [
    {
      id: "ws-platform",
      displayName: "Powerlytic Platform",
      legalName: "Powerlytic",
      slug: "powerlytic",
      kind: WorkspaceKind.ORGANIZATION,
      status: WorkspaceStatus.ACTIVE,
      timezone: "Asia/Kolkata",
      metadata: {}
    }
  ];

  private users: UserRecord[] = [
    {
      id: "usr-admin",
      email: "admin@powerlytic.com",
      name: "Platform Admin",
      active: true,
      createdAt: new Date().toISOString(),
      memberships: [{ id: "mem-admin", workspaceId: "ws-platform", role: Role.SUPER_ADMIN }]
    }
  ];

  private invitations: Array<Record<string, unknown>> = [];

  private portTypes: PortTypeDto[] = [
    {
      id: "pt-di",
      name: "Digital Input",
      codeName: "DI",
      category: PortCategory.INPUT,
      valueFormat: PortValueFormat.DIGITAL,
      active: true
    },
    {
      id: "pt-ai",
      name: "Analog Input",
      codeName: "AI",
      category: PortCategory.INPUT,
      valueFormat: PortValueFormat.ANALOG,
      active: true
    },
    {
      id: "pt-mi",
      name: "Modbus Input",
      codeName: "MI",
      category: PortCategory.INPUT,
      valueFormat: PortValueFormat.MODBUS,
      active: true
    },
    {
      id: "pt-do",
      name: "Digital Output",
      codeName: "DO",
      category: PortCategory.OUTPUT,
      valueFormat: PortValueFormat.DIGITAL,
      active: true
    }
  ];

  private deviceModels: DeviceModelDto[] = [
    {
      id: "dm-edge-100-v1",
      name: "Edge Monitor 100",
      version: 1,
      sku: "EDGE-100",
      description: "Reference industrial monitor carrying forward DI, AI, and MI semantics.",
      microControllerType: "ESP32",
      publishedAt: new Date().toISOString(),
      ports: [
        { id: "dmp-di-1", portKey: "DI_1", portTypeId: "pt-di", description: "Digital input 1" },
        { id: "dmp-ai-1", portKey: "AI_1", portTypeId: "pt-ai", description: "Analog input 1" },
        { id: "dmp-mi-1", portKey: "MI_1", portTypeId: "pt-mi", description: "Modbus input 1" }
      ]
    }
  ];

  private devices: DeviceDto[] = [
    {
      id: "dev-demo-1",
      configId: "cfg-demo-1",
      name: "Boiler Room Monitor",
      imei: "867530900001",
      serialNumber: "PL-DEMO-001",
      deviceModelId: "dm-edge-100-v1",
      workspaceId: "ws-platform",
      lifecycleStatus: DeviceLifecycleStatus.ACTIVE,
      healthStatus: DeviceHealthStatus.ONLINE,
      ports: [
        {
          portKey: "DI_1",
          name: "Pump Status",
          portTypeId: "pt-di",
          calibrationValue: { scaling: 1, offset: 0 },
          status: "ACTIVE"
        },
        {
          portKey: "AI_1",
          name: "Temperature",
          portTypeId: "pt-ai",
          unit: "C",
          calibrationValue: { scaling: 1, offset: 0 },
          thresholds: { max: 80, message: "Temperature high" },
          status: "ACTIVE"
        },
        {
          portKey: "MI_1",
          name: "Energy Meter",
          portTypeId: "pt-mi",
          calibrationValue: { scaling: 1, offset: 0 },
          status: "ACTIVE",
          modbusSlaves: [
            {
              slaveId: "1",
              portKey: "MI_1",
              name: "Main Meter",
              serial: { baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" },
              polling: { intervalMs: 1000, timeoutMs: 300, retries: 3 },
              reads: [
                {
                  readId: "read-voltage-l1",
                  slaveId: "1",
                  portKey: "MI_1",
                  registerType: "holding",
                  functionCode: "fc_3",
                  startAddress: 0,
                  bitsToRead: 16,
                  name: "Voltage L1",
                  scaling: 1,
                  offset: 0,
                  unit: "V",
                  tag: "V_L1",
                  endianness: "NONE"
                }
              ]
            }
          ]
        }
      ],
      lastSeenAt: new Date().toISOString(),
      metadata: {}
    }
  ];

  private telemetry: TelemetryValue[] = [];
  private deployments: Array<Record<string, unknown>> = [];
  private deviceCredentials: Array<Record<string, unknown>> = [
    {
      id: "cred-demo-1",
      deviceId: "dev-demo-1",
      label: "factory-http-key",
      active: true,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString()
    }
  ];
  private lifecycleEvents: Array<Record<string, unknown>> = [
    {
      id: "life-demo-1",
      deviceId: "dev-demo-1",
      fromStatus: "COMMISSIONING",
      toStatus: "ACTIVE",
      reason: "Commissioning completed",
      createdAt: new Date().toISOString()
    }
  ];
  private alerts: Array<Record<string, unknown>> = [];
  private alertIncidents: Array<Record<string, unknown>> = [
    {
      id: "inc-demo-1",
      workspaceId: "ws-platform",
      deviceId: "dev-demo-1",
      triggeredAt: new Date().toISOString(),
      message: "Temperature high",
      severity: AlertSeverity.HIGH,
      status: AlertIncidentStatus.NEW,
      sentTo: { emails: ["ops@powerlytic.com"], phones: [] }
    }
  ];
  private actuations: Array<Record<string, unknown>> = [];
  private auditLogs: Audit[] = [];

  listWorkspaces() {
    return this.workspaces;
  }

  createWorkspace(input: Record<string, unknown>) {
    const workspace = {
      id: randomUUID(),
      displayName: String(input.displayName),
      legalName: input.legalName ? String(input.legalName) : undefined,
      slug: String(input.slug),
      kind: (input.kind as WorkspaceKind) ?? WorkspaceKind.ORGANIZATION,
      status: WorkspaceStatus.ACTIVE,
      timezone: String(input.timezone ?? "UTC"),
      metadata: (input.metadata as Record<string, unknown>) ?? {}
    };
    this.workspaces.push(workspace);
    this.audit("workspace.created", "workspace", workspace.id, workspace.id);
    return workspace;
  }

  getWorkspace(id: string) {
    const workspace = this.workspaces.find((item) => item.id === id || item.slug === id);
    if (!workspace) throw new NotFoundException("Workspace not found");
    return workspace;
  }

  me() {
    return this.users[0];
  }

  login(email: string) {
    const user = this.users.find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new NotFoundException("User not found");
    return {
      user,
      accessToken: `dev-access-${user.id}`,
      refreshToken: `dev-refresh-${user.id}`
    };
  }

  listUsers(query: Record<string, unknown> = {}) {
    if (query.workspaceId) {
      return this.users.filter((user) =>
        user.memberships.some((membership) => membership.workspaceId === query.workspaceId)
      );
    }
    return this.users;
  }

  getUser(id: string) {
    const user = this.users.find((item) => item.id === id || item.email === id);
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  createUser(input: Record<string, unknown>) {
    const workspaceId = String(input.workspaceId ?? input.organization ?? "ws-platform");
    this.getWorkspace(workspaceId);
    const user: UserRecord = {
      id: randomUUID(),
      email: String(input.email),
      name: String(input.name),
      phone: input.phone ? String(input.phone) : undefined,
      active: true,
      createdAt: new Date().toISOString(),
      memberships: [
        {
          id: randomUUID(),
          workspaceId,
          role: (input.role as Role) ?? Role.OPERATOR
        }
      ]
    };
    this.users.push(user);
    this.audit("user.created", "user", user.id, workspaceId);
    return user;
  }

  updateUser(id: string, input: Record<string, unknown>) {
    const user = this.getUser(id);
    if (input.email) user.email = String(input.email);
    if (input.name) user.name = String(input.name);
    if (input.phone) user.phone = String(input.phone);
    if (typeof input.active === "boolean") user.active = input.active;
    this.audit("user.updated", "user", user.id);
    return user;
  }

  deleteUser(id: string) {
    const user = this.getUser(id);
    user.active = false;
    this.audit("user.deactivated", "user", user.id);
    return user;
  }

  listMemberships(workspaceId: string) {
    const workspace = this.getWorkspace(workspaceId);
    return this.users.flatMap((user) =>
      user.memberships
        .filter((membership) => membership.workspaceId === workspace.id)
        .map((membership) => ({ ...membership, user }))
    );
  }

  createInvitation(workspaceId: string, input: Record<string, unknown>) {
    const workspace = this.getWorkspace(workspaceId);
    const invitation = {
      id: randomUUID(),
      workspaceId: workspace.id,
      email: String(input.email),
      role: input.role ?? Role.VIEWER,
      status: "PENDING",
      token: randomUUID(),
      expiresAt: new Date(Date.now() + Number(input.expiresInDays ?? 7) * 86400000).toISOString(),
      createdAt: new Date().toISOString()
    };
    this.invitations.push(invitation);
    this.audit("invitation.created", "invitation", String(invitation.id), workspace.id);
    return invitation;
  }

  listInvitations(workspaceId: string) {
    const workspace = this.getWorkspace(workspaceId);
    return this.invitations.filter((invite) => invite.workspaceId === workspace.id);
  }

  removeMembership(workspaceId: string, membershipId: string) {
    this.getWorkspace(workspaceId);
    for (const user of this.users) {
      const membership = user.memberships.find((item) => item.id === membershipId);
      if (membership) {
        user.memberships = user.memberships.filter((item) => item.id !== membershipId);
        this.audit("membership.removed", "membership", membershipId, workspaceId);
        return { id: membershipId, workspaceId, status: "REMOVED" };
      }
    }
    throw new NotFoundException("Membership not found");
  }

  listPortTypes() {
    return this.portTypes;
  }

  createPortType(input: Omit<PortTypeDto, "id" | "active">) {
    const portType = { ...input, id: randomUUID(), active: true };
    this.portTypes.push(portType);
    this.audit("port_type.created", "port_type", portType.id);
    return portType;
  }

  updatePortType(id: string, input: Record<string, unknown>) {
    const portType = this.portTypes.find((item) => item.id === id);
    if (!portType) throw new NotFoundException("Port type not found");
    Object.assign(portType, input);
    this.audit("port_type.updated", "port_type", id);
    return portType;
  }

  deactivatePortType(id: string) {
    const portType = this.portTypes.find((item) => item.id === id);
    if (!portType) throw new NotFoundException("Port type not found");
    portType.active = false;
    this.audit("port_type.deactivated", "port_type", id);
    return portType;
  }

  listDeviceModels() {
    return this.deviceModels;
  }

  createDeviceModel(input: Record<string, unknown>) {
    const ports = this.generateModelPorts(input.ports as Array<{ portTypeId: string; description?: string; microControllerPin?: string }>);
    const model: DeviceModelDto = {
      id: randomUUID(),
      name: String(input.name),
      version: 1,
      sku: String(input.sku),
      description: input.description ? String(input.description) : undefined,
      microControllerType: String(input.microControllerType),
      ports
    };
    this.deviceModels.push(model);
    this.audit("device_model.created", "device_model", model.id);
    return model;
  }

  publishDeviceModel(id: string) {
    const model = this.findDeviceModel(id);
    model.publishedAt = new Date().toISOString();
    this.audit("device_model.published", "device_model", model.id);
    return model;
  }

  findDeviceModel(id: string) {
    const model = this.deviceModels.find((item) => item.id === id);
    if (!model) throw new NotFoundException("Device model not found");
    return model;
  }

  deleteDeviceModel(id: string) {
    const model = this.findDeviceModel(id);
    if (model.publishedAt) {
      throw new BadRequestException("Published device models cannot be deleted; deprecate them instead");
    }
    this.deviceModels = this.deviceModels.filter((item) => item.id !== id);
    this.audit("device_model.deleted", "device_model", id);
    return model;
  }

  listDevices(query: Record<string, unknown> = {}) {
    return this.devices.filter((device) => {
      if (query.workspaceId && device.workspaceId !== query.workspaceId) return false;
      if (query.imei && device.imei !== query.imei) return false;
      if (query.configId && device.configId !== query.configId) return false;
      if (query.status && device.lifecycleStatus !== query.status) return false;
      return true;
    });
  }

  manufactureDevice(input: Record<string, unknown>) {
    const model = this.findDeviceModel(String(input.deviceModelVersionId));
    const device: DeviceDto = {
      id: randomUUID(),
      configId: randomUUID(),
      imei: String(input.imei),
      serialNumber: input.serialNumber ? String(input.serialNumber) : undefined,
      batchNumber: input.batchNumber ? String(input.batchNumber) : undefined,
      name: input.name ? String(input.name) : `Device ${String(input.imei).slice(-4)}`,
      deviceModelId: model.id,
      lifecycleStatus: DeviceLifecycleStatus.IN_INVENTORY,
      healthStatus: DeviceHealthStatus.OFFLINE,
      ports: model.ports.map((port) => ({
        portKey: port.portKey,
        name: port.description ?? `Port ${port.portKey}`,
        portTypeId: port.portTypeId,
        calibrationValue: { scaling: 1, offset: 0 },
        status: "INACTIVE"
      })),
      metadata: (input.metadata as Record<string, unknown>) ?? {}
    };
    this.devices.push(device);
    this.audit("device.manufactured", "device", device.id, undefined, "Inventory record created");
    return device;
  }

  claimDevice(input: Record<string, unknown>) {
    const device = this.devices.find((item) => item.configId === input.claimCode || item.imei === input.claimCode);
    if (!device) throw new NotFoundException("Claimable device not found");
    device.workspaceId = String(input.workspaceId);
    device.name = input.name ? String(input.name) : device.name;
    device.lifecycleStatus = DeviceLifecycleStatus.ASSIGNED_TO_WORKSPACE;
    this.audit("device.claimed", "device", device.id, device.workspaceId);
    return device;
  }

  getDevice(id: string) {
    const device = this.devices.find((item) => item.id === id || item.configId === id || item.imei === id);
    if (!device) throw new NotFoundException("Device not found");
    return device;
  }

  updateDevice(id: string, input: Record<string, unknown>) {
    const device = this.getDevice(id);
    if ("imei" in input || "configId" in input || "deviceModelId" in input) {
      throw new Error("imei, configId, and deviceModelId are immutable");
    }
    Object.assign(device, input);
    this.audit("device.updated", "device", device.id, device.workspaceId);
    return device;
  }

  deleteDevice(id: string) {
    const device = this.getDevice(id);
    const fromStatus = device.lifecycleStatus;
    device.lifecycleStatus = DeviceLifecycleStatus.RETIRED;
    device.healthStatus = DeviceHealthStatus.OFFLINE;
    this.lifecycleEvents.push({
      id: randomUUID(),
      deviceId: device.id,
      fromStatus,
      toStatus: device.lifecycleStatus,
      reason: "Device retired",
      createdAt: new Date().toISOString()
    });
    this.audit("device.retired", "device", device.id, device.workspaceId);
    return device;
  }

  listDeviceCredentials(deviceId: string) {
    const device = this.getDevice(deviceId);
    return this.deviceCredentials.filter((credential) => credential.deviceId === device.id);
  }

  createDeviceCredential(deviceId: string, input: Record<string, unknown> = {}) {
    const device = this.getDevice(deviceId);
    const credential = {
      id: randomUUID(),
      deviceId: device.id,
      label: String(input.label ?? "device-api-key"),
      active: true,
      secretPreview: `pld_${randomUUID().slice(0, 8)}...`,
      createdAt: new Date().toISOString()
    };
    this.deviceCredentials.push(credential);
    this.audit("device_credential.created", "device_credential", String(credential.id), device.workspaceId);
    return credential;
  }

  revokeDeviceCredential(deviceId: string, credentialId: string) {
    this.getDevice(deviceId);
    const credential = this.deviceCredentials.find((item) => item.id === credentialId);
    if (!credential) throw new NotFoundException("Credential not found");
    credential.active = false;
    credential.revokedAt = new Date().toISOString();
    this.audit("device_credential.revoked", "device_credential", credentialId);
    return credential;
  }

  listLifecycleEvents(deviceId: string) {
    const device = this.getDevice(deviceId);
    return this.lifecycleEvents.filter((event) => event.deviceId === device.id);
  }

  buildDeviceConfig(id: string): DeviceConfigPayload {
    const device = this.getDevice(id);
    return {
      device_id: device.id,
      configId: device.configId,
      imei: device.imei,
      modbusSlaves: device.ports.flatMap((port) =>
        (port.modbusSlaves ?? []).map((slave) => ({
          unique_slave_id: String(slave.slaveId),
          slave_id: Number(slave.slaveId),
          serial: slave.serial,
          polling: slave.polling,
          registers: slave.reads.map((read) => ({
            readId: read.readId,
            func: read.functionCode,
            start: read.startAddress,
            bits: read.bitsToRead
          }))
        }))
      )
    };
  }

  deployConfig(id: string) {
    const device = this.getDevice(id);
    const config = this.buildDeviceConfig(device.id);
    const deployment = {
      id: randomUUID(),
      deviceId: device.id,
      configId: device.configId,
      configHash: calculateConfigHash(config),
      payload: {
        message: "config",
        hash: calculateConfigHash(config),
        configId: config.configId,
        config
      },
      status: DeploymentStatus.SENT,
      sentAt: new Date().toISOString()
    };
    this.deployments.push(deployment);
    this.audit("device_config.deployed", "device", device.id, device.workspaceId);
    return deployment;
  }

  getDeploymentStatus(id: string) {
    const device = this.getDevice(id);
    return [...this.deployments].reverse().find((deployment) => deployment.deviceId === device.id) ?? { status: DeploymentStatus.PENDING };
  }

  listDeployments(id: string) {
    const device = this.getDevice(id);
    return this.deployments.filter((deployment) => deployment.deviceId === device.id);
  }

  updateDeploymentStatus(id: string, input: Record<string, unknown>) {
    const current = this.getDeploymentStatus(id) as Record<string, unknown>;
    current.status = String(input.status).toUpperCase();
    current.message = input.message;
    if (current.status === DeploymentStatus.APPLIED) current.appliedAt = new Date().toISOString();
    this.audit("device_config.status_callback", "device", this.getDevice(id).id);
    return current;
  }

  ingestTelemetry(deviceId: string, payload: LegacyTelemetryPayload) {
    const device = this.getDevice(payload.deviceId ?? deviceId);
    if (!device.workspaceId) throw new Error("Device is not assigned to a workspace");
    const ts = payload.ts ? new Date(payload.ts).toISOString() : new Date().toISOString();
    const rows: TelemetryValue[] = [];

    for (const [portKey, rawValue] of Object.entries(payload.values)) {
      const port = device.ports.find((item) => item.portKey === portKey);
      if (!port) continue;
      const type = portKey.startsWith("MI_") ? "MODBUS" : portKey.startsWith("AI_") ? "ANALOG" : "DIGITAL";

      if (type === "MODBUS" && Array.isArray(rawValue)) {
        for (const slavePayload of rawValue as Array<{ slave_id: string | number; registers: Array<{ readId: string; value: number[] }> }>) {
          for (const register of slavePayload.registers ?? []) {
            const parsedValue = Array.isArray(register.value) ? Number(register.value[0] ?? 0) : 0;
            rows.push(this.telemetryRow(device, payload, ts, portKey, type, parsedValue, parsedValue, {
              readId: register.readId,
              slaveId: String(slavePayload.slave_id),
              rawRegisters: register.value.map((value) => `0x${value.toString(16).padStart(4, "0").toUpperCase()}`),
              parsedValue
            }));
          }
        }
      } else {
        const calibratedValue =
          type === "ANALOG" && typeof rawValue === "number"
            ? rawValue * port.calibrationValue.scaling + port.calibrationValue.offset
            : rawValue;
        rows.push(this.telemetryRow(device, payload, ts, portKey, type, rawValue, calibratedValue));
      }
    }

    this.telemetry.push(...rows);
    return { success: true, count: rows.length, message: `Successfully transformed and stored ${rows.length} value(s)` };
  }

  listTelemetry(deviceId: string, query: Record<string, unknown>) {
    return this.telemetry
      .filter((row) => row.deviceId === this.getDevice(deviceId).id)
      .filter((row) => !query.portKey || row.portKey === query.portKey)
      .filter((row) => !query.readId || row.readId === query.readId)
      .slice(-(Number(query.limit ?? 1000)))
      .reverse();
  }

  latestTelemetry(deviceId: string) {
    const seen = new Set<string>();
    return this.listTelemetry(deviceId, {}).filter((row) => {
      const key = row.readId ? `${row.portKey}:${row.readId}` : row.portKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  createAlertRule(input: Record<string, unknown>) {
    const rule = {
      id: randomUUID(),
      ...input,
      severity: input.severity ?? AlertSeverity.MEDIUM,
      active: true,
      createdAt: new Date().toISOString()
    };
    this.alerts.push(rule);
    this.audit("alert_rule.created", "alert_rule", String(rule.id), String(input.workspaceId ?? ""));
    return rule;
  }

  listAlerts() {
    return this.alerts;
  }

  updateAlertRule(id: string, input: Record<string, unknown>) {
    const rule = this.alerts.find((alert) => alert.id === id);
    if (!rule) throw new NotFoundException("Alert rule not found");
    Object.assign(rule, input);
    this.audit("alert_rule.updated", "alert_rule", id, String(rule.workspaceId ?? ""));
    return rule;
  }

  deactivateAlertRule(id: string) {
    return this.updateAlertRule(id, { active: false });
  }

  createAlertIncident(input: Record<string, unknown>) {
    const incident = {
      id: randomUUID(),
      status: AlertIncidentStatus.NEW,
      triggeredAt: new Date().toISOString(),
      ...input
    };
    this.alertIncidents.push(incident);
    return incident;
  }

  listAlertIncidents() {
    return this.alertIncidents;
  }

  updateAlertIncident(id: string, input: Record<string, unknown>) {
    const incident = this.alertIncidents.find((item) => item.id === id);
    if (!incident) throw new NotFoundException("Alert incident not found");
    Object.assign(incident, input);
    this.audit("alert_incident.updated", "alert_incident", id, String(incident.workspaceId ?? ""));
    return incident;
  }

  createActuation(deviceId: string, input: Record<string, unknown>) {
    const device = this.getDevice(deviceId);
    const command = {
      id: randomUUID(),
      deviceId: device.id,
      workspaceId: device.workspaceId,
      requestedById: "usr-admin",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      ...input
    };
    this.actuations.push(command);
    this.audit("actuation.created", "actuation", command.id, device.workspaceId, String(input.reason ?? ""));
    return command;
  }

  listActuations(deviceId: string) {
    const device = this.getDevice(deviceId);
    return this.actuations.filter((command) => command.deviceId === device.id);
  }

  updateActuation(deviceId: string, actuationId: string, input: Record<string, unknown>) {
    this.getDevice(deviceId);
    const command = this.actuations.find((item) => item.id === actuationId);
    if (!command) throw new NotFoundException("Actuation not found");
    Object.assign(command, input);
    this.audit("actuation.updated", "actuation", actuationId, String(command.workspaceId ?? ""));
    return command;
  }

  listAuditLogs() {
    return this.auditLogs;
  }

  private generateModelPorts(ports: Array<{ portTypeId: string; description?: string; microControllerPin?: string }> = []): DeviceModelPortDto[] {
    const counts = new Map<string, number>();
    return ports.map((port) => {
      const portType = this.portTypes.find((item) => item.id === port.portTypeId);
      if (!portType) throw new NotFoundException(`Port type not found: ${port.portTypeId}`);
      const next = (counts.get(portType.codeName) ?? 0) + 1;
      counts.set(portType.codeName, next);
      return {
        id: randomUUID(),
        portKey: `${portType.codeName}_${next}`,
        portTypeId: port.portTypeId,
        description: port.description,
        microControllerPin: port.microControllerPin
      };
    });
  }

  private telemetryRow(
    device: DeviceDto,
    rawPayload: LegacyTelemetryPayload,
    ts: string,
    portKey: string,
    portType: "DIGITAL" | "ANALOG" | "MODBUS",
    rawValue: unknown,
    calibratedValue: unknown,
    extra: Partial<TelemetryValue> = {}
  ): TelemetryValue {
    return {
      id: randomUUID(),
      deviceId: device.id,
      workspaceId: device.workspaceId ?? "",
      ts,
      ingestTs: new Date().toISOString(),
      portKey,
      portType,
      rawValue,
      calibratedValue,
      quality: "good",
      rawPayload,
      ...extra
    };
  }

  private audit(action: string, resource: string, resourceId?: string, workspaceId?: string, reason?: string) {
    this.auditLogs.push({
      id: randomUUID(),
      workspaceId,
      action,
      resource,
      resourceId,
      reason,
      createdAt: new Date().toISOString()
    });
  }
}
