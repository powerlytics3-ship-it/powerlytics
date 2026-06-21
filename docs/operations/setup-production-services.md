# Powerlytic Setup Guide: Codespaces, Local Services, and Deployment

This guide is written for first-time setup from GitHub Codespaces or a local machine. Follow it in order. Do **not** enable all production flags at once; turn on each dependency after the previous one works.

## 1. What Runs Where

| Part                   | Local/Codespaces                                | Production recommendation                                                               |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Web app (`apps/web`)   | Next.js dev server on port `3000`               | Vercel project connected to this repo                                                   |
| API (`apps/api`)       | NestJS dev server on port `4000`                | GCP Cloud Run or GKE service                                                            |
| Postgres + TimescaleDB | Docker Compose container                        | Managed database if possible; otherwise a stateful VM/GKE workload with persistent disk |
| Redis                  | Docker Compose container                        | Memorystore for Redis or a managed Redis provider                                       |
| Keycloak               | Docker Compose container for local auth testing | Managed identity provider or a separately hosted Keycloak service                       |
| MQTT broker            | Docker Compose Mosquitto for local testing      | EMQX Cloud, a managed broker, or your existing HTTPS-to-MQTT wrapper                    |

The Docker Compose stack in this repo is for dependencies, not the main app. In Codespaces you run Postgres/Redis/Keycloak/Mosquitto in containers, and run the web/API from the workspace with `pnpm`.

## 2. Current Backend Data Modes

Powerlytic currently has two backend data modes:

```env
POWERLYTIC_DATA_MODE=demo
```

Uses in-memory demo data. Good for checking screens quickly and does not require the database.

```env
POWERLYTIC_DATA_MODE=prisma
```

Uses Postgres/Timescale through Prisma. This is the real-data mode.

Recommended order:

1. Build the repo.
2. Run demo mode.
3. Start Postgres.
4. Initialize the Prisma schema and seed data.
5. Switch to `POWERLYTIC_DATA_MODE=prisma`.
6. Start Keycloak.
7. Enable `AUTH_REQUIRED=true`.
8. Add Redis/worker.
9. Add EMQX wrapper or direct MQTT config delivery.

## 3. Codespaces Quick Start

From the project root:

```bash
corepack enable
pnpm install
cp .env.example .env
```

Start the dependency containers from the repo root:

```bash
docker compose -f infra/compose.yaml up -d postgres redis mosquitto keycloak
```

Wait until Postgres is ready:

```bash
docker compose -f infra/compose.yaml ps
```

Generate Prisma Client and initialize the database schema:

```bash
pnpm db:generate
pnpm --filter @powerlytic/db exec prisma db push --schema prisma/schema.prisma
pnpm db:seed
```

For real-data mode, edit `.env`:

```env
POWERLYTIC_DATA_MODE=prisma
DATABASE_URL=postgresql://powerlytic:powerlytic@localhost:5432/powerlytic
```

Run the API and web in separate terminals:

```bash
pnpm --filter @powerlytic/api dev
```

```bash
pnpm --filter @powerlytic/web dev
```

In Codespaces, open the forwarded port for the web app (`3000`). If the browser cannot reach the API on `localhost:4000`, copy the forwarded API URL for port `4000` and set both of these in `.env` before restarting the web app:

```env
PUBLIC_API_BASE_URL=https://<your-4000-forwarded-url>/api
NEXT_PUBLIC_API_BASE_URL=https://<your-4000-forwarded-url>/api
```

Keep `AUTH_REQUIRED=false` until Keycloak login is fully configured.

## 4. Local Machine Quick Start

From the project root:

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose -f infra/compose.yaml up -d postgres redis mosquitto keycloak
pnpm db:generate
pnpm --filter @powerlytic/db exec prisma db push --schema prisma/schema.prisma
pnpm db:seed
pnpm dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Keycloak: `http://localhost:8080`

## 5. Environment Variables

Start with `.env.example`. The most important local values are:

```env
NODE_ENV=development
API_PORT=4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
PUBLIC_API_BASE_URL=http://localhost:4000/api
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://powerlytic:powerlytic@localhost:5432/powerlytic
POWERLYTIC_DATA_MODE=demo
AUTH_REQUIRED=false
REDIS_URL=redis://localhost:6379
QUEUE_ENABLED=false
MQTT_ENABLED=false
MQTT_URL=mqtt://localhost:1883
DEVICE_API_KEY_PEPPER=replace-this-with-a-long-random-secret
```

Important URL rule:

- Use `localhost` when the API/worker runs from your machine or Codespaces VM and connects to Compose-published ports.
- Use Compose service names such as `postgres`, `redis`, `mosquitto`, and `keycloak` only when the API itself is also running inside the same Compose network.
- Use public managed-service URLs in production.

## 6. Database Initialization

This repository currently has a Prisma schema and seed file. It does not yet include committed migration files, so use `prisma db push` for first-time development databases:

```bash
pnpm --filter @powerlytic/db exec prisma db push --schema prisma/schema.prisma
pnpm db:seed
```

The seed creates:

- `Powerlytic Platform` workspace
- `admin@powerlytic.com` user
- `SUPER_ADMIN` membership
- base port types: `DI`, `AI`, `MI`, `DO`
- demo model: `Edge Monitor 100`
- demo device: `Boiler Room Monitor`

For production, create and review Prisma migrations before deploying schema changes:

