import { AppShell, Button, PageHeader, Panel } from "../../../components/app-shell";
import { SelectField, TextField } from "../../../components/ui";
import { portTypes } from "../../../lib/mock-data";

export default function NewDeviceModelPage() {
  return (
    <AppShell>
      <PageHeader title="New Device Model" description="Create a draft model version, add ports, then publish to lock the hardware contract." action={<Button>Save Draft</Button>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Model Metadata">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Name" placeholder="Hybrid Meter" />
            <TextField label="SKU" placeholder="HYBRID-MTR" />
            <TextField label="MCU" placeholder="ESP32-S3" />
            <TextField label="Hardware revision" placeholder="EVT" />
            <TextField label="Firmware family" placeholder="hybrid-meter" />
          </div>
        </Panel>
        <Panel title="Ports">
          <div className="grid gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="grid gap-3 rounded-md border border-zinc-200 p-3 md:grid-cols-3">
                <SelectField label="Port type" options={portTypes.map((type) => `${type.codeName} · ${type.name}`)} />
                <TextField label="MCU pin" placeholder="A0 / D12 / UART1" />
                <TextField label="Description" placeholder="Temperature sensor" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
