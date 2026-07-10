import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function StudioDashboard() {
  const user = await requireStudioAdmin();
  const sb = getSupabase();
  const { data: orders = [] } = sb ? await sb.from("orders").select("id,public_order_id,slug,status,token_symbol,amount_human,created_at").order("created_at",{ascending:false}).limit(50) : { data: [] };
  const rows = orders || [];
  const count=(...statuses:string[])=>rows.filter(order=>statuses.includes(order.status)).length;
  return <StudioShell email={user.email || "owner"}><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-verse-blue">Creator operations</p><h1 className="mt-2 font-sora text-3xl font-black">Dashboard</h1></div><Link href="/studio/orders" className="rounded-2xl bg-verse-purple px-5 py-3 text-center font-black">Manage orders</Link></div><section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Awaiting payment" value={count("pending","awaiting_payment")}/><Metric label="Paid / reviewing" value={count("paid","reviewing","accepted")}/><Metric label="In progress" value={count("in_progress")}/><Metric label="Delivered" value={count("delivered","completed")}/></section><section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5"><h2 className="font-sora text-xl font-black">Recent timeline</h2><div className="mt-4 space-y-2">{rows.slice(0,8).map(order=><Link key={order.id} href={`/studio/orders/${order.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-black/20 px-4"><span><b className="block">{order.public_order_id}</b><span className="text-xs text-gray-500">{order.slug} · {new Date(order.created_at).toLocaleString()}</span></span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">{order.status}</span></Link>)}{!rows.length&&<p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-gray-500">New briefs will appear here after checkout.</p>}</div></section></StudioShell>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-white/10 bg-[#111522] p-4"><p className="text-xs uppercase tracking-wider text-gray-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>}
