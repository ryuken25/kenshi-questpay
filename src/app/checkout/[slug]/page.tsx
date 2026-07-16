import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import Footer from "@/components/Footer";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";
import CheckoutBriefForm from "@/components/checkout/CheckoutBriefForm";
import { getSession } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { ENABLED_TOKEN_SYMBOLS } from "@/lib/token-metadata";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const svc = getServiceBySlug(params.slug);
  if (!svc) return { title: "Checkout — QuestPay" };
  return {
    title: `Checkout: ${svc.name} — Kenshi QuestPay`,
    description: `Submit a brief and pay for ${svc.name} with ${ENABLED_TOKEN_SYMBOLS.join(", ")} on Polygon.`,
  };
}

export default async function CheckoutPage({ params }: Props) {
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
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6">
              <Link href={`/services/${svc.slug}`} className="text-xs text-[var(--qp-text-subtle)] hover:text-[var(--qp-text-secondary)]">← {svc.name}</Link>
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
      <Footer />
    </Web3Provider>
  );
}

import Link from "next/link";
