export const metadata = { title: 'Terms — Kenshi QuestPay' };
export default function TermsPage() {
  return <main className="min-h-screen bg-[#0B0D14] px-4 py-10 text-white sm:px-6 lg:px-8">
    <section className="mx-auto max-w-2xl">
      <h1 className="font-sora text-3xl font-black">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-gray-400">
        <p><b className="text-white">Scope:</b> Each service package has a defined deliverable. The creator confirms scope after payment. If the request is out of scope, a partial refund or revised scope may be negotiated.</p>
        <p><b className="text-white">Payment:</b> All payments are made directly to the creator wallet on Polygon mainnet. QuestPay never takes custody of funds.</p>
        <p><b className="text-white">Refunds:</b> Crypto payments are irreversible on-chain. Refund requests are handled case-by-case by the creator.</p>
        <p><b className="text-white">Community project:</b> QuestPay is a community-built project for the VERSE ecosystem. It is not an official Bitcoin.com product.</p>
        <p><b className="text-white">Demo:</b> The Base Sepolia testnet demo is for evaluation only. No real funds are involved in the demo flow.</p>
      </div>
    </section>
  </main>;
}
