export const metadata = { title: 'Privacy — Kenshi QuestPay' };
export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#0B0D14] px-4 py-10 text-white sm:px-6 lg:px-8">
    <section className="mx-auto max-w-2xl">
      <h1 className="font-sora text-3xl font-black">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-gray-400">
        <p>QuestPay stores your brief, contact method, and payment intent in Supabase to process your order. We do not store private keys, seed phrases, or wallet recovery data.</p>
        <p>Your email is used only for order notifications and receipt delivery. We never sell or share your data with third parties.</p>
        <p>Payment verification data (transaction hash, sender address) is stored permanently as proof of payment and is publicly verifiable on Polygon.</p>
        <p>Brief content is stored server-side and never exposed on public pages. Only sanitized order status is shown to unauthenticated users.</p>
      </div>
    </section>
  </main>;
}
