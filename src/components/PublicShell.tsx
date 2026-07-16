import { Web3Provider } from "@/components/Web3Provider";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-[var(--qp-bg)] text-[var(--qp-text-secondary)]">
        {children}
      </div>
    </Web3Provider>
  );
}
