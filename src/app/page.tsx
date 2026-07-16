import { Web3Provider } from "@/components/Web3Provider";
import HomeServicesPreview from "@/components/HomeServicesPreview";
import PremiumHomeHero from "@/components/home/PremiumHomeHero";
import BuyerCreatorBenefits from "@/components/home/BuyerCreatorBenefits";
import ScrollStoryHowItWorks from "@/components/home/ScrollStoryHowItWorks";

export default function HomePage() {
  return (
    <Web3Provider>
      <div>
        {/* 1. Hero */}
        <PremiumHomeHero />

        {/* 2. Compact trust / payment strip — single row, no disclaimer repeat */}
        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 rounded-[1.4rem] border border-[#7c5cff]/18 bg-[var(--qp-surface-1)] p-4 text-center text-sm font-semibold text-[#cfc7ff] sm:grid-cols-4">
            <span>Direct-to-creator payment</span><span>Locked quote</span><span>Verified on-chain</span><span>Public receipt</span>
          </div>
        </section>

        {/* 3. Featured services */}
        <HomeServicesPreview />

        {/* 4. One workflow section (the only "how it works" on the page) */}
        <ScrollStoryHowItWorks />

        {/* 5. Buyer / Creator split */}
        <BuyerCreatorBenefits />

        {/* 6. Final CTA — disclaimer lives only in the hero, not repeated here */}
        <section id="about" className="scroll-mt-28 relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="glass-panel-strong rounded-[1.5rem] p-8">
              <h2 className="font-sora text-2xl font-bold text-white sm:text-3xl">Ready to start with a <span className="gradient-text">clear scope</span>?</h2>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href="/services" className="inline-flex min-h-12 items-center rounded-xl bg-[var(--qp-violet-strong)] px-6 py-3 font-bold text-white hover:bg-[var(--qp-violet)]">Browse Services</a>
                <a href="/sign-in?next=/studio" className="inline-flex min-h-12 items-center rounded-xl border border-[var(--qp-border-default)] bg-[var(--qp-surface)] px-6 py-3 font-bold text-[var(--qp-text-primary)] hover:bg-[var(--qp-surface-hover)]">Sign In / Start Selling</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Web3Provider>
  );
}
