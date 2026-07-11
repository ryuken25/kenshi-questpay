import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kenshi QuestPay — Creator Services on Polygon",
  description:
    "Choose a scoped creator service, pay on Polygon, track progress, and receive delivery with a verifiable receipt.",
  openGraph: {
    title: "Kenshi QuestPay — Creator Services on Polygon",
    description:
      "Choose a scoped creator service, pay on Polygon, track progress, and receive delivery with a verifiable receipt.",
    type: "website",
    images: [{ url: "/questpay-og-1200x630.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kenshi QuestPay — Creator Services on Polygon",
    description: "Choose a scoped creator service, pay on Polygon, track progress, and receive delivery with a verifiable receipt.",
    images: ["/questpay-og-1200x630.png"],
  },
  icons: {
    icon: "/icons/questpay-mark-512.png",
    apple: "/icons/questpay-mark-512.png",
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
