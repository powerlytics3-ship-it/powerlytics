import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  AlertIncidentStatus,
  AlertSeverity,
  DeploymentStatus,
  DeviceHealthStatus,
  DeviceLifecycleStatus,
  ModelVersionStatus,
  Prisma,
  Role,
  WorkspaceKind,
  WorkspaceStatus
} from "@prisma/client";
import { type DeviceConfigPayload, type LegacyTelemetryPayload, type ModbusFunctionCode } from "@powerlytic/types";
import { RequestContextService } from "../auth/request-context.service.js";
import { calculateConfigHash } from "../common/hash.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { QueueProducerService } from "../queues/queue-producer.service.js";
import { MqttService } from "../realtime/mqtt.service.js";

@Injectable()
export class ProductionStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueProducerService,
    private readonly mqtt: MqttService,
    private readonly requestContext: RequestContextService
  ) {}

  async me() {
    return this.prisma.user.findFirst({ include: { memberships: true } });
  }

  async login(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, include: { memberships: true } });
    if (!user) throw new NotFoundException("User not found");
    return {
      user,
      // TODO: replace dev tokens with OIDC Authorization Code + PKCE tokens from your identity provider.
      accessToken: `dev-access-${user.id}`,
      refreshToken: `dev-refresh-${user.id}`
    };
  }

  async listWorkspaces() {
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds();
    return this.prisma.workspace.findMany({
      where: allowedWorkspaceIds ? { id: { in: allowedWorkspaceIds } } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  async createWorkspace(input: Record<string, unknown>) {
    this.requirePlatformUser();
    const workspace = await this.prisma.workspace.create({
      data: {
        displayName: String(input.displayName),
        legalName: input.legalName ? String(input.legalName) : undefined,
        slug: String(input.slug),
        kind: (input.kind as WorkspaceKind) ?? WorkspaceKind.ORGANIZATION,
        status: WorkspaceStatus.ACTIVE,
        timezone: String(input.timezone ?? "UTC"),
        metadata: objectValue(input.metadata)
      }
    });
    await this.audit("workspace.created", "workspace", workspace.id, workspace.id);
    return workspace;
  }

  async getWorkspace(id: string) {
    const workspace = await this.prisma.workspace.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!workspace) throw new NotFoundException("Workspace not found");
    this.assertWorkspaceAllowed(workspace.id);
    return workspace;
  }

  async listUsers(query: Record<string, unknown> = {}) {
    const workspaceId = this.resolveWorkspaceId(query.workspaceId ? String(query.workspaceId) : undefined);
    return this.prisma.user.findMany({
      where: workspaceId ? { memberships: { some: { workspaceId } } } : undefined,
      include: { memberships: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { OR: [{ id }, { email: id }] }, include: { memberships: true } });
    if (!user) throw new NotFoundException("User not found");
    if (!this.requestContext.isPlatformUser()) {
      const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds() ?? [];
      const canSee = user.memberships.some((membership) => allowedWorkspaceIds.includes(membership.workspaceId));
      if (!canSee) throw new NotFoundException("User not found");
    }
    return user;
  }

  async createUser(input: Record<string, unknown>) {
    const workspaceId = String(input.workspaceId ?? input.organization ?? "ws-platform");
    this.assertWorkspaceAllowed(workspaceId);
    await this.getWorkspace(workspaceId);
    const user = await this.prisma.user.create({
      data: {
        email: String(input.email),
        name: String(input.name),
        phone: input.phone ? String(input.phone) : undefined,
        memberships: {
          create: {
            workspaceId,
            role: (input.role as Role) ?? Role.OPERATOR
          }
        }
      },
      include: { memberships: true }
    });
    await this.audit("user.created", "user", user.id, workspaceId);
    return user;
  }

  async updateUser(id: string, input: Record<string, unknown>) {
    const user = await this.getUser(id);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: input.email ? String(input.email) : undefined,
        name: input.name ? String(input.name) : undefined,
        phone: input.phone ? String(input.phone) : undefined,
        active: typeof input.active === "boolean" ? input.active : undefined
      },
      include: { memberships: true }
    });
    await this.audit("user.updated", "user", updated.id);
    return updated;
  }

  async deleteUser(id: string) {
    const user = await this.getUser(id);
    await this.audit("user.deactivated", "user", user.id);
    return this.prisma.user.update({ where: { id: user.id }, data: { active: false }, include: { memberships: true } });
  }

  async listMemberships(workspaceId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    return this.prisma.membership.findMany({ where: { workspaceId: workspace.id }, include: { user: true, workspace: true } });
  }

  async createInvitation(workspaceId: string, input: Record<string, unknown>) {
    const workspace = await this.getWorkspace(workspaceId);
    const token = randomUUID();
    const invitation = await this.prisma.invitation.create({
      data: {
        workspaceId: workspace.id,
        email: String(input.email),
        role: (input.role as Role) ?? Role.VIEWER,
        tokenHash: hashSecret(token),
        expiresAt: new Date(Date.now() + Number(input.expiresInDays ?? 7) * 86400000)
      }
    });
    await this.audit("invitation.created", "invitation", invitation.id, workspace.id);
    return {
      ...invitation,
      // TODO: send this one-time token through your transactional email provider.
      token
    };
  }

  async listInvitations(workspaceId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    return this.prisma.invitation.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "desc" } });
  }

  async removeMembership(workspaceId: string, membershipId: string) {
    const workspace = await this.getWorkspace(workspaceId);
    const membership = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: "REMOVED" }
    });
    await this.audit("membership.removed", "membership", membershipId, workspace.id);
    return membership;
  }

  async listPortTypes() {
    return this.prisma.portType.findMany({ orderBy: { codeName: "asc" } });
  }

  async createPortType(input: Record<string, unknown>) {
    const portType = await this.prisma.portType.create({
      data: {
        name: String(input.name),
        codeName: String(input.codeName),
        category: input.category as never,
        valueFormat: input.valueFormat as never,
        description: input.description ? String(input.description) : undefined
      }
    });
    await this.audit("port_type.created", "port_type", portType.id);
    return portType;
  }

  async updatePortType(id: string, input: Record<string, unknown>) {
    const portType = await this.prisma.portType.update({ where: { id }, data: input });
    await this.audit("port_type.updated", "port_type", id);
    return portType;
  }

  async deactivatePortType(id: string) {
    const portType = await this.prisma.portType.update({ where: { id }, data: { active: false } });
    await this.audit("port_type.deactivated", "port_type", id);
    return portType;
  }

  async listDeviceModels() {
    const versions = await this.prisma.deviceModelVersion.findMany({
      include: { model: true, ports: { include: { portType: true } } },
      orderBy: { createdAt: "desc" }
    });
    return versions.map(modelVersionDto);
  }

  async findDeviceModel(id: string) {
    const version = await this.prisma.deviceModelVersion.findFirst({
      where: { OR: [{ id }, { model: { id } }] },
      include: { model: true, ports: { include: { portType: true } } }
    });
    if (!version) throw new NotFoundException("Device model not found");
    return modelVersionDto(version);
  }

  async createDeviceModel(input: Record<string, unknown>) {
    const model = await this.prisma.deviceModel.create({
      data: {
        name: String(input.name),
        sku: String(input.sku),
        description: input.description ? String(input.description) : undefined,
        versions: {
          create: {
            version: 1,
            status: ModelVersionStatus.DRAFT,
            microControllerType: String(input.microControllerType),
            hardwareRevision: input.hardwareRevision ? String(input.hardwareRevision) : undefined,
            ports: {
              create: await this.generateModelPorts(input.ports as Array<Record<string, unknown>>)
            }
          }
        }
      },
      include: { versions: { include: { ports: { include: { portType: true } } } } }
    });
    const version = model.versions[0];
    if (!version) throw new NotFoundException("Device model version was not created");
    await this.audit("device_model.created", "device_model", version.id);
    return modelVersionDto({ ...version, model });
  }

  async publishDeviceModel(id: string) {
    const existing = await this.findDeviceModel(id);
    const updated = await this.prisma.deviceModelVersion.update({
      where: { id: existing.id },
      data: { status: ModelVersionStatus.PUBLISHED, publishedAt: new Date() },
      include: { model: true, ports: { include: { portType: true } } }
    });
    await this.audit("device_model.published", "device_model", updated.id);
    return modelVersionDto(updated);
  }

  async deleteDeviceModel(id: string) {
    const existing = await this.findDeviceModel(id);
    if (existing.publishedAt) throw new BadRequestException("Published device models cannot be deleted; deprecate them instead");
    await this.prisma.deviceModelVersion.delete({ where: { id: existing.id } });
    await this.audit("device_model.deleted", "device_model", existing.id);
    return existing;
  }

  async listDevices(query: Record<string, unknown> = {}) {
    const workspaceId = this.resolveWorkspaceId(query.workspaceId ? String(query.workspaceId) : undefined);
    const devices = await this.prisma.device.findMany({
      where: {
        workspaceId: workspaceId ? workspaceId : this.workspaceFilterForNullableDevice(),
        imei: query.imei ? String(query.imei) : undefined,
        configId: query.configId ? String(query.configId) : undefined,
        lifecycleStatus: query.status ? (query.status as DeviceLifecycleStatus) : undefined
      },
      include: deviceInclude(),
      orderBy: { createdAt: "desc" }
    });
    return devices.map(deviceDto);
  }

  async getDevice(id: string) {
    const device = await this.prisma.device.findFirst({
      where: { OR: [{ id }, { configId: id }, { imei: id }] },
      include: deviceInclude()
    });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    return deviceDto(device);
  }

  async manufactureDevice(input: Record<string, unknown>) {
    this.requirePlatformUser();
    const modelVersion = await this.prisma.deviceModelVersion.findUnique({
      where: { id: String(input.deviceModelVersionId) },
      include: { ports: { include: { portType: true } } }
    });
    if (!modelVersion) throw new NotFoundException("Device model version not found");

    const device = await this.prisma.device.create({
      data: {
        configId: String(input.configId ?? randomUUID()),
        imei: String(input.imei),
        serialNumber: input.serialNumber ? String(input.serialNumber) : undefined,
        batchNumber: input.batchNumber ? String(input.batchNumber) : undefined,
        name: input.name ? String(input.name) : `Device ${String(input.imei).slice(-4)}`,
        deviceModelVersionId: modelVersion.id,
        lifecycleStatus: DeviceLifecycleStatus.IN_INVENTORY,
        healthStatus: DeviceHealthStatus.OFFLINE,
        firmwareVersion: input.firmwareVersion ? String(input.firmwareVersion) : undefined,
        hardwareRevision: input.hardwareRevision ? String(input.hardwareRevision) : undefined,
        manufactureDate: new Date(),
        metadata: objectValue(input.metadata),
        ports: {
          create: modelVersion.ports.map((port) => ({
            portTypeId: port.portTypeId,
            portKey: port.portKey,
            name: port.description ?? `Port ${port.portKey}`,
            status: "INACTIVE"
          }))
        },
        lifecycleEvents: {
          create: {
            fromStatus: DeviceLifecycleStatus.MANUFACTURED,
            toStatus: DeviceLifecycleStatus.IN_INVENTORY,
            reason: "Inventory record created"
          }
        }
      },
      include: deviceInclude()
    });
    await this.audit("device.manufactured", "device", device.id, undefined, "Inventory record created");
    return deviceDto(device);
  }

  async claimDevice(input: Record<string, unknown>) {
    const claimCode = String(input.claimCode);
    const workspaceId = this.resolveWorkspaceId(String(input.workspaceId));
    const device = await this.prisma.device.findFirst({ where: { OR: [{ configId: claimCode }, { imei: claimCode }] } });
    if (!device) throw new NotFoundException("Claimable device not found");
    if (device.workspaceId && device.workspaceId !== workspaceId) {
      throw new BadRequestException("Device is already assigned to a workspace");
    }
    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        workspaceId,
        name: input.name ? String(input.name) : device.name,
        lifecycleStatus: DeviceLifecycleStatus.ASSIGNED_TO_WORKSPACE,
        lifecycleEvents: {
          create: {
            fromStatus: device.lifecycleStatus,
            toStatus: DeviceLifecycleStatus.ASSIGNED_TO_WORKSPACE,
            reason: "Device claimed"
          }
        }
      },
      include: deviceInclude()
    });
    await this.audit("device.claimed", "device", updated.id, updated.workspaceId ?? undefined);
    return deviceDto(updated);
  }

  async updateDevice(id: string, input: Record<string, unknown>) {
    if ("imei" in input || "configId" in input || "deviceModelId" in input) {
      throw new BadRequestException("imei, configId, and deviceModelId are immutable");
    }
    const device = await this.prisma.device.findFirst({ where: { OR: [{ id }, { configId: id }, { imei: id }] } });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    if (input.workspaceId) this.assertWorkspaceAllowed(String(input.workspaceId));
    const updated = await this.prisma.device.update({ where: { id: device.id }, data: input, include: deviceInclude() });
    await this.audit("device.updated", "device", updated.id, updated.workspaceId ?? undefined);
    return deviceDto(updated);
  }

  async deleteDevice(id: string) {
    const device = await this.prisma.device.findFirst({ where: { OR: [{ id }, { configId: id }, { imei: id }] } });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    const updated = await this.prisma.device.update({
      where: { id: device.id },
      data: {
        lifecycleStatus: DeviceLifecycleStatus.RETIRED,
        healthStatus: DeviceHealthStatus.OFFLINE,
        lifecycleEvents: {
          create: {
            fromStatus: device.lifecycleStatus,
            toStatus: DeviceLifecycleStatus.RETIRED,
            reason: "Device retired"
          }
        }
      },
      include: deviceInclude()
    });
    await this.audit("device.retired", "device", updated.id, updated.workspaceId ?? undefined);
    return deviceDto(updated);
  }

  async listDeviceCredentials(deviceId: string) {
    const device = await this.getDevice(deviceId);
    this.assertDeviceAllowed(device.workspaceId, device.id);
    return this.prisma.deviceCredential.findMany({ where: { deviceId: device.id }, orderBy: { createdAt: "desc" } });
  }

  async createDeviceCredential(deviceId: string, input: Record<string, unknown> = {}) {
    const device = await this.getDevice(deviceId);
    this.assertDeviceAllowed(device.workspaceId, device.id);
    const secret = `pld_${randomUUID().replaceAll("-", "")}`;
    const credential = await this.prisma.deviceCredential.create({
      data: {
        deviceId: device.id,
        label: String(input.label ?? "device-api-key"),
        keyHash: hashSecret(secret)
      }
    });
    await this.audit("device_credential.created", "device_credential", credential.id, device.workspaceId);
    return {
      ...credential,
      // TODO: show this secret only once and store it in the device provisioning system.
      secret
    };
  }

  async revokeDeviceCredential(_deviceId: string, credentialId: string) {
    const credential = await this.prisma.deviceCredential.update({
      where: { id: credentialId },
      data: { active: false, rotatedAt: new Date() }
    });
    await this.audit("device_credential.revoked", "device_credential", credentialId);
    return credential;
  }

  async listLifecycleEvents(deviceId: string) {
    const device = await this.getDevice(deviceId);
    this.assertDeviceAllowed(device.workspaceId, device.id);
    return this.prisma.deviceLifecycleEvent.findMany({ where: { deviceId: device.id }, orderBy: { createdAt: "desc" } });
  }

  async buildDeviceConfig(id: string): Promise<DeviceConfigPayload> {
    const device = await this.prisma.device.findFirst({
      where: { OR: [{ id }, { configId: id }, { imei: id }] },
      include: deviceInclude()
    });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    return {
      device_id: device.id,
      configId: device.configId,
      imei: device.imei,
      modbusSlaves: device.ports.flatMap((port) =>
        port.modbusSlaves.map((slave) => ({
          unique_slave_id: slave.slaveId,
          slave_id: Number(slave.slaveId),
          serial: {
            baudRate: slave.baudRate,
            dataBits: slave.dataBits,
            stopBits: slave.stopBits,
            parity: normalizeParity(slave.parity)
          },
          polling: {
            intervalMs: slave.intervalMs,
            timeoutMs: slave.timeoutMs,
            retries: slave.retries
          },
          registers: slave.reads.map((read) => ({
            readId: read.readId,
            func: normalizeFunctionCode(read.functionCode),
            start: read.startAddress,
            bits: read.bitsToRead
          }))
        }))
      )
    };
  }

  async deployConfig(id: string) {
    const device = await this.prisma.device.findFirst({ where: { OR: [{ id }, { configId: id }, { imei: id }] } });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    const config = await this.buildDeviceConfig(device.id);
    const configHash = calculateConfigHash(config);
    const payload = { message: "config", hash: configHash, configId: config.configId, config };
    const deployment = await this.prisma.configDeployment.create({
      data: {
        deviceId: device.id,
        configId: device.configId,
        configHash,
        payload: payload as unknown as Prisma.InputJsonValue,
        status: DeploymentStatus.PENDING
      }
    });
    await this.queues.enqueueConfigDeployment({ deploymentId: deployment.id, deviceId: device.id, payload });
    await this.sendConfigToHttpsBridge(device.id, payload);
    await this.mqtt.publishJson(`powerlytic/devices/${device.id}/config`, payload);
    await this.audit("device_config.deployed", "device", device.id, device.workspaceId ?? undefined);
    return deployment;
  }

  async getDeploymentStatus(id: string) {
    const device = await this.getDevice(id);
    return (
      (await this.prisma.configDeployment.findFirst({ where: { deviceId: device.id }, orderBy: { createdAt: "desc" } })) ?? {
        status: DeploymentStatus.PENDING
      }
    );
  }

  async listDeployments(id: string) {
    const device = await this.getDevice(id);
    return this.prisma.configDeployment.findMany({ where: { deviceId: device.id }, orderBy: { createdAt: "desc" } });
  }

  async updateDeploymentStatus(id: string, input: Record<string, unknown>) {
    const current = (await this.getDeploymentStatus(id)) as { id?: string };
    if (!current.id) return current;
    const status = String(input.status).toUpperCase() as DeploymentStatus;
    const deployment = await this.prisma.configDeployment.update({
      where: { id: current.id },
      data: {
        status,
        message: input.message ? String(input.message) : undefined,
        appliedAt: status === DeploymentStatus.APPLIED ? new Date() : undefined
      }
    });
    await this.audit("device_config.status_callback", "device", deployment.deviceId);
    return deployment;
  }

  async ingestTelemetry(deviceId: string, payload: LegacyTelemetryPayload) {
    const device = await this.prisma.device.findFirst({
      where: { OR: [{ id: payload.deviceId ?? deviceId }, { configId: payload.deviceId ?? deviceId }, { imei: payload.deviceId ?? deviceId }] },
      include: { ports: { include: { portType: true } } }
    });
    if (!device) throw new NotFoundException("Device not found");
    this.assertDeviceAllowed(device.workspaceId, device.id);
    if (!device.workspaceId) throw new BadRequestException("Device is not assigned to a workspace");
    const ts = payload.ts ? new Date(payload.ts) : new Date();
    const rows: any[] = [];
    for (const [portKey, rawValue] of Object.entries(payload.values)) {
      const port = device.ports.find((item) => item.portKey === portKey);
      if (!port) continue;
      const portType = portKey.startsWith("MI_") ? "MODBUS" : portKey.startsWith("AI_") ? "ANALOG" : "DIGITAL";
      if (portType === "MODBUS" && Array.isArray(rawValue)) {
        for (const slavePayload of rawValue as Array<{ slave_id: string | number; registers: Array<{ readId: string; value: number[] }> }>) {
          for (const register of slavePayload.registers ?? []) {
            const parsedValue = Number(register.value?.[0] ?? 0);
            rows.push({
              ts,
              workspaceId: device.workspaceId,
              deviceId: device.id,
              devicePortId: port.id,
              portKey,
              portType,
              readId: register.readId,
              slaveId: String(slavePayload.slave_id),
              rawValue: register.value,
              calibratedValue: parsedValue,
              parsedValue,
              rawRegisters: register.value.map((value) => `0x${value.toString(16).padStart(4, "0").toUpperCase()}`),
              rawPayload: payload as unknown as Prisma.InputJsonValue
            });
          }
        }
      } else {
        const calibratedValue = portType === "ANALOG" && typeof rawValue === "number" ? rawValue * port.scaling + port.offset : rawValue;
        rows.push({
          ts,
          workspaceId: device.workspaceId,
          deviceId: device.id,
          devicePortId: port.id,
          portKey,
          portType,
          rawValue,
          calibratedValue,
          unit: port.unit,
          rawPayload: payload as unknown as Prisma.InputJsonValue
        });
      }
    }
    if (rows.length) await this.prisma.telemetryValue.createMany({ data: rows });
    await this.prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: new Date(), healthStatus: DeviceHealthStatus.ONLINE } });
    await this.queues.enqueueAlertEvaluation({ deviceId: device.id, workspaceId: device.workspaceId, telemetryCount: rows.length });
    return { success: true, count: rows.length, message: `Successfully transformed and stored ${rows.length} value(s)` };
  }

  async listTelemetry(deviceId: string, query: Record<string, unknown>) {
    const device = await this.getDevice(deviceId);
    return this.prisma.telemetryValue.findMany({
      where: {
        deviceId: device.id,
        portKey: query.portKey ? String(query.portKey) : undefined,
        readId: query.readId ? String(query.readId) : undefined
      },
      orderBy: { ts: "desc" },
      take: Number(query.limit ?? 1000)
    });
  }

  async latestTelemetry(deviceId: string) {
    const rows = await this.listTelemetry(deviceId, { limit: 1000 });
    const seen = new Set<string>();
    return rows.filter((row) => {
      const key = row.readId ? `${row.portKey}:${row.readId}` : row.portKey;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async createAlertRule(input: Record<string, unknown>) {
    const workspaceId = this.resolveWorkspaceId(String(input.workspaceId));
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    const rule = await this.prisma.alertRule.create({
      data: {
        workspaceId,
        deviceId: input.deviceId ? String(input.deviceId) : undefined,
        portKey: input.portKey ? String(input.portKey) : undefined,
        readId: input.readId ? String(input.readId) : undefined,
        comparator: String(input.comparator),
        threshold: Number(input.threshold),
        durationSeconds: Number(input.durationSeconds ?? 0),
        severity: (input.severity as AlertSeverity) ?? AlertSeverity.MEDIUM,
        message: String(input.message)
      } as Prisma.AlertRuleUncheckedCreateInput
    });
    await this.audit("alert_rule.created", "alert_rule", rule.id, rule.workspaceId);
    return rule;
  }

  async listAlerts() {
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds();
    return this.prisma.alertRule.findMany({
      where: allowedWorkspaceIds ? { workspaceId: { in: allowedWorkspaceIds } } : undefined,
      orderBy: { createdAt: "desc" }
    });
  }

  async updateAlertRule(id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.alertRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Alert rule not found");
    this.assertWorkspaceAllowed(existing.workspaceId);
    if (input.workspaceId) this.assertWorkspaceAllowed(String(input.workspaceId));
    const rule = await this.prisma.alertRule.update({ where: { id }, data: input });
    await this.audit("alert_rule.updated", "alert_rule", id, rule.workspaceId);
    return rule;
  }

  async deactivateAlertRule(id: string) {
    return this.updateAlertRule(id, { active: false });
  }

  async createAlertIncident(input: Record<string, unknown>) {
    const workspaceId = this.resolveWorkspaceId(String(input.workspaceId));
    if (!workspaceId) throw new BadRequestException("workspaceId is required");
    return this.prisma.alertIncident.create({
      data: {
        workspaceId,
        deviceId: input.deviceId ? String(input.deviceId) : undefined,
        alertRuleId: input.alertRuleId ? String(input.alertRuleId) : undefined,
        value: input.value ?? undefined,
        message: String(input.message),
        severity: (input.severity as AlertSeverity) ?? AlertSeverity.MEDIUM,
        status: AlertIncidentStatus.NEW,
        sentTo: input.sentTo ?? {}
      } as Prisma.AlertIncidentUncheckedCreateInput
    });
  }

  async listAlertIncidents() {
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds();
    return this.prisma.alertIncident.findMany({
      where: allowedWorkspaceIds ? { workspaceId: { in: allowedWorkspaceIds } } : undefined,
      orderBy: { triggeredAt: "desc" }
    });
  }

  async updateAlertIncident(id: string, input: Record<string, unknown>) {
    const existing = await this.prisma.alertIncident.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Alert incident not found");
    this.assertWorkspaceAllowed(existing.workspaceId);
    const incident = await this.prisma.alertIncident.update({ where: { id }, data: input });
    await this.audit("alert_incident.updated", "alert_incident", id, incident.workspaceId);
    return incident;
  }

  async createActuation(deviceId: string, input: Record<string, unknown>) {
    const device = await this.getDevice(deviceId);
    if (!device.workspaceId) throw new BadRequestException("Device is not assigned to a workspace");
    const command = await this.prisma.actuationCommand.create({
      data: {
        deviceId: device.id,
        workspaceId: device.workspaceId,
        requestedById: String(input.requestedById ?? "usr-admin"),
        portKey: String(input.portKey),
        command: String(input.command),
        requestedValue: input.requestedValue ?? input.value ?? {},
        reason: String(input.reason ?? ""),
        idempotencyKey: String(input.idempotencyKey ?? randomUUID())
      }
    });
    await this.queues.enqueueActuationDelivery({ actuationId: command.id, deviceId: device.id });
    await this.mqtt.publishJson(`powerlytic/devices/${device.id}/commands`, command);
    await this.audit("actuation.created", "actuation", command.id, device.workspaceId, command.reason);
    return command;
  }

  async listActuations(deviceId: string) {
    const device = await this.getDevice(deviceId);
    return this.prisma.actuationCommand.findMany({ where: { deviceId: device.id }, orderBy: { createdAt: "desc" } });
  }

  async updateActuation(_deviceId: string, actuationId: string, input: Record<string, unknown>) {
    const existing = await this.prisma.actuationCommand.findUnique({ where: { id: actuationId } });
    if (!existing) throw new NotFoundException("Actuation not found");
    this.assertWorkspaceAllowed(existing.workspaceId);
    const command = await this.prisma.actuationCommand.update({ where: { id: actuationId }, data: input });
    await this.audit("actuation.updated", "actuation", actuationId, command.workspaceId);
    return command;
  }

  async listAuditLogs() {
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds();
    return this.prisma.auditLog.findMany({
      where: allowedWorkspaceIds ? { workspaceId: { in: allowedWorkspaceIds } } : undefined,
      orderBy: { createdAt: "desc" },
      take: 500
    });
  }

  private async generateModelPorts(ports: Array<Record<string, unknown>> = []) {
    const counts = new Map<string, number>();
    const result = [];
    for (const port of ports) {
      const portType = await this.prisma.portType.findUnique({ where: { id: String(port.portTypeId) } });
      if (!portType) throw new NotFoundException(`Port type not found: ${String(port.portTypeId)}`);
      const next = (counts.get(portType.codeName) ?? 0) + 1;
      counts.set(portType.codeName, next);
      result.push({
        portTypeId: portType.id,
        portKey: `${portType.codeName}_${next}`,
        description: port.description ? String(port.description) : undefined,
        microControllerPin: port.microControllerPin ? String(port.microControllerPin) : undefined
      });
    }
    return result;
  }

  private async audit(action: string, resource: string, resourceId?: string, workspaceId?: string, reason?: string) {
    await this.prisma.auditLog.create({ data: { action, resource, resourceId, workspaceId, reason, metadata: {} } });
  }

  private async sendConfigToHttpsBridge(deviceId: string, payload: unknown) {
    if (process.env.CONFIG_BRIDGE_DIRECT !== "true" || !process.env.CONFIG_BRIDGE_URL) return;
    // TODO: set CONFIG_BRIDGE_URL to your EMQX wrapper HTTPS endpoint and CONFIG_BRIDGE_TOKEN if it requires auth.
    const response = await fetch(process.env.CONFIG_BRIDGE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.CONFIG_BRIDGE_TOKEN ? { authorization: `Bearer ${process.env.CONFIG_BRIDGE_TOKEN}` } : {})
      },
      body: JSON.stringify({ deviceId, payload })
    });
    if (!response.ok) throw new BadRequestException(`Config bridge rejected deployment: ${response.status}`);
  }

  private resolveWorkspaceId(requestedWorkspaceId?: string) {
    return this.requestContext.requireWorkspaceScope(requestedWorkspaceId);
  }

  private assertWorkspaceAllowed(workspaceId?: string | null) {
    if (!workspaceId || this.requestContext.isPlatformUser()) return;
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds() ?? [];
    if (!allowedWorkspaceIds.includes(workspaceId)) throw new NotFoundException("Resource not found");
  }

  private assertDeviceAllowed(workspaceId?: string | null, deviceId?: string) {
    const user = this.requestContext.getUser();
    if (user?.authType === "device" && deviceId && user.deviceId !== deviceId) {
      throw new NotFoundException("Device not found");
    }
    if (!workspaceId) {
      if (this.requestContext.isPlatformUser()) return;
      throw new NotFoundException("Device not found");
    }
    this.assertWorkspaceAllowed(workspaceId);
  }

  private workspaceFilterForNullableDevice() {
    const allowedWorkspaceIds = this.requestContext.allowedWorkspaceIds();
    return allowedWorkspaceIds ? { in: allowedWorkspaceIds } : undefined;
  }

  private requirePlatformUser() {
    if (!this.requestContext.isPlatformUser()) throw new NotFoundException("Resource not found");
  }
}

