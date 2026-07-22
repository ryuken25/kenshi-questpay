import FAQ from '@/components/FAQ';
import PublicShell from '@/components/PublicShell';
import { isNftReceiptsEnabled } from '@/lib/nft/flag';
export const metadata = { title: 'FAQ — Kenshi QuestPay' };
// Read ENABLE_NFT_RECEIPTS at request time, not build time, so the feature flag
// behaves consistently with the (dynamic) API routes instead of being baked in.
export const dynamic = 'force-dynamic';
export default function FaqPage() { return <PublicShell><div className="min-screen-safe pt-6"><FAQ nftEnabled={isNftReceiptsEnabled()} /></div></PublicShell>; }
