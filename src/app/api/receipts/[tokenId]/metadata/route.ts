import { NextResponse } from "next/server";
import { queryOneOptional } from "@/lib/db";
import { getServiceBySlug, chainKeyFromId, explorerTxUrl } from "@/lib/services";
import { NEXT_PUBLIC_SITE_URL } from "@/lib/server-config";

// Node-only deps (pg) — pin to the Node.js runtime, never Edge.
export const runtime = "nodejs";

/**
 * Public ERC-721 metadata for a minted QuestPay receipt.
 *
 * PRIVACY: exposes only what a public receipt already shows — service, amount,
 * token, date, order status, and the on-chain payment tx. Never the brief,
 * contact details, email, or any buyer PII beyond the wallet the token is
 * already publicly bound to on-chain.
 */
type ReceiptRow = {
  public_order_id: string;
  slug: string;
  status: string;
  amount_human: string | null;
  token_symbol: string | null;
  chain_id: number | null;
  created_at: string;
  nft_token_id: string;
  nft_mint_tx: string | null;
  nft_contract: string | null;
  nft_chain_id: number | null;
  payment_tx: string | null;
};

export async function GET(_req: Request, props: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await props.params;

  if (!/^\d+$/.test(tokenId)) {
    return NextResponse.json({ error: "Invalid token id." }, { status: 400 });
  }

  let row: ReceiptRow | null = null;
  try {
    row = await queryOneOptional<ReceiptRow>(
      `SELECT o.public_order_id, o.slug, o.status, o.amount_human, o.token_symbol,
              o.chain_id, o.created_at, o.nft_token_id, o.nft_mint_tx, o.nft_contract,
              o.nft_chain_id,
              (SELECT p.tx_hash FROM payments p WHERE p.order_id = o.id
                ORDER BY p.created_at ASC LIMIT 1) AS payment_tx
         FROM orders o
        WHERE o.nft_token_id = $1 AND o.nft_status = 'minted'
        LIMIT 1`,
      [tokenId],
    );
  } catch {
    return NextResponse.json({ error: "Metadata temporarily unavailable." }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  }

  const service = getServiceBySlug(row.slug);
  const siteUrl = NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const chainKey = chainKeyFromId(row.nft_chain_id ?? row.chain_id);
  const amountLabel =
    row.amount_human && row.token_symbol ? `${row.amount_human} ${row.token_symbol}` : "n/a";

  const attributes: { trait_type: string; value: string }[] = [
    { trait_type: "Service", value: service?.name || row.slug },
    { trait_type: "Amount Paid", value: amountLabel },
    { trait_type: "Order Status", value: row.status },
    { trait_type: "Network", value: chainKey === "bnb" ? "BNB Chain" : "Polygon" },
    { trait_type: "Issued", value: new Date(row.created_at).toISOString().slice(0, 10) },
    { trait_type: "Transferable", value: "No (soulbound)" },
  ];
  if (row.payment_tx) {
    attributes.push({ trait_type: "Payment Tx", value: row.payment_tx });
  }

  const body = {
    name: `QuestPay Receipt #${row.nft_token_id}`,
    description:
      `Soulbound proof of purchase for a Kenshi QuestPay creator service order. ` +
      `Verifiable on-chain; the private brief and buyer contact details are never stored on-chain.`,
    image: `${siteUrl}/questpay-og-1200x630.png`,
    external_url: row.payment_tx ? `${siteUrl}/verify/${row.payment_tx}` : `${siteUrl}/verify`,
    attributes,
    questpay: {
      orderId: row.public_order_id,
      paymentTx: row.payment_tx,
      paymentTxUrl: row.payment_tx ? explorerTxUrl(chainKey, row.payment_tx) : null,
      mintTx: row.nft_mint_tx,
      contract: row.nft_contract,
      chainId: row.nft_chain_id,
      soulbound: true,
    },
  };

  return NextResponse.json(body, {
    headers: {
      // Metadata is effectively immutable once minted; allow marketplace caching.
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
