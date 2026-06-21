import { AppShell, Button, PageHeader, Panel } from "../../../components/app-shell";
import { SelectField, TextField } from "../../../components/ui";

export default function NewOrganizationPage() {
  return (
    <AppShell>
      <PageHeader title="New Workspace" description="Create an organization tenant and invite the first workspace admin." action={<Button>Create Workspace</Button>} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Organization">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Display name" placeholder="Acme Foundry" />
            <TextField label="Slug" placeholder="acme-foundry" />
            <TextField label="Legal name" placeholder="Acme Foundry Pvt Ltd" />
            <TextField label="Industry" placeholder="Manufacturing" />
            <TextField label="Support email" placeholder="ops@acme.example" />
            <SelectField label="Timezone" options={["Asia/Kolkata", "UTC", "Europe/London"]} />
          </div>
        </Panel>
        <Panel title="First Admin">
          <div className="grid gap-4">
            <TextField label="Name" placeholder="Ops Lead" />
            <TextField label="Email" placeholder="ops@acme.example" />
            <TextField label="Phone" placeholder="+91 90000 00000" />
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
