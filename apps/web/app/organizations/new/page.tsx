"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, Button, PageHeader, Panel } from "../../../components/app-shell";
import { SelectField, TextField } from "../../../components/ui";
import { useRegisterOrganizationAndAdminMutation } from "../../../lib/hooks/api";

export default function NewOrganizationPage() {
  const router = useRouter();
  const registerOrganization = useRegisterOrganizationAndAdminMutation();
  const [error, setError] = useState("");

  async function onCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const result = await registerOrganization.mutateAsync({
        orgData: {
          displayName: String(form.get("displayName") ?? ""),
          name: String(form.get("displayName") ?? ""),
          slug: String(form.get("slug") ?? ""),
          legalName: String(form.get("legalName") ?? "") || undefined,
          industry: String(form.get("industry") ?? "") || undefined,
          supportEmail: String(form.get("supportEmail") ?? "") || undefined,
          timezone: String(form.get("timezone") ?? "UTC")
        },
        adminUser: {
          name: String(form.get("adminName") ?? ""),
          email: String(form.get("adminEmail") ?? ""),
          phone: String(form.get("adminPhone") ?? "") || undefined
        }
      });

      const organization = (result as Record<string, unknown>).organization as Record<string, unknown> | undefined;
      const workspaceId = String(organization?.id ?? "");
      if (workspaceId) {
        router.push(`/organizations/${workspaceId}`);
        return;
      }
      router.push("/organizations");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to create workspace");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="New Workspace"
        description="Create an organization tenant and invite the first workspace admin."
        action={<Button form="new-workspace-form">{registerOrganization.isPending ? "Creating..." : "Create Workspace"}</Button>}
      />
      <form className="grid gap-4 xl:grid-cols-2" id="new-workspace-form" onSubmit={onCreateWorkspace}>
        <Panel title="Organization">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Display name" name="displayName" placeholder="Acme Foundry" required />
            <TextField label="Slug" name="slug" placeholder="acme-foundry" required />
            <TextField label="Legal name" name="legalName" placeholder="Acme Foundry Pvt Ltd" />
            <TextField label="Industry" name="industry" placeholder="Manufacturing" />
            <TextField label="Support email" name="supportEmail" placeholder="ops@acme.example" type="email" />
            <SelectField label="Timezone" name="timezone" options={["Asia/Kolkata", "UTC", "Europe/London"]} required />
          </div>
        </Panel>
        <Panel title="First Admin">
          <div className="grid gap-4">
            <TextField label="Name" name="adminName" placeholder="Ops Lead" required />
            <TextField label="Email" name="adminEmail" placeholder="ops@acme.example" type="email" required />
            <TextField label="Phone" name="adminPhone" placeholder="+91 90000 00000" />
          </div>
          {error ? <div className="mt-4 text-sm text-red-700">{error}</div> : null}
          <div className="mt-4"><Button>{registerOrganization.isPending ? "Creating..." : "Create Workspace"}</Button></div>
        </Panel>
      </form>
    </AppShell>
  );
}
