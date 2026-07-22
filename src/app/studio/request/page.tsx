import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CreatorApplicationForm from "@/components/studio/CreatorApplicationForm";
import { getPendingApplication, listApplicationsForAccount } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

type SearchParams = { submitted?: string };

export default async function RequestCreatorPage(
  props: {
    searchParams?: Promise<SearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/studio/request");

  const isCreator =
    session.roles.includes("creator") || session.roles.includes("super_admin");
  if (isCreator) redirect("/studio");

  const submitted = searchParams?.submitted === "1";
  const pending = await getPendingApplication(session.accountId);
  const history = await listApplicationsForAccount(session.accountId);
  const showSuccess = submitted || Boolean(pending);

  return (
    <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-primary)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[var(--qp-violet-300)]">
          Creator access
        </p>
        <h1 className="mt-3 font-sora text-3xl font-black sm:text-4xl">Request to be a Creator</h1>
        <p className="mt-4 text-base leading-7 text-[var(--qp-text-secondary)]">
          Submit an application for Creator Studio access. Super admins review requests and grant the{" "}
          <span className="font-semibold text-white">creator</span> role. Until approved you keep full
          buyer access (orders, receipts, verify).
        </p>

        {showSuccess ? (
          <div className="mt-8 rounded-[2rem] border border-green-400/25 bg-green-400/10 p-6">
            <h2 className="font-sora text-xl font-black text-green-100">
              {pending ? "Application pending review" : "Application received"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-green-50/90">
              {pending
                ? "Your request is queued for admin review. You'll get creator access once a super admin approves your account. Buyer tools stay available in the meantime."
                : "Thanks — your request is queued for admin review. You'll get creator access once a super admin approves your account. Buyer tools stay available in the meantime."}
            </p>
            {pending && (
              <dl className="mt-4 grid gap-2 text-sm text-green-50/90">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-green-100/70">Display name</dt>
                  <dd className="font-semibold">{pending.displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-green-100/70">Craft</dt>
                  <dd className="font-semibold">{pending.craft}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-green-100/70">Submitted</dt>
                  <dd className="font-semibold">{new Date(pending.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            )}
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
          <CreatorApplicationForm />
        )}

        {history.some((a) => a.status !== "pending") && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-[var(--qp-surface)] p-5">
            <h2 className="font-sora text-lg font-black">Previous applications</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {history
                .filter((a) => a.status !== "pending")
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[rgba(8,8,14,.55)] px-4 py-3"
                  >
                    <span>
                      <b className="capitalize">{a.status}</b>
                      <span className="ml-2 text-muted">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    {a.reviewNote && (
                      <span className="truncate text-xs text-muted">{a.reviewNote}</span>
                    )}
                  </li>
                ))}
            </ul>
          </section>
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
