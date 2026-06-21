# Powerlytic API Contract

## Auth

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/auth/oidc/:provider/start`
- `GET /api/auth/oidc/:provider/callback`

Human users authenticate through OIDC. The backend validates access tokens and maps the external subject to an application `User` and active `Membership`.

## Workspaces And Organizations

- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/:workspaceId`
- `POST /api/workspaces/:workspaceId/invitations`
- `GET /api/workspaces/:workspaceId/memberships`
- `DELETE /api/workspaces/:workspaceId/memberships/:membershipId`
- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/:orgId`

Organizations are compatibility-facing names for B2B workspaces.

## Port Types

- `GET /api/port-types`
- `POST /api/port-types`
- `GET /api/port-types/:id`
- `PUT /api/port-types/:id`
- `POST /api/port-types/:id/deactivate`

## Device Models

- `GET /api/device-models`
- `POST /api/device-models`
- `GET /api/device-models/:modelId`
- `POST /api/device-models/:modelId/publish`
- `POST /api/device-models/:modelId/new-version`
- `POST /api/device-models/:modelId/deprecate`

Published model versions are immutable.

## Devices

- `GET /api/devices`
- `POST /api/devices/manufacture`
- `GET /api/devices/inventory`
- `GET /api/devices/:deviceId`
- `POST /api/devices/claim`
- `POST /api/devices/:deviceId/transfer`
- `PATCH /api/devices/:deviceId`
- `GET /api/devices/:deviceId/config`
- `POST /api/devices/:deviceId/config/deploy`
- `GET /api/devices/:deviceId/config/deployments`
- `PUT /api/devices/:deviceId/config/deployments/current/status`

Legacy aliases:

- `GET /api/device/:id/config`
- `POST /api/device/:id/deploy`
- `GET /api/device/:id/deployment-status`
- `PUT /api/device/:id/deployment-status`

## Telemetry

- `POST /api/telemetry/devices/:deviceId/values`
- `GET /api/devices/:deviceId/values`
- `GET /api/devices/:deviceId/values/latest`
- `GET /api/devices/:deviceId/values/snapshot`
- `GET /api/devices/:deviceId/values/table`
- `GET /api/devices/:deviceId/values/timeseries/:portKey`
- `GET /api/devices/:deviceId/values/timeseries/modbus/:readId`
- `GET /api/devices/:deviceId/values/stats/:portKey`
- `GET /api/devices/:deviceId/values/status`
- `GET /api/devices/:deviceId/values/export`

Legacy alias:

- `POST /api/values/devices/:deviceId`

## Alerts

- `GET /api/alert-rules`
- `POST /api/alert-rules`
- `GET /api/alert-incidents`
- `POST /api/alert-incidents/:id/ack`
- `POST /api/alert-incidents/:id/resolve`

## Actuation

- `POST /api/devices/:deviceId/actuations`
- `GET /api/devices/:deviceId/actuations`
- `POST /api/devices/:deviceId/actuations/:actuationId/cancel`
- `POST /api/devices/:deviceId/actuations/:actuationId/retry`

Actuation commands are persisted, audited, queued, acknowledged asynchronously, and never executed as blind synchronous toggles.
