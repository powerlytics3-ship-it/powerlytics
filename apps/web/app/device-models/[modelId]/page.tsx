import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { apiGet } from "../../../lib/api";

export default async function DeviceModelDetailPage({ params }: { params: Promise<{ modelId: string }> }) {
  const { modelId } = await params;
  const model = await apiGet<Record<string, unknown>>(`/device-models/${modelId}`, {});
  const ports = Array.isArray(model.ports) ? (model.ports as Array<Record<string, unknown>>) : [];
  return (
    <AppShell>
      <PageHeader title={`${String(model.name ?? "Model")} v${String(model.version ?? "")}`} description={`${String(model.sku ?? "-")} · ${String(model.microControllerType ?? "-")} · hardware ${String(model.hardwareRevision ?? "-")}`} action={<Button>{String(model.status) === "DRAFT" ? "Publish" : "New Version"}</Button>} />
      <Panel title="Ports">
        <DataTable
          rows={ports}
          rowKey={(port) => String(port.portKey)}
          columns={[
            { key: "portKey", header: "Port key" },
            { key: "portTypeId", header: "Type" },
            { key: "microControllerPin", header: "Pin" },
            { key: "description", header: "Description" }
          ]}
        />
      </Panel>
      <div className="mt-4"><StatusPill value={String(model.status ?? "UNKNOWN")} /></div>
    </AppShell>
  );
}
