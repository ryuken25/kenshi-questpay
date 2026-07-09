import { ShieldCheck, Users, FlaskConical } from "lucide-react";

const cards = [
  { icon: ShieldCheck, title: "For creators", text: "Stop losing payment proof and scope details in DMs. Every request starts with a clear package and brief." },
  { icon: Users, title: "For clients", text: "Know exactly what you are buying before sending payment, then keep a copyable on-chain receipt." },
  { icon: FlaskConical, title: "For demos", text: "Shows a real crypto checkout flow with a deployed Base Sepolia contract and successful test buy." },
];

export default function WhatIsThis() {
  return (
    <section id="what" className="relative px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="glass-panel-strong rounded-[1.75rem] p-5 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">What is this?</p>
              <h2 className="section-title mt-3 font-sora font-black text-white">QuestPay is a checkout page for small creator jobs.</h2>
              <ol className="mt-6 space-y-3 text-sm leading-7 text-gray-300 sm:text-base">
                <li><b className="text-white">1.</b> Pick a service package.</li>
                <li><b className="text-white">2.</b> Fill a clear brief instead of messy DMs.</li>
                <li><b className="text-white">3.</b> Pay with crypto on Base Sepolia.</li>
                <li><b className="text-white">4.</b> Get an NFT Service Pass receipt.</li>
              </ol>
              <p className="mt-5 rounded-2xl border border-verse-purple/20 bg-verse-purple/10 p-4 text-sm leading-6 text-gray-300">
                The full brief stays private. Only a proof hash goes on-chain.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {cards.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <Icon className="h-6 w-6 text-verse-blue" />
                  <h3 className="mt-3 font-sora text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
