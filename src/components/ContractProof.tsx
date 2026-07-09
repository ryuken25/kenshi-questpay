"use client";
import { Copy, ExternalLink, ShieldCheck } from "lucide-react";

const CONTRACT = "0x1e8d3843096C2f8A85e30C205B67e8eFfCB69029";
const DEPLOY_TX = "0x2f79ab2e03e7968adbf1f0972547160f0eaf85940f3d033a1dc5a4a91820133e";
const TEST_TX = "0x44888f3282ee03991f52c2cbf0807f54676b2c3e720e65931579c406f75a8578";
const scan = "https://sepolia.basescan.org";

function shortHash(v: string) { return `${v.slice(0, 6)}...${v.slice(-4)}`; }
function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-verse-blue/50 hover:bg-verse-blue/10"><ExternalLink className="h-4 w-4" />{children}</a>;
}

export default function ContractProof() {
  return (
    <section id="proof" className="relative px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-green-400">Not fake. Deployed and tested.</p>
            <h2 className="section-title mt-3 font-sora font-black text-white">Live Base Sepolia contract proof.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-400 sm:text-base">QuestPay uses a real deployed Service Pass contract. The test buy transaction succeeded with status 1.</p>
          </div>
          <div className="glass-panel-strong rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-400/15 text-green-300"><ShieldCheck /></div>
              <div><h3 className="font-sora text-xl font-black text-white">Live Contract</h3><p className="text-sm text-gray-400">Base Sepolia • Service Pass</p></div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs uppercase tracking-wider text-gray-500">Contract</p><p className="hash-chip mt-1 text-sm text-verse-blue">{CONTRACT}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs uppercase tracking-wider text-gray-500">Deploy tx</p><p className="hash-chip mt-1 text-sm text-gray-300">{DEPLOY_TX}</p></div>
                <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs uppercase tracking-wider text-gray-500">Test buy tx</p><p className="hash-chip mt-1 text-sm text-gray-300">{TEST_TX}</p></div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <LinkButton href={`${scan}/address/${CONTRACT}`}>Open Contract</LinkButton>
              <LinkButton href={`${scan}/tx/${DEPLOY_TX}`}>Deploy Tx</LinkButton>
              <LinkButton href={`${scan}/tx/${TEST_TX}`}>Test Tx</LinkButton>
              <button type="button" onClick={() => navigator.clipboard.writeText(CONTRACT)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-verse-purple px-4 py-2 text-sm font-bold text-white transition hover:bg-verse-purple/80"><Copy className="h-4 w-4" />Copy</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
