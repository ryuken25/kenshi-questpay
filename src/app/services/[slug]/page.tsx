import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Web3Provider } from "@/components/Web3Provider";
import { SERVICES, getServiceBySlug } from "@/lib/services";
import { SITE } from "@/lib/site";
interface Props { params: { slug: string }; }
export function generateStaticParams() { return SERVICES.map((s) => ({ slug: s.slug })); }
export function generateMetadata({ params }: Props): Metadata { const svc=getServiceBySlug(params.slug); return svc?{ title: `${svc.name} — Kenshi QuestPay`, description: svc.description }:{ title:"Service not found — QuestPay"}; }
function List({ title, items }: { title: string; items: string[] }) { return <div className="rounded-2xl border border-white/10 bg-[var(--qp-surface)] p-4"><h3 className="font-sora text-sm font-bold text-white">{title}</h3><ul className="mt-3 space-y-2 text-sm text-muted">{items.map((item)=><li key={item}>• {item}</li>)}</ul></div>; }
