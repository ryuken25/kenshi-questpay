import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-secondary)]">
        <Navbar />
        {children}
        <Footer />
      </div>
    </Web3Provider>
  );
}
