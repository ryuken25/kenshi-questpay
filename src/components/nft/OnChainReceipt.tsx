"use client";

import { ExternalLink, ShieldCheck, Loader2 } from "lucide-react";

/**
 * On-chain (soulbound) receipt block.
 *
 * Renders nothing unless the API supplied an `nft` block — and the API only
 * includes that when ENABLE_NFT_RECEIPTS is on. So with the flag off this
 * component is invisible and the page is unchanged.
 */
export interface NftReceipt {
  status: string;
  tokenId: string | null;
  mintTx: string | null;
  contract: string | null;
  chainId: number | null;
  mintTxUrl: string | null;
  metadataUrl: string | null;
  soulbound?: boolean;
}

export default function OnChainReceipt({ nft }: { nft?: NftReceipt | null }) {
  if (!nft) return null;

  if (nft.status === "minted" && nft.tokenId) {
    return (
      <div
        data-testid="nft-receipt"
        className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-400" aria-hidden="true" />
          <span className="text-sm font-medium text-white">
            On-chain receipt #{nft.tokenId}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          A non-transferable (soulbound) proof of purchase minted to your wallet. No brief
          or contact details are stored on-chain.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {nft.mintTxUrl && (
            <a
              href={nft.mintTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200"
            >
              Mint transaction <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {nft.metadataUrl && (
            <a
              href={nft.metadataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200"
            >
              Metadata <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (nft.status === "pending") {
    return (
      <p
        data-testid="nft-receipt-pending"
        className="mt-3 inline-flex items-center gap-2 text-xs text-muted"
      >
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        On-chain receipt is being minted — it will appear here shortly.
      </p>
    );
  }

  // 'failed' / anything else: stay silent. A mint problem is never surfaced as a
  // payment problem, and the payment itself is already verified independently.
  return null;
}
