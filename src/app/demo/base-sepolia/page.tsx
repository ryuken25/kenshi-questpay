import type { Metadata } from "next";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoBaseSepolia from "@/components/DemoBaseSepolia";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Base Sepolia Demo — Kenshi QuestPay",
  description: "Interactive demo on Base Sepolia testnet. No real funds.",
};

export default function DemoBaseSepoliaPage() {
  return (
    <Web3Provider>
      <Navbar />
      <main className="min-screen-safe pt-20">
        <DemoBaseSepolia />
      </main>
      <Footer />
    </Web3Provider>
  );
}
