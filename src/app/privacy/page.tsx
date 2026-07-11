import PublicShell from '@/components/PublicShell';
export const metadata = { title: 'Privacy — Kenshi QuestPay' };
export default function PrivacyPage() {
  return <PublicShell><main className="min-screen-safe px-4 py-24 sm:px-6 lg:px-8">
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-[var(--qp-border-soft)] bg-[var(--qp-surface)] p-6 sm:p-8">
      <h1 className="font-sora text-3xl font-black text-[var(--qp-text-primary)]">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-base leading-7 text-[var(--qp-text-secondary)]">
        <p>QuestPay stores your brief, contact method, and payment intent in Supabase to process your order. We do not store private keys, seed phrases, or wallet recovery data.</p>
        <p>Your email is used only for order notifications and receipt delivery. We never sell or share your data with third parties.</p>
        <p>Payment verification data (transaction hash, sender address) is stored permanently as proof of payment and is publicly verifiable on Polygon.</p>
        <p>Brief content is stored server-side and never exposed on public pages. Only sanitized order status is shown to unauthenticated users.</p>
      </div>
    </section>
  </main></PublicShell>;
}
