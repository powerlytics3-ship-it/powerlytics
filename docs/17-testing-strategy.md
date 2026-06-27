# 17 — Testing Strategy

## 1. Levels

| Level | Tooling | Scope | Needs a database? |
|---|---|---|---|
| Unit | Vitest | Pure logic: calibration math, Modbus register parsing/endianness, the `can()`/policy functions in `packages/permissions`, DTO validation rules | No |
| Integration | Vitest + a real, ephemeral Neon branch | Service-layer methods against a real Postgres (tenant scoping, immutability triggers, transactional audit writes) | Yes — a Neon branch created per CI run (or reused per local dev session), never a local Docker Postgres |
| API/E2E (backend) | Vitest + Supertest, run against the Nest app in-process | Full request lifecycle: guard → controller → service → DB, including the authorization matrix's concrete worked examples from `07-authorization-rbac-design.md` §7 as literal test cases | Yes, same ephemeral branch |
| Frontend component | Vitest + React Testing Library | Form validation, permission-gated rendering (`PermissionGuard` hides/shows correctly per role fixture) | No |
| End-to-end (full stack) | Playwright | Critical paths: sign-up → personal workspace created; invite → accept → member appears; claim device → configure → deploy → see status; create alert rule → ingest telemetry that breaches it → see the alert | Yes — run against a preview deployment (Vercel preview + Cloud Run preview + its Neon branch), not against local Docker |

## 2. Why No Docker Is Needed for Any of This

The two things that traditionally push a team toward `testcontainers`/Docker for testing — "I need a real Postgres" and "I need a real Redis" — are both solved by the managed services chosen for this stack having first-class ephemeral/free testing stories:

- **Postgres:** Neon's branching API creates a full, isolated copy of the schema (optionally seeded with fixture data) in seconds, and destroys it just as fast. A `pnpm test:integration` script wraps this: create branch → run migrations → run tests → delete branch, entirely through the Neon CLI/API, no local service.
- **Redis:** for unit/integration tests that touch rate-limiting or queue code, `ioredis-mock` (an in-memory fake) is used — these tests don't need real Redis semantics under concurrency, just the interface. For the handful of tests that genuinely want to verify real BullMQ behavior, a free, low-traffic Upstash database dedicated to CI is used (its free tier comfortably covers CI's request volume).

## 3. What Gets Tested First (Priority Order, Matching the Highest-Risk Findings)

1. **Tenant isolation.** A parameterized test suite that, for every workspace-scoped endpoint, asserts a member of Workspace A gets a 403/404 (never the actual data) when targeting Workspace B's resources. This is the direct regression test for the single biggest class of bug found in the existing system.
2. **Device/DeviceModel immutability.** Attempting to mutate `imei`, `deviceModelId`, a published model's ports, or change port count must fail, every time, at both the service layer and (for the model-publish case) the database trigger layer.
3. **Calibration & Modbus parsing correctness**, using the exact sample payloads already present in the current repo's `src/samples/*.ts` as fixtures — these are a ready-made, already-validated set of test cases.
4. **Bridge authentication.** Calls to the ack callback without a valid HMAC signature must be rejected; calls with a tampered body (valid signature for different content) must be rejected.
5. **Permission matrix worked examples** — the four concrete scenarios listed in `07-authorization-rbac-design.md` §7 are encoded as literal test cases, not just documentation prose.

## 4. Coverage Expectations

- Service layer (business logic, permission evaluation, calibration/Modbus transforms): high coverage expected, enforced by a CI coverage gate.
- Controllers: covered via the API/E2E layer rather than mocked-everything unit tests — a controller test that mocks its own service proves almost nothing about real behavior.
- Frontend: forms and permission-gated rendering get component tests; page-level layout/styling does not need automated coverage (diminishing returns relative to effort).

## 5. Test Data

A `prisma/seed.ts` script creates a baseline fixture set (a couple of workspaces of each type, a published Device Model with a representative port mix including Modbus, a few claimed/unclaimed devices) — used both for local development (so a fresh Neon branch isn't an empty product) and as the starting point integration tests build on.
