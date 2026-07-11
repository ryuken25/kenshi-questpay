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

test('unified auth infrastructure exists', () => {
  const auth = read('src/lib/auth.ts');
  assert.match(auth, /SESSION_COOKIE/);
  assert.match(auth, /ROOT_ACCOUNT_ID/);
  assert.match(auth, /ROOT_EMAIL/);
  assert.match(auth, /ROOT_WALLETS/);
  assert.match(auth, /requireRole/);
  assert.match(auth, /findOrCreateAccountByEmail/);
  assert.match(auth, /findOrCreateAccountByWallet/);
  assert.match(auth, /redirectForRoles/);
});

test('unified sign-in page exists and has no Creator Login copy', () => {
  const signin = read('src/app/sign-in/page.tsx');
  assert.match(signin, /Continue with Google/);
  assert.match(signin, /Continue with Wallet/);
  assert.match(signin, /Send secure link/);
  assert.doesNotMatch(signin, /Creator Login|owner email|private creator workflow/);
});

test('auth migration has root bootstrap', () => {
  const migration = read('supabase/migrations/20260711_questpay_v5_unified_auth.sql');
  assert.match(migration, /accounts/);
  assert.match(migration, /account_identities/);
  assert.match(migration, /account_roles/);
  assert.match(migration, /root_identity_claims/);
  assert.match(migration, /account_sessions/);
  assert.match(migration, /wallet_nonces/);
  assert.match(migration, /admin_audit_log/);
  assert.match(migration, /00000000-0000-4000-8000-000000000001/);
  assert.match(migration, /winayaarya@gmail.com/);
  assert.match(migration, /0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf/);
  assert.match(migration, /0xa111a8c806b1fac9d27650455344f5c2f144a743/);
});

test('navbar uses Sign in not Creator Login', () => {
  const navbar = read('src/components/Navbar.tsx');
  assert.match(navbar, /\/sign-in/);
  assert.doesNotMatch(navbar, /Creator Login/);
});
