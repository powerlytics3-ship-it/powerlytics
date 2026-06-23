"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { useApiClient, useDevicesQuery } from "../../lib/hooks/api";

function parseRequestedValue(value: string): boolean | number | string {
  const normalized = value.trim();
  if (normalized.toLowerCase() === "true") return true;
  if (normalized.toLowerCase() === "false") return false;
  const asNumber = Number(normalized);
  if (!Number.isNaN(asNumber) && normalized !== "") return asNumber;
  return normalized;
}

export default function ActuationsPage() {
  const { request, isSessionReady } = useApiClient();
  const queryClient = useQueryClient();
  const { data: devices = [] } = useDevicesQuery();
  const [createError, setCreateError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deviceOptions = useMemo(
    () => devices.map((device) => ({ label: String(device.name ?? device.id ?? ""), value: String(device.id ?? "") })),
    [devices]
  );

  const { data: actuations = [] } = useQuery({
    queryKey: ["actuations", "all", devices.map((d) => String(d.id ?? "")).join(",")],
    queryFn: async () => {
      const groups = await Promise.all(
        devices.map(async (device) => {
          const deviceId = String(device.id ?? "");
          if (!deviceId) return [] as Array<Record<string, unknown>>;
          const rows = await request<Array<Record<string, unknown>>>(`/devices/${deviceId}/actuations`);
          return rows.map((row) => ({ ...row, device: String(device.name ?? deviceId) })) as Array<Record<string, unknown>>;
        })
      );
      return groups.flat() as Array<Record<string, unknown>>;
    },
    enabled: isSessionReady && devices.length > 0
  });

  async function onCreateCommand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const form = new FormData(event.currentTarget);
    const deviceId = String(form.get("deviceId") ?? "");
    const requestedValueRaw = String(form.get("requestedValue") ?? "");

    if (!deviceId) {
      setCreateError("Device is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await request(`/devices/${deviceId}/actuations`, "POST", {
        portKey: String(form.get("portKey") ?? ""),
        command: String(form.get("command") ?? "SET_ON"),
        requestedValue: parseRequestedValue(requestedValueRaw),
        reason: String(form.get("reason") ?? ""),
        idempotencyKey: crypto.randomUUID()
      });
      await queryClient.invalidateQueries({ queryKey: ["actuations", "all"] });
      event.currentTarget.reset();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Failed to request command");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Actuation"
        description="Safe output commands require reason capture, idempotency, status tracking, and audit logging."
        action={
          <ModalTrigger label="New Command" title="New Actuation Command" variant="danger">
            <form className="grid gap-4" onSubmit={onCreateCommand}>
              <SelectField
                label="Device"
                name="deviceId"
                options={deviceOptions}
                required
              />
              <TextField label="Port key" name="portKey" placeholder="DO_1" required />
              <SelectField label="Command" name="command" options={["SET_ON", "SET_OFF", "PULSE"]} required />
              <TextField label="Requested value" name="requestedValue" placeholder="true / false / 1" required />
              <TextField label="Reason" name="reason" placeholder="Restore warehouse exhaust fan" required />
              {createError ? <div className="text-sm text-red-700">{createError}</div> : null}
              <Button variant="danger">{isSubmitting ? "Requesting..." : "Request Command"}</Button>
            </form>
          </ModalTrigger>
        }
      />
      <Panel title="Command History">
        <DataTable
          rows={actuations}
          rowKey={(row) => String(row.id)}
          columns={[
            { key: "device", header: "Device" },
            { key: "portKey", header: "Port" },
            { key: "command", header: "Command" },
            { key: "status", header: "Status", render: (row) => <StatusPill value={String(row.status)} /> },
            { key: "requestedBy", header: "Requested by" },
            { key: "reason", header: "Reason" },
            { key: "createdAt", header: "Created" }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
