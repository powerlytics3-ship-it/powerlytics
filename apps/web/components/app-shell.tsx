"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Building2, Cpu, FileClock, LayoutDashboard, RadioTower, Settings, ShieldCheck, SlidersHorizontal, Users, Zap } from "lucide-react";
import { clsx } from "clsx";
import { UserMenu } from "./user-menu";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: RadioTower },
  { href: "/device-models", label: "Models", icon: Cpu },
  { href: "/port-types", label: "Port Types", icon: SlidersHorizontal },
  { href: "/telemetry", label: "Telemetry", icon: Activity },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/actuations", label: "Actuation", icon: Zap },
  { href: "/organizations", label: "Workspaces", icon: Building2 },
  { href: "/users", label: "Users", icon: Users },
  { href: "/audit", label: "Audit", icon: FileClock },
  { href: "/settings", label: "Security", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-zinc-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-graphite text-white">
            <Zap size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-950">Powerlytic</div>
            <div className="text-xs text-zinc-500">Industrial IoT</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium",
                  active ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6">
          <div>
            <div className="text-sm font-semibold text-zinc-950">Platform Control Center</div>
            <div className="text-xs text-zinc-500">Workspace scoped operations and hardware contracts</div>
          </div>
          <UserMenu session={session} />
        </header>
        <main className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const tone =
    value.includes("ACTIVE") || value.includes("ONLINE") || value.includes("APPLIED")
      ? "bg-emerald-100 text-emerald-800"
      : value.includes("ERROR") || value.includes("CRITICAL")
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return <span className={clsx("rounded px-2 py-0.5 text-xs font-medium", tone)}>{value}</span>;
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "secondary" && "border border-zinc-300 bg-white text-zinc-950 hover:bg-zinc-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-md border border-zinc-200 bg-white", className)}>
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Metric({ label, value, detail }: { label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-normal text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-950">{value}</div>
      {detail ? <div className="mt-1 text-sm text-zinc-500">{detail}</div> : null}
    </div>
  );
}
