# 13 — Sequence Diagrams (Consolidated)

Flows already fully diagrammed in earlier documents are referenced rather than repeated: B2C sign-up (`06`, §4.1), B2B invitation (`06`, §4.2), device credential issuance + telemetry ingestion auth (`06`, §4.3), config deployment (`11`, §3), telemetry ingestion pipeline (`12`, §2). This document covers the remaining cross-cutting flows.

## 1. Device Manufacture → Claim → First Deployment (End to End)

```mermaid
sequenceDiagram
    participant Mfg as Manufacturer Staff (apps/admin)
    participant API as apps/api
    participant DB as Postgres
    participant Cust as Workspace Admin (apps/web)
    participant Bridge as mqtt-http-bridge

    Mfg->>API: POST /v1/devices/manufacture {imei, deviceModelId}
    API->>DB: load published DeviceModel + ports
    API->>DB: INSERT Device {lifecycleStatus: MANUFACTURED, workspaceId: null}
    API->>DB: INSERT DevicePort rows copied from DeviceModelPort
    API->>DB: generate + store claimCode
    API-->>Mfg: {device, claimCode} — printed on device label/QR

    Note over Mfg,Cust: Device is shipped. Time passes.

    Cust->>API: POST /v1/devices/claim {claimCode}
    API->>DB: find Device by claimCode, verify lifecycleStatus = MANUFACTURED
    API->>DB: UPDATE Device {workspaceId, lifecycleStatus: CLAIMED, claimedAt}
    API->>DB: INSERT DeviceClaim (audit trail)
    API->>DB: INSERT AuditLog {action: "device.claimed"}
    API-->>Cust: device now visible in their workspace

    Cust->>Cust: configures ports (unit, calibration, Modbus wiring)
    Cust->>API: POST /v1/devices/:id/deployments
    API->>Bridge: (see doc 11 for full detail)
    Bridge-->>API: ack
    API->>DB: UPDATE Device.lifecycleStatus = ACTIVE (first successful deployment)
```

## 2. Device Transfer Between Workspaces

```mermaid
sequenceDiagram
    participant SrcAdmin as Source Workspace Admin
    participant API as apps/api
    participant DB as Postgres
    participant DstAdmin as Destination Workspace Admin

    SrcAdmin->>API: POST /v1/devices/:id/transfer {toWorkspaceId, reason}
    API->>API: PermissionGuard: devices:transfer-out on source workspace
    API->>DB: INSERT DeviceTransfer {status: PENDING}
    API->>DB: INSERT AuditLog {action: "device.transfer_requested"}
    API-->>SrcAdmin: 201

    DstAdmin->>API: POST /v1/devices/:id/transfer/:transferId/approve
    API->>API: PermissionGuard: devices:claim on destination workspace
    API->>DB: UPDATE Device.workspaceId = toWorkspaceId
    API->>DB: UPDATE DeviceTransfer.status = COMPLETED
    API->>DB: INSERT AuditLog {action: "device.transfer_completed", beforeValue, afterValue}
    API-->>DstAdmin: 200
```

## 3. Actuation Command

```mermaid
sequenceDiagram
    participant Op as Operator (apps/web)
    participant API as apps/api
    participant DB as Postgres
    participant Bridge as mqtt-http-bridge
    participant HW as Device

    Op->>Op: clicks "Set ON" on a relay port, confirms in modal
    Op->>API: POST /v1/devices/:id/actuations {portKey, action:"SET", value:1, idempotencyKey}
    API->>API: PermissionGuard: actuation:send-command
    API->>API: verify port.portType.category === 'OUTPUT'
    API->>DB: INSERT ActuationCommand {status: PENDING} (idempotencyKey unique — a retried request with the same key returns the existing row, never double-sends)
    API->>Bridge: POST (signed) {commandId, portKey, value}
    Bridge->>HW: MQTT publish
    API->>DB: UPDATE status = SENT
    HW->>HW: applies relay change
    HW->>Bridge: ack (unchanged, outside this codebase)
    Bridge->>API: POST /v1/internal/bridge/actuations/:id/ack {status: ACKED}
    API->>DB: UPDATE status = ACKED, acknowledgedAt
    API->>DB: INSERT AuditLog {action: "actuation.sent"}
```

## 4. Alert Rule Evaluation & Notification

```mermaid
sequenceDiagram
    participant Ingest as TelemetryIngestionService
    participant Queue as BullMQ (Upstash Redis)
    participant Eval as AlertEvaluationProcessor
    participant DB as Postgres
    participant Notif as NotificationDeliveryProcessor
    participant Resend as Resend (email)

    Ingest->>Queue: enqueue {deviceId, portKeys}
    Queue->>Eval: job picked up
    Eval->>DB: load active AlertRule rows for deviceId + portKeys
    Eval->>DB: load latest DeviceTelemetry value per relevant portKey
    Eval->>Eval: evaluate condition (GREATER_THAN/LESS_THAN/EQUAL/NOT_EQUAL) + forDurationSec
    alt condition met (and not already an open AlertEvent for this rule)
        Eval->>DB: INSERT AlertEvent {status: NEW}
        Eval->>Queue: enqueue notification job
        Queue->>Notif: job picked up
        Notif->>DB: load NotificationChannel rows linked to the rule
        Notif->>Resend: send email
    end
```

## 5. Audit Log Write Path

Every mutating service method that touches a sensitive resource calls the same helper, so the write path is uniform regardless of which module triggered it:

```mermaid
sequenceDiagram
    participant Svc as Any *.service.ts
    participant Audit as AuditService
    participant DB as Postgres

    Svc->>Svc: perform the actual mutation (e.g. UPDATE WorkspaceMembership.role)
    Svc->>Audit: writeEntry({workspaceId, actorUserId, action, targetType, targetId, beforeValue, afterValue})
    Audit->>DB: INSERT AuditLog
    Note over Svc,DB: The mutation and the audit write happen inside the same Prisma transaction,<br/>so a successful action is never recorded without a corresponding audit row, and vice versa.
```

## 6. Admin Impersonation (Support Access)

```mermaid
sequenceDiagram
    participant SA as SuperAdmin (apps/admin)
    participant API as apps/api
    participant DB as Postgres
    participant WebSession as apps/web (impersonated view)

    SA->>API: POST /v1/admin/workspaces/:id/impersonate
    API->>API: PlatformGuard: requires platformRole = SUPER_ADMIN
    API->>DB: INSERT AuditLog {action: "admin.impersonation_started", actorUserId: SA, targetType: "Workspace", targetId}
    API-->>SA: short-lived impersonation token (Better Auth jwt() plugin, 15 min)
    SA->>WebSession: opens apps/web with impersonation token
    WebSession->>API: subsequent requests carry the impersonation token
    API->>API: every PermissionGuard check and every AuditService.writeEntry() during this session tags actorType: USER, actorUserId: SA, with a separate isImpersonating: true flag — never silently attributed to a workspace member
```