function deviceInclude() {
  return {
    modelVersion: { include: { model: true } },
    workspace: true,
    ports: {
      include: {
        portType: true,
        modbusSlaves: { include: { reads: true } }
      }
    }
  } as const;
}

function deviceDto(device: ReturnType<typeof deviceInclude> extends infer _T ? any : never) {
  return {
    id: device.id,
    configId: device.configId,
    name: device.name,
    imei: device.imei,
    serialNumber: device.serialNumber ?? undefined,
    batchNumber: device.batchNumber ?? undefined,
    deviceModelId: device.deviceModelVersionId,
    workspaceId: device.workspaceId ?? undefined,
    lifecycleStatus: device.lifecycleStatus,
    healthStatus: device.healthStatus,
    firmwareVersion: device.firmwareVersion ?? undefined,
    hardwareRevision: device.hardwareRevision ?? undefined,
    lastSeenAt: device.lastSeenAt?.toISOString(),
    metadata: device.metadata ?? {},
    ports: device.ports.map((port: any) => ({
      id: port.id,
      portKey: port.portKey,
      name: port.name,
      portTypeId: port.portTypeId,
      unit: port.unit ?? undefined,
      calibrationValue: { scaling: port.scaling, offset: port.offset },
      thresholds: { min: port.thresholdMin ?? undefined, max: port.thresholdMax ?? undefined, message: port.thresholdMessage ?? undefined },
      status: port.status,
      modbusSlaves: port.modbusSlaves.map((slave: any) => ({
        id: slave.id,
        slaveId: slave.slaveId,
        portKey: slave.portKey,
        name: slave.name,
        serial: { baudRate: slave.baudRate, dataBits: slave.dataBits, stopBits: slave.stopBits, parity: slave.parity },
        polling: { intervalMs: slave.intervalMs, timeoutMs: slave.timeoutMs, retries: slave.retries },
        reads: slave.reads.map((read: any) => ({
          id: read.id,
          readId: read.readId,
          slaveId: slave.slaveId,
          portKey: read.portKey,
          registerType: read.registerType ?? undefined,
          functionCode: read.functionCode,
          startAddress: read.startAddress,
          bitsToRead: read.bitsToRead,
          name: read.name,
          description: read.description ?? undefined,
          scaling: read.scaling,
          offset: read.offset,
          unit: read.unit ?? undefined,
          tag: read.tag ?? undefined,
          dataType: read.dataType ?? undefined,
          endianness: read.endianness
        }))
      }))
    }))
  };
}

