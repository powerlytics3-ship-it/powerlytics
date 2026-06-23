"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import {
  useClaimDeviceMutation,
  useDeviceModelsQuery,
  useDevicesQuery,
  useManufactureDeviceMutation,
  useWorkspacesQuery
} from "../../lib/hooks/api";

export default function DevicesPage() {
  const { data: apiDevices = [], isLoading: devicesLoading } = useDevicesQuery();
  const { data: deviceModels = [] } = useDeviceModelsQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const claimDevice = useClaimDeviceMutation();
  const manufactureDevice = useManufactureDeviceMutation();
  const [claimError, setClaimError] = useState("");
  const [manufactureError, setManufactureError] = useState("");
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [mfgModalOpen, setMfgModalOpen] = useState(false);

  const rows = apiDevices.map((device) => ({
    id: String(device.id),
    name: String(device.name),
    imei: String(device.imei),
    model: String(device.deviceModelId ?? ""),
    workspace: String(device.workspaceId ?? "Unassigned"),
    lifecycle: String(device.lifecycleStatus ?? ""),
    deployment: "READY"
  }));

  async function onClaimDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClaimError("");
    const form = new FormData(event.currentTarget);
    try {
      await claimDevice.mutateAsync({
        claimCode: String(form.get("claimCode") ?? ""),
        workspaceId: String(form.get("workspaceId") ?? ""),
        name: String(form.get("name") ?? "") || undefined
      });
      event.currentTarget.reset();
      setClaimModalOpen(false);
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : "Claim failed");
    }
  }

  async function onManufactureDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManufactureError("");
    const form = new FormData(event.currentTarget);
    try {
      await manufactureDevice.mutateAsync({
        imei: String(form.get("imei") ?? ""),
        serialNumber: String(form.get("serialNumber") ?? "") || undefined,
        deviceModelVersionId: String(form.get("deviceModelVersionId") ?? ""),
        batchNumber: String(form.get("batchNumber") ?? "") || undefined,
        firmwareVersion: String(form.get("firmwareVersion") ?? "") || undefined,
        hardwareRevision: String(form.get("hardwareRevision") ?? "") || undefined
      });
      event.currentTarget.reset();
      setMfgModalOpen(false);
    } catch (error) {
      setManufactureError(error instanceof Error ? error.message : "Manufacture failed");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Device Fleet"
        description="Manufacture inventory, assign workspace ownership, commission sites, deploy config, and preserve legacy config payload compatibility."
        action={
          <div className="flex gap-2">
            <ModalTrigger label="Claim Device" title="Claim Device" onClose={setClaimModalOpen}>
              <form className="grid gap-4" onSubmit={onClaimDevice}>
                <TextField label="Claim code / IMEI" name="claimCode" placeholder="cfg-demo-1" required />
                <SelectField
                  label="Workspace"
                  name="workspaceId"
                  options={workspaces.map((workspace) => ({ label: String(workspace.displayName ?? workspace.id ?? ""), value: String(workspace.id ?? "") }))}
                  required
                />
                <TextField label="Device name" name="name" placeholder="Boiler Room Monitor" />
                {claimError ? <div className="text-sm text-red-700">{claimError}</div> : null}
                <Button>{claimDevice.isPending ? "Claiming..." : "Claim"}</Button>
              </form>
            </ModalTrigger>
            <ModalTrigger label="Manufacture Device" title="Manufacture Device" onClose={setMfgModalOpen}>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onManufactureDevice}>
                <TextField label="IMEI" name="imei" placeholder="867530900004" required />
                <TextField label="Serial number" name="serialNumber" placeholder="PL-DEMO-004" />
                <SelectField
                  label="Model version"
                  name="deviceModelVersionId"
                  options={deviceModels.map((model) => ({ label: `${String(model.name ?? "model")} v${String(model.version ?? "1")}`, value: String(model.id ?? "") }))}
                  required
                />
                <TextField label="Batch number" name="batchNumber" placeholder="BATCH-2026-06" />
                <TextField label="Firmware version" name="firmwareVersion" placeholder="1.8.2" />
                <TextField label="Hardware revision" name="hardwareRevision" placeholder="A" />
                {manufactureError ? <div className="md:col-span-2 text-sm text-red-700">{manufactureError}</div> : null}
                <div className="md:col-span-2"><Button>{manufactureDevice.isPending ? "Manufacturing..." : "Manufacture"}</Button></div>
              </form>
            </ModalTrigger>
          </div>
        }
      />
      <Panel title="Devices">
        {devicesLoading ? (
          <div className="p-4 text-sm text-zinc-500">Loading devices...</div>
        ) : rows.length ? (
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
        ) : (
          <div className="p-4 text-sm text-zinc-500">No devices found in API.</div>
        )}
      </Panel>
    </AppShell>
  );
}
