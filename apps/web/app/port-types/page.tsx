import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { portTypes } from "../../lib/mock-data";

export default function PortTypesPage() {
  return (
    <AppShell>
      <PageHeader
        title="Port Types"
        description="Reusable input/output capability definitions used to generate stable device model port keys."
        action={
          <ModalTrigger label="Add Port Type" title="Add Port Type">
            <div className="grid gap-4">
              <TextField label="Name" placeholder="Digital Input" />
              <TextField label="Code name" placeholder="DI" />
              <SelectField label="Category" options={["INPUT", "OUTPUT"]} />
              <SelectField label="Value format" options={["DIGITAL", "ANALOG", "MODBUS", "AC_INPUT"]} />
              <Button>Create</Button>
            </div>
          </ModalTrigger>
        }
      />
      <Panel title="Definitions">
        <DataTable
          rows={portTypes}
          rowKey={(type) => String(type.id)}
          columns={[
            { key: "name", header: "Name" },
            { key: "codeName", header: "Code" },
            { key: "category", header: "Category" },
            { key: "valueFormat", header: "Format" },
            { key: "active", header: "Status", render: (type) => <StatusPill value={type.active ? "ACTIVE" : "INACTIVE"} /> }
          ]}
        />
      </Panel>
    </AppShell>
  );
}
