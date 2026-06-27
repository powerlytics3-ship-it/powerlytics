# 07 — Authorization / RBAC Design

## 1. Design Goals (Recap From the Brief)

- Permissions must exist on routes, pages, components, APIs, and backend services — not just "hide the button."
- Zero possibility of cross-workspace data leakage.
- Concrete bar to clear: Org User cannot view other users; Org Admin manages users inside their own org only; Company-equivalent (`SuperAdmin`) manages all workspaces; Manufacturer accesses platform-wide device-catalog information only (not customer data).
- Easy to extend with new roles/permissions later.

## 2. Role Model

Two independent role axes, matching the two kinds of access in the domain:

### 2.1 Platform Roles (`User.platformRole`, orthogonal to any workspace)

| Role | Scope |
|---|---|
| `SUPER_ADMIN` | Every workspace, every device, every user, billing, audit logs, impersonation for support. |
| `MANUFACTURER` | Device Models, Port Types, unclaimed device inventory (manufacture new devices, generate claim codes). **No** access to any workspace's members, telemetry, or devices once claimed. |

Most users (every ordinary customer, B2B or B2C) have `platformRole = null`.

### 2.2 Workspace Roles (`WorkspaceMembership.role`, scoped to exactly one workspace per row)

| Role | Can do |
|---|---|
| `OWNER` | Everything `ADMIN` can, plus delete the workspace itself and transfer ownership. Exactly one per workspace. |
| `ADMIN` | Manage members (invite/remove/change role), manage devices (claim/configure/deploy/transfer out), manage alert rules, view audit log for this workspace. |
| `OPERATOR` | Manage devices (configure/deploy/actuate), manage alert rules, **cannot** manage members or transfer devices out of the workspace. |
| `VIEWER` | Read-only: view devices, telemetry, alerts. No mutation of anything. |

This satisfies the concrete bar directly: an `OPERATOR`/`VIEWER` (the "Org User" equivalent) has no `members:*` permission at all, so they cannot list or view other users in any workspace, including their own, beyond what's needed to attribute actions (e.g., "deployed by Jane" shows a name, not a full member-management view). `ADMIN`/`OWNER` (the "Org Admin" equivalent) can manage members, but every query is pre-filtered to `workspaceId = <their own>` — there is no permission level, anywhere in this system, that grants "manage members in any workspace" except the platform `SUPER_ADMIN` role.

## 3. Permission Matrix

Permissions are named `resource:action`. This is the same vocabulary shape the current frontend already uses (`Resources.*` / `Actions.*`) — extended, not replaced.

| Resource | Action | OWNER | ADMIN | OPERATOR | VIEWER | (Platform) MANUFACTURER | (Platform) SUPER_ADMIN |
|---|---|---|---|---|---|---|---|
| `workspace` | view, edit | ✅ | ✅ | — | — | — | ✅ (any) |
| `workspace` | delete | ✅ | — | — | — | — | ✅ (any) |
| `members` | view, invite, edit-role, remove | ✅ | ✅ | — | — | — | ✅ (any) |
| `devices` | view | ✅ | ✅ | ✅ | ✅ | view inventory only | ✅ (any) |
| `devices` | claim, edit-config, transfer-out | ✅ | ✅ | edit-config only | — | — | ✅ (any) |
| `devices` | manufacture, generate-claim-code | — | — | — | — | ✅ | ✅ |
| `device_models` | view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `device_models` | create, edit (draft), publish | — | — | — | — | ✅ | ✅ |
| `port_types` | view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `port_types` | create, edit | — | — | — | — | ✅ | ✅ |
| `config_deployment` | deploy, view-history | ✅ | ✅ | ✅ | view-history only | — | ✅ (any) |
| `telemetry` | view | ✅ | ✅ | ✅ | ✅ | — | ✅ (any) |
| `telemetry` | ingest | — | — | — | — | — | (device credential only — see §5) |
| `actuation` | send-command, view-history | ✅ | ✅ | ✅ | view-history only | — | ✅ (any) |
| `alert_rules` | view, create, edit, delete | ✅ | ✅ | ✅ | view only | — | ✅ (any) |
| `alert_events` | view, acknowledge, resolve | ✅ | ✅ | ✅ | view only | — | ✅ (any) |
| `audit_log` | view | ✅ (own workspace) | ✅ (own workspace) | — | — | — | ✅ (any workspace + platform-level entries) |

