# Powerlytic

Production-grade Turborepo rebuild of the Powerlytic industrial IoT monitoring and actuation platform.

## What This Rebuild Does

- Replaces local username/password JWT as the long-term human auth design with OIDC-ready backend guards and a Keycloak local stack.
- Replaces single `User.organization` ownership with `Workspace`, `Membership`, and `Invitation`.
- Adds device manufacturing, inventory, claiming, commissioning, lifecycle state, config history, and audit logs.
- Preserves legacy hardware-facing config, telemetry, and deployment callback payloads through compatibility adapters.
- Keeps human user auth and device auth separate.

## Run Locally

```bash
corepack enable
pnpm install
docker compose -f infra/compose.yaml up -d
pnpm dev
```

Default services:

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- Keycloak: http://localhost:8080

## Useful Commands

```bash
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm db:generate
pnpm db:migrate
```

## Important Docs

- [Documentation Home](docs/README.md)
- [New Developer Guide](docs/onboarding/new-developer-guide.md)
- [System Overview](docs/architecture/system-overview.md)
- [Request Flows](docs/architecture/request-flows.md)
- [Entity Relationships](docs/architecture/entity-relationship.md)
- [API Contract](docs/api/api-contract.md)
- [Operations Runbook](docs/operations/runbook.md)
- [Deployment Guide](docs/operations/deployment.md)
