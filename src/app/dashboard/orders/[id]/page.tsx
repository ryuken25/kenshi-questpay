import { notFound, redirect } from "next/navigation";
import StudioShell from "@/components/StudioShell";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { getSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Legacy /dashboard/orders/[id] — redirect to /studio/orders/[id]
 * so status controls stay on the hardened studio surface.
 */
export default async function DashboardOrderDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireStudioAdmin();
  const sb = getSupabase();
  if (!sb) notFound();
  const { data: order } = await sb.from("orders").select("id").eq("id", params.id).maybeSingle();
  if (!order) notFound();
  redirect(`/studio/orders/${params.id}`);
}