This table is not prose — it is the literal content of `packages/permissions/src/matrix.ts`, described next.

## 4. Implementation: One Source of Truth, Three Consumers

The single biggest authorization lesson from the existing-system analysis is that the frontend had a clean permission model and the backend had none, so the UI's "no" was decorative. v2 fixes this by defining the matrix **once**, in a shared package, and having both the backend guards and the frontend policy layer import the same definitions.

```
packages/permissions/
├── src/
│   ├── roles.ts          // WorkspaceRole, PlatformRole enums (mirrors Prisma enums)
│   ├── resources.ts       // Resource, Action string-literal unions
│   ├── matrix.ts          // the table above, as data: Record<Role, Partial<Record<Resource, Action[]>>>
│   ├── can.ts              // can(role, resource, action): boolean — pure function, no I/O
│   └── policies/           // data-aware refinements, same pattern as today's organizations.policy.ts,
│       ├── devices.policy.ts      // e.g. canEdit requires device.workspaceId === membership.workspaceId
│       ├── members.policy.ts
│       └── index.ts
└── package.json
```

This package has **zero** dependency on NestJS, Next.js, Prisma, or Better Auth — it is pure logic, importable by both `apps/api` and `apps/web`/`apps/admin` without pulling either runtime into the other.

### 4.1 Backend Enforcement (NestJS Guards) — The Real Security Boundary

Every controller method is decorated with the permission it requires; a single global guard evaluates it before the handler runs.

```ts
// apps/api/src/auth/permission.decorator.ts
export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata('permission', { resource, action });

// apps/api/src/auth/permission.guard.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<{resource: Resource; action: Action}>('permission', ctx.getHandler());
    if (!required) return true; // no decorator = public or device-auth route, handled elsewhere

    const req = ctx.switchToHttp().getRequest();
    const membership = req.activeMembership; // resolved by an earlier WorkspaceContextMiddleware from the session + :workspaceId param
    const platformRole = req.user?.platformRole;

    if (platformRole === 'SUPER_ADMIN') return true; // super-admin bypasses workspace-level checks entirely, by design
    if (platformRole === 'MANUFACTURER') {
      return can('MANUFACTURER', required.resource, required.action); // never workspace-scoped
    }
    if (!membership) return false; // no membership in the workspace this request targets — hard deny
    if (!can(membership.role, required.resource, required.action)) return false;

    // Data-aware refinement (e.g., "is this specific device in MY workspace")
    const policy = policies[required.resource];
    if (policy?.[required.action]) {
      return policy[required.action](req.activeMembership, req.targetResource);
    }
    return true;
  }
}

// Example controller usage:
@Controller('workspaces/:workspaceId/devices')
export class DevicesController {
  @Get(':deviceId')
  @RequirePermission('devices', 'view')
  getDevice(@Param('deviceId') id: string, @ActiveMembership() membership: WorkspaceMembership) {
    return this.devicesService.getByIdScoped(id, membership.workspaceId); // every query takes workspaceId as a mandatory filter, never optional
  }
}
```

The critical structural rule, stated explicitly because it is exactly what was missing before: **every service method that reads or writes a workspace-owned resource takes `workspaceId` as a required parameter and includes it in the `WHERE` clause.** There is no "fetch by ID, then check ownership after" pattern anywhere — the ownership filter is part of the query itself, so a missing permission check can never leak data even if a guard were accidentally omitted from one route. This is the single change that closes the majority of the cross-tenant findings in the existing-system analysis (Organizations, Users, Devices, Telemetry were all reachable cross-tenant because their queries had no workspace filter at all, not because a role check was merely wrong).

