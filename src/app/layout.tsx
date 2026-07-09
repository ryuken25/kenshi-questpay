import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenshi QuestPay — Micro-Commission Checkout for Creators",
  description:
    "Skip the DM chaos. Submit a clean brief, pay with Base Sepolia ETH, receive an NFT Service Pass. Built for VIBE CODING WITH VERSE July 2025.",
  openGraph: {
    title: "Kenshi QuestPay",
    description: "Micro-commission checkout for creators. Pay with crypto. Get an NFT receipt.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D14] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
