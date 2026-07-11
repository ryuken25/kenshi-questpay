import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenshi QuestPay — Creator Service Checkout on Polygon",
  description:
    "Choose a fixed creator service, submit a clear private brief, pay directly on Polygon, track progress, and keep a verifiable receipt.",
  openGraph: {
    title: "Kenshi QuestPay",
    description:
      "Crypto-native service checkout and delivery workspace for small creator jobs on Polygon.",
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
      <body className="bg-[#080b18] min-h-screen antialiased">
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
