"use client";

import { useState } from "react";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhatIsThis from "@/components/WhatIsThis";
import PinnedStory from "@/components/PinnedStory";
import Packages from "@/components/Packages";
import ContractProof from "@/components/ContractProof";
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
        <WhatIsThis />
        <PinnedStory />
        <Packages selectedPackage={selectedPackage} onSelect={setSelectedPackage} />
        <ContractProof />
        <Checkout selectedPackage={selectedPackage} onTxSuccess={setReceipt} />
        <Receipt receipt={receipt} />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </Web3Provider>
  );
}
