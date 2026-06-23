"use client";

import { useState } from "react";
import { AppShell, Button, PageHeader, Panel, StatusPill } from "../../components/app-shell";
import { DataTable } from "../../components/table";
import { ModalTrigger, SelectField, TextField } from "../../components/ui";
import { useCreatePortTypeMutation, usePortTypesQuery } from "../../lib/hooks/api";

export default function PortTypesPage() {
  const { data: portTypes = [], isLoading } = usePortTypesQuery();
  const createPortType = useCreatePortTypeMutation();
  const [createError, setCreateError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  async function onCreatePortType(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError("");
    const form = new FormData(event.currentTarget);
    try {
      await createPortType.mutateAsync({
        name: String(form.get("name") ?? ""),
        codeName: String(form.get("codeName") ?? ""),
        category: String(form.get("category") ?? "INPUT"),
        valueFormat: String(form.get("valueFormat") ?? "DIGITAL"),
        description: String(form.get("description") ?? "") || undefined
      });
      event.currentTarget.reset();
      setModalOpen(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create port type");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Port Types"
        description="Reusable input/output capability definitions used to generate stable device model port keys."
        action={
          <ModalTrigger label="Add Port Type" title="Add Port Type" onClose={setModalOpen}>
            <form className="grid gap-4" onSubmit={onCreatePortType}>
              <TextField label="Name" name="name" placeholder="Digital Input" required />
              <TextField label="Code name" name="codeName" placeholder="DI" required />
              <SelectField label="Category" name="category" options={["INPUT", "OUTPUT"]} required />
              <SelectField label="Value format" name="valueFormat" options={["DIGITAL", "ANALOG", "MODBUS", "AC_INPUT"]} required />
              <TextField label="Description" name="description" placeholder="Discrete input state" />
              {createError ? <div className="text-sm text-red-700">{createError}</div> : null}
              <Button>{createPortType.isPending ? "Creating..." : "Create"}</Button>
            </form>
          </ModalTrigger>
        }
      />
      <Panel title="Definitions">
        {isLoading ? <div className="p-4 text-sm text-zinc-500">Loading port types...</div> : (
          <DataTable
            rows={portTypes}
            rowKey={(type) => String(type.id)}
            columns={[
              { key: "name", header: "Name" },
              { key: "codeName", header: "Code" },
              { key: "category", header: "Category" },
              { key: "valueFormat", header: "Format" },
              { key: "active", header: "Status", render: (type) => <StatusPill value={Boolean(type.active) ? "ACTIVE" : "INACTIVE"} /> }
            ]}
          />
        )}
      </Panel>
    </AppShell>
  );
}
