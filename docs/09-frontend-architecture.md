# 09 — Frontend Architecture

## 1. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router), React | Same as today — it's working well; v2 keeps it. |
| Server state | TanStack Query | Same as today. One hook module per resource, generated request functions from `packages/api-client` (the OpenAPI-derived typed client) instead of hand-written `axios` calls per hook. |
| Client/UI state | Zustand | Declared today but unused; v2 actually uses it for the few genuinely global UI concerns: active workspace selector, sidebar collapse state, in-progress multi-step forms (device claim wizard, device-model builder). Server state stays in TanStack Query — Zustand is never used as a second cache for server data. |
| Forms | React Hook Form + Zod | Adds Zod (not present today) as the validation layer, with schemas shared from `packages/api-client`'s generated Zod schemas where the backend DTO and the form shape match 1:1 (e.g., the alert-rule form), and bespoke schemas for multi-step/derived forms (e.g., the device-model port builder). |
| Styling | Tailwind CSS + shadcn/ui | Replaces daisyUI. shadcn/ui's "copy the component into your repo" model gives full control over markup/behavior for the data-dense table/drawer/form patterns this product leans on heavily, without taking on a separate theming framework's opinions on top of Tailwind's. |
| Icons | lucide-react | Unchanged. |
| Auth client | Better Auth React client | Replaces the hand-rolled `AuthContext` + `localStorage` token handling. |
| Tables | TanStack Table | Unchanged — the existing `GenericTable` wrapper pattern is kept, just retyped against generated API types. |

## 2. Two Apps, Shared Packages

Per the decision in `04-future-architecture-overview.md` §5:

```
apps/
├── web/      # customer-facing — B2B workspace members + B2C personal users
└── admin/    # SuperAdmin + Manufacturer console

packages/
├── ui/               # shared shadcn/ui-based component library (Button, Card, Inputs/*, GenericTable, layout primitives)
├── permissions/       # the RBAC matrix + can()/policy functions (07-authorization-rbac-design.md)
├── api-client/        # generated from /v1/openapi.json — typed fetch functions + Zod schemas + TanStack Query hooks
└── config/            # shared eslint/tsconfig/tailwind config
```

Both apps import `packages/ui`, `packages/permissions`, and `packages/api-client`. Neither app imports the other.

## 3. `apps/web` — Customer Dashboard

### 3.1 Folder Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   └── accept-invitation/[token]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # workspace switcher + sidebar, gated by Authenticator
│   │   ├── page.tsx                         # overview: device count, recent alerts, recent deployments
│   │   ├── devices/
│   │   │   ├── page.tsx                     # list
│   │   │   ├── claim/page.tsx               # NEW — claim-code entry flow
│   │   │   └── [deviceId]/
│   │   │       ├── page.tsx                 # detail/overview
│   │   │       ├── configure/page.tsx        # port/Modbus editor (today's edit-device form, ported)
│   │   │       ├── telemetry/page.tsx        # snapshot/table/chart (today's values pages, ported)
│   │   │       ├── deployments/page.tsx      # NEW — deployment history (today only shows current status)
│   │   │       └── actuations/page.tsx       # NEW
│   │   ├── alerts/
│   │   │   ├── page.tsx                     # NEW — incidents list
│   │   │   └── rules/page.tsx                # NEW — rule management
│   │   ├── members/page.tsx                  # NEW UI for the registration flows that today are Postman-only
│   │   ├── audit-log/page.tsx                # NEW
│   │   └── settings/page.tsx                 # workspace profile
│   └── layout.tsx
├── components/                                # app-specific composites built from packages/ui primitives
├── lib/
│   ├── auth-client.ts                         # Better Auth React client instance
│   ├── workspace-context.tsx                  # active workspace provider (replaces AuthContext's org-on-user-object assumption)
│   └── rbac/                                   # thin re-export of packages/permissions, plus PermissionGuard component
└── ...
```

### 3.2 What Changes Relative to Today's UI, and Why

| Today | v2 | Why |
|---|---|---|
| Users page is list-only; create/edit/delete only exist as untested API endpoints | Full Members page: invite, change role, remove, with the invitation-email flow surfaced in-product | The backend flows existed but had no UI — this was pure UI debt, not a backend gap. |
| No claim/transfer UI | Claim-code entry wizard; transfer request/approve flow | New backend capability needs a front door. |
| Device deployment shows only "current status" | Deployment history page (table of every `ConfigDeployment` row) | Matches the new `ConfigDeployment` history table — no more "what was deployed last week" black hole. |
| No alerts UI at all | Incidents + Rules pages | New backend capability needs a front door. |
| No audit log UI | Audit log page, filterable | New backend capability needs a front door. |
| Single flat nav, all roles | Same nav component, but item visibility now driven by the shared `packages/permissions` matrix instead of a bespoke per-page `Resources.*` check | Removes the risk of the nav and the actual route guard drifting apart — they now read the exact same data. |
| `AuthContext` assumes one `organization` on the user object | `WorkspaceContext` holds the **active** workspace (selectable, since a user can belong to several) plus the membership role for that workspace; every data hook takes the active workspace id implicitly | Direct consequence of the `Workspace`/`WorkspaceMembership` redesign in `05-database-design.md`. |

### 3.3 Workspace Switching

```tsx
// lib/workspace-context.tsx
const WorkspaceContext = createContext<{
  workspaces: WorkspaceSummary[];
  active: WorkspaceSummary;
  setActive: (id: string) => void;
} | null>(null);

