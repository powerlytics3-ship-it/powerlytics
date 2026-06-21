# Powerlytic Setup Guide: Database, Auth, Redis, and EMQX Wrapper

This guide is written for a first-time setup. Follow it in order. Do not enable all production flags at once; turn them on one by one after each dependency works.

## 1. What Each Third-Party Service Does

| Service | Why Powerlytic uses it | Required now? |
| --- | --- | --- |
| Postgres + TimescaleDB | Stores users, organizations, devices, configs, telemetry, alerts, audit logs | Yes for real data |
| Keycloak | Handles login, password, email verification, roles, OIDC tokens | Yes for real auth |
| Redis | Runs background jobs through BullMQ for config delivery, alert evaluation, actuation delivery | Optional at first, recommended |
| EMQX HTTPS wrapper | Your existing service that receives HTTPS config payload and publishes to MQTT | Yes if this is your current device delivery path |
| MQTT direct | API/worker can publish directly to MQTT broker | Optional; keep disabled if wrapper handles MQTT |

## 2. Current Modes

Powerlytic currently has two backend data modes:

```env
POWERLYTIC_DATA_MODE=demo
```

Uses in-memory demo data. Good for checking screens quickly.

```env
POWERLYTIC_DATA_MODE=prisma
```

Uses Postgres/Timescale through Prisma. This is the real-data mode.

Keep this order:

1. Run demo mode.
2. Start Postgres.
3. Run migrations and seed.
4. Switch to `POWERLYTIC_DATA_MODE=prisma`.
5. Start Keycloak.
6. Enable `AUTH_REQUIRED=true`.
7. Add Redis/worker.
8. Add EMQX wrapper config delivery.

## 3. Create `.env`

From the project root:

```bash
cd /Users/shubhambarkur/Documents/Codex/2026-06-21/files-mentioned-by-the-user-powerlytics/outputs/powerlytic-codex
cp .env.example .env
```

Start with this safe local config:

```env
NODE_ENV=development
API_PORT=4000
WEB_PORT=3000
PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
WEB_ORIGIN=http://localhost:3000

DATABASE_URL=postgresql://powerlytic:powerlytic@localhost:5432/powerlytic
POWERLYTIC_DATA_MODE=demo

AUTH_REQUIRED=false
OIDC_ISSUER_URL=http://localhost:8080/realms/powerlytic
OIDC_AUDIENCE=powerlytic-api
OIDC_CLIENT_ID=powerlytic-web
OIDC_CLIENT_SECRET=change-me

REDIS_URL=redis://localhost:6379
QUEUE_ENABLED=false

MQTT_ENABLED=false
MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=powerlytic-api

CONFIG_BRIDGE_URL=
CONFIG_BRIDGE_TOKEN=
CONFIG_BRIDGE_DIRECT=false

DEVICE_API_KEY_PEPPER=replace-this-with-a-long-random-secret
```

## 4. Install Dependencies

```bash
pnpm install
pnpm build
```

Expected result: build passes.

## 5. Start Postgres + TimescaleDB

The repo already has Docker Compose:

```bash
cd infra
docker compose up -d postgres
cd ..
```

Check it is running:

```bash
docker ps
```

You should see a Timescale/Postgres container.

Your local `DATABASE_URL` should be:

```env
DATABASE_URL=postgresql://powerlytic:powerlytic@localhost:5432/powerlytic
```

## 6. Run Database Migration and Seed

From project root:

```bash
pnpm --filter @powerlytic/db db:migrate
pnpm --filter @powerlytic/db db:seed
```

The seed creates:

- `Powerlytic Platform` workspace
- `admin@powerlytic.com` user
- `SUPER_ADMIN` membership
- base port types: `DI`, `AI`, `MI`, `DO`
- demo model: `Edge Monitor 100`
- demo device: `Boiler Room Monitor`

Now switch `.env`:

```env
POWERLYTIC_DATA_MODE=prisma
```

Run API:

