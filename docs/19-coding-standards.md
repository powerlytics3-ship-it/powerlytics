# 19 — Coding Standards

## 1. Contract-First Between Backend and Frontend

This is the most important standard in this document, because its absence was a real, named gap in the current system's own internal planning docs (and a real source of drift risk even where it wasn't):

1. Backend DTOs/entities are the single source of truth. They are written once, in `apps/api`, as `class-validator`-decorated classes plus `@nestjs/swagger` decorators.
2. `apps/api`'s build step generates `openapi.json`.
3. `packages/api-client` regenerates its typed fetch functions, Zod schemas, and TanStack Query hooks from that spec (`openapi-typescript` + a small generator script — not a hand-maintained file).
4. Both frontend apps import only from `packages/api-client`. **No frontend file ever hand-declares an interface that mirrors a backend response shape.** This is a hard rule, enforced by code review and by the CI contract-diff check in `18-cicd.md`.

## 2. Module Boundaries (Backend)

- A Nest module's service may only be called by: its own controller, its own background-job processors, and explicitly, the `AuditService` (which every mutating service calls outward to, never the reverse). No module reaches into another module's Prisma queries directly — if `AlertsModule` needs telemetry data, it asks `TelemetryModule`'s exported service, it does not run its own query against `device_telemetry`.
- Every mutating service method's signature includes `workspaceId` (or, for platform-admin operations, an explicit marker that it is intentionally unscoped) — a method that silently accepts "no workspace context" is the exact shape of bug that caused most of the existing system's security findings, so this is treated as a code-review blocker, not a style preference.

## 3. Naming & File Organization

- One resource per folder under `modules/` (backend) or `app/(dashboard)/` (frontend), matching the existing codebase's already-reasonable convention of "one folder per domain concept" — this part of the current project's structure is kept because new developers found it easy to navigate.
- Files: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/*.dto.ts`, consistent with NestJS community convention (chosen partly *because* it's a widely-known convention — a new hire who has used Nest elsewhere should feel at home immediately).
- No file named generically (`utils.ts`, `helpers.ts`) without a qualifying prefix — every utility file's name says what it does (`modbus-transformer.ts`, not `helpers.ts`).

## 4. TypeScript Conventions

- `strict: true` everywhere, no exceptions, in every `tsconfig.json` in the monorepo.
- No `any` without an inline comment explaining why (and preferably a follow-up ticket) — this is a lint rule, not just a guideline.
- Prisma-generated types are the source of truth for entity shapes; hand-written interfaces are only for request/response DTOs and view-model shapes that are deliberately different from the database shape.

## 5. Error Handling

- Backend: only the typed exception classes described in `08-api-specifications.md` §11 are thrown from service/controller code; nothing returns a raw `res.status(...).json(...)` call (which is how the current system produces three different inconsistent error shapes across modules).
- Frontend: TanStack Query's error boundaries + a shared `<ApiErrorMessage />` component that knows how to render the standard `ApiError` shape — no page hand-rolls its own `catch` block formatting.

## 6. Git & Review

- Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) — enables automated changelog generation later if desired.
- Every PR touching a controller must show (in the PR description or a CI-rendered diff) which `@RequirePermission` decorators changed — reviewers are explicitly asked to scrutinize authorization changes more closely than any other category of diff, given the existing system's history.
- No direct pushes to `main`; all changes through PR with the required checks from `18-cicd.md`.

## 7. Documentation-as-Code

- Every Nest controller method has an `@ApiOperation` summary — this is what populates the generated OpenAPI spec's descriptions, so "the API docs" are never a separately-maintained Markdown file that drifts from reality (the fate of the current system's `API_REFERENCE.md`, which is accurate but only covers one module and will not be updated automatically as the API evolves).
- Architecture Decision Records (ADRs): any decision that reverses or significantly extends something in this document set gets a short ADR markdown file under `docs/adr/`, numbered sequentially, following the lightweight "context / decision / consequences" format — so future developers (or a future AI agent) can see *why* a deviation happened without having to ask.
