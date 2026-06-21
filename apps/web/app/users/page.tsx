import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { users, workspaces } from "../../lib/mock-data";

export default function UsersPage() {
  return (
    <AppShell>
      <PageHeader
        title="Users"
        description="Global identities connect to tenant access through workspace memberships."
        action={
          <ModalTrigger label="Invite User" title="Invite User">
            <div className="grid gap-4">
              <TextField label="Email" placeholder="operator@acme.example" />
              <SelectField label="Workspace" options={workspaces.map((workspace) => workspace.displayName)} />
              <SelectField label="Role" options={["WORKSPACE_ADMIN", "OPERATOR", "VIEWER"]} />
              <Button>Send Invite</Button>
            </div>
          </ModalTrigger>
        }
      />
      <Panel title="User Directory">
        <DataTable
          rows={users}
          rowKey={(user) => String(user.id)}
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "role", header: "Role" },
            { key: "workspaceId", header: "Workspace", render: (user) => workspaces.find((workspace) => workspace.id === user.workspaceId)?.displayName ?? "" },
            { key: "status", header: "Status", render: (user) => <StatusPill value={String(user.status)} /> },
            { key: "lastLogin", header: "Last login", render: (user) => String(user.lastLogin ?? "Never") }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
