import { AppShell, PageHeader, Panel } from "../../components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Security"
        description="Auth.js, device credentials, audit policy, config deployment safety, and actuation approval settings."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Human Identity">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Provider</dt><dd className="font-medium text-zinc-950">Auth.js Credentials</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Session</dt><dd className="font-medium text-zinc-950">JWT + API bearer token</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Memberships</dt><dd className="font-medium text-zinc-950">Workspace scoped</dd></div>
          </dl>
        </Panel>
        <Panel title="Device Trust">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Credentials</dt><dd className="font-medium text-zinc-950">Per-device API key</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Future path</dt><dd className="font-medium text-zinc-950">mTLS certificates</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-zinc-500">Callbacks</dt><dd className="font-medium text-zinc-950">Authenticated</dd></div>
          </dl>
        </Panel>
      </div>
    </AppShell>
  );
}
