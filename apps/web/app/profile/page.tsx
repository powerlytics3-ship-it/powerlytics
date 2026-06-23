import { getServerSession } from "next-auth";
import { authOptions } from "../../auth.config";
import { redirect } from "next/navigation";
import { PageHeader, Panel } from "../../components/app-shell";
import { AppShell } from "../../components/app-shell";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <AppShell>
      <PageHeader
        title="User Profile"
        description="View your account information and access details"
      />

      <div className="grid gap-6 max-w-2xl">
        <Panel title="Account Information" className="bg-white">
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase">Email</label>
              <p className="mt-1 text-sm text-zinc-950">{user?.email}</p>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase">Name</label>
              <p className="mt-1 text-sm text-zinc-950">{user?.name || "Not set"}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase">User ID</label>
              <p className="mt-1 text-sm font-mono text-zinc-600 break-all">{user?.id}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Workspace Access" className="bg-white">
          <div className="px-4 py-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase">Primary Workspace</label>
              <p className="mt-1 text-sm text-zinc-950 font-mono">{user?.workspaceId || "None"}</p>
            </div>

            {user?.workspaceIds && user.workspaceIds.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase">All Workspaces</label>
                <div className="mt-2 space-y-2">
                  {user.workspaceIds.map((wsId) => (
                    <div
                      key={wsId}
                      className="text-sm px-3 py-2 bg-zinc-50 border border-zinc-200 rounded text-zinc-700 font-mono"
                    >
                      {wsId}
                      {wsId === user.workspaceId && (
                        <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Roles & Permissions" className="bg-white">
          <div className="px-4 py-4 space-y-4">
            {user?.roles && user.roles.length > 0 ? (
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Your Roles</label>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-600">No roles assigned</p>
            )}
            <p className="text-xs text-zinc-500 mt-2">
              Roles determine what actions you can perform in this platform.
            </p>
          </div>
        </Panel>

        <Panel title="Authentication Token" className="bg-white">
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-zinc-600">
              Your API token is included in your session and automatically sent with requests to the API.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
              <code className="text-xs text-zinc-700 break-all font-mono">
                {user?.apiToken ? user.apiToken.slice(0, 50) + "..." : "No token"}
              </code>
            </div>
            <p className="text-xs text-amber-600">
              ⚠️ Never share your token. It expires after 8 hours.
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
