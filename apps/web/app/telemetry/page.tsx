import { AppShell, PageHeader, Panel } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { SelectField, Tabs, TextField } from "../../components/ui";
import { devices, telemetryRows } from "../../lib/mock-data";

export default function TelemetryPage() {
  return (
    <AppShell>
      <PageHeader title="Telemetry" description="Snapshot, table, chart-ready, status, and export views for normalized device values." />
      <Panel title="Filters">
        <div className="grid gap-4 md:grid-cols-4">
          <SelectField label="Device" options={devices.map((device) => device.name)} />
          <TextField label="Port key" placeholder="AI_1" />
          <TextField label="Start time" placeholder="2026-06-21T00:00:00Z" />
          <TextField label="End time" placeholder="2026-06-22T00:00:00Z" />
        </div>
      </Panel>
      <div className="mt-4">
        <Tabs
          tabs={[
            {
              label: "Snapshot",
              content: <TelemetryTable title="Latest Snapshot" rows={telemetryRows} />
            },
            {
              label: "Table",
              content: <TelemetryTable title="Table View" rows={telemetryRows} />
            },
            {
              label: "Export",
              content: <TelemetryTable title="Export Preview" rows={telemetryRows} />
            }
          ]}
        />
      </div>
    </AppShell>
  );
}

function TelemetryTable({ title, rows }: { title: string; rows: typeof telemetryRows }) {
  return (
    <Panel title={title}>
      <DataTable
        rows={rows}
        rowKey={(row) => String(row.id)}
        columns={[
          { key: "ts", header: "Timestamp" },
          { key: "label", header: "Signal" },
          { key: "portKey", header: "Port" },
          { key: "rawValue", header: "Raw" },
          { key: "calibratedValue", header: "Calibrated", render: (row) => `${String(row.calibratedValue)} ${String(row.unit ?? "")}` },
          { key: "quality", header: "Quality" }
        ]}
      />
    </Panel>
  );
}
