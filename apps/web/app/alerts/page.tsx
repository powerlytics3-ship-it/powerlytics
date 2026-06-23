"use client";

import { useState } from "react";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, Tabs, TextField } from "../../components/ui";
import { useAlertIncidentsQuery, useAlertRulesQuery, useCreateAlertRuleMutation, useDevicesQuery, useWorkspacesQuery } from "../../lib/hooks/api";

export default function AlertsPage() {
  const { data: alertIncidents = [] } = useAlertIncidentsQuery();
  const { data: alertRules = [] } = useAlertRulesQuery();
  const { data: devices = [] } = useDevicesQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const createAlertRule = useCreateAlertRuleMutation();
  const [createError, setCreateError] = useState("");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  async function onCreateRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const form = new FormData(event.currentTarget);

    try {
      await createAlertRule.mutateAsync({
        workspaceId: String(form.get("workspaceId") ?? ""),
        deviceId: String(form.get("deviceId") ?? "") || undefined,
        portKey: String(form.get("portKey") ?? "") || undefined,
        comparator: String(form.get("comparator") ?? "GT"),
        threshold: Number(form.get("threshold") ?? 0),
        durationSeconds: Number(form.get("durationSeconds") ?? 0),
        severity: String(form.get("severity") ?? "MEDIUM"),
        message: String(form.get("message") ?? "")
      });
      event.currentTarget.reset();
      setRuleModalOpen(false);
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Failed to create rule");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Alerts"
        description="Rules evaluate telemetry and create incidents operators can acknowledge and resolve."
        action={
          <ModalTrigger label="New Rule" title="New Alert Rule" onClose={setRuleModalOpen}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateRule}>
              <SelectField
                label="Workspace"
                name="workspaceId"
                options={workspaces.map((workspace) => ({ label: String(workspace.displayName ?? workspace.id ?? ""), value: String(workspace.id ?? "") }))}
                required
              />
              <SelectField
                label="Device"
                name="deviceId"
                options={[
                  { label: "Any Device", value: "" },
                  ...devices.map((device) => ({ label: String(device.name ?? device.id ?? ""), value: String(device.id ?? "") }))
                ]}
              />
              <TextField label="Port key" name="portKey" placeholder="AI_1" />
              <SelectField label="Comparator" name="comparator" options={["GT", "GTE", "LT", "LTE", "EQ", "NEQ"]} required />
              <TextField label="Threshold" name="threshold" placeholder="80" type="number" required />
              <TextField label="Duration seconds" name="durationSeconds" placeholder="300" type="number" required />
              <SelectField label="Severity" name="severity" options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} required />
              <div className="md:col-span-2"><TextField label="Message" name="message" placeholder="Temperature high" required /></div>
              {createError ? <div className="md:col-span-2 text-sm text-red-700">{createError}</div> : null}
              <Button>{createAlertRule.isPending ? "Creating..." : "Create Rule"}</Button>
            </form>
          </ModalTrigger>
        }
      />
      <Tabs
        tabs={[
          {
            label: "Incidents",
            content: (
              <Panel title="Incidents">
                <DataTable rows={alertIncidents} rowKey={(row) => String(row.id)} columns={[
                  { key: "triggeredAt", header: "Triggered" },
                  { key: "deviceId", header: "Device" },
                  { key: "message", header: "Message" },
                  { key: "severity", header: "Severity", render: (row) => <StatusPill value={String(row.severity)} /> },
                  { key: "status", header: "Status", render: (row) => <StatusPill value={String(row.status)} /> }
                ]} />
              </Panel>
            )
          },
          {
            label: "Rules",
            content: (
              <Panel title="Rules">
                <DataTable rows={alertRules} rowKey={(row) => String(row.id)} columns={[
                  { key: "portKey", header: "Port" },
                  { key: "comparator", header: "Comparator" },
                  { key: "threshold", header: "Threshold" },
                  { key: "durationSeconds", header: "Duration" },
                  { key: "severity", header: "Severity", render: (row) => <StatusPill value={String(row.severity)} /> },
                  { key: "active", header: "Status", render: (row) => <StatusPill value={Boolean(row.active) ? "ACTIVE" : "INACTIVE"} /> }
                ]} />
              </Panel>
            )
          }
        ]}
      />
    </AppShell>
  );
}
