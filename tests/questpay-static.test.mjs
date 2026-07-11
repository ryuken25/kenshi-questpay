import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('production config is Polygon only', () => {
  const provider = read('src/components/Web3Provider.tsx');
  assert.match(provider, /chains:\s*\[polygon\]/);
  assert.doesNotMatch(provider, /baseSepolia|84532|sepolia\.base/);
});

test('payment page does not use direct window.ethereum transaction path', () => {
  const pay = read('src/components/PayPageClient.tsx');
  assert.doesNotMatch(pay, /window\.ethereum|eth_sendTransaction|wallet_switchEthereumChain/);
  assert.match(pay, /Payments are being upgraded/);
});

test('quote engine has no 1:1 VERSE or manual POL fallback', () => {
  const quote = read('src/lib/payments/quote-service.ts');
  const services = read('src/lib/services.ts');
  assert.match(services, /verse-bitcoin/);
  assert.match(services, /polygon-ecosystem-token/);
  assert.doesNotMatch(quote + services, /POL_AMOUNT_USD|OWNER_SET/);
  assert.doesNotMatch(quote, /tokenSymbol\s*===\s*["']VERSE["']\).*1/);
});

test('public copy removes Base Sepolia and emoji branding from active app source', () => {
  const files = [
    'src/app/layout.tsx',
    'src/components/Hero.tsx',
    'src/components/Navbar.tsx',
    'src/components/Footer.tsx',
    'src/components/FAQ.tsx',
    'src/components/HomeHowItWorks.tsx',
    'src/app/services/page.tsx',
    'src/app/services/[slug]/page.tsx',
  ];
  for (const file of files) {
    const src = read(file);
    assert.doesNotMatch(src, /Base Sepolia|testnet|⚔|⚡|🐉|🎯|🔍|💳|✅/u, file);
  }
});

test('exact VERSE logo and QuestPay mark exist', () => {
  assert.equal(existsSync(new URL('public/brand/verse/verse-logo.svg', root)), true);
  assert.equal(existsSync(new URL('public/brand/questpay/questpay-mark.svg', root)), true);
});
