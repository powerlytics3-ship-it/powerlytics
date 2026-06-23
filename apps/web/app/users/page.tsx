"use client";

import { useState } from "react";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { useCreateUserMutation, useUsersQuery, useWorkspacesQuery } from "../../lib/hooks/api";

export default function UsersPage() {
  const { data: users = [], isLoading: isUsersLoading } = useUsersQuery();
  const { data: workspaces = [] } = useWorkspacesQuery();
  const createUser = useCreateUserMutation();
  const [inviteError, setInviteError] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  async function onInviteUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError("");
    const form = new FormData(event.currentTarget);

    try {
      await createUser.mutateAsync({
        email: String(form.get("email") ?? ""),
        workspaceId: String(form.get("workspaceId") ?? ""),
        role: String(form.get("role") ?? "OPERATOR"),
        name: String(form.get("name") ?? "") || undefined
      });
      event.currentTarget.reset();
      setInviteModalOpen(false);
    } catch (cause) {
      setInviteError(cause instanceof Error ? cause.message : "Failed to invite user");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Users"
        description="Global identities connect to tenant access through workspace memberships."
        action={
          <ModalTrigger label="Invite User" title="Invite User" onClose={setInviteModalOpen}>
            <form className="grid gap-4" onSubmit={onInviteUser}>
              <TextField label="Email" name="email" placeholder="operator@acme.example" type="email" required />
              <TextField label="Name" name="name" placeholder="Operator" />
              <SelectField
                label="Workspace"
                name="workspaceId"
                options={workspaces.map((workspace) => ({ label: String(workspace.displayName ?? workspace.id ?? ""), value: String(workspace.id ?? "") }))}
                required
              />
              <SelectField label="Role" name="role" options={["WORKSPACE_ADMIN", "OPERATOR", "VIEWER"]} required />
              {inviteError ? <div className="text-sm text-red-700">{inviteError}</div> : null}
              <Button>{createUser.isPending ? "Sending..." : "Send Invite"}</Button>
            </form>
          </ModalTrigger>
        }
      />
      <Panel title="User Directory">
        {isUsersLoading ? (
          <div className="p-4 text-sm text-zinc-500">Loading users...</div>
        ) : (
          <DataTable
            rows={users}
            rowKey={(user) => String(user.id)}
            columns={[
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone" },
              {
                key: "role",
                header: "Role",
                render: (user) => {
                  const membership = Array.isArray(user.memberships) ? (user.memberships as Array<Record<string, unknown>>)[0] : undefined;
                  return String(membership?.role ?? "-");
                }
              },
              {
                key: "workspaceId",
                header: "Workspace",
                render: (user) => {
                  const membership = Array.isArray(user.memberships) ? (user.memberships as Array<Record<string, unknown>>)[0] : undefined;
                  const workspaceId = String(membership?.workspaceId ?? "");
                  return String(workspaces.find((workspace) => String(workspace.id) === workspaceId)?.displayName ?? workspaceId);
                }
              },
              { key: "active", header: "Status", render: (user) => <StatusPill value={Boolean(user.active) ? "ACTIVE" : "INACTIVE"} /> },
              { key: "lastLoginAt", header: "Last login", render: (user) => String(user.lastLoginAt ?? "Never") }
            ]}
          />
        )}
      </Panel>
    </AppShell>
  );
}
