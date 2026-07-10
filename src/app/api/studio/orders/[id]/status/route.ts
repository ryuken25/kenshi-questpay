import { NextRequest, NextResponse } from "next/server";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

const ALLOWED=new Set(["pending","paid","reviewing","accepted","in_progress","delivered","completed","cancelled"]);
export async function POST(request:NextRequest,{params}:{params:{id:string}}){const user=await requireStudioAdmin();const form=await request.formData();const status=String(form.get("status")||"");if(!ALLOWED.has(status))return NextResponse.json({error:"Invalid status"},{status:400});const sb=getSupabase();if(!sb)return NextResponse.json({error:"Order system unavailable"},{status:503});const {data:order}=await sb.from("orders").select("id,status").eq("id",params.id).single();if(!order)return NextResponse.json({error:"Order not found"},{status:404});const {error}=await sb.from("orders").update({status,...(status==="delivered"?{delivered_at:new Date().toISOString()}: {})}).eq("id",params.id);if(error)return NextResponse.json({error:"Status update failed"},{status:500});await sb.from("questpay_order_events").insert({order_id:params.id,event_type:"status_changed",from_status:order.status,to_status:status,metadata:{actor:user.email}});return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/studio/orders/${params.id}`,303)}
