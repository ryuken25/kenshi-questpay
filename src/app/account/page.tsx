import { getSession, getServiceClient } from "@/lib/auth";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";
import { getProfile } from "@/lib/profile";
import AccountProfileForm from "@/components/account/AccountProfileForm";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/account");

  const [profile, identitiesResult] = await Promise.all([
    getProfile(session.accountId),
    getServiceClient()
      .from("account_identities")
      .select("provider, normalized_email, normalized_wallet, is_primary, verified_at")
      .eq("account_id", session.accountId),
  ]);
  const identities = identitiesResult.data ?? [];

  return (
    <Web3Provider>
      <main className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="font-sora text-3xl font-black">Account</h1>

          <div className="mt-8">
            <AccountProfileForm profile={profile} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6">
              <h2 className="font-sora text-xl font-black">Linked identities</h2>
              <div className="mt-3 space-y-2">
                {identities.length === 0 ? (
                  <p className="text-sm text-[var(--qp-text-muted)]">No linked identities found.</p>
                ) : (
                  identities.map((id, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--qp-border-soft)] bg-[var(--qp-bg-elevated)] px-3 py-2 text-sm">
                      <span className="font-semibold capitalize text-[var(--qp-text-primary)]">{id.provider}</span>
                      <span className="truncate text-[var(--qp-text-muted)]">{id.normalized_email || id.normalized_wallet || "—"}</span>
                    </div>
                  ))
                )}
              </div>
              <p className="mt-3 text-xs text-[var(--qp-text-subtle)]">Signed in via: {session.authenticatedBy}</p>
            </div>
            <div className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6">
              <h2 className="font-sora text-xl font-black">Roles</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {session.roles.map((role) => (
                  <span key={role} className="rounded-full border border-[var(--qp-border-default)] bg-[var(--qp-bg-elevated)] px-3 py-1 text-sm font-semibold text-[var(--qp-text-primary)]">{role}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-300/35 bg-red-400/15 px-5 text-base font-bold text-red-100 hover:bg-red-400/25">Sign out</button>
            </form>
          </div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}
