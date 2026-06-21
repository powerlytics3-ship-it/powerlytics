# Phase 0 Discovery And Target Architecture

## Sources Inspected

- `/Users/shubhambarkur/Downloads/powerlytic.zip`
- `/Users/shubhambarkur/Downloads/powerlytics.zip`
- Legacy backend modules under `powerlytic-be/src/modules`
- Legacy frontend App Router pages under `powerlytic-ui/app/(pages)/dashboard`
- Rebuild docs under `powerlytics/docs/prompt`

## Current Functionality Inventory

Backend capabilities:

- Auth: login, refresh, password reset request, password reset, current user, logout.
- Users: create, list, update, delete, register company admin, register organization admin, register org user.
- Organizations: create, list, detail with users/devices, update, delete.
- Port types: CRUD for input/output and analog/digital/modbus/ac-input definitions.
- Device models: create, list, detail, delete; port keys generated from port type code names.
- Devices: create from model, list/filter, detail, update editable fields, delete, expose hardware config, initiate config deployment, poll deployment status, accept device deployment callback.
- Telemetry values: ingest DI/AI/MI payloads, transform values, apply calibration and Modbus parsing, latest snapshot, table, time series, stats, status, export.
- Alerts: CRUD for alert records, currently not protected.
- Health: basic backend health checks.

Frontend capabilities:

- Login and authenticated dashboard shell.
- Sidebar navigation for Dashboard, Users, Port Types, Device Models, Organizations, Devices.
- Device model list, detail, and creation.
- Device list, creation, detail, edit, config deployment status, value simulator, values table/snapshot/charts.
- Port type list/create/update/delete.
- Organization list, create, and detail.
- User list.
- React Query hooks and local RBAC helpers.

Hardware-facing contracts to preserve:

- Config fetch shape currently returned by `GET /api/device/:id/config`.
- Config deployment command payload sent to bridge: `{ message: "config", hash, configId, config }`.
- Deployment callback shape at `PUT /api/device/:id/deployment-status`: `{ status, message? }`.
- Telemetry ingestion shape currently accepted at `POST /api/values/devices/:deviceId`: `{ deviceId?, ts?, values: { DI_1, AI_1, MI_1 } }`.
- Modbus reads identified by backend-generated `readId`.

## Preserve, Change, Add, Remove Matrix

| Area | Decision | Notes |
| --- | --- | --- |
| DI/AI/MI telemetry payloads | Preserve with adapter | New canonical route is `/api/telemetry/devices/:deviceId/values`; legacy route remains. |
| Config payload to bridge | Preserve | Hashing and `configId` stay explicit. |
| Deployment callback | Preserve with device auth | Legacy unauthenticated behavior is replaced by a device credential guard. |
| User auth | Replace | OIDC/Keycloak is the production path; dev auth is a local convenience only. |
| Single user organization field | Replace | Use `Workspace`, `Membership`, and `Invitation`. |
| Device model mutation | Change | Published models are immutable; changes require new versions. |
| Device create equals customer assignment | Change | Split manufacture, inventory, assign, claim, install, commission, activate. |
| Alert records only | Add | Add alert rules and alert incidents. |
| Actuation | Add | First-class safe audited command lifecycle. |
| Mongo-only persistence | Change | Use PostgreSQL with TimescaleDB-ready telemetry tables. |
| Unprotected alert routes | Remove | All tenant resources require authz and workspace isolation. |

## Target Architecture

- `apps/web`: Next.js App Router dashboard.
- `apps/api`: NestJS API with explicit modules and guards.
- `apps/worker`: BullMQ worker for deployments, alert evaluation, telemetry fanout, and future reports.
- `packages/db`: Prisma schema and migration/seed boundary.
- `packages/types`: shared domain enums and DTO types.
- `packages/validators`: shared Zod schemas for request and device payload validation.
- `packages/authz`: role/permission helpers used by API and frontend.
- `packages/ui`: small reusable UI primitives for the dashboard.
- `infra`: Docker Compose for Postgres/Timescale, Redis, Mosquitto, and Keycloak.

## Folder Structure

```txt
powerlytic/
  apps/
    web/
    api/
    worker/
  packages/
    db/
    types/
    validators/
    authz/
    ui/
    config/
  infra/
    compose.yaml
    docker/
    env/
  docs/
    architecture/
    api/
    migration/
    operations/
```

## Database Model Proposal

Core relational data is modeled in PostgreSQL:

- Identity/profile: `users`, `workspaces`, `memberships`, `invitations`.
- Hardware catalog: `port_types`, `device_models`, `device_model_versions`, `device_model_ports`.
- Fleet: `devices`, `device_ports`, `modbus_slaves`, `modbus_reads`, `device_credentials`, `device_lifecycle_events`.
- Configuration: `config_shadows`, `config_deployments`.
- Telemetry: `telemetry_values` partitionable/Timescale-ready hypertable.
- Alerts/actuation: `alert_rules`, `alert_incidents`, `actuation_commands`.
- Governance: `audit_logs`.

## API Contract Proposal

The API exposes canonical routes under `/api` and also implements legacy aliases where hardware/bridge compatibility matters.

- Auth: `/api/auth/*`
- Workspaces and organizations: `/api/workspaces/*`, `/api/organizations/*`
- Device models: `/api/device-models/*`
- Port types: `/api/port-types/*`
- Devices: `/api/devices/*`
- Legacy device aliases: `/api/device/*`
- Telemetry: `/api/telemetry/devices/:deviceId/values`
- Legacy telemetry alias: `/api/values/devices/:deviceId`
- Alerts: `/api/alert-rules`, `/api/alert-incidents`
- Actuation: `/api/devices/:deviceId/actuations`
- Audit: `/api/audit-logs`

## Migration Compatibility Checklist

- Map legacy `Organization` records to `Workspace(kind=ORGANIZATION)`.
- Map legacy `User.organization` to `Membership` with equivalent role.
- Map legacy roles `CompanyAdmin`, `OrgAdmin`, `OrgUser` to `SUPER_ADMIN`, `WORKSPACE_ADMIN`, `OPERATOR` or `VIEWER` according to owner decision.
- Map legacy `DeviceModel` to a draft model plus published version 1.
- Map embedded legacy device ports to `DevicePort`, `ModbusSlave`, and `ModbusRead`.
- Preserve device `imei`, `configId`, model binding, org assignment, status, metadata, and deployment state.
- Preserve telemetry timestamps, raw/calibrated values, port keys, Modbus read IDs, slave IDs, and raw registers.
- Preserve bridge URL behavior through `CONFIG_BRIDGE_URL`.

## Open Questions For Owner

- Should B2C personal workspaces be enabled in MVP or only modeled for future use?
- Which legacy `OrgUser` capabilities should become `OPERATOR` versus `VIEWER`?
- Should current telemetry history be migrated from Mongo into Timescale immediately, or kept read-only during a phased cutover?
- Does the firmware support per-device API keys now, or do we need a bridge-level shared credential during transition?
- What approval policy is required for high-risk actuation commands?

## Implementation Assumptions

- MVP uses Keycloak locally and any OIDC provider in production.
- Device auth supports `x-device-key` immediately, with an mTLS/cert path documented for later.
- Existing firmware payloads remain valid through adapters.
- TimescaleDB is provided by Docker, while the Prisma schema stays plain PostgreSQL-compatible.
