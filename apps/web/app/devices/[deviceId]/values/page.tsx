import { AppShell, PageHeader, Panel } from "../../../../components/app-shell";
import { DataTable } from "../../../../components/table";
import { apiGet } from "../../../../lib/api";

export default async function DeviceValuesPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await apiGet<Record<string, unknown>>(`/devices/${deviceId}`, {});
  const valuesResponse = await apiGet<Record<string, unknown>>(`/devices/${deviceId}/values`, { data: [] });
  const rows = Array.isArray(valuesResponse.data) ? (valuesResponse.data as Array<Record<string, unknown>>) : [];
  return (
    <AppShell>
      <PageHeader title={`${String(device.name ?? "Device")} Values`} description="Table-ready telemetry with raw and calibrated values for digital, analog, and Modbus reads." />
      <Panel title="Telemetry Values">
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
    </AppShell>
  );
}
