import Link from "next/link";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { deviceModels } from "../../lib/mock-data";

export default function DeviceModelsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Device Models"
        description="Immutable published model versions define hardware capabilities and generated port keys."
        action={<Link href="/device-models/new"><Button>New Model</Button></Link>}
      />
      <Panel title="Model Versions">
        <DataTable
          rows={deviceModels}
          rowKey={(model) => String(model.id)}
          columns={[
            { key: "name", header: "Model", render: (model) => <Link className="font-medium text-zinc-950 underline-offset-2 hover:underline" href={`/device-models/${model.id}`}>{String(model.name)}</Link> },
            { key: "sku", header: "SKU" },
            { key: "version", header: "Version" },
            { key: "microControllerType", header: "MCU" },
            { key: "status", header: "Status", render: (model) => <StatusPill value={String(model.status)} /> },
            { key: "ports", header: "Ports", render: (model) => Array.isArray(model.ports) ? model.ports.map((port: any) => port.portKey).join(", ") : "" }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
