import { redirect } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import Footer from "@/components/Footer";
import { getSession, sanitizeNextPath } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = sanitizeNextPath(searchParams.next) ?? "/account";
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/onboarding?next=${next}`)}`);

  const profile = await getProfile(session.accountId);
  if (profile?.onboardingCompletedAt) redirect(next);

  return (
    <Web3Provider>
      <div className="min-h-screen bg-[var(--qp-bg)] pt-6 pb-16 text-[var(--qp-text-secondary)]">
        <section className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="mb-6 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--qp-violet-300)]">Almost there</p>
            <h1 className="mt-3 font-sora text-3xl font-black text-white">Set up your QuestPay profile</h1>
            <p className="mt-2 text-sm text-[var(--qp-text-muted)]">
              A few reusable details so checkout is one click next time. You can edit these later from your account.
            </p>
          </div>
          <OnboardingForm next={next} initialDisplayName={profile?.displayName ?? undefined} />
        </section>
      </div>
      <Footer />
    </Web3Provider>
  );
}
