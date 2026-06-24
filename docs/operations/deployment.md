# Deployment Guide

This guide describes how to deploy Powerlytics in a production-like environment.

## 1. Deployable units

- API (`apps/api`)
- Web (`apps/web`)
- Worker (`apps/worker`)
- PostgreSQL (managed recommended)
- Redis (managed recommended)
- MQTT broker (managed/self-hosted)

## 2. Build and migrate

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @powerlytic/db db:deploy
```

`db:deploy` applies Prisma migrations non-interactively.

## 3. Required production environment

Minimum required secrets/config:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `AUTH_TOKEN_SECRET`
- `DEVICE_API_KEY_PEPPER`
- `REDIS_URL` (if queues enabled)

Feature toggles:

- `AUTH_REQUIRED=true`
- `POWERLYTIC_DATA_MODE=prisma`
- `QUEUE_ENABLED=true` (if worker + Redis deployed)
- `MQTT_ENABLED=true` (if broker integrated)

## 4. Recommended startup order

1. Database and Redis
2. Run migrations
3. API
4. Worker
5. Web

## 5. Production health checks

- API liveness: `GET /api/health`
- API readiness: `GET /api/health/ready`
- Web route: `GET /login`
- Queue path: create config deploy and confirm worker updates deployment status

## 6. Logging and observability

At minimum collect logs from:

- API process logs
- Worker process logs
- Redis metrics
- Database metrics
- MQTT broker logs

Key operational tables to inspect:

- `ConfigDeployment`
- `AlertIncident`
- `ActuationCommand`
- `AuditLog`
- `TelemetryValue`

## 7. Security checklist

- Enforce TLS at ingress
- Rotate `NEXTAUTH_SECRET`, `AUTH_TOKEN_SECRET`, `DEVICE_API_KEY_PEPPER`
- Use managed secrets store (not plain env files in source)
- Restrict DB/Redis/MQTT network access
- Keep `AUTH_REQUIRED=true` in production
