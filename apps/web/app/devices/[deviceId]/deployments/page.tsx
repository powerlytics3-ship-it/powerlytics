import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../../components/app-shell";
import { DataTable } from "../../../../components/table";
import { apiGet } from "../../../../lib/api";

export default async function DeviceDeploymentsPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await apiGet<Record<string, unknown>>(`/devices/${deviceId}`, {});
  const rows = await apiGet<Array<Record<string, unknown>>>(`/devices/${deviceId}/config/deployments`, []);
  return (
    <AppShell>
      <PageHeader title={`${String(device.name ?? "Device")} Deployments`} description="Config deployment history with hash, bridge status, and device ACK timing." action={<Button>Deploy Current Config</Button>} />
      <Panel title="Deployment History">
        <DataTable
          rows={rows}
          rowKey={(row) => String(row.id)}
          columns={[
            { key: "configId", header: "Config ID" },
            { key: "hash", header: "Hash" },
            { key: "status", header: "Status", render: (row) => <StatusPill value={String(row.status)} /> },
            { key: "sentAt", header: "Sent" },
            { key: "appliedAt", header: "Applied" },
            { key: "message", header: "Message" }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
