export function shortAddress(address?: string, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}
export function polygonScanAddress(address: string) { return `https://polygonscan.com/address/${address}`; }
export function polygonScanTx(tx: string) { return `https://polygonscan.com/tx/${tx}`; }
