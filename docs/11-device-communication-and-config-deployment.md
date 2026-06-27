# 11 — Device Communication & Configuration Deployment

## 1. The Boundary, Restated

The backend never opens an MQTT connection and never will. The existing `mqtt-to-http-bridge` service (deployed separately, not part of this repository) is the only thing that speaks MQTT to the field. This is not a default we arrived at — it is an explicit constraint from the business, and it's a good one: it means the backend's deployment, scaling, and failure modes are completely decoupled from broker operations. v2 keeps this boundary exactly where it is and only changes what travels across it (adding authentication in both directions, and adding a history table instead of an overwritten status field).

```mermaid
flowchart LR
    subgraph API["apps/api"]
        CD["ConfigDeploymentService"]
        BC["BridgeClient"]
        CB["BridgeCallbackController"]
    end
    subgraph Bridge["mqtt-to-http-bridge (external, unchanged)"]
        B1["HTTPS endpoint"]
        B2["MQTT publisher"]
    end
    HW["Physical Device"]

    CD --> BC2[" "]
    CD -->|"1 builds payload"| BC
    BC -->|"2 POST, HMAC-signed, bearer token"| B1
    B1 -->|"3 MQTT publish"| B2
    B2 -->|"4 MQTT"| HW
    HW -->|"5 applies config"| HW
    Bridge -->|"6 signed callback"| CB
    CB -->|"7 writes ConfigDeployment row"| CD
```

## 2. What Changes vs. Today, Specifically

| | Today | v2 |
|---|---|---|
| Backend → bridge auth | None visible in code beyond whatever the bridge itself might check; the call is a plain `axios.post` with a JSON body and a 10s timeout | `Authorization: Bearer ${BRIDGE_API_TOKEN}` plus an `X-Signature` HMAC-SHA256 of the body using a shared secret, so the bridge can reject tampered/forged requests even if the bearer token leaked |
| Bridge → backend auth | **None** — `PUT /device/:id/deployment-status` has no auth middleware at all | `POST /v1/internal/bridge/deployments/:id/ack` requires the same HMAC signature scheme, verified by a dedicated `BridgeSignatureGuard` before the controller body runs |
| Endpoint URL | Defaults to a hardcoded single-device path baked into source if the env var is unset | `BRIDGE_BASE_URL` is required at boot (the app fails to start without it, via Nest's config validation) — no silently-wrong fallback is possible |
| Status tracking | One embedded object on `Device`, overwritten every deploy | Append-only `ConfigDeployment` rows; "current status" is a query (`ORDER BY createdAt DESC LIMIT 1`), not a field |
| Stuck deployments | Stay `pending`/`sent` forever if the device never acks | `deployment-timeout.processor` (cron, every minute) flips any `SENT` deployment older than `DEPLOYMENT_TIMEOUT_SECONDS` to `TIMED_OUT` |
| Payload shape | `{ message: "config", hash, configId, config }` | Unchanged — no reason to break the bridge's existing contract; only the transport-level auth around it changes |

## 3. Deployment Sequence (Full)

```mermaid
sequenceDiagram
    participant Op as Operator (apps/web)
    participant API as apps/api — ConfigDeploymentService
    participant DB as Postgres
    participant Bridge as mqtt-to-http-bridge
    participant HW as Device

    Op->>API: POST /v1/devices/:id/deployments
    API->>DB: load Device + DevicePort[] + ModbusSlaveConfig[] + ModbusReadConfig[]
    API->>API: build hardware-facing config JSON (same shape as today's getConfigByDeviceId)
    API->>API: configHash = sha256(config)
    API->>DB: INSERT ConfigDeployment {status: PENDING, configHash, configSnapshot}
    API->>Bridge: POST {message:"config", hash, configId, config} (signed)
    alt bridge accepts
        Bridge-->>API: 200
        API->>DB: UPDATE status = SENT, sentAt = now()
    else bridge rejects / network error
        API->>DB: UPDATE status = ERROR, errorMessage
        API-->>Op: surfaces error in UI immediately
    end
    Bridge->>HW: MQTT publish (unchanged, outside this codebase)
    HW->>HW: applies config locally
    HW->>Bridge: (whatever ack mechanism the bridge already uses — unchanged)
    Bridge->>API: POST /v1/internal/bridge/deployments/:id/ack {status: APPLIED|ERROR} (signed)
    API->>API: BridgeSignatureGuard verifies HMAC
    API->>DB: UPDATE status, acknowledgedAt
    Note over API,DB: If no ack arrives within DEPLOYMENT_TIMEOUT_SECONDS,<br/>the cron job marks it TIMED_OUT instead of leaving it SENT forever.
```

## 4. Hardware-Facing Config Payload (Unchanged Shape, Carried Forward)

This is read directly from the current `device.service.ts`'s `getConfigByDeviceId` and is preserved exactly, because changing it would require a firmware/bridge-side change that is out of scope for this rebuild:

```json
{
  "device_id": "...",
  "configId": "...",
  "imei": "...",
  "modbusSlaves": [
    {
      "unique_slave_id": "c618ac18-...",
      "slave_id": 1,
      "serial": { "baudRate": 9600, "dataBits": 8, "stopBits": 1, "parity": "none" },
      "polling": { "intervalMs": 1000, "timeoutMs": 300, "retries": 3 },
      "registers": [
        { "readId": "...", "func": "fc_4", "start": 0, "bits": 32 }
      ]
    }
  ]
}
```

## 5. Idempotency & Replay Safety

Each `ConfigDeployment` row stores the exact `configSnapshot` sent. If an operator deploys twice in quick succession with no change, the `configHash` matches the previous deployment's hash; the UI surfaces "no changes since last deploy" and the API can short-circuit (configurable — either still send, for safety, or skip and return the existing row, depending on operational preference). This directly uses the `config-hash.ts` utility that already exists and already works in the current codebase — it's ported, not redesigned.

## 6. Why Not Introduce Direct MQTT or EMQX

Stated for completeness, since it was explicitly ruled out: introducing a broker client into the backend would (a) duplicate operational responsibility the bridge service already owns, (b) couple the backend's deployment/scaling story to broker connection management, and (c) provide no capability the current HTTPS-bridge contract doesn't already provide. There is no requirement in this rebuild that the bridge doesn't already satisfy; the only real gaps were authentication (fixed in §2) and history (fixed via `ConfigDeployment`).
