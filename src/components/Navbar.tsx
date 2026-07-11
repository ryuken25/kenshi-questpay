"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Menu, X } from "lucide-react";
import WalletButton from "@/components/wallet/WalletButton";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/verify", label: "Receipts" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="fixed left-0 right-0 top-0 z-50 glass-panel-strong">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex h-16 items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-sora text-xl font-bold text-white"><Image src="/brand/questpay/questpay-mark.svg" alt="QuestPay" width={28} height={28}/><span>QuestPay</span></Link>
      <div className="hidden items-center gap-6 md:flex">{navLinks.map((l)=><Link key={l.href} href={l.href} className="text-sm text-gray-400 transition-colors hover:text-verse-purple">{l.label}</Link>)}<WalletButton/><Link href="/studio/login" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-gray-200 hover:bg-white/10"><LayoutDashboard size={15}/>Creator Login</Link><Link href="/services" className="rounded-xl bg-verse-purple px-4 py-2 text-sm font-bold text-white">Start an Order</Link></div>
      <button type="button" onClick={() => setOpen(!open)} className="rounded-xl p-2 text-gray-300 md:hidden">{open ? <X/> : <Menu/>}</button>
    </div>{open ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2 pb-4 md:hidden">{navLinks.map((l)=><Link key={l.href} href={l.href} onClick={()=>setOpen(false)} className="block rounded-xl px-3 py-2 text-gray-300 hover:bg-white/10">{l.label}</Link>)}<div className="px-3 py-2"><WalletButton/></div><Link href="/studio/login" onClick={()=>setOpen(false)} className="block rounded-xl px-3 py-2 text-gray-300 hover:bg-white/10">Creator Login</Link><Link href="/services" onClick={()=>setOpen(false)} className="block rounded-xl bg-verse-purple px-3 py-3 text-center font-bold text-white">Start an Order</Link></motion.div> : null}</div>
  </motion.nav>;
}
