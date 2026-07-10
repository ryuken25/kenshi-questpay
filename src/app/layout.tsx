import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenshi QuestPay — Micro-Commission Checkout for Creators",
  description:
    "Structured briefs, Polygon crypto checkout, and verifiable on-chain receipts for creator micro-commissions. Real payments on Polygon mainnet. Free evaluator demo on Base Sepolia.",
  openGraph: {
    title: "Kenshi QuestPay",
    description:
      "Micro-commission checkout for creators. Pay with USDT, VERSE, or POL on Polygon. Verify receipts on-chain.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hubImpactSrc = process.env.NEXT_PUBLIC_HUB_IMPACT_SRC?.trim();
  const hubSiteId = process.env.NEXT_PUBLIC_HUB_SITE_ID?.trim();
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D14] min-h-screen antialiased">
        {children}
        {hubImpactSrc ? (
          <Script
            defer
            src={hubImpactSrc}
            data-site-id={hubSiteId || undefined}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
