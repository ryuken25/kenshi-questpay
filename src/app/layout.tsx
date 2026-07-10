import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenshi QuestPay — Micro-Commission Checkout for Creators",
  description:
    "Structured briefs, Polygon crypto checkout, and verifiable on-chain receipts for creator micro-commissions. Built for VIBE CODING WITH VERSE July Edition.",
  openGraph: {
    title: "Kenshi QuestPay",
    description: "Micro-commission checkout for creators. Pay with POL/USDT/fxVERSE on Polygon. Verify receipts on-chain.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D14] min-h-screen antialiased">
        {children}
        <Script
          defer
          data-domain="kenshi-questpay.vercel.app"
          src="https://analytics.vgdh.io/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
