import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin/users");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  const sb = getSupabase();
  const { data: accounts = [] } = sb
    ? await sb
        .from("accounts")
        .select("id,primary_email,status,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  const rows = accounts || [];

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-[var(--qp-text-muted)] hover:text-white">
          &larr; Admin
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Super Admin</p>
            <h1 className="mt-2 font-sora text-3xl font-black">Users</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--qp-text-muted)]">
              Platform accounts, status, and identity anchors. Role grants still flow through Creators
              tools until full user admin lands.
            </p>
          </div>
          <Link
            href="/admin/creators"
            className="rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qp-surface-hover)]"
          >
            Manage creators
          </Link>
        </div>

        <div className="mt-8 overflow-x-auto rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[rgba(8,8,14,.55)] text-xs uppercase text-muted">
              <tr>
                <th className="p-4">Account</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((account) => (
                <tr key={account.id} className="border-t border-[var(--qp-border-soft)]">
                  <td className="p-4 font-mono text-xs text-[var(--qp-violet-300)]">
                    {String(account.id).slice(0, 8)}…
                  </td>
                  <td>{account.primary_email || "—"}</td>
                  <td>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold">
                      {account.status || "active"}
                    </span>
                  </td>
                  <td className="text-muted">
                    {account.created_at ? new Date(account.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="p-8 text-center">
              <img
                src="/illustrations/questpay/dashboard-empty-state.svg"
                alt=""
                className="mx-auto h-32 w-32 opacity-50"
              />
              <p className="mt-4 text-base text-[var(--qp-text-muted)]">
                No accounts returned. Auth/RBAC is active; populate via sign-in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
