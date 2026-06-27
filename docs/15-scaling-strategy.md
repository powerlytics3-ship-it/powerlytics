# 15 — Scaling Strategy

The principle from `04-future-architecture-overview.md`: start simple, keep the seams that let specific pieces scale independently *when their specific bottleneck actually shows up* — not preemptively.

## 1. What Breaks First, and In What Order

Given this product's shape (telemetry volume grows with device count × reporting frequency; everything else grows with customer/user count, which is much slower), the realistic order of bottlenecks is:

### Stage 1 — Current design, as specified (roughly: up to a few thousand devices reporting every 1–5 seconds)

No changes needed. A single Neon Postgres instance (with its built-in autoscaling compute and read replicas available on paid tiers if needed), a single `apps/api` instance (Cloud Run/Render scales horizontally on its own), and monthly-partitioned `device_telemetry` comfortably handle this.

### Stage 2 — Telemetry write volume becomes the bottleneck

**Symptom:** `device_telemetry` insert latency degrades, or Neon's compute autoscaling can't keep up with sustained write throughput.

**Response, in order of effort:**
1. Increase batching — the ingestion service already inserts one statement per device-payload (multiple values at once); if devices are reporting more frequently than necessary, increase the firmware-side reporting interval (operational, not architectural) where the product allows it.
2. Move `TelemetryModule` into its own deployable NestJS service (the module boundary described in `10-backend-architecture.md` §5 was drawn specifically so this requires no business-logic rewrite — only extracting the module into its own `apps/telemetry-ingest` and pointing it at the same database).
3. Add a write-side queue in front of the database (ingestion endpoint enqueues into Upstash/Redis or a managed queue, a worker pool drains it into Postgres) if burst traffic, not sustained throughput, is the actual problem — this smooths spikes without needing a different database.

### Stage 3 — Telemetry read/query volume or storage size becomes the bottleneck

**Symptom:** dashboard chart queries slow down, or the partitioned table's total size makes maintenance (backups, vacuum) unwieldy on a single Neon instance.

**Response:**
1. Add a Neon read replica for telemetry queries, keeping writes on the primary.
2. Move to a purpose-built time-series store for telemetry specifically (TimescaleDB on a dedicated host, or ClickHouse) while keeping every other table on Neon — this is exactly why telemetry was kept in its own module/table family from day one rather than deeply intertwined with the relational tenant data; migrating it is "stand up a new store, change `TelemetryQueryService`'s and `TelemetryIngestionService`'s data access, backfill," not a platform-wide rewrite.
3. Pre-aggregate older data (e.g., downsample telemetry older than 30 days to 1-minute averages in a separate rollup table) so dashboards querying long historical ranges don't scan raw-resolution data.

### Stage 4 — Tenant/workspace count grows into the tens of thousands

**Symptom:** workspace-list/admin-console queries across all workspaces (used by `SuperAdmin`) slow down.

**Response:** these are already indexed (`05-database-design.md` §9) and paginated by design; this stage mostly needs query-plan monitoring (Neon's built-in insights) and, if needed, materialized summary tables (e.g., a `workspace_device_counts` materialized view refreshed periodically) rather than any architectural change.

### Stage 5 — Background job volume (alert evaluation, notification delivery) grows

**Symptom:** BullMQ queue depth on Upstash grows faster than workers drain it.

**Response:** add more worker processes (horizontally scalable, stateless) before considering anything more drastic — this is the cheapest lever available and Upstash/BullMQ are designed for exactly this.

## 2. What We Deliberately Did Not Build Up Front

- No Kafka/event-streaming platform — there is no current requirement that justifies its operational cost, and the BullMQ-on-Redis queue covers every async need this design has today.
- No microservices split beyond the telemetry-extraction seam — splitting `WorkspacesModule`/`DevicesModule`/etc. into separate services before there's a measured reason to would add deployment and data-consistency complexity (cross-service transactions, eventual consistency for what's currently a single-database transaction) with no corresponding benefit at the scale this product is actually at.
- No multi-region database from day one — Neon's branching and read-replica features cover the realistic near-term needs; multi-region active-active is a real undertaking that should be justified by an actual latency or compliance requirement, not spec'd speculatively.

## 3. Monitoring That Tells Us When to Move to the Next Stage

| Signal | Source | Triggers consideration of |
|---|---|---|
| `device_telemetry` insert p95 latency | Application metrics (OpenTelemetry → whatever APM is configured) | Stage 2 |
| Neon compute autoscaling hitting its ceiling sustained for >10 min | Neon dashboard | Stage 2/3 |
| Dashboard chart endpoint p95 latency | Application metrics | Stage 3 |
| `device_telemetry` total size / partition count | Scheduled check in the partition-maintenance job, logged | Stage 3 |
| BullMQ queue depth trend | Upstash dashboard / a small `/v1/admin/queue-health` endpoint | Stage 5 |

This is intentionally a short list of concrete, observable triggers rather than a calendar — the architecture changes when the data says to, not on a schedule.
