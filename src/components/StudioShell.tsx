import Link from "next/link";

const navItem =
  "rounded-xl border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] px-3 py-2 text-sm font-medium text-[var(--qp-text-secondary)] hover:bg-[var(--qp-surface-hover)] hover:text-white";

export default function StudioShell({
  email,
  children,
  showAdmin = true,
}: {
  email: string;
  children: React.ReactNode;
  /** Super admins get a link into the platform admin console. */
  showAdmin?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <header className="border-b border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/studio" className="font-sora text-xl font-black text-[var(--qp-text-primary)]">
              QuestPay Studio
            </Link>
            <p className="mt-1 text-sm text-[var(--qp-text-muted)]">Creator operations · custody → accept → release</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Studio navigation">
            <Link className={navItem} href="/studio">
              Overview
            </Link>
            <Link className={navItem} href="/studio/products">
              Products
            </Link>
            <Link className={navItem} href="/studio/orders">
              Orders
            </Link>
            <Link className={navItem} href="/studio/earnings">
              Earnings
            </Link>
            <Link className={navItem} href="/studio/settings">
              Settings
            </Link>
            {showAdmin ? (
              <Link className={navItem} href="/admin">
                Admin
              </Link>
            ) : null}
            <span className="max-w-48 truncate px-2 text-sm text-[var(--qp-text-muted)]">{email}</span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-red-300/35 bg-red-400/15 px-3 py-2 text-sm font-bold text-red-100 hover:bg-red-400/25"
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
