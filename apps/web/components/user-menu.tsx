"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Settings, User } from "lucide-react";
import type { Session } from "next-auth";

export function UserMenu({ session }: { session: Session | null }) {
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        <div className="h-6 w-6 rounded-full bg-zinc-300 flex items-center justify-center text-xs font-semibold">
          {session.user.name?.[0] || session.user.email?.[0]}
        </div>
        <span className="hidden sm:inline max-w-[120px] truncate">{session.user.email}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white shadow-lg z-50">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-xs font-medium text-zinc-500">ACCOUNT</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950 truncate">{session.user.email}</p>
            {session.user.workspaceId && (
              <p className="mt-1 text-xs text-zinc-600">Workspace: {session.user.workspaceId}</p>
            )}
          </div>

          {session.user.workspaceIds && session.user.workspaceIds.length > 0 && (
            <div className="border-b border-zinc-200 px-4 py-2">
              <p className="text-xs font-medium text-zinc-500 mb-1">YOUR WORKSPACES</p>
              <div className="space-y-1">
                {session.user.workspaceIds.map((wsId) => (
                  <div key={wsId} className="text-xs text-zinc-600 py-1">
                    • {wsId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.user.roles && session.user.roles.length > 0 && (
            <div className="border-b border-zinc-200 px-4 py-2">
              <p className="text-xs font-medium text-zinc-500 mb-1">YOUR ROLES</p>
              <div className="flex flex-wrap gap-1">
                {session.user.roles.map((role) => (
                  <span key={role} className="inline-block px-2 py-1 text-xs bg-zinc-100 text-zinc-700 rounded">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1 p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 rounded hover:bg-zinc-100"
            >
              <User size={16} />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 rounded hover:bg-zinc-100"
            >
              <Settings size={16} />
              Settings
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 rounded hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
