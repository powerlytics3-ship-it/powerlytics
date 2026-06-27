# 01 — Executive Summary

## What Powerlytic Is

Powerlytic is a multi-tenant IoT monitoring platform. Physical hardware (ESP32/STM32-class controllers) is installed at customer sites, reads electrical/industrial signals through configurable ports (digital, analog, Modbus/RS‑485), and reports that telemetry to the cloud. Customers view live and historical data, manage devices, and push configuration changes back down to the hardware.

Today the product serves **organizations** (B2B — a company with many users and many devices). The business now wants the **same product** to serve **individual homeowners** (B2C — one person, a handful of devices) without forking the codebase or hacking around the data model.

## What This Document Set Is

This is a complete, from-scratch architecture and build plan for **Powerlytic v2**. It is split into two parts:

1. **Existing System Analysis** (`02-existing-system-analysis.md`) — a ground-truth audit of the current codebase (not the aspirational docs that were already sitting in the repo's `docs/prompt/` folder — those describe a *desired future state* the team had sketched out, and in several places they are wrong about what the code actually does today). Everything in that document was verified by reading the actual source files in `powerlytics-be/src` and `powerlytics-ui/app`.

2. **Target Architecture** (everything else) — a redesign that preserves every real business behavior found in the audit, fixes every gap found in the audit, and is built around the constraints given for this rebuild:
   - PostgreSQL (Neon) as the system of record, Redis only where it earns its place.
   - No Keycloak. Authentication is evaluated across Better Auth, Auth.js (NextAuth), Clerk, and Lucia, with a clear recommendation.
   - No Docker for local development.
   - The existing HTTPS→MQTT bridge service stays exactly where it is — the backend will never speak MQTT directly and EMQX is not introduced.
   - One unified product for B2B and B2C via a `Workspace` abstraction, not two products.
   - Cloud services chosen to be free-tier-first.

## Current State, In One Paragraph

The backend is a single Express + Mongoose (MongoDB) service with eight modules (Auth, User, Organization, Device, DeviceModel, PortType, Value, Alert). It correctly implements device-model-driven port configuration, Modbus register parsing with endianness handling, calibration, and a working (if narrow) config-deployment bridge to external hardware. It does **not** correctly implement tenant isolation — more than half of its routes either have no authentication, no role check, or no organization-scope check, meaning a logged-in user from Org A can, today, read and in several cases modify Org B's data. The frontend is a Next.js 15 / React 19 app with a genuinely well-designed client-side RBAC abstraction (role → resource → action → policy) that is undermined by the backend not enforcing the same rules. There is no test suite, no CI pipeline, no OpenAPI contract, and the `dist/` folder checked into the repo is stale relative to `src/`.

## Why a Rebuild, Not a Patch

The two biggest structural problems — single-organization-per-user (no way to model a personal/B2C tenant or a user who belongs to two organizations) and missing backend authorization — are load-bearing assumptions throughout the codebase. Patching them in place would touch nearly every route handler anyway. A clean rebuild around a `Workspace` + `WorkspaceMembership` model, with authorization enforced once in shared middleware/guards instead of ad hoc in each controller, costs little more than patching and removes an entire category of recurring bugs.

## What Stays, What Changes

| Keeps working exactly as today | Changes |
|---|---|
| Modbus parsing (function codes, endianness, scaling/offset) | MongoDB → PostgreSQL (relational tenant data fits relational modeling far better; see `05-database-design.md`) |
| Device-model → device port templating | Single `organization` per user → `Workspace` + `WorkspaceMembership` (many-to-many, role per membership) |
| HTTPS bridge for config deployment (no direct MQTT in our backend) | Bridge calls get authenticated (today the device→backend ack endpoint has **no auth at all**) |
| Calibration model (scaling/offset on ports) | Backend RBAC is enforced everywhere, not just on some routes |
| Telemetry payload shape from devices (`DI_*`, `AI_*`, `MI_*`) | Device-to-cloud auth becomes a device credential, not a borrowed user JWT |
| React Query + Zustand + React Hook Form on the frontend | Auth moves from hand-rolled JWT/bcrypt to Better Auth (see `06-authentication-design.md`) |
| The frontend's role/resource/action policy pattern (it's good — we extend it) | Frontend splits into a customer app and a separate internal admin app (see `09-frontend-architecture.md`) |
| | Actuation (turning a relay on/off) and alerting move from "data model only, no real flow" to fully implemented, audited features |

## Document Map

| # | Document | Answers |
|---|---|---|
| 02 | Existing System Analysis | What does the current code actually do, and where exactly does it fall short? |
| 03 | Business Domain & Requirements | What is Powerlytic for, and what must v2 do (functionally and non-functionally)? |
| 04 | Future Architecture Overview | What's the shape of the new system, and why? |
| 05 | Database Design | What does the Postgres schema look like? |
| 06 | Authentication Design | Better Auth vs. Auth.js vs. Clerk vs. Lucia, and the chosen login/session/device-auth flows |
| 07 | Authorization / RBAC Design | Roles, permissions, and how they're enforced at every layer |
| 08 | API Specifications | Every endpoint, its contract, and its auth requirement |
| 09 | Frontend Architecture | Stack, app split, folder structure, component patterns |
| 10 | Backend Architecture | Module structure, layering, background jobs |
| 11 | Device Communication & Config Deployment | The HTTPS↔MQTT bridge contract in detail |
| 12 | Telemetry Flow | Ingestion → transformation → storage → query |
| 13 | Sequence Diagrams | The cross-cutting flows, end to end |
| 14 | Security Considerations | Threats and mitigations |
| 15 | Scaling Strategy | What breaks first, and what we do about it |
| 16 | Deployment & Environment Guide | Exact services to create, exact env vars, exact local setup |
| 17 | Testing Strategy | Unit/integration/E2E approach without Docker |
| 18 | CI/CD | Pipeline design |
| 19 | Coding Standards | Conventions for a multi-developer, multi-year codebase |
| 20 | Feature Roadmap & Migration Plan | What ships when, and how existing data moves over |
| 21 | Implementation Blueprint | The exact module-by-module build order for an AI coding agent |
| 22 | Project Folder Structure | The monorepo layout, file by file |
