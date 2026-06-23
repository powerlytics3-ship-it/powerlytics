import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-lg rounded-md border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-zinc-950">Access denied</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your account is authenticated but does not have permission to open this page.
        </p>
        <div className="mt-5 flex gap-3">
          <Link className="inline-flex h-9 items-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white" href="/">
            Go to overview
          </Link>
          <Link className="inline-flex h-9 items-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800" href="/api/auth/signout?callbackUrl=/login">
            Sign out
          </Link>
        </div>
      </div>
    </main>
  );
}
