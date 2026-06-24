# Backend Schemas and Contracts

## Source of truth hierarchy

1. Persistence schema: `packages/db/prisma/schema.prisma`
2. Input contracts: `packages/validators/src/index.ts`
3. API-facing route shapes: controllers in `apps/api/src/**`
4. Internal response helpers: mappers in `apps/api/src/production/production-state.service.ts`

## 1. Prisma persistence model

Main model groups:

- Identity: `User`, `Account`, `Session`, `VerificationToken`
- Tenancy: `Workspace`, `Membership`, `Invitation`
- Hardware catalog: `PortType`, `DeviceModel`, `DeviceModelVersion`, `DeviceModelPort`
- Fleet: `Device`, `DevicePort`, `ModbusSlave`, `ModbusRead`, `DeviceCredential`, `DeviceLifecycleEvent`
- Operations: `ConfigDeployment`, `TelemetryValue`, `AlertRule`, `AlertIncident`, `ActuationCommand`, `AuditLog`

## 2. Zod validation contracts

API controllers parse request bodies with shared Zod schemas from `@powerlytic/validators`.

Representative schemas:

- Workspace/invitation: `workspaceSchema`, `invitationSchema`
- Device lifecycle: `manufactureDeviceSchema`, `claimDeviceSchema`, `updateDeviceSchema`
- Telemetry: `telemetryIngestSchema`
- Alerts/actuation: `createAlertRuleSchema`, `createActuationSchema`
- Config callback: `deploymentStatusCallbackSchema`

## 3. API schema files in Nest app

`apps/api/src/schemas` contains domain record schemas used in API internals:

- `workspace.schema.ts`
- `device-model.schema.ts`
- `device.schema.ts`
- `config-deployment.schema.ts`
- `telemetry.schema.ts`
- `alert-actuation.schema.ts`

These are useful for documenting record shapes and cross-domain consistency.

## 4. DTO and mapping behavior

The service layer maps Prisma records to API DTO-like structures in:

- `deviceDto(...)` in `apps/api/src/production/production-state.service.ts`
- `modelVersionDto(...)` in `apps/api/src/production/production-state.service.ts`

Examples of mapped concerns:

- Modbus nested topology (`modbusSlaves` -> `reads`)
- Device calibration and thresholds
- Published/deprecated model version timestamps

## 5. Compatibility payloads

Legacy contracts intentionally preserved:

- Telemetry legacy route payload (`POST /api/values/devices/:deviceId`)
- Device config payload (`GET /api/device/:id/config`)
- Deployment callback status updates (`PUT /api/device/:id/deployment-status`)

The same internal services back both canonical and legacy routes.
