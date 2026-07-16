import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

export default function MyOrdersPage() {
  return (
    <Web3Provider>
      <main className="min-screen-safe pt-6">
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#C1B6FF]">Buyer workspace</p>
            <h1 className="mt-3 font-sora text-3xl font-black text-[var(--qp-text-primary)]">My Orders</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--qp-text-secondary)]">Wallet-signed order history is being upgraded. Real payments remain disabled until the production payment gate is PASS.</p>
            <a href="/services" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--qp-violet-strong)] px-5 text-base font-bold text-white hover:bg-[var(--qp-violet)]">Browse Services</a>
          </div>
        </section>
      </main>
      <Footer />
    </Web3Provider>
  );
}