### 4.2 Frontend Enforcement (Pages & Components) — UX, Not Security

`apps/web` and `apps/admin` both consume the same `packages/permissions` package:

```tsx
// apps/web/app/_lib/rbac/usePermission.ts — same shape as today's usePolicy.ts, now backed by the shared package
export function usePermission(resource: Resource, action: Action, data?: unknown) {
  const { activeMembership } = useWorkspaceContext();
  return canWithPolicy(activeMembership, resource, action, data);
}

// Page-level guard — same component name and usage as the current RoleProtectedGuard, intentionally,
// so the existing pattern the team already knows transfers directly:
<PermissionGuard resource="members" action="view">
  <MembersList />
</PermissionGuard>

// Component-level — same hook, smaller scope:
{usePermission('devices', 'transfer-out') && <TransferDeviceButton device={device} />}
```

### 4.3 API-Documentation-Level Enforcement

Because `@RequirePermission` is a Nest decorator read by `@nestjs/swagger` alongside the existing `@ApiOperation` decorators, the generated OpenAPI spec annotates every endpoint with the permission it requires. This means the API contract itself documents authorization requirements — not just request/response shapes — for anyone (including an AI coding agent) building against it later.

## 5. The Device / Machine Boundary

Devices never hold a `WorkspaceMembership` and are never evaluated against the human permission matrix at all. `DeviceAuthGuard` (separate from `PermissionGuard`) resolves a `DeviceCredential`, and the only authorization question for a device request is "does this credential's `deviceId` match the `deviceId` in the URL/payload" — there is no broader permission to check, by design, because a device should only ever be able to act as itself.

## 6. Extensibility

Adding a new role: add one enum value, add one row to `matrix.ts`. No controller, guard, or page changes are required unless the new role needs genuinely new UI.

Adding a new resource/action: add it to `resources.ts`, add a column to the matrix, add `@RequirePermission` to the relevant controller methods. The compiler (TypeScript's literal-union types for `Resource`/`Action`) will flag any decorator referencing a resource/action that doesn't exist in the matrix, which is the concrete mechanism that keeps this "easy to extend" rather than "easy to extend incorrectly."

## 7. Concrete Worked Examples (Matching the Brief's Bar)

- **"Org User cannot view other users."** An `OPERATOR`/`VIEWER` membership has no `members:view` entry in the matrix → `PermissionGuard` denies `GET /workspaces/:id/members` with a 403 before the controller method body ever executes, regardless of whose workspace `:id` is.
- **"Org Admin can manage users inside their organization."** `ADMIN`/`OWNER` have `members:*`, and `MembersService.invite()`/`.removeMember()`/`.changeRole()` all take `workspaceId` from `req.activeMembership.workspaceId` (resolved from the session), never from client-supplied input — an Admin cannot even construct a request that targets a different workspace's membership table, because the service signature doesn't accept an arbitrary workspace id from the request body.
- **"Company Admin can manage all organizations."** `platformRole === 'SUPER_ADMIN'` short-circuits the workspace-membership check entirely in `PermissionGuard`, and `apps/admin`'s `WorkspacesController` (mounted only in the admin-facing route group) takes `workspaceId` as a path parameter sourced from the admin's own navigation, not constrained to any one workspace.
- **"Manufacturer/Admin can access platform-wide information."** `MANUFACTURER` is checked against the matrix's `MANUFACTURER` column, which only has entries for `device_models`, `port_types`, and inventory-side `devices` actions — there is no row granting it `telemetry:view` or `members:*` for any workspace, so even a `MANUFACTURER` staff account that somehow obtained a `workspaceId` cannot read that workspace's data.
