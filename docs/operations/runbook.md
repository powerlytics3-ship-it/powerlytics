# Runbook

This runbook is the fastest path to run and verify the whole stack locally.

## 1. Prerequisites

- Node.js 20+
- pnpm (via `corepack enable`)
- Docker

## 2. Start local infrastructure

```bash
docker compose -f infra/compose.yaml up -d
```

Services started:

- PostgreSQL/Timescale: `localhost:5432`
- Redis: `localhost:6379`
- Mosquitto MQTT: `localhost:1883` (WS `9001`)

## 3. Prepare environment

Create local env:

```bash
cp .env.example .env
```

Recommended initial `.env`:

```env
NODE_ENV=development
API_PORT=4000
WEB_PORT=3000
WEB_ORIGIN=http://localhost:3000

PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

DATABASE_URL=postgresql://powerlytic:powerlytic@localhost:5432/powerlytic
POWERLYTIC_DATA_MODE=prisma

AUTH_REQUIRED=true
NEXTAUTH_SECRET=replace-with-long-random-secret
AUTH_TOKEN_SECRET=replace-with-long-random-secret
NEXTAUTH_URL=http://localhost:3000

DEVICE_API_KEY_PEPPER=replace-with-kms-secret

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
```

### Environment variable reference

| Variable | Used by | Purpose |
| --- | --- | --- |
| `API_PORT` | API | Nest listen port |
| `WEB_ORIGIN` | API | CORS allowed web origin |
| `PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` | Web | API base URL |
| `DATABASE_URL` | API/Web/Prisma | PostgreSQL connection |
| `POWERLYTIC_DATA_MODE` | API | `demo` or `prisma` storage mode |
| `AUTH_REQUIRED` | API | Enforce auth guard (`true`/`false`) |
| `NEXTAUTH_SECRET` | Web/API | NextAuth/JWT shared fallback secret |
| `AUTH_TOKEN_SECRET` | Web/API | API bearer token signing/verification secret |
| `DEVICE_API_KEY_PEPPER` | API | Hash pepper for device credentials |
| `REDIS_URL` | API/Worker | BullMQ backend |
| `QUEUE_ENABLED` | API | Enable enqueueing jobs |
| `MQTT_ENABLED` | API/Worker | Enable MQTT publish |
| `MQTT_URL` | API/Worker | MQTT broker URL |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | API/Worker | Broker auth |
| `MQTT_CLIENT_ID` | API/Worker | Broker client identity |
| `CONFIG_BRIDGE_URL` | API/Worker | Optional HTTP bridge endpoint |
| `CONFIG_BRIDGE_TOKEN` | API/Worker | Optional bridge bearer token |
| `CONFIG_BRIDGE_DIRECT` | API | Push deploy payload directly from API |

## 4. Install and initialize database

```bash
corepack enable
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Seed creates:

- Workspace `ws-platform`
- Admin user `admin@powerlytic.com`
- SUPER_ADMIN membership
- Base port types (DI, AI, MI, DO)
- Model `EDGE-100` and demo device `dev-demo-1`

Admin seed uses a bcrypt hash from `packages/db/prisma/seed.ts`.

Set a known local admin password after seeding:

```bash
pnpm --filter @powerlytic/web exec node -e "const {PrismaClient}=require('@prisma/client'); const bcrypt=require('bcryptjs'); (async()=>{const prisma=new PrismaClient(); const hash=await bcrypt.hash('Admin1234',10); await prisma.user.update({where:{email:'admin@powerlytic.com'},data:{password:hash}}); await prisma.$disconnect(); console.log('Updated admin@powerlytic.com password to Admin1234');})().catch(async(e)=>{console.error(e); process.exit(1);});"
```

## 5. Start application processes

```bash
pnpm dev
```

This starts:

- API: `apps/api` on `http://localhost:4000/api`
- Web: `apps/web` on `http://localhost:3000`
- Worker: `apps/worker`

## 6. First verification checks

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/ready
```

Open in browser:

- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`
- `http://localhost:4000/api/docs`

Local login credentials after the password bootstrap step:

- Email: `admin@powerlytic.com`
- Password: `Admin1234`

## 7. Queue and async checks

Enable queues by setting:

```env
QUEUE_ENABLED=true
```

Then restart `pnpm dev` and test a deploy/actuation flow.

Expected queue names:

- `config-deployments`
- `alert-evaluation`
- `actuation-delivery`

## 8. Device telemetry check

Create a device credential via API, then ingest telemetry:

```bash
curl -X POST http://localhost:4000/api/devices/dev-demo-1/credentials \
	-H "Authorization: Bearer <token>" \
	-H "x-workspace-id: ws-platform" \
	-H "Content-Type: application/json" \
	-d '{"label":"factory-http-key"}'
```

```bash
curl -X POST http://localhost:4000/api/values/devices/dev-demo-1 \
	-H "Authorization: Device <secret>" \
	-H "Content-Type: application/json" \
	-d '{"values":{"DI_1":1,"AI_1":42.4}}'
```

## 9. Troubleshooting

### API returns empty/stale data

- Confirm `POWERLYTIC_DATA_MODE=prisma`
- Confirm migrations and seed completed
- Confirm `DATABASE_URL` points to local postgres

### Unauthorized/forbidden responses

- Confirm `AUTH_REQUIRED` mode
- For human calls include `Authorization: Bearer ...`
- Include `x-workspace-id` that user belongs to

### Jobs are not running

- Set `QUEUE_ENABLED=true`
- Confirm Redis is reachable on `REDIS_URL`
- Confirm worker process is running

### MQTT publish not happening

- Set `MQTT_ENABLED=true`
- Validate broker URL/credentials

