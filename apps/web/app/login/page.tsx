import { Zap } from "lucide-react";
import { Button, Panel } from "../../components/app-shell";
import { TextField } from "../../components/ui";

export default function LoginPage() {
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
          <p className="mt-4 max-w-xl text-zinc-300">OIDC-ready identity, workspace-scoped roles, and device credentials keep human access separate from machine trust.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Panel title="Sign In">
            <div className="grid gap-4">
              <TextField label="Email" value="admin@powerlytic.com" />
              <TextField label="Password" value="Admin@123" />
              <Button>Continue</Button>
              <Button variant="secondary">Continue with Keycloak</Button>
              <div className="text-sm text-zinc-500">Dev fallback is present for local testing; production login should use OIDC Authorization Code + PKCE.</div>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
