import { AppShell, PageHeader, Panel } from "../../../../components/app-shell";
import { DataTable } from "../../../../components/table";
import { getDevice, telemetryRows } from "../../../../lib/mock-data";

export default async function DeviceValuesPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = getDevice(deviceId);
  const rows = telemetryRows.filter((row) => row.deviceId === device.id);
  return (
    <AppShell>
      <PageHeader title={`${device.name} Values`} description="Table-ready telemetry with raw and calibrated values for digital, analog, and Modbus reads." />
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
