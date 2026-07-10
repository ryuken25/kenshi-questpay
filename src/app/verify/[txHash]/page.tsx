import type { Metadata } from "next";
import VerifyTxClient from "@/components/VerifyTxClient";

interface Props {
  params: { txHash: string };
}

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: `Verify ${params.txHash.slice(0, 10)}... — QuestPay`,
    description: "On-chain payment verification on Polygon mainnet.",
  };
}

export default function VerifyTxPage({ params }: Props) {
  return <VerifyTxClient txHash={params.txHash} />;
}
