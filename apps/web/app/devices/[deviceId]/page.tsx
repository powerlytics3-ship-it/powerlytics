import Link from "next/link";
import { AppShell, Button, Metric, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { apiGet } from "../../../lib/api";

export default async function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await apiGet<Record<string, unknown>>(`/devices/${deviceId}`, {});
  const latestResponse = await apiGet<Record<string, unknown>>(`/devices/${deviceId}/values/latest`, { data: [] });
  const latest = Array.isArray(latestResponse.data) ? (latestResponse.data as Array<Record<string, unknown>>) : [];
  const deploymentRows = await apiGet<Array<Record<string, unknown>>>(`/devices/${deviceId}/config/deployments`, []);
  const deployment = deploymentRows[0];
  const devicePorts = Array.isArray(device.ports) ? (device.ports as Array<Record<string, unknown>>) : [];

  return (
    <AppShell>
      <PageHeader
        title={String(device.name ?? "Device")}
        description={`IMEI ${String(device.imei ?? "-")} · ${String(device.deviceModelId ?? "-")} · ${String(device.locationAddress ?? "-")}`}
        action={<Link href={`/devices/${String(device.id ?? deviceId)}/configure`}><Button>Configure</Button></Link>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Lifecycle" value={<StatusPill value={String(device.lifecycleStatus ?? "UNKNOWN")} />} detail={String(device.healthStatus ?? "-")} />
        <Metric label="Last seen" value={String(device.lastSeenAt ?? "Never")} detail={String(device.updatedAt ?? "-")} />
        <Metric label="Firmware" value={String(device.firmwareVersion ?? "-")} detail={String(device.serialNumber ?? "-")} />
        <Metric label="Deployment" value={<StatusPill value={String(deployment?.status ?? "PENDING")} />} detail={String(deployment?.message ?? deployment?.hash ?? "-")} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Ports">
          <DataTable
            rows={devicePorts}
            rowKey={(port) => String(port.portKey)}
            columns={[
              { key: "portKey", header: "Key" },
              { key: "name", header: "Name" },
              { key: "portTypeId", header: "Format" },
              { key: "unit", header: "Unit" },
              { key: "status", header: "Status", render: (port) => <StatusPill value={String(port.status)} /> }
            ]}
          />
        </Panel>
        <Panel title="Latest Values">
          <DataTable
            rows={latest}
            rowKey={(row) => String(row.id)}
            columns={[
              { key: "label", header: "Signal" },
              { key: "portKey", header: "Port" },
              { key: "calibratedValue", header: "Value", render: (row) => `${String(row.calibratedValue)} ${String(row.unit ?? "")}` },
              { key: "quality", header: "Quality" }
            ]}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
