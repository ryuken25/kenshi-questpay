import { encodeFunctionData, erc20Abi, formatUnits, parseUnits } from 'viem';
import { PAYMENTS, TokenSymbol, isAmountReady } from '@/config/payments';

export type VerifyResult = { ok: boolean; reason?: string; txHash: string; from?: string; to?: string; token?: TokenSymbol; amount?: string; blockNumber?: number; timestamp?: number; explorer?: string };
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const padAddr = (addr: string) => `0x${addr.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
export const middle = (v: string, a = 6, b = 4) => v ? `${v.slice(0,a)}…${v.slice(-b)}` : '';
export function amountFor(packageId: number, token: TokenSymbol) { return PAYMENTS.packages.find(p => p.id === packageId)?.amounts[token] ?? ''; }
export function eip681(packageId: number, token: TokenSymbol) {
  const amount = amountFor(packageId, token); const cfg = PAYMENTS.tokens[token];
  if (!isAmountReady(amount)) return '';
  const units = parseUnits(amount, cfg.decimals).toString();
  if (cfg.kind === 'native') return `ethereum:${PAYMENTS.receiveAddress}@137?value=${units}`;
  return `ethereum:${cfg.address}@137/transfer?address=${PAYMENTS.receiveAddress}&uint256=${units}`;
}
export async function switchToPolygon(provider: any) {
  try { await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: PAYMENTS.chainHex }] }); }
  catch (err: any) {
    if (err?.code === 4902) await provider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: PAYMENTS.chainHex, chainName: 'Polygon Mainnet', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 }, rpcUrls: [PAYMENTS.rpc], blockExplorerUrls: ['https://polygonscan.com'] }] });
    else throw err;
  }
}
export async function sendWalletPayment({ packageId, token }: { packageId: number; token: TokenSymbol }) {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error('No injected wallet found. Open in MetaMask mobile browser or use Manual Pay.');
  const amount = amountFor(packageId, token); const cfg = PAYMENTS.tokens[token];
  if (!isAmountReady(amount)) throw new Error(`${token} amount is not configured yet.`);
  await switchToPolygon(provider);
  const [from] = await provider.request({ method: 'eth_requestAccounts' });
  const value = parseUnits(amount, cfg.decimals);
  let txHash: string;
  if (cfg.kind === 'native') {
    txHash = await provider.request({ method: 'eth_sendTransaction', params: [{ from, to: PAYMENTS.receiveAddress, value: `0x${value.toString(16)}` }] });
  } else {
    const data = encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [PAYMENTS.receiveAddress, value] });
    txHash = await provider.request({ method: 'eth_sendTransaction', params: [{ from, to: cfg.address, data }] });
  }
  return { from, txHash };
}
async function rpc(method: string, params: any[]) {
  const res = await fetch(PAYMENTS.rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }) });
  const json = await res.json(); if (json.error) throw new Error(json.error.message || 'RPC error'); return json.result;
}
export async function verifyPolygonPayment(txHash: string, packageId: number, token: TokenSymbol): Promise<VerifyResult> {
  try {
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return { ok: false, txHash, reason: 'Invalid transaction hash format.' };
    const amount = amountFor(packageId, token); const cfg = PAYMENTS.tokens[token];
    if (!isAmountReady(amount)) return { ok: false, txHash, reason: `${token} amount is not configured yet.` };
    const expected = parseUnits(amount, cfg.decimals);
    const [tx, receipt] = await Promise.all([rpc('eth_getTransactionByHash', [txHash]), rpc('eth_getTransactionReceipt', [txHash])]);
    if (!tx || !receipt) return { ok: false, txHash, reason: 'Transaction not found on Polygon yet.' };
    if (receipt.status !== '0x1') return { ok: false, txHash, reason: 'Transaction failed on-chain.' };
    const block = await rpc('eth_getBlockByNumber', [receipt.blockNumber, false]);
    const timestamp = Number.parseInt(block.timestamp, 16);
    if (Date.now() / 1000 - timestamp > 86400) return { ok: false, txHash, reason: 'Transaction is older than 24 hours.' };
    if (cfg.kind === 'native') {
      const okTo = tx.to?.toLowerCase() === PAYMENTS.receiveAddress.toLowerCase();
      const value = BigInt(tx.value || '0x0');
      if (!okTo || value < expected) return { ok: false, txHash, reason: 'POL payment does not match expected receiver/amount.' };
      return { ok: true, txHash, from: tx.from, to: tx.to, token, amount: formatUnits(value, cfg.decimals), blockNumber: Number.parseInt(receipt.blockNumber, 16), timestamp, explorer: `https://polygonscan.com/tx/${txHash}` };
    }
    const wantedTo = padAddr(PAYMENTS.receiveAddress);
    const log = (receipt.logs || []).find((l: any) => l.address?.toLowerCase() === cfg.address?.toLowerCase() && l.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC && l.topics?.[2]?.toLowerCase() === wantedTo.toLowerCase() && BigInt(l.data || '0x0') >= expected);
    if (!log) return { ok: false, txHash, reason: `${token} transfer to owner wallet with expected amount not found.` };
    return { ok: true, txHash, from: `0x${log.topics[1].slice(-40)}`, to: PAYMENTS.receiveAddress, token, amount: formatUnits(BigInt(log.data), cfg.decimals), blockNumber: Number.parseInt(receipt.blockNumber, 16), timestamp, explorer: `https://polygonscan.com/tx/${txHash}` };
  } catch (e: any) { return { ok: false, txHash, reason: e?.message || 'Verification failed.' }; }
}
export function markRedeemed(txHash: string) { const list = JSON.parse(localStorage.getItem('questpay:redeemed') || '[]'); if (!list.includes(txHash)) localStorage.setItem('questpay:redeemed', JSON.stringify([...list, txHash])); }
export function isRedeemed(txHash: string) { return JSON.parse(localStorage.getItem('questpay:redeemed') || '[]').includes(txHash); }
