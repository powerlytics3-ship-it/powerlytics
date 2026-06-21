import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../../components/app-shell";
import { DataTable } from "../../../../components/table";
import { deployments, getDevice } from "../../../../lib/mock-data";

export default async function DeviceDeploymentsPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = getDevice(deviceId);
  const rows = deployments.filter((deployment) => deployment.deviceId === device.id);
  return (
    <AppShell>
      <PageHeader title={`${device.name} Deployments`} description="Config deployment history with hash, bridge status, and device ACK timing." action={<Button>Deploy Current Config</Button>} />
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
