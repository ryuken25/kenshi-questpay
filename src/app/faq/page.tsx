import FAQ from '@/components/FAQ';
import PublicShell from '@/components/PublicShell';
import { isNftReceiptsEnabled } from '@/lib/nft/flag';
export const metadata = { title: 'FAQ — Kenshi QuestPay' };
export default function FaqPage() { return <PublicShell><div className="min-screen-safe pt-6"><FAQ nftEnabled={isNftReceiptsEnabled()} /></div></PublicShell>; }