```bash
pnpm --filter @powerlytic/api start
```

Test:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/devices
```

## 7. Start Keycloak

Start Keycloak from Docker Compose:

```bash
cd infra
docker compose up -d keycloak
cd ..
```

Open:

```text
http://localhost:8080
```

Admin login:

```text
username: admin
password: admin
```

The repo imports a realm from:

```text
infra/docker/keycloak-realm.json
```

Expected realm:

```text
powerlytic
```

Expected clients:

```text
powerlytic-web
powerlytic-api
```

Expected roles:

```text
SUPER_ADMIN
ENGINEERING_ADMIN
MANUFACTURER
WORKSPACE_ADMIN
OPERATOR
VIEWER
```

## 8. Create Your First Keycloak User

In Keycloak:

1. Select realm `powerlytic`.
2. Go to `Users`.
3. Click `Create new user`.
4. Set email:

```text
admin@powerlytic.com
```

5. Turn `Email verified` on for local testing.
6. Save.
7. Go to `Credentials`.
8. Set a password.
9. Turn `Temporary` off.
10. Go to `Role mapping`.
11. Assign `SUPER_ADMIN`.

Important: this email must match the seeded database user:

```text
admin@powerlytic.com
```

For real production, also set the Keycloak user subject into `User.externalSub` or add a small first-login linking flow.

## 9. Enable Auth

After Keycloak works, update `.env`:

```env
AUTH_REQUIRED=true
OIDC_ISSUER_URL=http://localhost:8080/realms/powerlytic
OIDC_AUDIENCE=powerlytic-api
```

Important: the backend now validates JWTs and then checks the user against Postgres memberships.

Every human API request must include:

```http
Authorization: Bearer <keycloak-access-token>
X-Workspace-Id: ws-platform
```

Tenant isolation works like this:

- `SUPER_ADMIN`, `ENGINEERING_ADMIN`, and `MANUFACTURER` are platform-level roles.
- `WORKSPACE_ADMIN`, `OPERATOR`, and `VIEWER` are organization/workspace roles.
- Workspace users can only access workspaces in their active memberships.
- Passing another org's `X-Workspace-Id` will fail.

## 10. OTP / Email / Phone Validation

You asked if OTP is needed.

Recommended:

| Use case | Recommendation |
| --- | --- |
| Login MFA | Use Keycloak MFA/OTP, not custom app code |
| Email verification | Use Keycloak email verification |
| Phone verification | Optional; add only if phone is used for alerts, SMS login, or compliance |
| New organization admin invite | Use email invite token first; OTP/MFA can be required in Keycloak |
| Device auth | Do not use OTP; use device credentials/API keys |

So yes, OTP/MFA is useful for admins, but it should be configured in Keycloak. The app should not build its own password/OTP system unless you have a very specific reason.

For local development you can skip OTP. For production, enable Keycloak MFA for:

- `SUPER_ADMIN`
- `ENGINEERING_ADMIN`
- `WORKSPACE_ADMIN`

## 11. Device Credentials

Devices should not use human Keycloak tokens.

Create a device credential:

```bash
curl -X POST http://localhost:4000/api/devices/dev-demo-1/credentials \
  -H "Authorization: Bearer <admin-token>" \
  -H "X-Workspace-Id: ws-platform" \
  -H "Content-Type: application/json" \
  -d '{"label":"factory-device-key"}'
```

The response contains a one-time secret:

```json
{
  "secret": "pld_xxxxx"
}
```

Store that secret in your device provisioning system. The database stores only a hash.

Device telemetry request:

```bash
curl -X POST http://localhost:4000/api/values/devices/dev-demo-1 \
  -H "Authorization: Device <device-secret>" \
  -H "Content-Type: application/json" \
  -d '{"values":{"DI_1":1,"AI_1":42.5}}'
