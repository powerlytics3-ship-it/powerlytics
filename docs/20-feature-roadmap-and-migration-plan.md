# 20 — Feature Roadmap & Migration Plan

## 1. Feature Roadmap

This is sequenced by dependency, not by calendar — each phase is a prerequisite for the next.

| Phase | Delivers | Why this order |
|---|---|---|
| **P0 — Foundation** | Monorepo scaffold, Postgres schema + migrations, Better Auth wired up, `Workspace`/`WorkspaceMembership`, permission matrix package, basic CI | Nothing else can be built (or tested meaningfully) without identity, tenancy, and authorization existing first. |
| **P1 — Device Catalog & Fleet** | Port Types, Device Models (draft/publish/version), Device manufacture/claim/transfer, per-port configuration UI | This is the data the rest of the product operates on. |
| **P2 — Telemetry** | Device credentials, ingestion endpoint, calibration/Modbus parsing (ported), all read views, dashboard snapshot/table/chart UI | Depends on P1 (can't ingest telemetry for ports that don't exist yet). |
| **P3 — Configuration Deployment** | Authenticated bridge integration, deployment history, timeout handling, deployment UI | Depends on P1 (device/port config to deploy) — independent of P2, can be built in parallel by a second workstream. |
| **P4 — Actuation** | Output command flow, audit trail, confirmation UX | Depends on P1 (output ports) and benefits from P3's bridge-integration plumbing already existing. |
| **P5 — Alerting** | Alert rules, evaluation job, notification delivery, incidents UI | Depends on P2 (needs telemetry flowing to evaluate against). |
| **P6 — Admin Console** | `apps/admin`: cross-workspace views, impersonation, platform audit log, inventory management | Can start as soon as P0/P1 exist; doesn't block or get blocked by P2–P5. |
| **P7 — Hardening & Polish** | Full E2E suite, load testing telemetry ingestion, accessibility pass, notification channel variety (SMS/webhook) | Continuous, but a dedicated pass before a major external launch is worthwhile. |

## 2. Migration Plan (Existing MongoDB Data → New Postgres Schema)

This assumes there is real production data in the current MongoDB instance that needs to carry over (organizations, users, devices, recent telemetry). If the current system has negligible real customer data, the simplest and lowest-risk path is a clean cutover with no migration at all — confirm this with the business before investing in the migration tooling below.

### 2.1 Mapping Table

| Current (MongoDB) | New (Postgres) | Transformation Notes |
|---|---|---|
| `users` | `User` (Better Auth) + `Account` (credential) | Existing bcrypt password hashes are compatible with Better Auth's credential provider — no forced password reset needed if the hash format matches; verify Better Auth's expected bcrypt parameters before migrating, and force a reset only if they don't match. |
| `users.organization` | `WorkspaceMembership` | One row per existing user, role mapped per §2.2 below. Users with no `organization` (none observed as `CompanyAdmin` in the current schema, since that role has no org) become platform-role users with no membership row. |
| `organizations` | `Workspace {type: ORGANIZATION}` | Direct field mapping (`name`, `address`, `orgEmail`→`billingEmail`, `cin`). `orgPhone` has no destination field by default — store in `metadata` if retaining it matters, or drop it; confirm with the business which is correct. |
| `devicemodels` | `DeviceModel {status: PUBLISHED}` + `DeviceModelPort` | Every existing model is marked `PUBLISHED` immediately on migration (they were already effectively immutable in practice, just not enforced) — this preserves real-world behavior rather than retroactively inventing a draft history that never existed. |
| `porttypes` | `PortType` | Direct mapping. |
| `devices` | `Device` + `DevicePort` (+ `ModbusSlaveConfig`/`ModbusReadConfig` from the embedded arrays) | `organizationId` present → `workspaceId` set, `lifecycleStatus: ACTIVE`. `organizationId` absent → `workspaceId: null`, `lifecycleStatus: MANUFACTURED` (and a claim code is generated retroactively so these devices remain claimable). |
| `devices.deployment` (single embedded object) | One `ConfigDeployment` row, seeded from the last known status | History only exists going forward from the migration point — this is an accepted, explicit gap (there is no historical deployment data to recover from the old single-object field). |
| `values` (time-series collection) | `device_telemetry` (partitioned table) | Bulk export/import, partitioned by the original `ts` value into the correct monthly partition. Given likely volume, this runs as a background batch job, not inline with the cutover, and read traffic can be dual-routed (read recent data from Postgres, older history from a frozen read-only Mongo replica) for a transition window if needed. |
| `alerts` | *(not migrated)* | Confirmed unused in practice (see `02-existing-system-analysis.md` §4.6) — there's nothing real to bring over. |

### 2.2 Role Mapping

| Current `User.role` | New |
|---|---|
| `CompanyAdmin` | `User.platformRole = SUPER_ADMIN` (no workspace membership) |
| `OrgAdmin` | `WorkspaceMembership.role = ADMIN` in their existing org's new `Workspace` row |
| `OrgUser` | `WorkspaceMembership.role = OPERATOR` (chosen over `VIEWER` as the safer default — confirm with the business per-customer if a more conservative default, e.g. `VIEWER`, is preferred; this is a one-line change to the migration script, not an architectural decision) |

### 2.3 Migration Execution Steps

1. Stand up the new Postgres schema (migrations applied to a fresh Neon branch) and the new `apps/api` deployed alongside, but not yet receiving production traffic.
2. Run the export/transform/import script (one script per collection, idempotent — safe to re-run against a freshly-migrated branch while testing) against a copy of production Mongo data, into a staging Neon branch.
3. Validate record counts and spot-check key relationships (every migrated `Device` has the right `Workspace`, every migrated `WorkspaceMembership` has the right role) against the source.
4. Dry-run the new frontend apps against the migrated staging data with internal users.
5. Schedule a short maintenance window: freeze writes on the old system, run the final incremental migration (anything written since the staging export), cut DNS/traffic to the new system.
6. Keep the old MongoDB instance (read-only) for a defined retention window (e.g., 90 days) as a rollback/reference safety net before decommissioning it.

### 2.4 What Is Explicitly Not Migrated

- The stale `dist/` build output (not data, just confirming it has no bearing on migration).
- The unused `Alert` collection.
- Any refresh tokens / sessions (users simply sign in again on the new system — there's no value in migrating ephemeral session state).
