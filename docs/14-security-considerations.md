# 14 — Security Considerations

This document maps every issue found in `02-existing-system-analysis.md` §9/§14 to its specific fix in v2, then covers additional hardening that goes beyond just closing existing gaps.

## 1. Direct Remediation of Findings From the Existing System

| Existing-system finding | v2 mitigation |
|---|---|
| Cross-tenant data exposure (Organizations, Users, Devices, Telemetry, DeviceModels reachable across orgs) | Every workspace-owned query is scoped by `workspaceId` as a mandatory filter, enforced by `PermissionGuard` + data-aware policies (`07-authorization-rbac-design.md` §4.1), not merely a role check. |
| Unauthenticated deployment-status callback | `BridgeSignatureGuard` (HMAC-SHA256 over the request body, shared secret) required on all bridge→backend callbacks (`11-device-communication-and-config-deployment.md` §2). |
| Unauthenticated DeviceModel and Alert CRUD | Every route has a `PermissionGuard` decorator; there is no controller method in v2 without either `@RequirePermission`, `@UseGuards(DeviceAuthGuard)`, or an explicit `@Public()` marker reviewed in PR (a lint rule / Nest interceptor check fails CI if a controller method has none of the three — see `18-cicd.md`). |
| JWT in `localStorage` | Better Auth's HttpOnly, Secure, SameSite cookie session; no token is ever placed in `localStorage` or readable by page JavaScript. |
| Refresh-token signer bug | No hand-rolled JWT signing exists in v2's session path at all — Better Auth owns token issuance. |
| Password reset token returned in API response | Better Auth's flow only ever delivers the reset link via the configured email provider; no response body in this system ever contains a reset/verification token. |
| No rate limiting on auth endpoints | Better Auth's built-in rate limiting, backed by Upstash Redis, enabled on sign-in/sign-up/reset. |
| No request validation | Global `ValidationPipe` + `class-validator` DTOs on every mutating route (`08-api-specifications.md` §12). |
| Role-string case-sensitivity bug, role-enum mismatch in registration | Roles are a Prisma enum (`WorkspaceRole`), referenced via the TypeScript type everywhere — a typo'd literal string is a compile error, not a silent runtime bypass. |
| Hardcoded fallback bridge URL | `BRIDGE_BASE_URL` is a required, validated env var; the app fails fast at boot if it's missing, via Nest's `ConfigModule` schema validation. |
| Stale `dist/` committed to the repo | `.gitignore` excludes build output in v2; CI builds from `src/` on every deploy, so there is no "stale compiled artifact" that could ever be the thing actually running. |
| No audit trail | `AuditLog`, written transactionally alongside every sensitive mutation (`13-sequence-diagrams.md` §5). |
| Devices authenticating with a borrowed human JWT | `DeviceCredential` + `DeviceAuthGuard`, entirely separate code path from human session auth (`06-authentication-design.md` §4.3). |

## 2. Additional Hardening Beyond the Existing Gaps

### 2.1 Secrets Management
All secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BRIDGE_API_TOKEN`, `BRIDGE_HMAC_SECRET`, OAuth client secrets, Resend API key, Upstash credentials) are environment variables only, sourced from the hosting platform's secret store (Vercel/Render/Cloud Run environment configuration), never committed. `.env.example` documents every required variable's *name* and a placeholder, never a real value (see `16-deployment-and-environment-guide.md`).

### 2.2 CORS
Origin allow-list is read from `ALLOWED_ORIGINS` (comma-separated env var), not hardcoded in source — adding a new frontend deployment is a config change, not a code change and redeploy, fixing the operational friction in the current `app.ts`.

### 2.3 Transport Security
All traffic is HTTPS-only (enforced by the hosting platforms by default for both Vercel and Cloud Run/Render). Cookies are `Secure`, so they're never sent over plain HTTP even if a misconfigured client tried.

### 2.4 Password Storage
bcrypt (Better Auth's default, cost factor 10+) — unchanged from the current system's already-reasonable choice, just executed by audited library code instead of hand-rolled calls.

### 2.5 Device Credential Storage
Device API keys are stored as a salted hash (`sha256`, with the key itself being high-entropy random bytes, so a plain hash is acceptable here unlike a human password — there's no dictionary-attack surface against a 256-bit random key). The plaintext key is shown to the operator exactly once at creation time and never retrievable again, matching the standard pattern for machine API keys industry-wide (e.g., Stripe, GitHub PATs).

### 2.6 Audit Log Integrity
Audit log rows are never updated or deleted by application code (no `UPDATE`/`DELETE` Prisma call exists anywhere in `AuditService`); the only thing that ever happens to an audit row after insert is being read.

### 2.7 Least Privilege for the Manufacturer Role
`MANUFACTURER` platform role has zero matrix entries for any workspace-scoped resource (`07-authorization-rbac-design.md` §3) — this is enforced by the same shared `packages/permissions` matrix the rest of the system uses, so there's no separate "manufacturer-only" code path that could drift out of sync and accidentally grant broader access.

### 2.8 Impersonation Safety
Support impersonation sessions are short-lived (15 minutes), explicitly flagged (`isImpersonating: true`) in every audit entry written during their use, and require `SUPER_ADMIN`, not `MANUFACTURER` or any workspace role (`13-sequence-diagrams.md` §6).

### 2.9 Dependency & Supply Chain
`pnpm audit` (or Snyk/Dependabot, see `18-cicd.md`) runs in CI on every PR; this did not exist in the current system at all.

### 2.10 SQL Injection
Prisma's query builder parameterizes all queries by construction; the one place raw SQL is used (the telemetry partitioning migration) is a fixed migration file, not a runtime query built from request input.

## 3. Threat Model Summary

| Actor | What they can reach | What stops them from reaching more |
|---|---|---|
| Unauthenticated internet user | `/api/auth/sign-up`, `/api/auth/sign-in`, public marketing pages | Rate limiting; everything else requires a valid session, device credential, or bridge HMAC signature |
| A workspace's `VIEWER` | That workspace's devices/telemetry/alerts, read-only | `PermissionGuard` denies every mutating action; query scoping prevents seeing other workspaces' data even if a `workspaceId` were guessed |
| A workspace's `ADMIN`/`OWNER` | Full management of their own workspace only | Same query-scoping mechanism; no endpoint accepts an arbitrary `workspaceId` from the body for a mutating action — it's always derived from the authenticated session's active membership |
| A compromised device credential | Can post telemetry as that one device, can be revoked instantly | `DeviceAuthGuard` ties the credential to exactly one `deviceId`; no broader permission exists to escalate from "one device" to "a workspace" or "the platform" |
| `MANUFACTURER` staff | Device catalog, port types, unclaimed inventory | No matrix entry for any workspace-scoped or telemetry resource |
| `SUPER_ADMIN` | Everything, audited | The role with the largest blast radius — mitigated by being a separate app (`apps/admin`), a separate sign-in audience, and (recommended) passkey/hardware-key enforcement for this specific role |
| The bridge service | Can post deployment/actuation acks for the device IDs it's told about | HMAC signature required; cannot read any other data, has no session, no broader API access |
