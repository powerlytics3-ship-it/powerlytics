# Implementation Status

## Done in Code

- Backend has demo mode and Prisma production mode.
- Original giant backend state file is now a facade.
- Demo state is isolated in `apps/api/src/demo/demo-state.service.ts`.
- Production database logic is in `apps/api/src/production/production-state.service.ts`.
- Prisma service is wired in `apps/api/src/prisma/prisma.service.ts`.
- Postgres/Timescale schema exists in `packages/db/prisma/schema.prisma`.
- Seed creates workspace, admin user, membership, port types, model, and demo device.
- Keycloak/OIDC JWT guard exists.
- RBAC permission guard exists.
- Request context exists for per-request user/workspace state.
- Production service enforces workspace tenant isolation.
- Device API-key auth exists for telemetry/device calls.
- Redis/BullMQ queue producer exists.
- Worker consumes config deployment, alert evaluation, and actuation jobs.
- Direct EMQX HTTPS wrapper config delivery exists through `CONFIG_BRIDGE_DIRECT=true`.
- MQTT direct publishing exists but is optional and disabled by default.
- Frontend main dashboard/device list can fetch API with mock fallback.
- Main UI pages build and render without browser console errors.

## Verified

Commands run successfully:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Runtime smoke checked:

- `GET /api/health`
- `GET /api/devices`
- `GET /api/device/dev-demo-1/config`
- `POST /api/values/devices/dev-demo-1`

Browser checked:

- `/login`
- `/dashboard`
- `/devices`
- `/devices/dev-demo-1/configure`
- `/telemetry`
- `/alerts`
- `/users`
- `/audit`

## Still Needs Your Real Values

- Real `DATABASE_URL`.
- Real Keycloak users/client settings.
- Real `DEVICE_API_KEY_PEPPER`.
- Real EMQX wrapper URL/token.
- Real frontend auth token/session wiring.
- Real SMTP settings in Keycloak for email verification/invites.

## Still Needs Future Product Work

- Full frontend OIDC login integration.
- Every frontend modal form should submit mutations to the API.
- Complete admin UI for membership invites and accepting invitations.
- Optional phone verification/SMS provider integration.
- Exact bridge payload adjustment if your EMQX wrapper expects a different shape.
- Production deployment scripts and hosting-specific secrets.

## Security State

Backend production mode is now role-based and tenant-scoped:

- Workspace users can only access workspaces in their memberships.
- Device credentials can only access their exact device.
- Platform roles can access manufacturing/platform workflows.
- Device telemetry can use `Authorization: Device <secret>`.
- Human users must use `Authorization: Bearer <OIDC token>` when `AUTH_REQUIRED=true`.

Frontend auth is not fully real yet. The login page is present, but it still needs an OIDC session library or custom Keycloak browser flow before users can actually sign in through the UI.

