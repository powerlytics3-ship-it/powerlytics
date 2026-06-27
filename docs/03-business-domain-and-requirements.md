# 03 — Business Domain, Functional & Non-Functional Requirements

## 1. Business Domain

Powerlytic sells a hardware+software product. A physical controller is installed at a site (a factory panel, a solar inverter room, a homeowner's utility closet) and wired to sensors and, optionally, relays. The software's job is to:

1. Let the **owner** of that hardware (a company, or an individual) configure what the hardware reads and how raw readings are converted into real-world units.
2. Receive a continuous stream of readings from the hardware and make them visible (live and historical).
3. Let the owner push configuration changes back down to the hardware safely.
4. (New in v2) Let the owner send control commands to output-capable hardware, and be notified when readings cross defined thresholds.

### 1.1 Core Domain Concepts

| Concept | Definition |
|---|---|
| **Workspace** | The universal tenant. Every user, device, and piece of data belongs to exactly one workspace (or, for platform staff, to none). A workspace is either `ORGANIZATION` (B2B — many members, role-based) or `PERSONAL` (B2C — one owner, no other members by default). |
| **Device Model** | An immutable hardware template: a microcontroller type plus an ordered list of ports and their types. Two devices built from the same model are interchangeable in terms of what they *can* measure. |
| **Device** | One physical, serialized unit. Bound permanently to one Device Model and one IMEI. Starts life "manufactured" (no workspace), is later "claimed" into exactly one workspace. |
| **Port** | A single physical I/O point on a device: digital in, analog in, Modbus-in (a virtual port representing a group of Modbus reads on one or more RS‑485 slaves), or digital out (relay). |
| **Calibration** | A linear transform (`scaling`, `offset`) applied to a raw reading to produce a real-world value. |
| **Telemetry** | A timestamped reading from one port. |
| **Config Deployment** | The act of pushing a device's current port/Modbus configuration down to the physical hardware via the external MQTT bridge. |
| **Actuation** *(new)* | A timestamped, audited command sent to an output-capable port. |
| **Alert Rule / Alert Event** *(new)* | A condition defined against a port's telemetry (e.g., "AI_1 calibrated value > 80 for 5 minutes") and the resulting incidents it fires. |

### 1.2 Business Rules (Carried Forward, Verified Against Code)

These were true in the current implementation and remain true in v2:

- A device's IMEI and Device Model binding are permanent once set.
- A device's ports are defined entirely by its Device Model at the moment of creation; an owner can tune *values* on those ports (unit, calibration, thresholds, Modbus slave/read wiring) but cannot add, remove, or retype ports.
- Telemetry calibration is `calibratedValue = rawValue × scaling + offset`, applicable at both the port level and (for Modbus) the individual-read level.

### 1.3 Business Rules (New in v2, Per the Stated Requirements)

- A Device Model becomes immutable the moment it is published; changing port definitions after that requires creating a new, versioned Device Model.
- A device belongs to **at most one workspace at a time**. Moving it to another workspace is an explicit, audited "transfer" — never a silent field update.
- A user can belong to **multiple workspaces**, with a different role in each.
- There is never a code path that lets a member of Workspace A read or write a resource scoped to Workspace B, regardless of that member's role.
- B2C and B2B customers use the same data model, the same APIs, and (mostly) the same UI — the only difference is the `Workspace.type` and what that implies for available navigation (e.g., a `PERSONAL` workspace has no "Members" page because there's nothing to manage there).

## 2. Functional Requirements

Grouped by capability area. Each is implemented as one or more modules described in `10-backend-architecture.md` and exposed via the endpoints in `08-api-specifications.md`.

### FR-1 Identity & Access
- FR-1.1 Users can sign up with email/password or via OAuth (Google at minimum).
- FR-1.2 A new user signing up with no invitation gets a `PERSONAL` workspace created automatically.
- FR-1.3 An `ORGANIZATION` workspace can invite new members by email; invitees who don't yet have an account can create one as part of accepting the invite.
- FR-1.4 Every workspace membership carries exactly one role from a fixed, extensible set (`07-authorization-rbac-design.md`).
- FR-1.5 Platform staff (`SuperAdmin`, `Manufacturer`) authenticate the same way but hold platform-level, not workspace-level, permissions.
- FR-1.6 Sessions are revocable; logging out (or an admin forcing a logout) invalidates the session immediately, not just on natural expiry.

### FR-2 Workspace & Membership Management
- FR-2.1 A workspace owner/admin can invite, remove, and change the role of members in their own workspace only.
- FR-2.2 A `SuperAdmin` can view and administer any workspace.
- FR-2.3 Workspace profile (name, billing contact, address) is editable by workspace admins.

### FR-3 Device Model Management
- FR-3.1 A `Manufacturer` or `SuperAdmin` can draft a Device Model: name, microcontroller type, ordered port list (each port typed via the global Port Type taxonomy).
- FR-3.2 Publishing a Device Model locks its port definitions permanently.
- FR-3.3 A published Device Model can be superseded by a new version; existing devices stay bound to the version they were manufactured with.

### FR-4 Device Lifecycle
- FR-4.1 Devices are created ("manufactured") against a published Device Model, recording IMEI and serial; no workspace is attached yet.
- FR-4.2 A workspace member with the right permission can claim an unclaimed device into their workspace using a claim code (generated at manufacture time, e.g. printed on the device label/QR code).
- FR-4.3 A device can be transferred between workspaces; this requires elevated permission and is fully audited.
- FR-4.4 Within a workspace, members with permission can edit a device's per-port settings: display name, unit, calibration, thresholds, and (for Modbus ports) the full slave/register configuration.
- FR-4.5 Device immutability rules from the current system (IMEI, model binding, port identity) are preserved exactly.

### FR-5 Configuration Deployment
- FR-5.1 A workspace member with permission can deploy a device's current configuration; the backend builds the hardware-facing config payload and sends it to the existing HTTPS bridge service — never directly to MQTT.
- FR-5.2 Every deployment is recorded as a new history row (not an overwrite), capturing who triggered it, the config hash, and its outcome.
- FR-5.3 The bridge's acknowledgement callback is authenticated; only the bridge service (or a device using its own credential, if the architecture calls for it) can update deployment status.
- FR-5.4 Deployments that don't reach a terminal state within a configurable timeout are marked failed/stale rather than left pending forever.

### FR-6 Telemetry
- FR-6.1 Devices authenticate to the ingestion endpoint with a device-specific credential, not a human session token.
- FR-6.2 Ingested payloads are validated against the device's actual port/Modbus configuration; unrecognized ports are rejected into a quarantine record rather than silently dropped.
- FR-6.3 Calibration and Modbus register parsing (function code, endianness, scaling/offset) behave identically to the current implementation.
- FR-6.4 The UI can retrieve: latest snapshot, time-series for a port/read, tabular history, aggregate stats over a range, and a CSV-ready export — matching the current Value module's read surface.

### FR-7 Actuation *(new)*
- FR-7.1 A permitted workspace member can send a command to an output-capable port.
- FR-7.2 Every command is persisted with a lifecycle (`PENDING → SENT → ACKED | FAILED | TIMED_OUT`) and a full audit trail.
- FR-7.3 High-impact commands can be configured to require a confirmation step in the UI.

### FR-8 Alerting *(new)*
- FR-8.1 A workspace member with permission can define alert rules against a device's ports (threshold + duration).
- FR-8.2 Telemetry ingestion evaluates active rules for the device and creates an Alert Event when a rule's condition is met.
- FR-8.3 Alert Events can be acknowledged and resolved by workspace members.
- FR-8.4 Notification delivery (email at minimum) fires on new Alert Events to the configured recipients.

### FR-9 Auditing
- FR-9.1 Every sensitive action (role change, device transfer, device-model publish, member removal, deletion of any kind) writes an immutable audit log entry capturing actor, action, target, timestamp, and (where relevant) before/after values.
- FR-9.2 Workspace admins can view their own workspace's audit log; `SuperAdmin` can view any workspace's.

### FR-10 Admin / Platform Operations
- FR-10.1 `SuperAdmin` can view and manage all workspaces, all users, and all devices platform-wide.
- FR-10.2 `Manufacturer` staff can manage Device Models, Port Types, and unclaimed device inventory, without access to any workspace's telemetry or member data.

## 3. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | No cross-workspace data access under any role/path combination, enforced server-side (not just hidden in the UI). All secrets via environment variables, never committed. Passwords hashed (bcrypt/argon2), tokens never logged. |
| **Availability** | Telemetry ingestion and config deployment must remain available even if the interactive dashboard API is degraded — these are architecturally separable concerns (see `10-backend-architecture.md` for how the modular monolith is structured so this split is possible later without a rewrite). |
| **Performance** | Dashboard list/detail views return in <300ms p95 at expected initial scale (hundreds of workspaces, thousands of devices). Telemetry ingestion endpoint accepts a single device's payload in <150ms p95. |
| **Scalability** | The design must not require a rewrite to go from "tens of devices" to "tens of thousands of devices" — it must instead require *adding* a small number of well-defined components (read replica, queue consumer, partition rollover) per `15-scaling-strategy.md`. |
| **Maintainability** | A new engineer should be able to find "where does X happen" within one module's folder, not spread across the codebase. Shared logic (permission checks, validation schemas) lives in one place and is imported, never copy-pasted. |
| **Auditability** | Every state-changing action on a sensitive resource is traceable to a specific actor and timestamp, indefinitely (audit logs are append-only and not subject to the soft-delete/retention policy applied to operational data). |
| **Testability** | Business logic (calibration, Modbus parsing, permission evaluation, deployment-state transitions) is unit-testable without a database; integration tests run against a real (ephemeral) Postgres instance without requiring Docker locally (Neon branching — see `17-testing-strategy.md`). |
| **Developer onboarding** | A new developer can get the full stack running locally (frontend + backend + database) by cloning the repo, copying one `.env.example`, and running `pnpm install && pnpm dev` — no Docker, no manual service installation. |
| **Cost** | Every external dependency has a workable free tier for early-stage usage; nothing requires a paid plan to develop against or to run a small production deployment. |
| **Compliance posture** | Audit logging, role separation, and tenant isolation are designed so that SOC 2-style controls (access review, least privilege, traceability) are addressable later without re-architecting. |
