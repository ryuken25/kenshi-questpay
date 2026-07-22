import { ArrowRight, CircleCheck } from "lucide-react";
import { Web3Provider } from "@/components/Web3Provider";
import HomeServicesPreview from "@/components/HomeServicesPreview";
import PremiumHomeHero from "@/components/home/PremiumHomeHero";
import BuyerCreatorBenefits from "@/components/home/BuyerCreatorBenefits";
import ProductPreviewRow from "@/components/home/ProductPreviewRow";
import { Button, TokenCoin } from "@/components/ui";

const TRUST_POINTS = ["Escrow-protected", "Locked quote", "Verified on-chain", "Public receipt"];

export default function HomePage() {
  return (
    <Web3Provider>
      <div>
        {/* 1. Hero */}
        <PremiumHomeHero />

        {/* 2. Polygon strip — network brand lead + trust chips, no disclaimer repeat */}
        <section className="px-4 pb-10 sm:px-6 lg:px-8">
          <div
            data-reveal
            className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-[1.4rem] border border-[#7c5cff]/18 bg-[var(--qp-surface-1)] px-5 py-4 text-center text-sm font-semibold text-[#cfc7ff] backdrop-blur-md sm:gap-x-7"
          >
            <span className="inline-flex items-center gap-2">
              <TokenCoin token="pol" size={22} aria-hidden="true" />
              <span className="text-[var(--qp-violet-300)]">Built on Polygon</span>
            </span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-white/10 sm:inline-block" />
            {TRUST_POINTS.map((label) => (
              <span key={label} className="inline-flex items-center gap-2">
                <CircleCheck size={15} className="text-[var(--qp-violet-300)]" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* 3. Featured services */}
        <HomeServicesPreview />

        {/* 4. One workflow section (the only "how it works" on the page) */}
        <ProductPreviewRow />

        {/* 5. Buyer / Creator split */}
        <BuyerCreatorBenefits />

        {/* 6. Final CTA — disclaimer lives only in the hero, not repeated here */}
        <section id="about" className="scroll-mt-28 relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div data-reveal className="glass-panel-strong rounded-[1.5rem] p-8 sm:p-12">
              <h2 className="font-sora text-2xl font-bold text-white sm:text-3xl">Ready to start with a <span className="gradient-text">clear scope</span>?</h2>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button href="/services" size="lg" iconRight={<ArrowRight size={16} aria-hidden="true" />}>Browse Services</Button>
                <Button href="/sign-in?next=/studio" size="lg" variant="secondary">Sign In / Start Selling</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Web3Provider>
  );
}
