# Migration And Compatibility Checklist

## Preserved Contracts

- Legacy telemetry route: `POST /api/values/devices/:deviceId`.
- Canonical telemetry route with same payload: `POST /api/telemetry/devices/:deviceId/values`.
- Legacy config route: `GET /api/device/:id/config`.
- Canonical config route: `GET /api/devices/:deviceId/config`.
- Legacy deploy route: `POST /api/device/:id/deploy`.
- Canonical deploy route: `POST /api/devices/:deviceId/config/deploy`.
- Legacy deployment status callback: `PUT /api/device/:id/deployment-status`.
- Config bridge payload: `{ message: "config", hash, configId, config }`.

## Intentional Changes

- Device and bridge callbacks require device credentials or a migration bridge credential.
- Users no longer store one direct organization reference. Access is via memberships.
- Device manufacturing no longer means customer assignment.
- Device model updates after publish are blocked. Create a new version instead.
- Alert and actuation actions are protected and audited.

## Migration Steps

1. Export Mongo collections: users, organizations, port types, device models, devices, values, alerts.
2. Import organizations as B2B workspaces.
3. Import users as profiles, map password users to IdP accounts, then create memberships.
4. Import port types and normalize code names.
5. Import device models as model version 1 and mark them published.
6. Import devices with immutable IMEI/config ID/model version references.
7. Import embedded port, slave, and read configuration.
8. Import telemetry into `telemetry_values`, preserving `ts`, `ingestTs`, raw values, calibrated values, units, quality, and raw payloads.
9. Import alerts as incidents, then create alert rules manually if the historical trigger rule is not recoverable.
10. Run contract tests against current firmware/bridge samples before cutover.
