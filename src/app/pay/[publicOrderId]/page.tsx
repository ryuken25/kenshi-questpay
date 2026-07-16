import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Footer from "@/components/Footer";
import PayPageClient from "@/components/PayPageClient";
import { getSupabase } from "@/lib/supabase-server";
import { getServiceBySlug } from "@/lib/services";

interface Props {
  params: { publicOrderId: string };
}

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Pay — Order ${params.publicOrderId} — QuestPay`,
    description: "Complete your crypto payment on Polygon mainnet.",
  };
}

export default async function PayPage({ params }: Props) {
  const { publicOrderId } = params;
  const sb = getSupabase();

  let order = null;
  if (sb) {
    const { data } = await sb
      .from("orders")
      .select("*")
      .eq("public_order_id", publicOrderId)
      .single();
    order = data;
  }

  const service = order ? getServiceBySlug(order.slug) : null;

  return (
    <Web3Provider>
      <main className="min-screen-safe pt-6">
        <PayPageClient
          publicOrderId={publicOrderId}
          order={order}
          serviceName={service?.name || order?.slug}
        />
      </main>
      <Footer />
    </Web3Provider>
  );
}
