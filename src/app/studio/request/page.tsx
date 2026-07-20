import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SearchParams = { submitted?: string };

export default async function RequestCreatorPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/studio/request");

  const isCreator =
    session.roles.includes("creator") || session.roles.includes("super_admin");
  if (isCreator) redirect("/studio");

  const submitted = searchParams?.submitted === "1";

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
          Creator access
        </p>
        <h1 className="mt-3 font-sora text-3xl font-black sm:text-4xl">Request to be a Creator</h1>
        <p className="mt-4 text-base leading-7 text-[var(--qp-text-secondary)]">
          Submit an application for Creator Studio access. Admins review requests and grant the{" "}
          <span className="font-semibold text-white">creator</span> role. Until approved you keep full
          buyer access (orders, receipts, verify).
        </p>

        {submitted ? (
          <div className="mt-8 rounded-[2rem] border border-green-400/25 bg-green-400/10 p-6">
            <h2 className="font-sora text-xl font-black text-green-100">Application received</h2>
            <p className="mt-3 text-sm leading-6 text-green-50/90">
              Thanks — your request is queued for admin review. You&apos;ll get creator access once a
              super admin approves your account. Buyer tools stay available in the meantime.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/my-orders"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-verse-purple px-6 font-black"
              >
                Back to My Orders
              </Link>
              <Link
                href="/for-creators"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-6 font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
              >
                Creator guide
              </Link>
            </div>
          </div>
        ) : (
          <form
            className="mt-8 space-y-4 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-6"
            action="/studio/request"
            method="get"
          >
            <input type="hidden" name="submitted" value="1" />

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Display name</span>
              <input
                name="displayName"
                required
                placeholder="How buyers should know you"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none focus:border-[var(--qp-violet-500)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Primary craft / services
              </span>
              <input
                name="craft"
                required
                placeholder="e.g. UI review, landing polish, component builds"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none focus:border-[var(--qp-violet-500)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Portfolio / proof link
              </span>
              <input
                name="portfolio"
                type="url"
                placeholder="https://"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none focus:border-[var(--qp-violet-500)]"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Why you want Creator Studio
              </span>
              <textarea
                name="note"
                required
                rows={5}
                placeholder="Brief pitch, typical delivery window, and payout wallet readiness."
                className="mt-2 w-full rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 py-3 text-base outline-none focus:border-[var(--qp-violet-500)]"
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-[rgba(8,8,14,.45)] p-4 text-sm leading-6 text-[var(--qp-text-secondary)]">
              <input type="checkbox" name="agree" required className="mt-1" />
              <span>
                I understand QuestPay uses temporary custody → buyer accept → server release, and I will
                only mark work submitted after delivering the agreed scope.
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="min-h-12 flex-1 rounded-2xl bg-verse-purple px-6 font-black">
                Submit application
              </button>
              <Link
                href="/for-creators"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-6 font-bold text-[var(--qp-text-secondary)] hover:bg-white/5"
              >
                Learn more
              </Link>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Already approved?{" "}
          <Link href="/studio" className="font-semibold text-[var(--qp-violet-300)] hover:underline">
            Open Creator Studio
          </Link>
        </p>
      </div>
    </div>
  );
}
