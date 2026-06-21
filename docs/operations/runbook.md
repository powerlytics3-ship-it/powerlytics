# Operations Runbook

## Local Stack

```bash
docker compose -f infra/compose.yaml up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Health Checks

- API health: `GET /api/health`
- API readiness: `GET /api/health/ready`
- Worker readiness: check queue connection and Redis ping.

## Security Baseline

- Rotate OIDC client secrets and device credential pepper before production.
- Disable dev auth and seed users in production.
- Require HTTPS at ingress.
- Store secrets in a managed secrets system.
- Enable audit log retention and immutable export.

## Deployment Failure Triage

1. Check `config_deployments` for current status and config hash.
2. Check worker logs for bridge publish errors.
3. Check bridge response from `CONFIG_BRIDGE_URL`.
4. Check device callback auth failures.
5. Compare expected config hash with callback payload.

## Telemetry Triage

1. Confirm device has active credentials.
2. Validate payload with `telemetryIngestSchema`.
3. Confirm device is assigned to a workspace.
4. Check unknown port/read warnings.
5. Check Timescale/Postgres write latency.
