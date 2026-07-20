import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminCreatorsPanel from "@/components/admin/AdminCreatorsPanel";
import { listAllApplications } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

export default async function AdminCreatorsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin/creators");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  const applications = await listAllApplications({ limit: 100 });
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link href="/admin" className="text-sm text-[var(--qp-text-muted)] hover:text-white">
          &larr; Admin
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Super Admin</p>
            <h1 className="mt-2 font-sora text-3xl font-black">Creators</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--qp-text-muted)]">
              Review creator applications. Approving grants the <b className="text-white">creator</b>{" "}
              role and unlocks Studio products/orders. {pendingCount} pending.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qp-surface-hover)]"
            >
              Users
            </Link>
            <Link
              href="/studio/products"
              className="rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qp-surface-hover)]"
            >
              Studio products
            </Link>
          </div>
        </div>

        <AdminCreatorsPanel initialApplications={applications} />
      </div>
    </div>
  );
}
