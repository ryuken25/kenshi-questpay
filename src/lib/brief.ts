import crypto from "crypto";

export function generateBriefId(handle: string, mainProblem: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const data = `${handle}:${mainProblem}:${Date.now()}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 8);
  return `questpay:${dateStr}:${hash}`;
}

export function hashBrief(briefId: string): string {
  // Client-side SHA-256 hash to send to contract
  const encoder = new TextEncoder();
  const data = encoder.encode(briefId);
  // Use SubtleCrypto in browser
  return briefId; // Will be hashed before sending to contract
}

export async function hashBriefAsync(briefId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(briefId);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
