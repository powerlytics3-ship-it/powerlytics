import { Activity, AlertTriangle, Cpu, RadioTower } from "lucide-react";
import { AppShell, Metric, PageHeader, Panel, StatusPill } from "../components/app-shell";
import { apiGet } from "../lib/api";

const fleet = [
  { name: "Boiler Room Monitor", imei: "867530900001", status: "ACTIVE", health: "ONLINE", model: "EDGE-100 v1" },
  { name: "Line 2 Energy Meter", imei: "867530900002", status: "COMMISSIONING", health: "DEGRADED", model: "EDGE-100 v1" },
  { name: "Warehouse Relay Panel", imei: "867530900003", status: "MAINTENANCE", health: "OFFLINE", model: "RELAY-IO v2" }
];

export default async function Page() {
  const apiFleet = await apiGet<Array<Record<string, unknown>>>("/devices", []);
  const visibleFleet = apiFleet.length
    ? apiFleet.map((device) => ({
        name: String(device.name),
        imei: String(device.imei),
        status: String(device.lifecycleStatus),
        health: String(device.healthStatus),
        model: String(device.deviceModelId ?? "")
      }))
    : fleet;

  return (
    <AppShell>
      <PageHeader
        title="Operations Overview"
        description="Fleet state, config deployment, telemetry freshness, and safety-critical work queues in one workspace-scoped view."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Active devices" value={String(visibleFleet.filter((device) => device.status === "ACTIVE").length)} detail={`${visibleFleet.filter((device) => device.health === "ONLINE").length} online`} />
        <Metric label="Telemetry points" value="1.2M" detail="Last 24 hours" />
        <Metric label="Open incidents" value="7" detail="2 high severity" />
        <Metric label="Pending actuations" value="3" detail="Awaiting approval" />
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
                {visibleFleet.map((device) => (
                  <tr key={device.imei} className="border-t border-zinc-200">
                    <td className="px-3 py-3">
                      <div className="font-medium text-zinc-950">{device.name}</div>
                      <div className="text-xs text-zinc-500">{device.imei}</div>
                    </td>
                    <td className="px-3 py-3 text-zinc-700">{device.model}</td>
                    <td className="px-3 py-3"><StatusPill value={device.status} /></td>
                    <td className="px-3 py-3"><StatusPill value={device.health} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Risk Queue">
          <div className="space-y-3">
            {[
              { icon: AlertTriangle, title: "AI_1 threshold breach", detail: "Boiler Room Monitor above 80 C for 6 min" },
              { icon: Cpu, title: "Model draft waiting publish", detail: "Relay IO v3 needs review before manufacturing" },
              { icon: RadioTower, title: "Config callback missing", detail: "Line 2 Energy Meter has not ACKed deployment" },
              { icon: Activity, title: "Telemetry gap", detail: "Warehouse Relay Panel offline for 42 min" }
            ].map((item) => {
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
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
