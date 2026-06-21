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
pnpm db:push
pnpm db:seed
```

The root `db:push`, `db:migrate`, and `db:seed` scripts default to `postgresql://powerlytic:powerlytic@localhost:5432/powerlytic` when `DATABASE_URL` is not exported. If you use a different database URL, export it first or put it in `.env` and source it in your shell.

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

## 3.1 What You Can Skip in Codespaces

You do **not** need every production service just to see the app running. Use the smallest path for what you are testing:

| Goal                                 | Run these steps                                                            | You can skip for now                           | Required `.env` mode                                 |
| ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Check the UI and API shape quickly   | `corepack enable`, `pnpm install`, `cp .env.example .env`, run API and web | Postgres, seed, Keycloak, Redis, MQTT          | `POWERLYTIC_DATA_MODE=demo`, `AUTH_REQUIRED=false`   |
| Test real database reads/writes      | Start `postgres`, run `db push`, run seed, run API and web                 | Keycloak, Redis, MQTT                          | `POWERLYTIC_DATA_MODE=prisma`, `AUTH_REQUIRED=false` |
| Test backend JWT validation          | Real database setup plus Keycloak                                          | Redis, MQTT                                    | `POWERLYTIC_DATA_MODE=prisma`, `AUTH_REQUIRED=true`  |
| Test background jobs/config delivery | Real database setup plus Redis/worker and/or MQTT/bridge                   | Keycloak if auth is not the thing being tested | Depends on test                                      |

For most Codespaces work, start with the first or second row. Keycloak is not required until you intentionally want to test authenticated requests. Redis, worker, MQTT, and the EMQX wrapper are optional until you test background delivery flows.

Minimal Codespaces demo-mode commands:

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm --filter @powerlytic/api dev
```

Then open a second terminal:

```bash
pnpm --filter @powerlytic/web dev
```

If you want real database mode, add only Postgres and database initialization before starting API/web:

```bash
docker compose -f infra/compose.yaml up -d postgres
pnpm db:generate
pnpm db:push
pnpm db:seed
```

Then set:

```env
POWERLYTIC_DATA_MODE=prisma
AUTH_REQUIRED=false
```

## 4. Local Machine Quick Start

From the project root:

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose -f infra/compose.yaml up -d postgres redis mosquitto keycloak
pnpm db:generate
pnpm db:push
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
pnpm db:push
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
pnpm db:migrate -- --name init
```

Commit the generated `packages/db/prisma/migrations/**` files before using production migration deployment.

## 7. Keycloak Local Auth

### What Keycloak does here

Keycloak is the local OIDC identity provider. It owns human login, passwords, roles, and JWT signing. The Powerlytic API does not check the Keycloak password directly. Instead, the API validates an access token signed by Keycloak, reads roles from the token, and then checks that the same user exists in the Powerlytic database with an active membership.

Important current limitation: the web login screen is still OIDC-ready UI, not a complete browser login flow. For now, keep `AUTH_REQUIRED=false` for normal Codespaces UI development. Enable `AUTH_REQUIRED=true` when you are testing API authentication with a bearer token from Keycloak or after the frontend OIDC Authorization Code + PKCE flow is implemented.

### Start Keycloak

Start Keycloak from the repo root:

```bash
docker compose -f infra/compose.yaml up -d keycloak
```

In Codespaces, open the forwarded port for `8080`. On a local machine, open `http://localhost:8080`.

Admin login:

```text
username: admin
password: admin
```

The Compose service imports the realm from `infra/docker/keycloak-realm.json` when the Keycloak container starts for the first time. Expected realm: `powerlytic`. Expected clients: `powerlytic-web` and `powerlytic-api`.

If the realm is missing, remove and recreate the Keycloak container/volume for local development, then start it again. Do this only for disposable local data.

### Create the matching local user

The seed creates a Powerlytic database user with this email:

```text
admin@powerlytic.com
```

Create the same user in Keycloak:

1. In Keycloak, switch from the `master` realm to the `powerlytic` realm.
2. Go to **Users**.
3. Click **Create new user**.
4. Set **Email** to `admin@powerlytic.com`.
5. Turn **Email verified** on for local testing.
6. Save the user.
7. Open the **Credentials** tab.
8. Set a password and turn **Temporary** off.
9. Open **Role mapping**.
10. Assign `SUPER_ADMIN` for local admin testing.

The email must match because the API currently links a Keycloak token to a Powerlytic user by `externalSub` or by email.

### Enable API auth only when you are ready

After Keycloak and the database user are ready, update `.env`:

```env
POWERLYTIC_DATA_MODE=prisma
AUTH_REQUIRED=true
OIDC_ISSUER_URL=http://localhost:8080/realms/powerlytic
OIDC_AUDIENCE=powerlytic-api
```

In Codespaces, if the API cannot reach Keycloak through `localhost:8080`, use the port-forwarded Keycloak URL for `OIDC_ISSUER_URL`. The issuer URL in the token must match the issuer URL configured in the API, so keep this value consistent while testing.

Every authenticated human API request must include both headers:

```http
Authorization: Bearer <keycloak-access-token>
X-Workspace-Id: ws-platform
```

If you only want to run the UI in Codespaces, leave this disabled:

```env
AUTH_REQUIRED=false
```

With `AUTH_REQUIRED=false`, the API injects a development admin user automatically, so you do not need Keycloak tokens for normal local UI checks.

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
pnpm db:deploy
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

Use the root `db:push` script for a disposable development database:

```bash
pnpm db:push
```

Create reviewed migrations before production deployment.

### `Environment variable not found: DATABASE_URL` during Prisma commands

Run the root scripts instead of `pnpm --filter @powerlytic/db exec ...` for local setup:

```bash
pnpm db:generate
pnpm db:push
pnpm db:seed
```

Those scripts provide the local Compose Postgres URL if `DATABASE_URL` is not already set. If you need a custom database, run:

```bash
export DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>
pnpm db:push
pnpm db:seed
```

### Build warnings about Turbo outputs

The current build may warn that type-only packages have no output files. That warning is not a failed build if the command exits with status `0`.
