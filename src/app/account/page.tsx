import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/account");

  return (
    <Web3Provider>
      <main className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <Navbar />
        <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
          <h1 className="font-sora text-3xl font-black">Account</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6">
              <h2 className="font-sora text-xl font-black">Profile</h2>
              <p className="mt-3 text-sm text-[var(--qp-text-muted)]">Account ID: {session.accountId.slice(0, 8)}...</p>
              <p className="mt-1 text-sm text-[var(--qp-text-muted)]">Signed in via: {session.authenticatedBy}</p>
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
            <a href="/api/auth/logout" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-300/35 bg-red-400/15 px-5 text-base font-bold text-red-100 hover:bg-red-400/25">Sign out</a>
          </div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}
