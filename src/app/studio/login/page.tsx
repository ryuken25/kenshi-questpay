import Link from "next/link";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

export default function StudioLogin({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  return (
    <Web3Provider>
      <main className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
        <section className="mx-auto max-w-lg px-4 pb-20 pt-28">
          <div className="glass-panel-strong rounded-[2rem] p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-[#C1B6FF]">Private creator workflow</p>
            <h1 className="mt-3 font-sora text-3xl font-black text-[var(--qp-text-primary)]">QuestPay Studio</h1>
            <p className="mt-3 text-base leading-7 text-[var(--qp-text-secondary)]">Public checkout needs no account. Studio access requires the allowlisted owner identity through Supabase Auth.</p>
            {searchParams.sent && <p className="mt-5 rounded-2xl border border-green-300/30 bg-green-400/10 p-4 text-sm font-medium leading-6 text-green-100">If that email is authorized, a secure sign-in link is on the way.</p>}
            {searchParams.error && <p className="mt-5 rounded-2xl border border-red-300/30 bg-red-400/10 p-4 text-sm font-medium leading-6 text-red-100">Sign-in could not be completed. Check the Supabase provider configuration and try again.</p>}
            <a href="/api/auth/oauth" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-base font-black text-black">Continue with Google</a>
            <div className="my-5 flex items-center gap-3 text-sm text-[var(--qp-text-muted)]"><span className="h-px flex-1 bg-[var(--qp-border-soft)]" />or owner magic link<span className="h-px flex-1 bg-[var(--qp-border-soft)]" /></div>
            <form action="/api/auth/studio-login" method="post" className="space-y-3">
              <label className="block text-sm font-semibold text-[var(--qp-text-primary)]">Owner email
                <input name="email" type="email" required autoComplete="email" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-bg-elevated)] px-4 text-base text-[var(--qp-text-primary)] placeholder:text-[var(--qp-text-subtle)] outline-none focus:border-[var(--qp-violet)] focus:ring-4 focus:ring-[var(--qp-focus-ring)]" />
              </label>
              <button type="submit" className="min-h-12 w-full rounded-xl bg-[var(--qp-violet-strong)] px-5 text-base font-black text-white hover:bg-[var(--qp-violet)]">Email secure link</button>
            </form>
            <Link href="/" className="mt-6 block text-center text-sm text-[var(--qp-text-muted)] hover:text-white">Back to QuestPay</Link>
          </div>
        </section>
        <Footer />
      </main>
    </Web3Provider>
  );
}
