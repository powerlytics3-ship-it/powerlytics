import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, Tabs, TextField } from "../../components/ui";
import { alertIncidents, alertRules, devices } from "../../lib/mock-data";

export default function AlertsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        description="Rules evaluate telemetry and create incidents operators can acknowledge and resolve."
        action={
          <ModalTrigger label="New Rule" title="New Alert Rule">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Device" options={devices.map((device) => device.name)} />
              <TextField label="Port key" placeholder="AI_1" />
              <SelectField label="Comparator" options={["GT", "GTE", "LT", "LTE", "EQ", "NEQ"]} />
              <TextField label="Threshold" placeholder="80" />
              <TextField label="Duration seconds" placeholder="300" />
              <SelectField label="Severity" options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} />
              <div className="md:col-span-2"><TextField label="Message" placeholder="Temperature high" /></div>
              <Button>Create Rule</Button>
            </div>
          </ModalTrigger>
        }
      />
      <Tabs
        tabs={[
          {
            label: "Incidents",
            content: (
              <Panel title="Incidents">
                <DataTable rows={alertIncidents} rowKey={(row) => String(row.id)} columns={[
                  { key: "triggeredAt", header: "Triggered" },
                  { key: "device", header: "Device" },
                  { key: "message", header: "Message" },
                  { key: "severity", header: "Severity", render: (row) => <StatusPill value={String(row.severity)} /> },
                  { key: "status", header: "Status", render: (row) => <StatusPill value={String(row.status)} /> }
                ]} />
              </Panel>
            )
          },
          {
            label: "Rules",
            content: (
              <Panel title="Rules">
                <DataTable rows={alertRules} rowKey={(row) => String(row.id)} columns={[
                  { key: "portKey", header: "Port" },
                  { key: "comparator", header: "Comparator" },
                  { key: "threshold", header: "Threshold" },
                  { key: "durationSeconds", header: "Duration" },
                  { key: "severity", header: "Severity", render: (row) => <StatusPill value={String(row.severity)} /> },
                  { key: "active", header: "Status", render: (row) => <StatusPill value={row.active ? "ACTIVE" : "INACTIVE"} /> }
                ]} />
              </Panel>
            )
          }
        ]}
      />
    </AppShell>
  );
}
