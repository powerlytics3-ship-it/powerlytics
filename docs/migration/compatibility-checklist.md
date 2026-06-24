# Migration and Compatibility Checklist

## 1. Contracts preserved for compatibility

- `POST /api/values/devices/:deviceId` (legacy telemetry ingest)
- `POST /api/telemetry/devices/:deviceId/values` (canonical ingest)
- `GET /api/device/:id/config` (legacy config fetch)
- `GET /api/devices/:deviceId/config` (canonical config fetch)
- `POST /api/device/:id/deploy` (legacy deploy)
- `POST /api/devices/:deviceId/config/deploy` (canonical deploy)
- `PUT /api/device/:id/deployment-status` (legacy deploy status callback)

Config payload shape remains:

```json
{
	"message": "config",
	"hash": "<sha256>",
	"configId": "cfg-...",
	"config": { "...": "..." }
}
```

## 2. Intentional behavior changes

- Access control is workspace + role based (memberships), not single-organization ownership.
- Device credentials are hashed and scoped to device/workspace.
- Manufacturing and claiming are explicit lifecycle transitions.
- Alert/actuation are persisted and async-capable via queue/worker.

## 3. Data migration checklist

1. Export legacy users, organizations, models, devices, telemetry, alerts.
2. Import organizations as `Workspace(kind=ORGANIZATION)`.
3. Import users, then create `Membership` records per workspace.
4. Import port catalog into `PortType` (`codeName` uniqueness required).
5. Import hardware catalog into `DeviceModel` + `DeviceModelVersion` + `DeviceModelPort`.
6. Import devices with immutable identifiers (`imei`, `configId`) and model version links.
7. Import port configuration, modbus slaves/reads into normalized child tables.
8. Import telemetry into `TelemetryValue` preserving timestamps and raw payloads.
9. Import alert history as `AlertIncident`; define active operating policies as `AlertRule`.
10. Verify contract tests against firmware/bridge traffic samples.

## 4. Cutover verification

- Health endpoints return OK.
- Legacy telemetry route still accepts device payloads.
- Config deploy flow writes `ConfigDeployment` and reaches worker/bridge.
- Workspace isolation blocks cross-tenant access.
- Dashboard pages render from API data without fallback mode.
