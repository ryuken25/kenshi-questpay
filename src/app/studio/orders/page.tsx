import Link from "next/link";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function StudioOrders({searchParams}:{searchParams:{status?:string;q?:string}}){
 const user=await requireStudioAdmin(); const sb=getSupabase();
 let query=sb?.from("orders").select("id,public_order_id,slug,status,token_symbol,amount_human,customer_name,created_at").order("created_at",{ascending:false}).limit(200);
 if(query&&searchParams.status) query=query.eq("status",searchParams.status);
 if(query&&searchParams.q) query=query.or(`public_order_id.ilike.%${searchParams.q}%,customer_name.ilike.%${searchParams.q}%,slug.ilike.%${searchParams.q}%`);
 const {data:orders=[]}=query?await query:{data:[]};
 return <StudioShell email={user.email||"owner"}><h1 className="font-sora text-3xl font-black">Orders</h1><form className="mt-5 grid gap-2 rounded-2xl bg-[var(--qp-surface)] p-3 sm:grid-cols-[1fr_auto_auto]"><input name="q" defaultValue={searchParams.q} placeholder="Search order, client, service" className="min-h-11 rounded-xl border border-white/10 bg-[rgba(8,8,14,.72)] px-4 text-base outline-none"/><select name="status" defaultValue={searchParams.status} className="min-h-11 rounded-xl bg-[rgba(8,11,24,.56)] px-4"><option value="">All statuses</option>{["pending","paid","reviewing","accepted","in_progress","delivered","completed","cancelled"].map(x=><option key={x}>{x}</option>)}</select><button className="rounded-xl bg-verse-purple px-5 font-black">Filter</button></form><div className="mt-5 overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[var(--qp-surface)] text-xs uppercase text-muted"><tr><th className="p-4">Order</th><th>Client</th><th>Service</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{(orders||[]).map(order=><tr key={order.id} className="border-t border-[var(--qp-border-soft)]"><td className="p-4"><Link className="font-mono font-bold text-[var(--qp-violet-300)]" href={`/studio/orders/${order.id}`}>{order.public_order_id}</Link></td><td>{order.customer_name||"—"}</td><td>{order.slug}</td><td>{order.amount_human} {order.token_symbol}</td><td><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{order.status}</span></td><td>{new Date(order.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>{!orders?.length&&<p className="p-8 text-center text-muted">No orders match this view.</p>}</div></StudioShell>;
}
