"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
const faqs = [
  { q: "What is QuestPay?", a: "QuestPay is a crypto-native service checkout and delivery workspace for small creator jobs. It connects service scope, private brief, Polygon payment, status tracking, delivery, and receipt proof." },
  { q: "Which network does QuestPay use?", a: "Polygon mainnet only for production payments and receipts." },
  { q: "Is my brief on-chain?", a: "No. Payment is verified on Polygon. The private brief stays off-chain, while a private scope fingerprint can be stored in the database for integrity." },
  { q: "Do I need a wallet?", a: "You can browse without a wallet. Wallet connection is used for payment and wallet sign-in for private order tracking." },
  { q: "Does QuestPay custody funds?", a: "No. Payments go directly from the buyer wallet to the creator receive wallet." },
  { q: "Can I get a refund?", a: "On-chain payments are irreversible. Cancellation or refund handling is case-by-case with the creator and must not be assumed unless explicitly agreed." },
];
export default function FAQ() { const [openIndex,setOpenIndex]=useState<number|null>(null); return <section id="faq" className="relative py-20"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8"><motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.6}} className="mb-12 text-center"><h2 className="mb-4 font-sora text-3xl font-bold text-white sm:text-4xl"><span className="gradient-text">FAQ</span></h2><p className="font-inter text-gray-400">Common questions, straight answers</p></motion.div><div className="space-y-3">{faqs.map((faq,i)=><motion.div key={faq.q} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.4,delay:i*.05}} className="glass-panel overflow-hidden rounded-xl"><button onClick={()=>setOpenIndex(openIndex===i?null:i)} className="flex w-full items-center justify-between px-6 py-4 text-left"><span className="font-inter text-sm font-medium text-white">{faq.q}</span><ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openIndex===i?'rotate-180':''}`}/></button>{openIndex===i?<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} className="px-6 pb-4"><p className="font-inter text-sm leading-relaxed text-gray-400">{faq.a}</p></motion.div>:null}</motion.div>)}</div></div></section>; }
