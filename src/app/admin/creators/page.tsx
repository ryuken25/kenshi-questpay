import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminCreatorsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin/creators");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  return (
    <main className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <a href="/admin" className="text-sm text-[var(--qp-text-muted)] hover:text-white">&larr; Admin</a>
        <h1 className="mt-3 font-sora text-3xl font-black">Creators</h1>
        <div className="mt-8 rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-8">
          <img src="/illustrations/questpay/dashboard-empty-state.svg" alt="Empty" className="mx-auto h-32 w-32 opacity-50" />
          <p className="mt-4 text-center text-base text-[var(--qp-text-muted)]">This section is being built out. Core auth and RBAC infrastructure is active.</p>
        </div>
      </div>
    </main>
  );
}
