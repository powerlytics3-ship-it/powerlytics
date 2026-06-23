import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../../components/app-shell";
import { SelectField, Tabs, TextField } from "../../../../components/ui";
import { apiGet } from "../../../../lib/api";

export default async function DeviceConfigurePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = await apiGet<Record<string, unknown>>(`/devices/${deviceId}`, {});
  const config = await apiGet<Record<string, unknown>>(`/devices/${deviceId}/config`, { ports: [] });
  const ports = Array.isArray(config.ports) ? (config.ports as Array<Record<string, unknown>>) : [];
  const modbusPort = ports.find((port) => Array.isArray(port.modbusSlaves));
  const slaves = Array.isArray(modbusPort?.modbusSlaves) ? (modbusPort.modbusSlaves as Array<Record<string, unknown>>) : [];
  const slave = slaves[0];
  const reads = Array.isArray(slave?.reads) ? (slave.reads as Array<Record<string, unknown>>) : [];

  return (
    <AppShell>
      <PageHeader title={`Configure ${String(device.name ?? "Device")}`} description="Edit safe device-specific configuration without changing immutable IMEI or model binding." action={<Button>Deploy Config</Button>} />
      <Tabs
        tabs={[
          {
            label: "General",
            content: (
              <Panel title="Device Settings">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Name" value={String(device.name ?? "")} />
                  <TextField label="Point of contact" value="Plant operations" />
                  <TextField label="Alert email" value="ops@powerlytic.com" />
                  <TextField label="Alert phone" value="+91 90000 00000" />
                  <TextField label="Location" value={String(device.locationAddress ?? "")} />
                  <SelectField label="Lifecycle" value={String(device.lifecycleStatus ?? "ACTIVE")} options={["INSTALLED", "COMMISSIONING", "ACTIVE", "MAINTENANCE", "SUSPENDED", "RETIRED"]} />
                </div>
              </Panel>
            )
          },
          {
            label: "Ports",
            content: (
              <div className="grid gap-4">
                {ports.map((port) => (
                  <Panel key={String(port.portKey)} title={`${String(port.portKey)} · ${String(port.name ?? "Port")}`}>
                    <div className="grid gap-4 md:grid-cols-4">
                      <TextField label="Unit" value={String(port.unit ?? "")} />
                      <TextField label="Scaling" value={String(port.scaling ?? 1)} />
                      <TextField label="Offset" value={String(port.offset ?? 0)} />
                      <SelectField label="Status" value={String(port.status)} options={["ACTIVE", "INACTIVE", "FAULT"]} />
                      <TextField label="Threshold min" value={String(port.thresholdMin ?? "")} />
                      <TextField label="Threshold max" value={String(port.thresholdMax ?? "")} />
                    </div>
                  </Panel>
                ))}
              </div>
            )
          },
          {
            label: "Modbus",
            content: (
              <Panel title={`${String(modbusPort?.portKey ?? "MI_1")} Modbus Slaves`}>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField label="Slave ID" value={String(slave?.slaveId ?? "1")} />
                  <TextField label="Baud rate" value={String((slave?.serial as Record<string, unknown> | undefined)?.baudRate ?? 9600)} />
                  <SelectField label="Parity" value={String((slave?.serial as Record<string, unknown> | undefined)?.parity ?? "none")} options={["none", "even", "odd"]} />
                  <TextField label="Interval ms" value={String((slave?.polling as Record<string, unknown> | undefined)?.intervalMs ?? 1000)} />
                  <TextField label="Timeout ms" value={String((slave?.polling as Record<string, unknown> | undefined)?.timeoutMs ?? 300)} />
                  <TextField label="Retries" value={String((slave?.polling as Record<string, unknown> | undefined)?.retries ?? 3)} />
                </div>
                <div className="mt-4 grid gap-3">
                  {reads.map((read) => (
                    <div key={String(read.readId)} className="rounded-md border border-zinc-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-medium text-zinc-950">{String(read.name ?? "Read")}</div>
                        <StatusPill value={String(read.functionCode ?? "-")} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <TextField label="Read ID" value={String(read.readId ?? "")} />
                        <TextField label="Start address" value={String(read.startAddress ?? "")} />
                        <TextField label="Bits" value={String(read.bitsToRead ?? "")} />
                        <TextField label="Unit" value={String(read.unit ?? "")} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )
          }
        ]}
      />
    </AppShell>
  );
}
