import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { getDeviceModel } from "../../../lib/mock-data";

export default async function DeviceModelDetailPage({ params }: { params: Promise<{ modelId: string }> }) {
  const { modelId } = await params;
  const model = getDeviceModel(modelId);
  return (
    <AppShell>
      <PageHeader title={`${model.name} v${model.version}`} description={`${model.sku} · ${model.microControllerType} · hardware ${model.hardwareRevision}`} action={<Button>{model.status === "DRAFT" ? "Publish" : "New Version"}</Button>} />
      <Panel title="Ports">
        <DataTable
          rows={model.ports}
          rowKey={(port) => String(port.portKey)}
          columns={[
            { key: "portKey", header: "Port key" },
            { key: "type", header: "Type" },
            { key: "pin", header: "Pin" },
            { key: "description", header: "Description" }
          ]}
        />
      </Panel>
      <div className="mt-4"><StatusPill value={model.status} /></div>
    </AppShell>
  );
}
