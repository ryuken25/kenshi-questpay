import type { Metadata } from "next";
import VerifyTxClient from "@/components/VerifyTxClient";

interface Props {
  params: Promise<{ txHash: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  return {
    title: `Verify ${params.txHash.slice(0, 10)}... — QuestPay`,
    description: "On-chain payment verification on Polygon mainnet.",
  };
}

export default async function VerifyTxPage(props: Props) {
  const params = await props.params;
  return <VerifyTxClient txHash={params.txHash} />;
}
