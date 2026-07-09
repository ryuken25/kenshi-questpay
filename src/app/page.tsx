"use client";

import { useState } from "react";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PinnedStory from "@/components/PinnedStory";
import Packages from "@/components/Packages";
import Checkout from "@/components/Checkout";
import Receipt from "@/components/Receipt";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface ReceiptData {
  packageId: number;
  buyerAddress: string;
  txHash: string;
  network: string;
  briefId: string;
}

export default function HomePage() {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  return (
    <Web3Provider>
      <Navbar />
      <main>
        <Hero />
        <PinnedStory />
        <Packages selectedPackage={selectedPackage} onSelect={setSelectedPackage} />
        <Checkout selectedPackage={selectedPackage} onTxSuccess={setReceipt} />
        <Receipt receipt={receipt} />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </Web3Provider>
  );
}
