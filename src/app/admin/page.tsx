import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (!session.roles.includes("super_admin")) redirect("/my-orders");

  const cards = [
    {
      href: "/admin/users",
      title: "Users",
      body: "Search accounts, identities, and account status.",
    },
    {
      href: "/admin/transactions",
      title: "Transactions",
      body: "All verified payments, order states, and release audit surface.",
    },
    {
      href: "/admin/creators",
      title: "Creators",
      body: "Grant, revoke, and manage creator access.",
    },
    {
      href: "/admin/audit",
      title: "Audit Log",
      body: "Immutable record of admin actions.",
    },
    {
      href: "/admin/system",
      title: "System",
      body: "Auth provider health and configuration.",
    },
    {
      href: "/studio",
      title: "Creator Studio",
      body: "Jump into creator operations (super admin full access).",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Super Admin</p>
            <h1 className="mt-2 font-sora text-3xl font-black">Admin Console</h1>
          </div>
          <Link
            href="/account"
            className="rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-4 py-2 text-sm font-semibold hover:bg-[var(--qp-surface-hover)]"
          >
            Account
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 hover:bg-[var(--qp-surface-hover)]"
            >
              <h2 className="font-sora text-xl font-black">{card.title}</h2>
              <p className="mt-2 text-sm text-[var(--qp-text-muted)]">{card.body}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
