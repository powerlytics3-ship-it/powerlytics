import Link from "next/link";
import { AppShell, Button, Metric, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { deployments, getDevice, telemetryRows } from "../../../lib/mock-data";

export default async function DeviceDetailPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = getDevice(deviceId);
  const latest = telemetryRows.filter((row) => row.deviceId === device.id);
  const deployment = deployments.find((item) => item.deviceId === device.id);

  return (
    <AppShell>
      <PageHeader
        title={device.name}
        description={`IMEI ${device.imei} · ${device.model} · ${device.location}`}
        action={<Link href={`/devices/${device.id}/configure`}><Button>Configure</Button></Link>}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Lifecycle" value={<StatusPill value={device.lifecycle} />} detail={device.health} />
        <Metric label="Last seen" value={device.lastSeen.slice(11, 16)} detail={device.lastSeen.slice(0, 10)} />
        <Metric label="Firmware" value={device.firmware} detail={device.serialNumber} />
        <Metric label="Deployment" value={<StatusPill value={deployment?.status ?? "PENDING"} />} detail={deployment?.message || deployment?.hash} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Ports">
          <DataTable
            rows={device.ports}
            rowKey={(port) => String(port.portKey)}
            columns={[
              { key: "portKey", header: "Key" },
              { key: "name", header: "Name" },
              { key: "valueFormat", header: "Format" },
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
