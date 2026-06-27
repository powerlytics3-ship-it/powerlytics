# 22 — Implementation Blueprint (Module-by-Module Build Order)

This is the document an AI coding agent (or a developer) should follow literally, top to bottom, to build Powerlytic v2 from an empty repository. Each step names the exact deliverable, the document(s) that fully specify it, and the acceptance check that proves it's done before moving on. Steps within a numbered stage can be parallelized across multiple agents/developers; stages themselves are sequential because each one is a real dependency of the next.

---

## Stage 0 — Repository & Tooling Skeleton

1. Initialize the monorepo exactly as laid out in `21-project-folder-structure.md`: pnpm workspaces, Turborepo, shared `packages/config` (eslint/tsconfig/tailwind presets).
2. Create `apps/api` as a bare NestJS project with the Fastify adapter (`@nestjs/platform-fastify`), global `ValidationPipe`, global exception filter (`08-api-specifications.md` §11), Pino logging.
3. Create `apps/web` and `apps/admin` as bare Next.js App Router projects, Tailwind + shadcn/ui installed, sharing `packages/ui`'s setup.
4. Set up `packages/permissions` with empty `roles.ts`/`resources.ts`/`matrix.ts`/`can.ts` files (filled in Stage 2).
5. Create a Neon project and a `dev` branch; wire `DATABASE_URL`/`DIRECT_DATABASE_URL` per `16-deployment-and-environment-guide.md`.
6. Create the Upstash Redis database; wire its env vars.
7. Stand up the CI pipeline skeleton from `18-cicd.md` (lint/typecheck/build jobs only — test jobs come online as tests exist).

**Acceptance check:** `pnpm dev` runs all three apps locally with no errors, hitting a real (empty) Neon branch; CI passes on an empty/trivial diff.

---

## Stage 1 — Identity, Tenancy & Authorization

This stage is the foundation everything else depends on. Do not start Stage 2 until this is fully working and tested.

1. Write the full Prisma schema for the Identity/Workspace section of `05-database-design.md` §2 (`User`, `Session`, `Account`, `Verification`, `Workspace`, `WorkspaceMembership`, `Invitation`). Run the initial migration against the dev Neon branch.
2. Install and configure Better Auth in `apps/api` per `06-authentication-design.md` §3 (Prisma adapter, email/password, Google OAuth, `organization`, `admin`, `jwt`, `apiKey` plugins). Mount it at `/api/auth/*`.
3. Implement the `afterSignUp` hook that auto-creates a `PERSONAL` workspace + `OWNER` membership (`06` §4.1).
4. Build `WorkspacesModule` and `MembersModule` (CRUD + invite/accept/role-change/remove) per `08-api-specifications.md` §2.
5. Fill in `packages/permissions` completely: the full matrix from `07-authorization-rbac-design.md` §3, `can()`, and the `policies/` data-aware refinements.
6. Build `SessionGuard`, `WorkspaceContextMiddleware`, `PermissionGuard`, `PlatformGuard`, and the `@RequirePermission` decorator (`07` §4.1, `10-backend-architecture.md` §1).
7. Build `AuditModule`/`AuditService` (`05` §8) and wire it into `MembersService` as the first consumer (every role change, invite, and removal writes an audit row, in the same transaction as the mutation).
8. Frontend: build the sign-up/sign-in/accept-invitation pages in `apps/web`, the `WorkspaceContext` provider, the workspace switcher, and the Members page (`09-frontend-architecture.md` §3).
9. Frontend: build `apps/admin`'s sign-in (separate audience) and a minimal authenticated shell (full admin features come in Stage 6).

**Acceptance check:** every test in `17-testing-strategy.md` §3 item 1 and item 5 passes — i.e., the cross-tenant isolation tests and the four concrete RBAC worked examples from `07` §7 are green. A human can sign up, get a personal workspace, create an org workspace, invite a teammate, and see the invite accepted, end to end through the UI.

---

## Stage 2 — Device Catalog & Fleet

1. Extend the Prisma schema with `05-database-design.md` §3 in full (`PortType`, `DeviceModel`, `DeviceModelPort`, `Device`, `DevicePort`, `ModbusSlaveConfig`, `ModbusReadConfig`, `DeviceCredential`, `DeviceClaim`, `DeviceTransfer`). Migrate. Add the immutability trigger from `05` §10.
2. Build `PortTypesModule`, `DeviceModelsModule` (draft/publish/new-version per `08` §3), `DevicesModule` (manufacture/claim/transfer/configure per `08` §4), `DeviceCredentialsService`.
3. Port the existing system's immutability-stripping logic from `device.service.ts` into `DevicesService.update()` — this logic was already correct; translate it, don't redesign it (`02-existing-system-analysis.md` §3 confirms exactly what it must preserve).
4. Wire `AuditService` into every mutating method here too (claim, transfer, publish, manufacture).
5. Frontend (`apps/web`): devices list/detail/configure pages, the device-claim wizard, transfer request/approve UI. Port the existing Modbus slave/read nested-form UI (React Hook Form `useFieldArray`) with minimal change — it was the best-executed part of the current frontend.
6. Frontend (`apps/admin`): Device Model builder + publish workflow, Port Type management, unclaimed-inventory + manufacture-device UI.

