# Request and Event Flows

This document captures the main synchronous and asynchronous flows.

## 1. Human Login and API Access

```mermaid
sequenceDiagram
  participant U as User
  participant W as Next.js Web
  participant NA as NextAuth
  participant DB as PostgreSQL
  participant A as API Guard

  U->>W: Submit email/password on /login
  W->>NA: CredentialsProvider.authorize()
  NA->>DB: Load User + Memberships
  DB-->>NA: User record
  NA->>NA: Verify bcrypt password
  NA->>NA: Sign API JWT (AUTH_TOKEN_SECRET/NEXTAUTH_SECRET)
  NA-->>W: Session with apiToken + workspace claims
  W->>A: API request with Bearer token + x-workspace-id
  A->>DB: Validate user and active workspace membership
  DB-->>A: membership ok
  A-->>W: authorized response
```

## 2. Device Telemetry Ingest

```mermaid
sequenceDiagram
  participant D as Device
  participant API as TelemetryController
  participant G as JwtAuthGuard
  participant P as ProductionStateService
  participant DB as PostgreSQL
  participant Q as Redis/BullMQ

  D->>API: POST /api/values/devices/:deviceId
  API->>G: check Device auth header
  G->>DB: match DeviceCredential.keyHash
  DB-->>G: device credential + workspace
  API->>P: ingestTelemetry()
  P->>DB: store telemetry rows
  P->>DB: update device lastSeen + ONLINE
  P->>Q: enqueue alert-evaluation
  API-->>D: success + count
```

## 3. Config Deployment

```mermaid
sequenceDiagram
  participant U as User
  participant API as DevicesController
  participant P as ProductionStateService
  participant DB as PostgreSQL
  participant Q as QueueProducer
  participant R as Redis
  participant W as Worker
  participant M as MQTT/HTTP Bridge

  U->>API: POST /api/devices/:id/config/deploy
  API->>P: deployConfig()
  P->>DB: build payload + create ConfigDeployment(PENDING)
  P->>Q: enqueue config-deployments job
  Q->>R: push job
  P->>M: optional direct publish (CONFIG_BRIDGE_DIRECT)
  R->>W: worker receives job
  W->>DB: update deployment SENT
  W->>M: publish payload (MQTT and/or HTTP bridge)
```

## 4. Alert Evaluation

```mermaid
sequenceDiagram
  participant T as Telemetry ingest
  participant R as Redis Queue
  participant W as Alert Worker
  participant DB as PostgreSQL

  T->>R: enqueue alert-evaluation(deviceId, workspaceId)
  R->>W: deliver job
  W->>DB: read latest telemetry + active alert rules
  W->>W: evaluate comparators and thresholds
  W->>DB: create AlertIncident rows for triggered rules
```

## 5. Actuation Flow

```mermaid
sequenceDiagram
  participant U as User
  participant API as ActuationsController
  participant P as ProductionStateService
  participant R as Redis
  participant W as Worker
  participant DB as PostgreSQL
  participant M as MQTT

  U->>API: POST /api/devices/:deviceId/actuations
  API->>P: createActuation()
  P->>DB: insert ActuationCommand(PENDING)
  P->>R: enqueue actuation-delivery
  R->>W: worker receives job
  W->>DB: mark command SENT
  W->>M: publish powerlytic/devices/{id}/commands
```

## 6. Legacy Compatibility Flow

The API keeps firmware-facing legacy aliases:

- `POST /api/values/devices/:deviceId` (telemetry)
- `GET /api/device/:id/config`
- `POST /api/device/:id/deploy`
- `GET /api/device/:id/deployment-status`
- `PUT /api/device/:id/deployment-status`

These route to the same underlying state services as canonical endpoints.
