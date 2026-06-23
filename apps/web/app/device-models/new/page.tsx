"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Button, PageHeader, Panel } from "../../../components/app-shell";
import { SelectField, TextField } from "../../../components/ui";
import { useCreateDeviceModelMutation, usePortTypesQuery } from "../../../lib/hooks/api";

export default function NewDeviceModelPage() {
  const router = useRouter();
  const { data: portTypes = [] } = usePortTypesQuery();
  const createDeviceModel = useCreateDeviceModelMutation();
  const [createError, setCreateError] = useState<string>("");

  async function onSaveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const form = new FormData(event.currentTarget);

    const ports = [1, 2, 3]
      .map((index) => ({
        portTypeId: String(form.get(`portTypeId_${index}`) ?? ""),
        microControllerPin: String(form.get(`microControllerPin_${index}`) ?? "") || undefined,
        description: String(form.get(`description_${index}`) ?? "") || undefined
      }))
      .filter((port) => port.portTypeId);

    try {
      await createDeviceModel.mutateAsync({
        name: String(form.get("name") ?? ""),
        sku: String(form.get("sku") ?? ""),
        microControllerType: String(form.get("microControllerType") ?? ""),
        hardwareRevision: String(form.get("hardwareRevision") ?? "") || undefined,
        firmwareFamily: String(form.get("firmwareFamily") ?? "") || undefined,
        ports
      });
      router.push("/device-models");
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create device model");
    }
  }

  return (
    <AppShell>
      <PageHeader title="New Device Model" description="Create a draft model version, add ports, then publish to lock the hardware contract." action={<Button form="new-device-model-form">Save Draft</Button>} />
      <form className="grid gap-4 xl:grid-cols-[1fr_1fr]" id="new-device-model-form" onSubmit={onSaveDraft}>
        <Panel title="Model Metadata">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Name" name="name" placeholder="Hybrid Meter" required />
            <TextField label="SKU" name="sku" placeholder="HYBRID-MTR" required />
            <TextField label="MCU" name="microControllerType" placeholder="ESP32-S3" required />
            <TextField label="Hardware revision" name="hardwareRevision" placeholder="EVT" />
            <TextField label="Firmware family" name="firmwareFamily" placeholder="hybrid-meter" />
          </div>
        </Panel>
        <Panel title="Ports">
          <div className="grid gap-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="grid gap-3 rounded-md border border-zinc-200 p-3 md:grid-cols-3">
                <SelectField
                  label="Port type"
                  name={`portTypeId_${index}`}
                  options={portTypes.map((type) => ({ label: `${String(type.codeName ?? "")} · ${String(type.name ?? "")}`, value: String(type.id ?? "") }))}
                />
                <TextField label="MCU pin" name={`microControllerPin_${index}`} placeholder="A0 / D12 / UART1" />
                <TextField label="Description" name={`description_${index}`} placeholder="Temperature sensor" />
              </div>
            ))}
          </div>
          {createError ? <div className="mt-4 text-sm text-red-700">{createError}</div> : null}
          <div className="mt-4"><Button>{createDeviceModel.isPending ? "Saving..." : "Save Draft"}</Button></div>
        </Panel>
      </form>
    </AppShell>
  );
}
