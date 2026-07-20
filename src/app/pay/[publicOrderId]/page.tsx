import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import PayPageClient from "@/components/PayPageClient";
import { queryOneOptional } from "@/lib/db";
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

  const order = await queryOneOptional<any>(
    `SELECT * FROM orders WHERE public_order_id = $1 LIMIT 1`,
    [publicOrderId],
  );

  const service = order ? getServiceBySlug(String(order.slug)) : null;

  return (
    <Web3Provider>
      <div className="min-screen-safe pt-6">
        <PayPageClient
          publicOrderId={publicOrderId}
          order={order as any}
          serviceName={service?.name || (order?.slug as string | undefined)}
        />
      </div>
    </Web3Provider>
  );
}
