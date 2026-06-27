# 21 — Project Folder Structure (Full Monorepo)

```
powerlytic/
├── apps/
│   ├── api/                              # NestJS (Fastify adapter) — see 10-backend-architecture.md for full detail
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── auth/
│   │   │   ├── workspaces/
│   │   │   ├── members/
│   │   │   ├── port-types/
│   │   │   ├── device-models/
│   │   │   ├── devices/
│   │   │   ├── config-deployment/
│   │   │   ├── telemetry/
│   │   │   ├── actuation/
│   │   │   ├── alerts/
│   │   │   ├── audit/
│   │   │   ├── admin/
│   │   │   ├── common/
│   │   │   └── jobs/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── test/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── web/                              # Next.js — customer dashboard — see 09-frontend-architecture.md
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   └── (dashboard)/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── admin/                            # Next.js — internal console — see 09-frontend-architecture.md
│       ├── app/
│       │   ├── (auth)/
│       │   └── (console)/
│       ├── components/
│       ├── lib/
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── ui/                               # shared shadcn/ui-based component library
│   │   └── src/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── inputs/
│   │       ├── generic-table.tsx
│   │       └── layout/
│   │
│   ├── permissions/                      # the RBAC matrix — single source of truth, see 07
│   │   └── src/
│   │       ├── roles.ts
│   │       ├── resources.ts
│   │       ├── matrix.ts
│   │       ├── can.ts
│   │       └── policies/
│   │
│   ├── api-client/                       # generated from apps/api's OpenAPI spec — never hand-edited
│   │   └── src/
│   │       ├── generated/                # output of the generation script — gitignored or committed depending on team preference; recommend committing for reproducible builds, regenerated in CI to catch drift
│   │       └── index.ts
│   │
│   └── config/                           # shared eslint-config, tsconfig base, tailwind preset
│       ├── eslint-preset.js
│       ├── tsconfig.base.json
│       └── tailwind-preset.js
│
├── docs/                                  # this document set, plus any future ADRs
│   └── adr/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-production.yml
│       └── cleanup-preview.yml
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## Notes on a Few Specific Choices

- **`packages/api-client/src/generated/` is committed, not gitignored.** This means anyone cloning the repo can build the frontend apps without first running the backend — a meaningful onboarding win, and exactly the kind of thing that lets "any AI coding agent or senior developer build the entire application without referring to the old codebase" actually hold up in practice, since the contract is inspectable as plain checked-in TypeScript rather than something that only exists after a successful backend build.
- **No `apps/telemetry-ingest` exists yet** — per `15-scaling-strategy.md`, this is the pre-planned extraction target for `apps/api/src/telemetry/`, created only when the triggers in that document's monitoring table actually fire. Speculatively creating it now would be exactly the kind of premature complexity the architecture is designed to avoid.
- **`prisma/migrations/` is the only place raw SQL appears** (for the partitioning DDL and the immutability trigger from `05-database-design.md` §10) — everywhere else, Prisma's schema/query builder is the only way the database is touched.
