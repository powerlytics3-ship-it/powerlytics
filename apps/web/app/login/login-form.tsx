"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/app-shell";

export default function LoginForm({ callbackUrl, error }: { callbackUrl: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@powerlytic.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(error || "");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (result?.error) {
      setErrorMsg(result.error || "Login failed");
      return;
    }

    if (result?.ok) {
      router.push(callbackUrl);
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-zinc-700">Email</span>
        <input
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
          type="email"
          name="email"
          placeholder="admin@powerlytic.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-zinc-700">Password</span>
        <input
          className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
          type="password"
          name="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      {errorMsg && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading} variant="secondary">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <div className="text-sm text-zinc-500">
        Use credentials to sign in. Your session is stored securely.
      </div>
    </form>
  );
}
