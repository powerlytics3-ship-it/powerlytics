import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../../components/ui";
import { devices, getWorkspace, users } from "../../../lib/mock-data";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  const members = users.filter((user) => user.workspaceId === workspace.id);
  const fleet = devices.filter((device) => device.workspaceId === workspace.id);
  return (
    <AppShell>
      <PageHeader
        title={workspace.displayName}
        description={`${workspace.industry} · ${workspace.timezone} · ${workspace.supportEmail}`}
        action={
          <ModalTrigger label="Invite Member" title="Invite Member">
            <div className="grid gap-4">
              <TextField label="Email" placeholder="operator@acme.example" />
              <SelectField label="Role" options={["WORKSPACE_ADMIN", "OPERATOR", "VIEWER"]} />
              <Button>Send Invite</Button>
            </div>
          </ModalTrigger>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Members">
          <DataTable rows={members} rowKey={(user) => String(user.id)} columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status", render: (user) => <StatusPill value={String(user.status)} /> }
          ]} />
        </Panel>
        <Panel title="Devices">
          <DataTable rows={fleet} rowKey={(device) => String(device.id)} columns={[
            { key: "name", header: "Name" },
            { key: "imei", header: "IMEI" },
            { key: "lifecycle", header: "Lifecycle", render: (device) => <StatusPill value={String(device.lifecycle)} /> }
          ]} />
        </Panel>
      </div>
    </AppShell>
  );
}
