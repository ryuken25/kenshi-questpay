import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Web3Provider } from "@/components/Web3Provider";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";
import CheckoutBriefForm from "@/components/checkout/CheckoutBriefForm";
import { getSession } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { ENABLED_TOKEN_SYMBOLS } from "@/lib/token-metadata";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const svc = getServiceBySlug(params.slug);
  if (!svc) return { title: "Checkout — QuestPay" };
  return {
    title: `Checkout: ${svc.name} — Kenshi QuestPay`,
    description: `Submit a brief and pay for ${svc.name} with ${ENABLED_TOKEN_SYMBOLS.join(", ")} on Polygon.`,
  };
}

export default async function CheckoutPage(props: Props) {
  const params = await props.params;
  const svc = getServiceBySlug(params.slug);
  if (!svc) notFound();

  const checkoutPath = `/checkout/${params.slug}`;
  const session = await getSession();
  const profile = session ? await getProfile(session.accountId) : null;

  if (session && !profile?.onboardingCompletedAt) {
    redirect(`/onboarding?next=${encodeURIComponent(checkoutPath)}`);
  }

  return (
    <Web3Provider>
      <div className="min-screen-safe pt-6">
        <section className="px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-2xl pb-6">
            <div className="mb-6">
              <Link href={`/services/${svc.slug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-subtle hover:text-secondary">← Back to {svc.name}</Link>
            </div>
            <CheckoutBriefForm
              service={svc}
              next={checkoutPath}
              authenticated={Boolean(session)}
              profileEmail={profile?.contactValue ?? undefined}
              profileName={profile?.displayName ?? undefined}
            />
          </div>
        </section>
      </div>
    </Web3Provider>
  );
}
