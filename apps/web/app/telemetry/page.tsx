import { AppShell, PageHeader, Panel } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { SelectField, Tabs, TextField } from "../../components/ui";
import { apiGet } from "../../lib/api";

export default async function TelemetryPage() {
  const devices = await apiGet<Array<Record<string, unknown>>>("/devices", []);
  const selectedDeviceId = String(devices[0]?.id ?? "");
  const telemetryResponse = selectedDeviceId
    ? await apiGet<Record<string, unknown>>(`/devices/${selectedDeviceId}/values`, { data: [] })
    : { data: [] };
  const telemetryRows = Array.isArray(telemetryResponse.data) ? (telemetryResponse.data as Array<Record<string, unknown>>) : [];

  return (
    <AppShell>
      <PageHeader title="Telemetry" description="Snapshot, table, chart-ready, status, and export views for normalized device values." />
      <Panel title="Filters">
        <div className="grid gap-4 md:grid-cols-4">
          <SelectField label="Device" options={devices.map((device) => String(device.name ?? device.id ?? ""))} />
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

function TelemetryTable({ title, rows }: { title: string; rows: Array<Record<string, unknown>> }) {
  return (
    <Panel title={title}>
      <DataTable
        rows={rows}
        rowKey={(row) => String(row.id)}
        columns={[
          { key: "ts", header: "Timestamp" },
          { key: "portKey", header: "Signal" },
          { key: "portKey", header: "Port" },
          { key: "rawValue", header: "Raw" },
          { key: "calibratedValue", header: "Calibrated", render: (row) => `${String(row.calibratedValue)} ${String(row.unit ?? "")}` },
          { key: "quality", header: "Quality" }
        ]}
      />
    </Panel>
  );
}
