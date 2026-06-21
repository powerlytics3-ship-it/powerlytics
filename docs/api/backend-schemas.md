# Backend Schemas And DTOs

Concrete backend schema files live under `apps/api/src/schemas`:

- `workspace.schema.ts`: workspace, membership, invitation.
- `device-model.schema.ts`: port type, device model, model version, generated model ports.
- `device.schema.ts`: device, device port, calibration, thresholds, Modbus slaves and reads.
- `config-deployment.schema.ts`: bridge-compatible hardware config payload and deployment records.
- `telemetry.schema.ts`: normalized DI, AI, and Modbus telemetry rows and snapshots.
- `alert-actuation.schema.ts`: alert rules, alert incidents, and actuation commands.

Swagger DTO classes live under `apps/api/src/dto`:

- `workspace.dto.ts`
- `device.dto.ts`
- `telemetry.dto.ts`

The database schema remains the source of persistence truth in `packages/db/prisma/schema.prisma`; the Zod schemas are request/record contracts used by services, tests, and future repositories.
