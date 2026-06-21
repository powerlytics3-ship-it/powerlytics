import Link from "next/link";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { apiGet } from "../../lib/api";
import { devices, deviceModels, workspaces } from "../../lib/mock-data";

export default async function DevicesPage() {
  const apiDevices = await apiGet<Array<Record<string, unknown>>>("/devices", []);
  const rows = apiDevices.length
    ? apiDevices.map((device) => ({
        id: String(device.id),
        name: String(device.name),
        imei: String(device.imei),
        model: String(device.deviceModelId ?? ""),
        workspace: String(device.workspaceId ?? "Unassigned"),
        lifecycle: String(device.lifecycleStatus ?? ""),
        deployment: "READY"
      }))
    : devices;

  return (
    <AppShell>
      <PageHeader
        title="Device Fleet"
        description="Manufacture inventory, assign workspace ownership, commission sites, deploy config, and preserve legacy config payload compatibility."
        action={
          <div className="flex gap-2">
            <ModalTrigger label="Claim Device" title="Claim Device">
              <div className="grid gap-4">
                <TextField label="Claim code / IMEI" placeholder="cfg-demo-1" />
                <SelectField label="Workspace" options={workspaces.map((workspace) => workspace.displayName)} />
                <TextField label="Device name" placeholder="Boiler Room Monitor" />
                <Button>Claim</Button>
              </div>
            </ModalTrigger>
            <ModalTrigger label="Manufacture Device" title="Manufacture Device">
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="IMEI" placeholder="867530900004" />
                <TextField label="Serial number" placeholder="PL-DEMO-004" />
                <SelectField label="Model version" options={deviceModels.map((model) => `${model.name} v${model.version}`)} />
                <TextField label="Batch number" placeholder="BATCH-2026-06" />
                <TextField label="Firmware version" placeholder="1.8.2" />
                <TextField label="Hardware revision" placeholder="A" />
                <div className="md:col-span-2"><Button>Manufacture</Button></div>
              </div>
            </ModalTrigger>
          </div>
        }
      />
      <Panel title="Devices">
        <DataTable
          rows={rows}
          rowKey={(device) => String(device.id)}
          columns={[
            { key: "name", header: "Device", render: (device) => <Link className="font-medium text-zinc-950 underline-offset-2 hover:underline" href={`/devices/${device.id}`}>{String(device.name)}</Link> },
            { key: "imei", header: "IMEI" },
            { key: "model", header: "Model" },
            { key: "workspace", header: "Workspace" },
            { key: "lifecycle", header: "Lifecycle", render: (device) => <StatusPill value={String(device.lifecycle)} /> },
            { key: "deployment", header: "Config", render: (device) => <StatusPill value={String(device.deployment)} /> },
            { key: "id", header: "Actions", render: (device) => <Link className="text-sm font-medium text-zinc-950" href={`/devices/${device.id}/configure`}>Configure</Link> }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
