-- CreateEnum
CREATE TYPE "WorkspaceKind" AS ENUM ('ORGANIZATION', 'PERSONAL');

-- CreateEnum
CREATE TYPE "WorkspaceStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ENGINEERING_ADMIN', 'MANUFACTURER', 'WORKSPACE_ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "PortCategory" AS ENUM ('INPUT', 'OUTPUT');

-- CreateEnum
CREATE TYPE "PortValueFormat" AS ENUM ('ANALOG', 'DIGITAL', 'MODBUS', 'AC_INPUT');

-- CreateEnum
CREATE TYPE "ModelVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "DeviceLifecycleStatus" AS ENUM ('MANUFACTURED', 'IN_INVENTORY', 'ASSIGNED_TO_WORKSPACE', 'INSTALLED', 'COMMISSIONING', 'ACTIVE', 'MAINTENANCE', 'SUSPENDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "DeviceHealthStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'SENT', 'APPLIED', 'ERROR', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertIncidentStatus" AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ActuationStatus" AS ENUM ('PENDING_APPROVAL', 'PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "externalSub" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "kind" "WorkspaceKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalName" TEXT,
    "industry" TEXT,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "address" TEXT,
    "supportEmail" TEXT,
    "billingEmail" TEXT,
    "taxId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "codeName" TEXT NOT NULL,
    "category" "PortCategory" NOT NULL,
    "valueFormat" "PortValueFormat" NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceModelVersion" (
    "id" TEXT NOT NULL,
    "deviceModelId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ModelVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "microControllerType" TEXT NOT NULL,
    "hardwareRevision" TEXT,
    "firmwareFamily" TEXT,
    "publishedAt" TIMESTAMP(3),
    "deprecatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceModelPort" (
    "id" TEXT NOT NULL,
    "deviceModelVersionId" TEXT NOT NULL,
    "portTypeId" TEXT NOT NULL,
    "portKey" TEXT NOT NULL,
    "microControllerPin" TEXT,
    "description" TEXT,

    CONSTRAINT "DeviceModelPort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "serialNumber" TEXT,
    "batchNumber" TEXT,
    "manufactureDate" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "deviceModelVersionId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "lifecycleStatus" "DeviceLifecycleStatus" NOT NULL DEFAULT 'MANUFACTURED',
    "healthStatus" "DeviceHealthStatus" NOT NULL DEFAULT 'OFFLINE',
    "firmwareVersion" TEXT,
    "hardwareRevision" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationAddress" TEXT,
    "pointOfContact" TEXT,
    "alertEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alertPhones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicePort" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "portTypeId" TEXT NOT NULL,
    "portKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "scaling" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "offset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "thresholdMin" DOUBLE PRECISION,
    "thresholdMax" DOUBLE PRECISION,
    "thresholdMessage" TEXT,

    CONSTRAINT "DevicePort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModbusSlave" (
    "id" TEXT NOT NULL,
    "devicePortId" TEXT NOT NULL,
    "slaveId" TEXT NOT NULL,
    "portKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baudRate" INTEGER NOT NULL,
    "dataBits" INTEGER NOT NULL,
    "stopBits" DOUBLE PRECISION NOT NULL,
    "parity" TEXT NOT NULL,
    "intervalMs" INTEGER NOT NULL,
    "timeoutMs" INTEGER NOT NULL,
    "retries" INTEGER NOT NULL,

    CONSTRAINT "ModbusSlave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModbusRead" (
    "id" TEXT NOT NULL,
    "modbusSlaveId" TEXT NOT NULL,
    "readId" TEXT NOT NULL,
    "portKey" TEXT NOT NULL,
    "registerType" TEXT,
    "functionCode" TEXT NOT NULL,
    "startAddress" INTEGER NOT NULL,
    "bitsToRead" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scaling" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "offset" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "tag" TEXT,
    "dataType" TEXT,
    "endianness" TEXT NOT NULL DEFAULT 'NONE',

    CONSTRAINT "ModbusRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCredential" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigDeployment" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "configHash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "sentAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryValue" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "ingestTs" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "devicePortId" TEXT,
    "portKey" TEXT NOT NULL,
    "portType" TEXT NOT NULL,
    "readId" TEXT,
    "slaveId" TEXT,
    "rawValue" JSONB NOT NULL,
    "calibratedValue" JSONB,
    "unit" TEXT,
    "quality" TEXT NOT NULL DEFAULT 'good',
    "rawPayload" JSONB,
    "parsedValue" DOUBLE PRECISION,
    "rawRegisters" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bitsToRead" INTEGER,
    "endianness" TEXT,

    CONSTRAINT "TelemetryValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "deviceId" TEXT,
    "portKey" TEXT,
    "readId" TEXT,
    "comparator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertIncident" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "deviceId" TEXT,
    "alertRuleId" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" JSONB,
    "message" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertIncidentStatus" NOT NULL DEFAULT 'NEW',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "sentTo" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AlertIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActuationCommand" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "portKey" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "requestedValue" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ActuationStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActuationCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLifecycleEvent" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "fromStatus" "DeviceLifecycleStatus",
    "toStatus" "DeviceLifecycleStatus" NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_externalSub_key" ON "User"("externalSub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_kind_status_idx" ON "Workspace"("kind", "status");

-- CreateIndex
CREATE INDEX "Membership_workspaceId_role_status_idx" ON "Membership"("workspaceId", "role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_workspaceId_key" ON "Membership"("userId", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_workspaceId_email_idx" ON "Invitation"("workspaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "PortType_name_key" ON "PortType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PortType_codeName_key" ON "PortType"("codeName");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModel_sku_key" ON "DeviceModel"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModelVersion_deviceModelId_version_key" ON "DeviceModelVersion"("deviceModelId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModelPort_deviceModelVersionId_portKey_key" ON "DeviceModelPort"("deviceModelVersionId", "portKey");

-- CreateIndex
CREATE UNIQUE INDEX "Device_configId_key" ON "Device"("configId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_imei_key" ON "Device"("imei");

-- CreateIndex
CREATE UNIQUE INDEX "Device_serialNumber_key" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "Device_workspaceId_lifecycleStatus_idx" ON "Device"("workspaceId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Device_deviceModelVersionId_idx" ON "Device"("deviceModelVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "DevicePort_deviceId_portKey_key" ON "DevicePort"("deviceId", "portKey");

-- CreateIndex
CREATE UNIQUE INDEX "ModbusSlave_devicePortId_slaveId_key" ON "ModbusSlave"("devicePortId", "slaveId");

-- CreateIndex
CREATE UNIQUE INDEX "ModbusRead_readId_key" ON "ModbusRead"("readId");

-- CreateIndex
CREATE INDEX "DeviceCredential_deviceId_active_idx" ON "DeviceCredential"("deviceId", "active");

-- CreateIndex
CREATE INDEX "ConfigDeployment_deviceId_createdAt_idx" ON "ConfigDeployment"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "TelemetryValue_deviceId_ts_idx" ON "TelemetryValue"("deviceId", "ts");

-- CreateIndex
CREATE INDEX "TelemetryValue_workspaceId_ts_idx" ON "TelemetryValue"("workspaceId", "ts");

-- CreateIndex
CREATE INDEX "TelemetryValue_deviceId_portKey_ts_idx" ON "TelemetryValue"("deviceId", "portKey", "ts");

-- CreateIndex
CREATE INDEX "TelemetryValue_deviceId_readId_ts_idx" ON "TelemetryValue"("deviceId", "readId", "ts");

-- CreateIndex
CREATE INDEX "AlertIncident_workspaceId_status_triggeredAt_idx" ON "AlertIncident"("workspaceId", "status", "triggeredAt");

-- CreateIndex
CREATE INDEX "ActuationCommand_workspaceId_createdAt_idx" ON "ActuationCommand"("workspaceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActuationCommand_deviceId_idempotencyKey_key" ON "ActuationCommand"("deviceId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "DeviceLifecycleEvent_deviceId_createdAt_idx" ON "DeviceLifecycleEvent"("deviceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog"("resource", "resourceId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModelVersion" ADD CONSTRAINT "DeviceModelVersion_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModelPort" ADD CONSTRAINT "DeviceModelPort_deviceModelVersionId_fkey" FOREIGN KEY ("deviceModelVersionId") REFERENCES "DeviceModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModelPort" ADD CONSTRAINT "DeviceModelPort_portTypeId_fkey" FOREIGN KEY ("portTypeId") REFERENCES "PortType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_deviceModelVersionId_fkey" FOREIGN KEY ("deviceModelVersionId") REFERENCES "DeviceModelVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePort" ADD CONSTRAINT "DevicePort_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePort" ADD CONSTRAINT "DevicePort_portTypeId_fkey" FOREIGN KEY ("portTypeId") REFERENCES "PortType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModbusSlave" ADD CONSTRAINT "ModbusSlave_devicePortId_fkey" FOREIGN KEY ("devicePortId") REFERENCES "DevicePort"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModbusRead" ADD CONSTRAINT "ModbusRead_modbusSlaveId_fkey" FOREIGN KEY ("modbusSlaveId") REFERENCES "ModbusSlave"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCredential" ADD CONSTRAINT "DeviceCredential_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigDeployment" ADD CONSTRAINT "ConfigDeployment_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryValue" ADD CONSTRAINT "TelemetryValue_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryValue" ADD CONSTRAINT "TelemetryValue_devicePortId_fkey" FOREIGN KEY ("devicePortId") REFERENCES "DevicePort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertIncident" ADD CONSTRAINT "AlertIncident_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertIncident" ADD CONSTRAINT "AlertIncident_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertIncident" ADD CONSTRAINT "AlertIncident_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActuationCommand" ADD CONSTRAINT "ActuationCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActuationCommand" ADD CONSTRAINT "ActuationCommand_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLifecycleEvent" ADD CONSTRAINT "DeviceLifecycleEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
