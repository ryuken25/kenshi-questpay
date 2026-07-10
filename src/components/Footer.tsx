import Link from "next/link";
import { Github } from "lucide-react";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-sora font-bold text-lg gradient-text mb-1">⚔️ Kenshi QuestPay</p>
            <p className="text-xs text-gray-600 font-inter">
              Micro-commission checkout for creators • {SITE.edition}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href={SITE.creator.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-verse-purple transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Terms
            </Link>
            <span className="text-xs text-gray-700 font-mono">
              {SITE.realNetwork}
            </span>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-700 font-mono">
            Built with Next.js, wagmi, viem, Supabase & Nodemailer • {SITE.realNetwork}
          </p>
          <p className="mt-2 text-[10px] text-gray-700">{SITE.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
