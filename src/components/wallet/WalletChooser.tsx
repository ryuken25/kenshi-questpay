"use client";

import { AlertTriangle, Check, ExternalLink, Loader2, QrCode, Wallet } from "lucide-react";
import type { Connector } from "wagmi";
import {
  isUserRejection,
  sanitizeWalletIcon,
  walletStateLabels,
  type InstallSuggestion,
  type WalletConnectionState,
} from "@/lib/wallet-provider-manifest";

const cardBase =
  "grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[18px] border px-3.5 py-3 text-left transition-transform duration-150 min-h-[72px] border-[rgba(139,105,255,0.16)] bg-[linear-gradient(180deg,rgba(18,20,34,0.92),rgba(10,12,22,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]";
const cardHover = "hover:-translate-y-px hover:border-[rgba(154,118,255,0.42)] hover:bg-[linear-gradient(180deg,rgba(24,26,44,0.98),rgba(13,15,27,0.98))]";

function WalletLogo({ icon, name }: { icon?: string | null; name: string }) {
  const safe = sanitizeWalletIcon(icon);
  return (
    <span className="grid size-12 place-items-center overflow-hidden rounded-[15px] bg-white/95">
      {safe ? (
        // eslint-disable-next-line @next/next/no-img-element -- wallet icons are runtime data URIs / remote hosts; next/image can't handle arbitrary data URIs
        <img src={safe} alt="" width={30} height={30} className="size-[30px] object-contain" loading="lazy" decoding="async" />
      ) : (
        <span className="text-lg font-black text-[#0d1224]">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function StatusLine({ state, error }: { state: WalletConnectionState; error?: string | null }) {
  if (error) return <span className="block text-xs font-medium text-amber-200/90">{error}</span>;
  const label = walletStateLabels[state];
  if (!label || state === "idle") return null;
  const tone = state === "rejected" || state === "unsupported" || state === "wrong_chain" ? "text-amber-200/90" : "text-[#c1b6ff]";
  return <span className={`block text-xs font-medium ${tone}`}>{label}</span>;
}

export type WalletChooserProps = {
  detected: readonly Connector[];
  walletConnect: Connector | null;
  installs: InstallSuggestion[];
  onConnect: (connector: Connector) => void;
  pendingUid: string | null;
  state: WalletConnectionState;
  error?: string | null;
  /** WalletConnect QR verb differs between plain connect and sign-in flows. */
  connectLabel?: string;
};

export default function WalletChooser({
  detected,
  walletConnect,
  installs,
  onConnect,
  pendingUid,
  state,
  error,
  connectLabel = "Connect",
}: WalletChooserProps) {
  const busy = pendingUid !== null;
  const rejectionOnly = error && isUserRejection({ message: error });

  return (
    <div className="space-y-4">
      {detected.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--qp-text-muted)]">Detected wallets</p>
          {detected.map((connector) => {
            const isPending = pendingUid === connector.uid;
            return (
              <button
                key={connector.uid}
                type="button"
                disabled={busy && !isPending}
                onClick={() => onConnect(connector)}
                className={`${cardBase} ${cardHover} disabled:cursor-not-allowed disabled:opacity-55`}
              >
                <WalletLogo icon={connector.icon} name={connector.name} />
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{connector.name}</span>
                  {isPending ? (
                    <StatusLine state={state} error={rejectionOnly ? error : null} />
                  ) : (
                    <span className="block text-xs text-[var(--qp-text-muted)]">Detected · Polygon</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 rounded-lg border border-[rgba(154,118,255,0.3)] bg-[rgba(124,92,255,0.16)] px-3 py-1.5 text-xs font-bold text-white">
                  {isPending ? (
                    state === "success" ? <Check size={14} /> : <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {isPending ? walletStateLabels[state] && state !== "idle" ? "Working" : connectLabel : connectLabel}
                </span>
              </button>
            );
          })}
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--qp-text-muted)]">Other wallets</p>
        {walletConnect ? (
          <button
            type="button"
            disabled={busy && pendingUid !== walletConnect.uid}
            onClick={() => onConnect(walletConnect)}
            className={`${cardBase} ${cardHover} disabled:cursor-not-allowed disabled:opacity-55`}
          >
            <WalletLogo icon={walletConnect.icon} name={walletConnect.name} />
            <span className="min-w-0">
              <span className="block truncate font-bold text-white">WalletConnect</span>
              {pendingUid === walletConnect.uid ? (
                <StatusLine state={state} error={rejectionOnly ? error : null} />
              ) : (
                <span className="block text-xs text-[var(--qp-text-muted)]">Mobile & QR</span>
              )}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-[rgba(154,118,255,0.3)] bg-[rgba(124,92,255,0.16)] px-3 py-1.5 text-xs font-bold text-white">
              {pendingUid === walletConnect.uid ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
              {connectLabel}
            </span>
          </button>
        ) : (
          <a
            href="https://walletconnect.com/"
            target="_blank"
            rel="noreferrer"
            className={`${cardBase} ${cardHover} opacity-80`}
          >
            <WalletLogo name="WalletConnect" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-white">WalletConnect</span>
              <span className="block text-xs text-[var(--qp-text-muted)]">Mobile QR unavailable right now</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--qp-text-muted)]">
              <ExternalLink size={14} /> About
            </span>
          </a>
        )}
      </section>

      {installs.length > 0 ? (
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--qp-text-muted)]">Not detected</p>
          {installs.map((wallet) => (
            <a
              key={wallet.key}
              href={wallet.installUrl ?? wallet.officialUrl}
              target="_blank"
              rel="noreferrer"
              className={`${cardBase} ${cardHover}`}
            >
              <WalletLogo name={wallet.names[0]} />
              <span className="min-w-0">
                <span className="block truncate font-bold text-white">{wallet.names[0]}</span>
                <span className="block text-xs text-[var(--qp-text-muted)]">Not installed · Open official site</span>
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--qp-text-muted)]">
                <ExternalLink size={14} /> Install
              </span>
            </a>
          ))}
        </section>
      ) : null}

      {error && !rejectionOnly ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}

      <p className="flex items-center gap-2 text-xs leading-5 text-[var(--qp-text-subtle)]">
        <Wallet size={13} className="shrink-0" /> QuestPay only requests a message signature. It never asks for your seed phrase.
      </p>
    </div>
  );
}