```

The backend checks:

- credential is active
- credential belongs to the same exact device
- device belongs to the workspace
- telemetry is stored under the correct workspace

## 12. Redis and Worker

Redis is used for background jobs.

Start Redis:

```bash
cd infra
docker compose up -d redis
cd ..
```

Enable queues:

```env
QUEUE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

Start worker:

```bash
pnpm --filter @powerlytic/worker start
```

Current worker jobs:

| Queue | Job |
| --- | --- |
| `config-deployments` | sends config to bridge/MQTT and marks deployment sent |
| `alert-evaluation` | evaluates latest telemetry against alert rules |
| `actuation-delivery` | sends output/control commands |

You can keep `QUEUE_ENABLED=false` at first if you want direct bridge delivery from the API.

## 13. Your EMQX HTTPS Wrapper

You said you already have an EMQX custom wrapper that exposes an HTTPS endpoint. That is supported now.

Use this when you deploy config:

```text
Powerlytic API -> your HTTPS wrapper -> EMQX/MQTT topic -> device subscriber
```

Set:

```env
CONFIG_BRIDGE_DIRECT=true
CONFIG_BRIDGE_URL=https://your-wrapper-domain.example.com/your/config/endpoint
CONFIG_BRIDGE_TOKEN=your-wrapper-token-if-needed
MQTT_ENABLED=false
QUEUE_ENABLED=false
```

The API sends this payload to your wrapper:

```json
{
  "deviceId": "dev-demo-1",
  "payload": {
    "message": "config",
    "hash": "config-hash",
    "configId": "cfg-demo-1",
    "config": {
      "device_id": "dev-demo-1",
      "configId": "cfg-demo-1",
      "imei": "867530900001",
      "modbusSlaves": []
    }
  }
}
```

If your wrapper expects a different JSON shape, change `sendConfigToHttpsBridge()` in:

```text
apps/api/src/production/production-state.service.ts
```

Search:

```text
sendConfigToHttpsBridge
```

## 14. Direct MQTT Alternative

If later you want Powerlytic to publish MQTT directly, set:

```env
MQTT_ENABLED=true
MQTT_URL=mqtts://your-emqx-broker:8883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
MQTT_CLIENT_ID=powerlytic-api
```

Then API/worker publishes to:

```text
powerlytic/devices/{deviceId}/config
powerlytic/devices/{deviceId}/commands
```

For now, because you already have an HTTPS wrapper, keep direct MQTT disabled.

## 15. Recommended Local Startup Order

Terminal 1:

```bash
cd infra
docker compose up -d postgres keycloak redis
```

Terminal 2:

```bash
pnpm --filter @powerlytic/api start
```

Terminal 3:

```bash
pnpm --filter @powerlytic/web start
```

Terminal 4, only if queues are enabled:

```bash
pnpm --filter @powerlytic/worker start
```

Open:

```text
http://localhost:3000
```

## 16. Security Checklist Before Real Use

- [ ] `POWERLYTIC_DATA_MODE=prisma`
- [ ] `AUTH_REQUIRED=true`
- [ ] Keycloak users exist and emails match database users
- [ ] Every customer user has a `Membership` row
- [ ] Every request sends `X-Workspace-Id`
- [ ] `DEVICE_API_KEY_PEPPER` is a real secret
- [ ] Device credentials are created and stored securely
- [ ] `CONFIG_BRIDGE_TOKEN` is set if your wrapper requires auth
- [ ] `WEB_ORIGIN` is set to your real frontend domain
- [ ] Demo mode is disabled in production

## 17. What Is Still Not Fully Finished

These are intentionally left as integration tasks because they require your real providers:

- Web login is still a UI shell; it needs a real Keycloak/OIDC frontend session library.
- Keycloak email sending must be configured with your SMTP provider.
- Phone OTP/SMS is not configured; use Keycloak or an SMS provider if needed.
- Config bridge payload may need small shape changes to match your EMQX wrapper.
- Frontend forms mostly render but not every modal posts real mutations yet.
- Production deployment needs secrets from your hosting environment.

