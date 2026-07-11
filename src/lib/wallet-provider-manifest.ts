import type { Connector } from "wagmi";

/**
 * QuestPay wallet presentation manifest.
 * Runtime EIP-6963 / connector metadata always takes precedence over these
 * static entries; the manifest only supplies official URLs and fallback intent.
 */
export type WalletPresentation = {
  key: string;
  names: string[];
  officialUrl: string;
  installUrl?: string;
  preferredDiscovery: "eip6963" | "walletconnect" | "sdk";
  note: string;
};

export const walletPresentation: WalletPresentation[] = [
  {
    key: "metamask",
    names: ["MetaMask"],
    officialUrl: "https://metamask.io/",
    installUrl: "https://metamask.io/download/",
    preferredDiscovery: "eip6963",
    note: "Use EIP-6963/Wagmi announced icon first; official brand fallback only.",
  },
  {
    key: "rabby",
    names: ["Rabby", "Rabby Wallet"],
    officialUrl: "https://rabby.io/",
    installUrl: "https://rabby.io/",
    preferredDiscovery: "eip6963",
    note: "Use provider-announced icon; fallback source is RabbyHub/logo.",
  },
  {
    key: "okx",
    names: ["OKX Wallet", "OKX"],
    officialUrl: "https://www.okx.com/web3",
    installUrl: "https://www.okx.com/web3",
    preferredDiscovery: "eip6963",
    note: "Do not confuse exchange logo with wallet connector metadata.",
  },
  {
    key: "coinbase",
    names: ["Coinbase Wallet", "Base Account"],
    officialUrl: "https://www.coinbase.com/wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    preferredDiscovery: "sdk",
    note: "Use connector/SDK metadata and official deep-link behavior.",
  },
  {
    key: "binance",
    names: ["Binance Wallet", "Binance Web3 Wallet"],
    officialUrl: "https://web3.binance.com/",
    installUrl: "https://web3.binance.com/",
    preferredDiscovery: "eip6963",
    note: "Only show as detected/supported when the connector is actually available.",
  },
  {
    key: "walletconnect",
    names: ["WalletConnect"],
    officialUrl: "https://walletconnect.com/",
    preferredDiscovery: "walletconnect",
    note: "Use official WalletConnect connector icon and QR/modal metadata.",
  },
];

export type InstallSuggestion = Pick<WalletPresentation, "key" | "names" | "officialUrl" | "installUrl">;

/**
 * Wallet connection lifecycle states from the QuestPay spec. A given surface
 * implements the subset it needs (WalletModal: connect only; AuthPanel: full
 * signature flow).
 */
export type WalletConnectionState =
  | "idle"
  | "opening"
  | "awaiting_approval"
  | "connected"
  | "signature_requested"
  | "verifying"
  | "success"
  | "rejected"
  | "wrong_chain"
  | "unsupported";

export const walletStateLabels: Record<WalletConnectionState, string> = {
  idle: "",
  opening: "Opening wallet…",
  awaiting_approval: "Confirm in your wallet",
  connected: "Connected",
  signature_requested: "Sign the message to continue",
  verifying: "Verifying signature…",
  success: "Signed in",
  rejected: "Request cancelled",
  wrong_chain: "Wrong network — switch to Polygon",
  unsupported: "This wallet isn't supported yet",
};

/**
 * Only allow icons we can safely render inside an <img>: https URLs and image
 * data URIs. Extension-announced data URIs are untrusted, so we reject anything
 * that is not an explicit image mime type (blocks javascript:, http:, and
 * non-image data payloads). SVGs loaded via <img src> run in a non-scripted
 * context, so image/svg+xml is allowed.
 */
export function sanitizeWalletIcon(icon?: string | null): string | null {
  if (!icon || typeof icon !== "string") return null;
  const trimmed = icon.trim();
  if (/^https:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
  if (/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/i.test(trimmed)) return trimmed;
  return null;
}

export function matchWalletPresentation(name?: string | null): WalletPresentation | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    walletPresentation.find((p) => p.names.some((n) => lower.includes(n.toLowerCase()) || n.toLowerCase().includes(lower))) ??
    null
  );
}

export type PreparedWalletList = {
  detected: Connector[];
  walletConnect: Connector | null;
  installs: InstallSuggestion[];
};

/**
 * Split wagmi connectors into what we actually render:
 * - `detected`: EIP-6963 discovered injected connectors (real icon/name) plus
 *   SDK connectors (Coinbase). The generic `injected` fallback is only kept when
 *   no EIP-6963 provider was discovered but a raw window.ethereum exists.
 * - `walletConnect`: the WalletConnect connector, if the project ID enabled it.
 * - `installs`: manifest wallets that were not detected, surfaced as official
 *   install links (never faked as installed).
 */
export function prepareWalletList(connectors: readonly Connector[], hasInjectedProvider: boolean): PreparedWalletList {
  const hasDiscovered = connectors.some((c) => c.type === "injected" && c.id !== "injected");

  const detected = connectors.filter((c) => {
    if (c.id === "walletConnect") return false;
    if (c.id === "injected") return hasDiscovered ? false : hasInjectedProvider;
    return true;
  });

  const walletConnect = connectors.find((c) => c.id === "walletConnect") ?? null;

  const detectedNames = detected.map((c) => c.name.toLowerCase());
  const isDetected = (p: WalletPresentation) =>
    p.names.some((n) => {
      const needle = n.toLowerCase();
      return detectedNames.some((dn) => dn.includes(needle) || needle.includes(dn));
    });

  const installs: InstallSuggestion[] = walletPresentation
    .filter((p) => p.key !== "walletconnect" && !isDetected(p))
    .map(({ key, names, officialUrl, installUrl }) => ({ key, names, officialUrl, installUrl }));

  return { detected, walletConnect, installs };
}

export function isUserRejection(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: number; name?: string; message?: string; shortMessage?: string };
  if (e.code === 4001) return true;
  const text = `${e.name ?? ""} ${e.shortMessage ?? ""} ${e.message ?? ""}`.toLowerCase();
  return text.includes("reject") || text.includes("denied") || text.includes("cancell");
}
