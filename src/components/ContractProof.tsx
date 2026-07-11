import { ShieldCheck } from "lucide-react";
export default function ContractProof() {
  return <section className="section-padding"><div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-6"><ShieldCheck className="h-8 w-8 text-emerald-300"/><h2 className="mt-3 font-sora text-2xl font-black text-white">Polygon payment verification.</h2><p className="mt-2 text-gray-400">QuestPay verifies public Polygon transaction proof while private briefs stay off-chain.</p></div></section>;
}
