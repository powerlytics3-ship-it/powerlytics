import { Activity, AlertTriangle, Cpu, RadioTower } from "lucide-react";
import { AppShell, Metric, PageHeader, Panel, StatusPill } from "../components/app-shell";
import { apiGet } from "../lib/api";

export default async function Page() {
  const apiFleet = await apiGet<Array<Record<string, unknown>>>("/devices", []);
  const alertIncidents = await apiGet<Array<Record<string, unknown>>>("/alert-incidents", []);
  const telemetryCount = await Promise.all(
    apiFleet.map(async (device) => {
      const id = String(device.id ?? "");
      if (!id) return 0;
      const values = await apiGet<Record<string, unknown>>(`/devices/${id}/values/latest`, { data: [] });
      return Array.isArray(values.data) ? values.data.length : 0;
    })
  ).then((counts) => counts.reduce((acc, curr) => acc + curr, 0));
  const actuationCount = await Promise.all(
    apiFleet.map(async (device) => {
      const id = String(device.id ?? "");
      if (!id) return 0;
      const items = await apiGet<Array<Record<string, unknown>>>(`/devices/${id}/actuations`, []);
      return items.filter((item) => String(item.status ?? "").includes("PENDING")).length;
    })
  ).then((counts) => counts.reduce((acc, curr) => acc + curr, 0));

  const visibleFleet = apiFleet.map((device) => ({
    name: String(device.name),
    imei: String(device.imei),
    status: String(device.lifecycleStatus),
    health: String(device.healthStatus),
    model: String(device.deviceModelId ?? "")
  }));
  const riskItems = alertIncidents.slice(0, 4).map((incident) => ({
    icon: AlertTriangle,
    title: String(incident.message ?? "Alert incident"),
    detail: `${String(incident.deviceId ?? "unknown-device")} · ${String(incident.severity ?? "UNKNOWN")}`
  }));

  return (
    <AppShell>
      <PageHeader
        title="Operations Overview"
        description="Fleet state, config deployment, telemetry freshness, and safety-critical work queues in one workspace-scoped view."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active devices" value={String(visibleFleet.filter((device) => device.status === "ACTIVE").length)} detail={`${visibleFleet.filter((device) => device.health === "ONLINE").length} online`} />
        <Metric label="Latest telemetry points" value={String(telemetryCount)} detail="Latest snapshot across fleet" />
        <Metric label="Open incidents" value={String(alertIncidents.filter((incident) => String(incident.status) !== "RESOLVED").length)} detail={`${alertIncidents.filter((incident) => String(incident.severity) === "HIGH" || String(incident.severity) === "CRITICAL").length} high/critical`} />
        <Metric label="Pending actuations" value={String(actuationCount)} detail="Awaiting approval or ACK" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Fleet">
          <div className="overflow-hidden rounded-md border border-zinc-200">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-normal text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Lifecycle</th>
                  <th className="px-3 py-2">Health</th>
                </tr>
              </thead>
              <tbody>
                {visibleFleet.length ? (
                  visibleFleet.map((device) => (
                    <tr key={device.imei} className="border-t border-zinc-200">
                      <td className="px-3 py-3">
                        <div className="font-medium text-zinc-950">{device.name}</div>
                        <div className="text-xs text-zinc-500">{device.imei}</div>
                      </td>
                      <td className="px-3 py-3 text-zinc-700">{device.model}</td>
                      <td className="px-3 py-3"><StatusPill value={device.status} /></td>
                      <td className="px-3 py-3"><StatusPill value={device.health} /></td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-zinc-200">
                    <td className="px-3 py-6 text-zinc-500" colSpan={4}>No devices found yet. Manufacture or claim a device to see fleet data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Risk Queue">
          <div className="space-y-3">
            {riskItems.length ? riskItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-md border border-zinc-200 p-3">
                  <Icon size={18} className="mt-0.5 text-copper" />
                  <div>
                    <div className="text-sm font-medium text-zinc-950">{item.title}</div>
                    <div className="text-sm text-zinc-600">{item.detail}</div>
                  </div>
                </div>
              );
            }) : <div className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-500">No active risk incidents.</div>}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
