import ContractProof from './ContractProof';

export default function DemoBaseSepolia() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5">
        <p className="text-sm leading-6 text-yellow-100">
          <b>Free evaluator demo — Base Sepolia testnet. No real funds.</b>{' '}
          This is separate from QuestPay&apos;s Polygon mainnet checkout.
        </p>
      </div>
      <ContractProof />
    </section>
  );
}
