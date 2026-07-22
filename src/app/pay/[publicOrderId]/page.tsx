import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import PayPageClient from "@/components/PayPageClient";
import { queryOneOptional } from "@/lib/db";
import { getServiceBySlug } from "@/lib/services";

interface Props {
  params: Promise<{ publicOrderId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return {
    title: `Pay — Order ${params.publicOrderId} — QuestPay`,
    description: "Complete your crypto payment on Polygon mainnet.",
  };
}

export default async function PayPage(props: Props) {
  const params = await props.params;
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
