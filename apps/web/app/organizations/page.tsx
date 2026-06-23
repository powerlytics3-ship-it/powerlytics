import Link from "next/link";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { apiGet } from "../../lib/api";

export default async function OrganizationsPage() {
  const workspaces = await apiGet<Array<Record<string, unknown>>>("/workspaces", []);
  const users = await apiGet<Array<Record<string, unknown>>>("/users", []);

  return (
    <AppShell>
      <PageHeader
        title="Workspaces"
        description="B2B organizations and future personal workspaces use memberships, invitations, and workspace-scoped access checks."
        action={<Link href="/organizations/new"><Button>New Workspace</Button></Link>}
      />
      <Panel title="Workspace Directory">
        <DataTable
          rows={workspaces}
          rowKey={(workspace) => String(workspace.id)}
          columns={[
            { key: "displayName", header: "Workspace", render: (workspace) => <Link href={`/organizations/${workspace.id}`} className="font-medium text-zinc-950 underline-offset-2 hover:underline">{String(workspace.displayName)}</Link> },
            { key: "slug", header: "Slug" },
            { key: "industry", header: "Industry" },
            { key: "timezone", header: "Timezone" },
            { key: "status", header: "Status", render: (workspace) => <StatusPill value={String(workspace.status)} /> },
            {
              key: "id",
              header: "Members",
              render: (workspace) => users.filter((user) => Array.isArray(user.memberships) && (user.memberships as Array<Record<string, unknown>>).some((m) => String(m.workspaceId) === String(workspace.id))).length
            }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
