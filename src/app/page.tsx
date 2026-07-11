import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HomeServicesPreview from "@/components/HomeServicesPreview";
import HomeHowItWorks from "@/components/HomeHowItWorks";
import { SITE } from "@/lib/site";

export default function HomePage() {
  return (
    <Web3Provider>
      <Navbar />
      <main>
        <Hero />
        <HomeServicesPreview />
        <HomeHowItWorks />
        <section className="py-20 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-panel-strong rounded-2xl p-8">
              <h2 className="font-sora text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to start with a <span className="gradient-text">clear scope</span>?
              </h2>
              <p className="text-muted mb-6">
                {SITE.disclaimer}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href="/services" className="inline-flex min-h-11 items-center rounded-2xl bg-verse-purple px-6 py-3 font-bold text-white">
                  Browse Services
                </a>
                <a href="/how-it-works" className="inline-flex min-h-11 items-center rounded-2xl border border-white/10 bg-[var(--qp-surface)] px-6 py-3 font-bold text-secondary">
                  See How It Works
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