```bash
pnpm --filter @powerlytic/db exec prisma migrate dev --schema prisma/schema.prisma --name init
```

Commit the generated `packages/db/prisma/migrations/**` files before using production migration deployment.

## 7. Keycloak Local Auth

Start Keycloak:

```bash
docker compose -f infra/compose.yaml up -d keycloak
```

Open `http://localhost:8080`.

Admin login:

```text
username: admin
password: admin
```

The repo imports the realm from `infra/docker/keycloak-realm.json`.

Expected realm: `powerlytic`

Expected clients:

- `powerlytic-web`
- `powerlytic-api`

Expected roles:

- `SUPER_ADMIN`
- `ENGINEERING_ADMIN`
- `MANUFACTURER`
- `WORKSPACE_ADMIN`
- `OPERATOR`
- `VIEWER`

Create a local test user with email `admin@powerlytic.com`, mark email verified, set a non-temporary password, and assign `SUPER_ADMIN`. This email must match the seeded database user.

After Keycloak works, update `.env`:

```env
AUTH_REQUIRED=true
OIDC_ISSUER_URL=http://localhost:8080/realms/powerlytic
OIDC_AUDIENCE=powerlytic-api
```

Every authenticated human API request must include:

```http
Authorization: Bearer <keycloak-access-token>
X-Workspace-Id: ws-platform
```

## 8. Redis, Worker, and Queues

For first run, keep queues disabled:

```env
QUEUE_ENABLED=false
```

When Redis is running and you want background jobs:

```env
REDIS_URL=redis://localhost:6379
QUEUE_ENABLED=true
```

Start the worker separately:

```bash
pnpm --filter @powerlytic/worker dev
```

In production, deploy the worker as a separate Cloud Run service or GKE workload that uses the same database, Redis, MQTT, and config bridge environment variables as the API.

## 9. MQTT and EMQX Wrapper

Local Mosquitto is only for development:

```env
MQTT_ENABLED=true
MQTT_URL=mqtt://localhost:1883
```

If your devices use an HTTPS wrapper that publishes to EMQX/MQTT, keep direct MQTT disabled and configure the bridge instead:

```env
MQTT_ENABLED=false
CONFIG_BRIDGE_URL=https://<your-wrapper-host>/c2d/commands
CONFIG_BRIDGE_TOKEN=<secret-token>
CONFIG_BRIDGE_DIRECT=true
```

In production, Vercel should never connect directly to MQTT, Redis, or Postgres. Browser traffic goes to the backend API; the API/worker talks to Postgres, Redis, Keycloak/OIDC, and MQTT/bridge.

## 10. Deploying Web to Vercel and Backend to GCP

### Vercel frontend

Create a Vercel project with:

- Root directory: `apps/web`
- Install command: `corepack enable && pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @powerlytic/web build`
- Output: Next.js default

Set Vercel environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://<your-api-domain>/api
PUBLIC_API_BASE_URL=https://<your-api-domain>/api
```

Use your Cloud Run custom domain or load balancer URL for `<your-api-domain>`.

### GCP backend

Deploy the API to Cloud Run or GKE. Cloud Run is the simplest starting point.

Backend environment variables should use production services:

```env
NODE_ENV=production
API_PORT=8080
WEB_ORIGIN=https://<your-vercel-domain>
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
POWERLYTIC_DATA_MODE=prisma
AUTH_REQUIRED=true
OIDC_ISSUER_URL=https://<your-issuer>/realms/powerlytic
OIDC_AUDIENCE=powerlytic-api
REDIS_URL=redis://<redis-host>:6379
QUEUE_ENABLED=true
MQTT_ENABLED=false
CONFIG_BRIDGE_URL=https://<your-wrapper-host>/c2d/commands
CONFIG_BRIDGE_TOKEN=<secret-token>
CONFIG_BRIDGE_DIRECT=true
DEVICE_API_KEY_PEPPER=<secret-manager-value>
```

Do not use the Compose Postgres volume for production. A containerized local Postgres volume is disposable developer infrastructure; production data belongs in Cloud SQL-compatible Postgres with Timescale support, Timescale Cloud, AlloyDB/Postgres if Timescale features are not required, or a carefully managed stateful deployment.

### Production migration flow

Use one release job or manual step before rolling out a new API version:

```bash
pnpm --filter @powerlytic/db db:deploy
```

This requires committed migration files. Until migrations are committed, do not rely on production automatic migration deployment.

## 11. Troubleshooting Common Build/Run Errors

### `cp .env.example .env` fails

Pull the latest code. The root `.env.example` file should exist. If it does not, create it from this guide.

### API cannot connect to Postgres

Check the Compose services:

```bash
docker compose -f infra/compose.yaml ps
```

If API runs from the host or Codespaces VM, `DATABASE_URL` should use `localhost:5432`, not `postgres:5432`.

### Browser cannot reach API from Codespaces

Use the forwarded public URL for port `4000` in `NEXT_PUBLIC_API_BASE_URL` and restart `apps/web`.

### `pnpm db:migrate` asks questions or fails on a fresh setup

Use `prisma db push` for a disposable development database:

```bash
pnpm --filter @powerlytic/db exec prisma db push --schema prisma/schema.prisma
```

Create reviewed migrations before production deployment.

### Build warnings about Turbo outputs

The current build may warn that type-only packages have no output files. That warning is not a failed build if the command exits with status `0`.
