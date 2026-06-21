import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { actuations, devices } from "../../lib/mock-data";

export default function ActuationsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Actuation"
        description="Safe output commands require reason capture, idempotency, status tracking, and audit logging."
        action={
          <ModalTrigger label="New Command" title="New Actuation Command" variant="danger">
            <div className="grid gap-4">
              <SelectField label="Device" options={devices.map((device) => device.name)} />
              <TextField label="Port key" placeholder="DO_1" />
              <SelectField label="Command" options={["SET_ON", "SET_OFF", "PULSE"]} />
              <TextField label="Reason" placeholder="Restore warehouse exhaust fan" />
              <Button variant="danger">Request Command</Button>
            </div>
          </ModalTrigger>
        }
      />
      <Panel title="Command History">
        <DataTable
          rows={actuations}
          rowKey={(row) => String(row.id)}
          columns={[
            { key: "device", header: "Device" },
            { key: "portKey", header: "Port" },
            { key: "command", header: "Command" },
            { key: "status", header: "Status", render: (row) => <StatusPill value={String(row.status)} /> },
            { key: "requestedBy", header: "Requested by" },
            { key: "reason", header: "Reason" },
            { key: "createdAt", header: "Created" }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
