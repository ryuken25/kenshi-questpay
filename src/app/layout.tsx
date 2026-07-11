import type { Metadata, Viewport } from "next";
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
  const buildSha = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
  return (
    <html lang="en" className="dark">
      <body data-build-sha={buildSha} className="min-h-screen bg-[var(--qp-bg)] antialiased">
        {children}
        <script defer data-domain="kenshi-questpay.vercel.app" src="https://analytics.vgdh.io/js/script.js" />
      </body>
    </html>
  );
}
