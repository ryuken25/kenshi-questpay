export type TokenSymbol = 'POL' | 'USDT' | 'VERSE';
export type TokenConfig = { kind: 'native' | 'erc20'; symbol: TokenSymbol; label: string; address?: `0x${string}`; decimals: number; enabled: boolean };

export const PAYMENTS = {
  chainId: 137,
  chainHex: '0x89',
  chainName: 'Polygon Mainnet',
  rpc: process.env.NEXT_PUBLIC_POLYGON_RPC ?? 'https://polygon-bor-rpc.publicnode.com',
  receiveAddress: (process.env.NEXT_PUBLIC_RECEIVE_ADDRESS ?? '0xA111a8C806b1FAc9D27650455344F5C2f144a743') as `0x${string}`,
  tokens: {
    POL: { kind: 'native', symbol: 'POL', label: 'POL', decimals: 18, enabled: true },
    USDT: { kind: 'erc20', symbol: 'USDT', label: 'USDT (PoS)', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`, decimals: 6, enabled: true },
    VERSE: { kind: 'erc20', symbol: 'VERSE', label: 'fxVERSE', address: (process.env.NEXT_PUBLIC_VERSE_ADDRESS ?? '0xc708d6f2153933daa50b2d0758955be0a93a8fec') as `0x${string}`, decimals: 18, enabled: true },
  } satisfies Record<TokenSymbol, TokenConfig>,
  packages: [
    { id: 1, slug: 'starter', usd: 5, amounts: { USDT: '5', POL: 'OWNER_SET', VERSE: 'OWNER_SET' } },
    { id: 2, slug: 'pro', usd: 15, amounts: { USDT: '15', POL: 'OWNER_SET', VERSE: 'OWNER_SET' } },
    { id: 3, slug: 'studio', usd: 40, amounts: { USDT: '40', POL: 'OWNER_SET', VERSE: 'OWNER_SET' } },
    { id: 4, slug: 'boss', usd: 80, amounts: { USDT: '80', POL: 'OWNER_SET', VERSE: 'OWNER_SET' } },
    { id: 5, slug: 'legendary', usd: 150, amounts: { USDT: '150', POL: 'OWNER_SET', VERSE: 'OWNER_SET' } },
  ],
};

export const isAmountReady = (amount?: string) => !!amount && amount !== 'OWNER_SET' && Number(amount) > 0;
export const polygonScanTx = (tx: string) => `https://polygonscan.com/tx/${tx}`;
export const polygonScanAddress = (addr: string) => `https://polygonscan.com/address/${addr}`;
