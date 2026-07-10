"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink, Loader2, QrCode, Shield, Wallet } from "lucide-react";
import { PACKAGES } from "@/lib/config";
import { briefSchema, type BriefFormData } from "@/lib/schemas";
import { PAYMENTS, TokenSymbol, isAmountReady, polygonScanAddress, polygonScanTx } from "@/config/payments";
import { amountFor, eip681, isRedeemed, markRedeemed, middle, sendWalletPayment, verifyPolygonPayment } from "@/lib/payment-utils";

interface CheckoutProps {
  selectedPackage: number | null;
  onTxSuccess: (receipt: {
    packageId: number;
    buyerAddress: string;
    txHash: string;
    network: string;
    briefId: string;
    token?: string;
    amount?: string;
    mode?: string;
  }) => void;
}

const inputClass = "w-full rounded-xl border border-white/5 bg-base-lighter px-4 py-3 text-base text-white placeholder-gray-600 outline-none transition-colors focus:border-verse-purple/50";
const tokenList: TokenSymbol[] = ["USDT", "POL", "VERSE"];

export default function Checkout({ selectedPackage, onTxSuccess }: CheckoutProps) {
  const [form, setForm] = useState<BriefFormData>({
    handle: "",
    contactMethod: "",
    contactValue: "",
    projectLink: "",
    packageId: selectedPackage || 1,
    deadline: "",
    mainProblem: "",
    expectedOutput: "",
    refLinks: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [briefId, setBriefId] = useState("");
  const [mode, setMode] = useState<"wallet" | "manual" | "demo">("manual");
  const [token, setToken] = useState<TokenSymbol>("USDT");
  const [manualTx, setManualTx] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (selectedPackage) setForm((prev) => ({ ...prev, packageId: selectedPackage })); }, [selectedPackage]);

  const generateBriefId = useCallback((handle: string, problem: string) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const data = `${handle}:${problem}:${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash) + data.charCodeAt(i);
    return `questpay:${dateStr}:${Math.abs(hash).toString(16).slice(0, 8).padStart(8, "0")}`;
  }, []);

  const updateField = (field: keyof BriefFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validateBrief = () => {
    const result = briefSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0] as string] = issue.message; });
      setErrors(fieldErrors);
      return null;
    }
    const id = briefId || generateBriefId(form.handle, form.mainProblem);
    setBriefId(id);
    return id;
  };

  async function payWithWallet() {
    const id = validateBrief(); if (!id) return;
    setBusy(true); setStatus("Opening wallet on Polygon mainnet...");
    try {
      const { from, txHash } = await sendWalletPayment({ packageId: form.packageId, token });
      setStatus(`Sent ${middle(txHash)}. Waiting for Polygon confirmation...`);
      const verified = await verifyPolygonPayment(txHash, form.packageId, token);
      if (!verified.ok) throw new Error(verified.reason);
      markRedeemed(txHash);
      onTxSuccess({ packageId: form.packageId, buyerAddress: from, txHash, network: "Polygon Mainnet", briefId: id, token, amount: verified.amount, mode: "wallet" });
      setStatus("Payment confirmed. Receipt generated.");
      location.hash = "receipt";
    } catch (e: any) { setStatus(e?.message || "Wallet payment failed."); }
    finally { setBusy(false); }
  }

  async function verifyManual() {
    const id = validateBrief(); if (!id) return;
    if (isRedeemed(manualTx)) { setStatus("This tx hash was already redeemed in this browser."); return; }
    setBusy(true); setStatus("Verifying payment on Polygon...");
    const verified = await verifyPolygonPayment(manualTx.trim(), form.packageId, token);
    setBusy(false);
    if (!verified.ok) { setStatus(verified.reason || "Verification failed."); return; }
    markRedeemed(manualTx.trim());
    onTxSuccess({ packageId: form.packageId, buyerAddress: verified.from || "", txHash: manualTx.trim(), network: "Polygon Mainnet", briefId: id, token, amount: verified.amount, mode: "manual" });
    setStatus("Payment verified. Receipt generated.");
    location.hash = "receipt";
  }

  const pkg = PACKAGES.find((p) => p.id === form.packageId);
  const amount = amountFor(form.packageId, token);
  const ready = isAmountReady(amount);
  const uri = eip681(form.packageId, token);
  const qr = uri ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}` : "";

  return (
    <section id="checkout" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8 text-center sm:mb-12">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-verse-blue">Package → Brief → Payment → Receipt</p>
          <h2 className="font-sora mt-3 text-3xl font-bold text-white sm:text-4xl"><span className="gradient-text">Real Polygon</span> Checkout</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-400">Default mode collects real crypto directly to the creator wallet. 100% buyer → owner, no custody, no backend keys. Base Sepolia Service Pass remains as opt-in testnet demo.</p>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 text-[11px] font-bold text-gray-400 sm:grid-cols-4 sm:text-xs">
            {['Package','Brief','Payment','Receipt'].map((step, i) => <span key={step} className="rounded-xl bg-black/20 px-2 py-2">{i + 1}. {step}</span>)}
          </div>
        </motion.div>

        <form onSubmit={(e)=>e.preventDefault()} className="glass-panel space-y-6 rounded-2xl p-5 sm:p-8">
          <div className="rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm leading-6 text-green-100">
            <b>Real payment default:</b> Polygon mainnet to <a className="font-mono text-verse-blue underline" href={polygonScanAddress(PAYMENTS.receiveAddress)} target="_blank">{middle(PAYMENTS.receiveAddress)}</a>. No backend DB; paid state is per-browser, on-chain tx + <code>/verify</code> is canonical proof.
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name / Handle" error={errors.handle}><input className={inputClass} value={form.handle} onChange={(e)=>updateField('handle', e.target.value)} placeholder="e.g., @ryuken" /></Field>
            <Field label="Contact Method" error={errors.contactMethod}><input className={inputClass} value={form.contactMethod} onChange={(e)=>updateField('contactMethod', e.target.value)} placeholder="Discord, X DM, Email" /></Field>
          </div>
          <Field label="Contact Value" error={errors.contactValue}><input className={inputClass} value={form.contactValue} onChange={(e)=>updateField('contactValue', e.target.value)} placeholder="user#1234, @handle, email@example.com" /></Field>
          <Field label="Project Link"><input className={inputClass} value={form.projectLink || ''} onChange={(e)=>updateField('projectLink', e.target.value)} placeholder="https://..." /></Field>

          <Field label="Package" error={errors.packageId}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PACKAGES.map((p) => <button key={p.id} type="button" onClick={()=>updateField('packageId', p.id)} className={`min-h-16 rounded-xl border px-3 py-3 text-left text-xs transition ${form.packageId===p.id?'border-verse-purple bg-verse-purple/30 text-white':'border-white/5 bg-base-lighter text-gray-400'}`}><span className="mb-1 block text-lg">{p.emoji}</span><b>{p.name}</b><span className="block text-verse-blue">${PAYMENTS.packages.find(x=>x.id===p.id)?.usd ?? p.price}</span></button>)}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deadline"><input className={inputClass} value={form.deadline || ''} onChange={(e)=>updateField('deadline', e.target.value)} placeholder="3 days, next Friday, ASAP" /></Field>
            <Field label="Payment token">
              <div className="grid grid-cols-3 gap-2">
                {tokenList.map((t) => { const a = amountFor(form.packageId, t); const ok = isAmountReady(a); return <button key={t} type="button" onClick={()=>setToken(t)} className={`min-h-12 rounded-xl border px-2 text-sm font-black ${token===t?'border-verse-blue bg-verse-blue/20 text-white':'border-white/5 bg-base-lighter text-gray-400'}`}><span>{t}</span><span className="block text-[10px] font-normal">{ok ? a : 'amount pending'}</span></button> })}
              </div>
            </Field>
          </div>

          <Field label="Main Problem / Request" error={errors.mainProblem}><textarea className={`${inputClass} resize-none`} rows={4} value={form.mainProblem} onChange={(e)=>updateField('mainProblem', e.target.value)} placeholder="Describe what you need help with..." /></Field>
          <Field label="Expected Output"><textarea className={`${inputClass} resize-none`} rows={3} value={form.expectedOutput || ''} onChange={(e)=>updateField('expectedOutput', e.target.value)} placeholder="What should be delivered?" /></Field>
          <Field label="Reference Links"><textarea className={`${inputClass} resize-none`} rows={2} value={form.refLinks || ''} onChange={(e)=>updateField('refLinks', e.target.value)} placeholder="Links, screenshots, docs..." /></Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={()=>setMode('manual')} className={`min-h-12 rounded-2xl px-4 font-black ${mode==='manual'?'bg-verse-purple text-white':'bg-white/5 text-gray-400'}`}>Manual Pay + Verify</button>
            <button type="button" onClick={()=>setMode('wallet')} className={`min-h-12 rounded-2xl px-4 font-black ${mode==='wallet'?'bg-verse-purple text-white':'bg-white/5 text-gray-400'}`}>Wallet Mode</button>
            <button type="button" onClick={()=>setMode('demo')} className={`min-h-12 rounded-2xl px-4 font-black ${mode==='demo'?'bg-yellow-500 text-black':'bg-white/5 text-gray-400'}`}>Testnet Demo</button>
          </div>

          {mode === 'manual' && <div className="rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
              <div className="rounded-2xl bg-white p-3 text-center">{qr ? <img src={qr} alt="Payment QR" className="mx-auto h-auto w-full max-w-[220px]" /> : <div className="grid h-[196px] place-items-center text-sm text-black">Set amount first</div>}<p className="mt-2 text-xs text-black">EIP-681 QR</p></div>
              <div className="space-y-3 text-sm">
                <Info label="Token" value={token} />
                <Info label="Exact amount" value={ready ? amount : `${token} amount pending from owner`} warn={!ready} />
                <Info label="Receive address" value={PAYMENTS.receiveAddress} copy />
                <Info label="Payment URI" value={uri || 'Not available until amount is set'} copy={!!uri} />
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><input className={inputClass} value={manualTx} onChange={(e)=>setManualTx(e.target.value)} placeholder="Paste Polygon tx hash after paying" /><button type="button" disabled={busy || !ready} onClick={verifyManual} className="rounded-2xl bg-green-400 px-5 py-3 font-black text-black disabled:opacity-40">{busy ? <Loader2 className="animate-spin"/> : 'Verify Tx'}</button></div>
              </div>
            </div>
          </div>}

          {mode === 'wallet' && <div className="rounded-3xl border border-verse-blue/20 bg-verse-blue/10 p-5"><p className="mb-4 text-sm leading-6 text-gray-300">Works in MetaMask mobile in-app browser or any injected EIP-1193 wallet. It switches/adds Polygon and sends {token} directly to owner wallet.</p><button type="button" disabled={busy || !ready} onClick={payWithWallet} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-verse-blue px-5 font-black text-black disabled:opacity-40"><Wallet size={18}/>{busy ? 'Processing...' : `Pay ${ready ? `${amount} ${token}` : token}`}</button></div>}

          {mode === 'demo' && <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5"><p className="text-sm leading-6 text-yellow-100"><b>Demo — Base Sepolia, no real funds.</b> The existing ServicePass contract remains deployed/tested for free evaluation. Real payment mode above is Polygon mainnet.</p><a href="#contract-proof" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-yellow-400 px-4 font-black text-black">View Testnet Contract <ExternalLink size={16}/></a></div>}

          {status && <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-gray-300">{status}</p>}
        </form>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><label className="mb-1 block text-sm font-semibold text-gray-400">{label} <span className="text-red-400">*</span></label>{children}{error && <p className="mt-1 text-xs text-red-400">{error}</p>}</div>; }
function Info({ label, value, copy, warn }: { label: string; value: string; copy?: boolean; warn?: boolean }) { return <div className="rounded-2xl bg-white/[0.04] p-3"><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p><div className={`mt-1 flex items-center gap-2 break-all font-mono text-sm ${warn?'text-yellow-300':'text-white'}`}><span>{value}</span>{copy && <button type="button" onClick={()=>navigator.clipboard.writeText(value)} className="shrink-0 rounded-lg bg-white/10 p-2"><Copy size={14}/></button>}</div></div>; }
