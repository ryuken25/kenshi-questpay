import { notFound, redirect } from "next/navigation";
import { requireStudioAdmin } from "@/lib/supabase-auth";
import { queryOneOptional, hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Legacy /dashboard/orders/[id] — redirect to /studio/orders/[id]
 * so status controls stay on the hardened studio surface.
 */
export default async function DashboardOrderDetail(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  await requireStudioAdmin();
  if (!hasDatabase) notFound();
  const order = await queryOneOptional<{ id: string }>(
    `SELECT id FROM orders WHERE id = $1 LIMIT 1`,
    [params.id],
  );
  if (!order) notFound();
  redirect(`/studio/orders/${params.id}`);
}
