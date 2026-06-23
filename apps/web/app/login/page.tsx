import { Zap } from "lucide-react";
import { Button, Panel } from "../../components/app-shell";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  const callbackUrl = resolvedParams?.callbackUrl || "/dashboard";

  return (
    <main className="grid min-h-screen bg-zinc-100 lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-zinc-950">
            <Zap size={20} />
          </div>
          <div>
            <div className="font-semibold">Powerlytic</div>
            <div className="text-sm text-zinc-300">Industrial IoT Control Plane</div>
          </div>
        </div>
        <div>
          <h1 className="max-w-2xl text-4xl font-semibold">Secure monitoring, configuration, and actuation for field hardware.</h1>
          <p className="mt-4 max-w-xl text-zinc-300">RBAC-protected access with workspace-scoped roles and device credentials for secure IoT operations.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Panel title="Sign In">
            <LoginForm callbackUrl={callbackUrl} error={error} />
          </Panel>
        </div>
      </section>
    </main>
  );
}
