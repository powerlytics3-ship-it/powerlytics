"use client";

import { clsx } from "clsx";
import { X } from "lucide-react";
import { useState } from "react";

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey
}: {
  columns: Array<{ key: keyof T | string; header: string; render?: (row: T) => React.ReactNode }>;
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-normal text-zinc-500">
          <tr>
            {columns.map((column) => <th key={String(column.key)} className="px-3 py-2">{column.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-zinc-200">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-3 py-3 text-zinc-700">
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TextField({
  label,
  name,
  value,
  placeholder,
  type = "text",
  required = false
}: {
  label: string;
  name?: string;
  value?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
        defaultValue={value}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

type SelectOption = string | { label: string; value: string };

export function SelectField({
  label,
  name,
  options,
  value,
  required = false
}: {
  label: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <select
        className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
        defaultValue={value}
        name={name}
        required={required}
      >
        {options.map((option) => {
          const normalized = typeof option === "string" ? { label: option, value: option } : option;
          return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
        })}
      </select>
    </label>
  );
}

export function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input type="checkbox" className="h-4 w-4 accent-zinc-950" defaultChecked={defaultChecked} />
    </label>
  );
}

export function ModalTrigger({
  label,
  title,
  children,
  variant = "primary",
  onClose
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClose?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  
  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    onClose?.(isOpen);
  };

  const titleId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-dialog-title`;
  const buttonClass = clsx(
    "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium",
    variant === "primary" && "bg-zinc-950 text-white",
    variant === "secondary" && "border border-zinc-300 bg-white text-zinc-950",
    variant === "danger" && "bg-red-600 text-white"
  );

  return (
    <>
      <button className={buttonClass} onClick={() => handleClose(true)}>{label}</button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 p-4">
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md bg-white shadow-xl"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-950" id={titleId}>{title}</h2>
              <button className="rounded p-1 hover:bg-zinc-100" onClick={() => handleClose(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function Tabs({ tabs }: { tabs: Array<{ label: string; content: React.ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.label ?? "");
  const current = tabs.find((tab) => tab.label === active) ?? tabs[0];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 rounded-md bg-zinc-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={clsx("h-9 rounded px-3 text-sm font-medium", active === tab.label ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600")}
            onClick={() => setActive(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {current?.content}
    </div>
  );
}