**Acceptance check:** a `MANUFACTURER` can draft, publish, and version a Device Model; manufacture a device against it; a workspace member can claim it via claim code; immutability tests (model port mutation after publish, IMEI/model-binding mutation on a device) all fail correctly.

---

## Stage 3 — Telemetry (Can Run in Parallel With Stage 4)

1. Add `05` §5's `DeviceTelemetry`/`TelemetryQuarantine` tables via the raw-SQL partitioning migration.
2. Port `modbusTransformer.ts` and the calibration logic from the current `valueTransformation.service.ts` into `apps/api/src/telemetry/modbus/modbus-transformer.ts`, as pure functions, unit-tested against the sample payloads in the old repo's `src/samples/*.ts`.
3. Build `DeviceAuthGuard` (`06` §4.3) and the ingestion controller/service (`12-telemetry-flow.md` §2).
4. Build the eight read endpoints (`TelemetryQueryService`, `08` §6), each tenant-scoped per `12` §5.
5. Frontend: snapshot/table/chart/export pages, ported from the current devices/[deviceId]/values/* pages onto the new generated API client.

**Acceptance check:** the exact sample payloads from the old repo's `src/samples/value_from_machine_to_BE.ts` produce the same calibrated values they did in the current system (this is the regression test that proves the port was faithful); an unrecognized `portKey` lands in `TelemetryQuarantine` instead of vanishing.

---

## Stage 4 — Configuration Deployment (Can Run in Parallel With Stage 3)

1. Add `ConfigDeployment` table (`05` §4).
2. Build `BridgeClient` (outbound, HMAC-signed) and `BridgeCallbackController` (inbound, `BridgeSignatureGuard`) per `11-device-communication-and-config-deployment.md` §2–3. Port `config-hash.ts` unchanged.
3. Build `deployment-timeout.processor` (BullMQ + Upstash) per `10-backend-architecture.md` §4.
4. Frontend: deploy button + deployment-history page.

**Acceptance check:** a deploy request produces a `ConfigDeployment` row that transitions `PENDING → SENT` on a successful bridge call; a forged/unsigned callback to the ack endpoint is rejected; a `SENT` deployment with no ack flips to `TIMED_OUT` after the configured timeout in a test that fast-forwards the clock.

---

## Stage 5 — Actuation & Alerting

1. Add `ActuationCommand` table (`05` §6); build the actuation flow (`13-sequence-diagrams.md` §3), reusing `BridgeClient`.
2. Add `AlertRule`/`AlertEvent`/`NotificationChannel` tables (`05` §7); build `AlertRulesModule`, `AlertEvaluationProcessor`, `NotificationDeliveryProcessor` (Resend) per `10` §4 and `13` §4.
3. Frontend: actuation controls on the device page (with confirmation modal for output commands), Alerts (incidents + rules) pages.

**Acceptance check:** sending a calibrated telemetry value that breaches a configured `AlertRule` produces exactly one `AlertEvent` and one delivered notification (verify via Resend's test mode); a duplicate breach while the event is still `NEW` does not create a second event.

---

## Stage 6 — Admin Console Completion

1. Build the remaining `apps/admin` surface: cross-workspace list/detail, impersonation (`13` §6), platform-wide audit log.
2. Build `/v1/admin/*` controllers, gated by `PlatformGuard` + `SUPER_ADMIN`/`MANUFACTURER` matrix entries only.

**Acceptance check:** a `MANUFACTURER` session cannot reach any workspace-scoped endpoint, including via `apps/admin`'s own UI (attempting it returns 403, and the UI doesn't render the option in the first place); impersonation actions are tagged correctly in the audit log per `14-security-considerations.md` §2.8.

---

## Stage 7 — Hardening Pass

1. Full Playwright E2E suite covering every flow in `13-sequence-diagrams.md`.
2. Load test the telemetry ingestion endpoint against the throughput numbers in `03-business-domain-and-requirements.md`'s non-functional requirements.
3. Wire Sentry, PostHog, and the CI contract-diff/permission-decorator lint checks from `18-cicd.md` if not already enabled earlier (recommend enabling them from Stage 0 onward rather than deferring, but they are called out explicitly here as a final gate before considering the rebuild complete).
4. Run the migration plan from `20-feature-roadmap-and-migration-plan.md` §2 against a copy of real production data (if applicable) and validate record counts/spot-checks before any production cutover.

**Acceptance check:** every acceptance check from Stages 1–6 still passes; the security threat-model table in `14-security-considerations.md` §3 has been manually walked through and confirmed, row by row, against the actual running system.

---

## How to Use This Blueprint With an AI Coding Agent

Feed the agent this document plus the specific numbered document(s) referenced in the stage it's working on — not the entire document set at once. Each stage is scoped to be a coherent, reviewable unit of work with its own acceptance check, which is also the right granularity for a single PR (or a small handful of PRs) per stage. Do not let the agent skip ahead to a later stage's tables/endpoints before the current stage's acceptance check is green — the dependency order in this document is real, not procedural.
