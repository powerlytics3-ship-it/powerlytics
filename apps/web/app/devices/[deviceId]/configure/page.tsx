import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../../components/app-shell";
import { SelectField, Tabs, TextField } from "../../../../components/ui";
import { getDevice } from "../../../../lib/mock-data";

export default async function DeviceConfigurePage({ params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const device = getDevice(deviceId);
  const modbusPort = device.ports.find((port) => port.valueFormat === "MODBUS");
  const slave = modbusPort?.modbusSlaves?.[0];

  return (
    <AppShell>
      <PageHeader title={`Configure ${device.name}`} description="Edit safe device-specific configuration without changing immutable IMEI or model binding." action={<Button>Deploy Config</Button>} />
      <Tabs
        tabs={[
          {
            label: "General",
            content: (
              <Panel title="Device Settings">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Name" value={device.name} />
                  <TextField label="Point of contact" value="Plant operations" />
                  <TextField label="Alert email" value="ops@powerlytic.com" />
                  <TextField label="Alert phone" value="+91 90000 00000" />
                  <TextField label="Location" value={device.location} />
                  <SelectField label="Lifecycle" value={device.lifecycle} options={["INSTALLED", "COMMISSIONING", "ACTIVE", "MAINTENANCE", "SUSPENDED", "RETIRED"]} />
                </div>
              </Panel>
            )
          },
          {
            label: "Ports",
            content: (
              <div className="grid gap-4">
                {device.ports.map((port) => (
                  <Panel key={port.portKey} title={`${port.portKey} · ${port.name}`}>
                    <div className="grid gap-4 md:grid-cols-4">
                      <TextField label="Unit" value={String(port.unit ?? "")} />
                      <TextField label="Scaling" value={String(port.scaling)} />
                      <TextField label="Offset" value={String(port.offset)} />
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
              <Panel title={`${modbusPort?.portKey ?? "MI_1"} Modbus Slaves`}>
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField label="Slave ID" value={slave?.slaveId ?? "1"} />
                  <TextField label="Baud rate" value={String(slave?.serial.baudRate ?? 9600)} />
                  <SelectField label="Parity" value={slave?.serial.parity ?? "none"} options={["none", "even", "odd"]} />
                  <TextField label="Interval ms" value={String(slave?.polling.intervalMs ?? 1000)} />
                  <TextField label="Timeout ms" value={String(slave?.polling.timeoutMs ?? 300)} />
                  <TextField label="Retries" value={String(slave?.polling.retries ?? 3)} />
                </div>
                <div className="mt-4 grid gap-3">
                  {slave?.reads.map((read) => (
                    <div key={read.readId} className="rounded-md border border-zinc-200 p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-medium text-zinc-950">{read.name}</div>
                        <StatusPill value={read.functionCode} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-4">
                        <TextField label="Read ID" value={read.readId} />
                        <TextField label="Start address" value={String(read.startAddress)} />
                        <TextField label="Bits" value={String(read.bitsToRead)} />
                        <TextField label="Unit" value={read.unit} />
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
