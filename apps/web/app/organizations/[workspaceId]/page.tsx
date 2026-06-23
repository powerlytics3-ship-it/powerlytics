"use client";

import { use, useState } from "react";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../../components/app-shell";
import { DataTable } from "../../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../../components/ui";
import { useCreateWorkspaceInvitationMutation, useOrganizationDetailQuery } from "../../../lib/hooks/api";

export default function OrganizationDetailPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const { data: orgDetail } = useOrganizationDetailQuery(workspaceId);
  const createInvitation = useCreateWorkspaceInvitationMutation(workspaceId);
  const [inviteError, setInviteError] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const workspace = ((orgDetail ?? {}) as Record<string, unknown>).organization as Record<string, unknown> | undefined;
  const members = (((orgDetail ?? {}) as Record<string, unknown>).users as Array<Record<string, unknown>>) ?? [];
  const fleet = (((orgDetail ?? {}) as Record<string, unknown>).devices as Array<Record<string, unknown>>) ?? [];

  async function onInviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError("");
    const form = new FormData(event.currentTarget);

    try {
      await createInvitation.mutateAsync({
        email: String(form.get("email") ?? ""),
        role: String(form.get("role") ?? "OPERATOR"),
        expiresInDays: Number(form.get("expiresInDays") ?? 7)
      });
      event.currentTarget.reset();
      setInviteModalOpen(false);
    } catch (cause) {
      setInviteError(cause instanceof Error ? cause.message : "Failed to send invite");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={String(workspace?.displayName ?? workspace?.id ?? "Workspace")}
        description={`${String(workspace?.industry ?? "-")} · ${String(workspace?.timezone ?? "-")} · ${String(workspace?.supportEmail ?? "-")}`}
        action={
          <ModalTrigger label="Invite Member" title="Invite Member" onClose={setInviteModalOpen}>
            <form className="grid gap-4" onSubmit={onInviteMember}>
              <TextField label="Email" name="email" placeholder="operator@acme.example" type="email" required />
              <SelectField label="Role" name="role" options={["WORKSPACE_ADMIN", "OPERATOR", "VIEWER"]} required />
              <TextField label="Expires in days" name="expiresInDays" placeholder="7" type="number" required />
              {inviteError ? <div className="text-sm text-red-700">{inviteError}</div> : null}
              <Button>{createInvitation.isPending ? "Sending..." : "Send Invite"}</Button>
            </form>
          </ModalTrigger>
        }
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Members">
          <DataTable rows={members} rowKey={(user) => String(user.id)} columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            {
              key: "role",
              header: "Role",
              render: (user) => {
                const membership = Array.isArray(user.memberships) ? (user.memberships as Array<Record<string, unknown>>)[0] : undefined;
                return String(membership?.role ?? "-");
              }
            },
            { key: "active", header: "Status", render: (user) => <StatusPill value={Boolean(user.active) ? "ACTIVE" : "INACTIVE"} /> }
          ]} />
        </Panel>
        <Panel title="Devices">
          <DataTable rows={fleet} rowKey={(device) => String(device.id)} columns={[
            { key: "name", header: "Name" },
            { key: "imei", header: "IMEI" },
            { key: "lifecycleStatus", header: "Lifecycle", render: (device) => <StatusPill value={String(device.lifecycleStatus ?? "-")} /> }
          ]} />
        </Panel>
      </div>
    </AppShell>
  );
}
