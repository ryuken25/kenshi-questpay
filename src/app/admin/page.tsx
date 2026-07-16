import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Super Admin</p>
            <h1 className="mt-2 font-sora text-3xl font-black">Admin Console</h1>
          </div>
          <a href="/account" className="rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qp-surface-hover)]">Account</a>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a href="/admin/creators" className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 hover:bg-[var(--qp-surface-hover)]">
            <h2 className="font-sora text-xl font-black">Creators</h2>
            <p className="mt-2 text-sm text-[var(--qp-text-muted)]">Grant, revoke, and manage creator access.</p>
          </a>
          <a href="/admin/accounts" className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 hover:bg-[var(--qp-surface-hover)]">
            <h2 className="font-sora text-xl font-black">Accounts</h2>
            <p className="mt-2 text-sm text-[var(--qp-text-muted)]">Search accounts, identities, and status.</p>
          </a>
          <a href="/admin/audit" className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 hover:bg-[var(--qp-surface-hover)]">
            <h2 className="font-sora text-xl font-black">Audit Log</h2>
            <p className="mt-2 text-sm text-[var(--qp-text-muted)]">Immutable record of admin actions.</p>
          </a>
          <a href="/admin/system" className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 hover:bg-[var(--qp-surface-hover)]">
            <h2 className="font-sora text-xl font-black">System</h2>
            <p className="mt-2 text-sm text-[var(--qp-text-muted)]">Auth provider health and configuration.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