function modelVersionDto(version: any) {
  return {
    id: version.id,
    deviceModelId: version.deviceModelId,
    name: version.model.name,
    version: version.version,
    sku: version.model.sku,
    description: version.model.description ?? undefined,
    microControllerType: version.microControllerType,
    publishedAt: version.publishedAt?.toISOString(),
    deprecatedAt: version.deprecatedAt?.toISOString(),
    ports: version.ports.map((port: any) => ({
      id: port.id,
      portKey: port.portKey,
      portTypeId: port.portTypeId,
      description: port.description ?? undefined,
      microControllerPin: port.microControllerPin ?? undefined
    }))
  };
}

function objectValue(value: unknown) {
  return typeof value === "object" && value !== null ? value : {};
}

function normalizeParity(value: string): "none" | "even" | "odd" {
  if (value === "even" || value === "odd") return value;
  return "none";
}

function normalizeFunctionCode(value: string): ModbusFunctionCode {
  if (value === "fc_1" || value === "fc_2" || value === "fc_4") return value;
  return "fc_3";
}

function hashSecret(secret: string) {
  // TODO: set DEVICE_API_KEY_PEPPER from a secret manager before provisioning real devices.
  return createHash("sha256")
    .update(`${process.env.DEVICE_API_KEY_PEPPER ?? "dev-pepper"}:${secret}`)
    .digest("hex");
}
