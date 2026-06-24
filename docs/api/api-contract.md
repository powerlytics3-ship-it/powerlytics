# API Contract

Global prefix: `/api`

Swagger: `/api/docs`

## Authentication model

API accepts:

- Human bearer token: `Authorization: Bearer <jwt>`
- Device key: `Authorization: Device <secret>` or `x-device-key: <secret>`

For human requests, send `x-workspace-id` for tenant scoping.

## Permission model

Route-level authorization uses `@RequirePermission(...)` with permissions from `@powerlytic/authz`.

Main permission keys:

- `workspace:read`, `workspace:manage`, `membership:manage`
- `device_model:read`, `device_model:manage`
- `device:manufacture`, `device:read`, `device:manage`, `device:claim`, `device:deploy_config`
- `telemetry:read`, `telemetry:ingest`
- `alert:manage`, `actuation:create`, `audit:read`

## Endpoint inventory

### Health

- `GET /api/health`
- `GET /api/health/ready`

### Auth

- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

### Workspaces and Organizations

- `GET /api/workspaces` (`workspace:read`)
- `POST /api/workspaces` (`workspace:manage`)
- `GET /api/workspaces/:workspaceId` (`workspace:read`)
- `GET /api/workspaces/:workspaceId/memberships` (`membership:manage`)
- `POST /api/workspaces/:workspaceId/invitations` (`membership:manage`)
- `GET /api/workspaces/:workspaceId/invitations` (`membership:manage`)
- `DELETE /api/workspaces/:workspaceId/memberships/:membershipId` (`membership:manage`)

Organization aliases:

- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/:orgId`

### Users

- `GET /api/users` (`membership:manage`)
- `GET /api/users/org/:orgID` (`membership:manage`)
- `GET /api/users/:id` (`membership:manage`)
- `POST /api/users` (`membership:manage`)
- `PUT /api/users/:id` (`membership:manage`)
- `DELETE /api/users/:id` (`membership:manage`)

Registration helpers:

- `POST /api/users/register-company-admin`
- `POST /api/users/register-organization`
- `POST /api/users/register-org-user`

### Port Types

- `GET /api/port-types` (`device_model:read`)
- `POST /api/port-types` (`device_model:manage`)
- `GET /api/port-types/:id` (`device_model:read`)
- `PUT /api/port-types/:id` (`device_model:manage`)
- `POST /api/port-types/:id/deactivate` (`device_model:manage`)
- `DELETE /api/port-types/:id` (`device_model:manage`)

### Device Models

- `GET /api/device-models` (`device_model:read`)
- `POST /api/device-models` (`device_model:manage`)
- `GET /api/device-models/:modelId` (`device_model:read`)
- `POST /api/device-models/:modelId/publish` (`device_model:manage`)
- `POST /api/device-models/:modelId/new-version` (`device_model:manage`)
- `POST /api/device-models/:modelId/deprecate` (`device_model:manage`)
- `DELETE /api/device-models/:modelId` (`device_model:manage`)

### Devices

- `GET /api/devices` (`device:read`)
- `POST /api/devices/manufacture` (`device:manufacture`)
- `GET /api/devices/inventory` (`device:read`)
- `POST /api/devices/claim` (`device:claim`)
- `GET /api/devices/:deviceId` (`device:read`)
- `PATCH /api/devices/:deviceId` (`device:manage`)
- `DELETE /api/devices/:deviceId` (`device:manage`)
- `POST /api/devices/:deviceId/transfer` (`device:manage`)
- `GET /api/devices/:deviceId/config` (`device:read`)
- `POST /api/devices/:deviceId/config/deploy` (`device:deploy_config`)
- `GET /api/devices/:deviceId/config/deployments` (`device:read`)
- `GET /api/devices/:deviceId/config/deployments/:deploymentId` (`device:read`)
- `PUT /api/devices/:deviceId/config/deployments/current/status` (callback)
- `GET /api/devices/:deviceId/credentials` (`device:manage`)
- `POST /api/devices/:deviceId/credentials` (`device:manage`)
- `POST /api/devices/:deviceId/credentials/:credentialId/revoke` (`device:manage`)
- `GET /api/devices/:deviceId/lifecycle-events` (`device:read`)

Legacy compatibility routes:

- `GET /api/device/:id/config`
- `POST /api/device/:id/deploy`
- `GET /api/device/:id/deployment-status`
- `PUT /api/device/:id/deployment-status`

### Telemetry

- `POST /api/telemetry/devices/:deviceId/values` (`telemetry:ingest`)
- `POST /api/values/devices/:deviceId` (`telemetry:ingest`, legacy alias)
- `GET /api/devices/:deviceId/values` (`telemetry:read`)
- `GET /api/devices/:deviceId/values/latest` (`telemetry:read`)
- `GET /api/devices/:deviceId/values/snapshot`
- `GET /api/devices/:deviceId/values/table`
- `GET /api/devices/:deviceId/values/timeseries/:portKey`
- `GET /api/devices/:deviceId/values/timeseries/modbus/:readId`
- `GET /api/devices/:deviceId/values/stats/:portKey` (`telemetry:read`)
- `GET /api/devices/:deviceId/values/status` (`telemetry:read`)
- `GET /api/devices/:deviceId/values/export`

### Alerts

- `GET /api/alert-rules` (`telemetry:read`)
- `POST /api/alert-rules` (`alert:manage`)
- `GET /api/alert-rules/:id` (`telemetry:read`)
- `PUT /api/alert-rules/:id` (`alert:manage`)
- `POST /api/alert-rules/:id/deactivate` (`alert:manage`)
- `GET /api/alert-incidents` (`telemetry:read`)
- `GET /api/alert-incidents/:id` (`telemetry:read`)
- `POST /api/alert-incidents/:id/ack` (`alert:manage`)
- `POST /api/alert-incidents/:id/resolve` (`alert:manage`)

Legacy incident aliases:

- `POST /api/alerts`
- `GET /api/alerts`
- `GET /api/alerts/:id`
- `PUT /api/alerts/:id`

### Actuations

- `GET /api/devices/:deviceId/actuations` (`actuation:create`)
- `POST /api/devices/:deviceId/actuations` (`actuation:create`)
- `GET /api/devices/:deviceId/actuations/:actuationId` (`actuation:create`)
- `POST /api/devices/:deviceId/actuations/:actuationId/cancel` (`actuation:create`)
- `POST /api/devices/:deviceId/actuations/:actuationId/retry` (`actuation:create`)

### Audit

- `GET /api/audit-logs` (`audit:read`)
- `GET /api/organizations/:orgId/audit-logs` (`audit:read`)
- `GET /api/devices/:deviceId/audit-logs` (`audit:read`)

## Request examples

### Human API request

```bash
curl -X GET "http://localhost:4000/api/devices" \
	-H "Authorization: Bearer <token>" \
	-H "x-workspace-id: ws-platform"
```

### Device telemetry ingest

```bash
curl -X POST "http://localhost:4000/api/values/devices/dev-demo-1" \
	-H "Authorization: Device <device-secret>" \
	-H "Content-Type: application/json" \
	-d '{"values":{"DI_1":1,"AI_1":41.7}}'
```

### Config deploy

```bash
curl -X POST "http://localhost:4000/api/devices/dev-demo-1/config/deploy" \
	-H "Authorization: Bearer <token>" \
	-H "x-workspace-id: ws-platform"
```
