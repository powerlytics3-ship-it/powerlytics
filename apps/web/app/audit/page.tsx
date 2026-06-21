import { AppShell, PageHeader, Panel } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { SelectField, TextField } from "../../components/ui";
import { auditLogs } from "../../lib/mock-data";

export default function AuditPage() {
  return (
    <AppShell>
      <PageHeader title="Audit Log" description="Sensitive workspace, device, deployment, and actuation operations are traceable." />
      <Panel title="Filters">
        <div className="grid gap-4 md:grid-cols-4">
          <TextField label="Resource ID" placeholder="dev-demo-1" />
          <SelectField label="Action" options={["All", "device_config.deployed", "actuation.created", "membership.invited"]} />
          <TextField label="From" placeholder="2026-06-21" />
          <TextField label="To" placeholder="2026-06-22" />
        </div>
      </Panel>
      <div className="mt-4">
        <Panel title="Events">
          <DataTable
            rows={auditLogs}
            rowKey={(row) => String(row.id)}
            columns={[
              { key: "createdAt", header: "Time" },
              { key: "action", header: "Action" },
              { key: "resource", header: "Resource" },
              { key: "resourceId", header: "Resource ID" },
              { key: "actor", header: "Actor" },
              { key: "workspace", header: "Workspace" }
            ]}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