// Persisted in a cookie (not localStorage — avoids the XSS-exposure pattern flagged in the
// existing-system analysis for anything auth-adjacent) so the server-rendered shell can read
// the active workspace on first paint without a client-side flash.
```

A B2C user simply has exactly one workspace in this list and never sees a switcher UI element (it's conditionally rendered only when `workspaces.length > 1`) — this is the concrete mechanism by which "B2B and B2C share a UI without hacks" plays out on the frontend: there's no `if (isB2C)` branch anywhere, just a list that happens to have one item.

## 4. `apps/admin` — Internal Console

```
apps/admin/
├── app/
│   ├── (auth)/sign-in/page.tsx              # separate sign-in, separate session audience
│   ├── (console)/
│   │   ├── layout.tsx                        # PlatformGuard — requires platformRole, no workspace switcher concept
│   │   ├── workspaces/
│   │   │   ├── page.tsx                       # all workspaces, search/filter
│   │   │   └── [workspaceId]/page.tsx          # full detail + impersonate action
│   │   ├── device-models/                     # the model builder/publisher (today's create-device-model form, ported + publish workflow added)
│   │   ├── port-types/
│   │   ├── inventory/page.tsx                  # unclaimed devices, manufacture-new-device form, claim code generation
│   │   └── audit-log/page.tsx                  # platform-wide
└── ...
```

`apps/admin` is deployed to its own subdomain/Vercel project, has its own (stricter) CSP, and — unlike `apps/web` — is a reasonable place to consider IP allow-listing or requiring a hardware security key (Better Auth supports passkeys) for `SUPER_ADMIN` sign-in, since its blast radius is the entire platform.

## 5. Component Patterns Carried Forward (Because They Were Good)

- The `GenericTable` wrapper around TanStack Table.
- React Hook Form + `useFieldArray` for the nested Modbus slave/read configuration UI — this was the most complex, and best-executed, form in the current app; it is ported with minimal change, just re-typed against the generated API client and Zod schemas instead of hand-written interfaces.
- The role/resource/action/policy shape for permission checks — extended into `packages/permissions`, not replaced.

## 6. Data Fetching Pattern

```ts
// packages/api-client generates this from the OpenAPI spec:
export function useDeviceQuery(deviceId: string) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => apiClient.devices.getDevice({ deviceId }),
  });
}

// Pages just consume it:
const { data: device, isLoading } = useDeviceQuery(deviceId);
```

No hook file hand-writes an `axios.get(...)` call against a string URL, as happens throughout the current `_react-query-hooks/` folder — the request function, its types, and its Zod-validated response shape are all generated, so a backend contract change becomes a type error in the frontend at build time instead of a silent runtime mismatch.
