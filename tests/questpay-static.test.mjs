import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('wallet config includes Polygon and staged BNB Chain, no testnets, and no BNB token is live for payment', () => {
  const provider = read('src/components/Web3Provider.tsx');
  assert.match(provider, /chains:\s*\[polygon,\s*bsc\]/);
  assert.doesNotMatch(provider, /baseSepolia|84532|sepolia\.base/);

  const services = read('src/lib/services.ts');
  // BNB Chain wallet connectivity exists, but every BNB token entry in the
  // CHAIN_TOKENS matrix must stay enabled:false until a real send/verify
  // path against BSC is proven. Slice between CHAIN_TOKENS's "bnb:" key and
  // the matrix's closing "};" — plain slicing avoids CRLF-sensitive regexes,
  // and NETWORKS.bnb (a separate, single-line object) is excluded by
  // starting the search at CHAIN_TOKENS.
  const chainTokensStart = services.indexOf('CHAIN_TOKENS');
  assert.ok(chainTokensStart !== -1, 'expected a CHAIN_TOKENS export');
  const bnbStart = services.indexOf('bnb:', chainTokensStart);
  const matrixEnd = services.indexOf('};', bnbStart);
  assert.ok(bnbStart !== -1 && matrixEnd !== -1, 'expected a bnb block inside CHAIN_TOKENS');
  const bnbBlock = services.slice(bnbStart, matrixEnd);
  assert.doesNotMatch(bnbBlock, /enabled:\s*true/);
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
  const authPanel = read('src/components/auth/AuthPanel.tsx');
  assert.match(authPanel, /Continue with Google/);
  assert.match(authPanel, /Connect Wallet/);
  assert.match(authPanel, /Send secure link/);
  assert.doesNotMatch(signin + authPanel, /Creator Login|owner email|private creator workflow/);
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

test('navbar uses Sign In and Start Selling, no persistent Connect Wallet, no Creator Login', () => {
  const navbar = read('src/components/Navbar.tsx');
  assert.match(navbar, /Sign In/);
  assert.match(navbar, /Start Selling/);
  assert.match(navbar, /AuthModal/);
  assert.doesNotMatch(navbar, /Connect Wallet/);
  assert.doesNotMatch(navbar, /Creator Login/);
});

test('reference parity palette stays near-black and violet without cyan headline branding', () => {
  const css = read('src/app/globals.css');
  assert.match(css, /--qp-black-000:\s*#010104/);
  assert.match(css, /--qp-violet-500:\s*#8752ff/i);
  const gradient = css.slice(css.indexOf('.gradient-text'), css.indexOf('.gradient-border'));
  assert.match(gradient, /#8b4dff/i);
  assert.doesNotMatch(gradient, /#67e3fa|#78a6ff/i);
});

test('public hero uses compact parity composition without blue or cyan backdrop', () => {
  const hero = read('src/components/home/PremiumHomeHero.tsx');
  assert.match(hero, /qp-home-hero/);
  assert.match(hero, /qp-hero-title/);
  assert.doesNotMatch(hero, /70,180,255|7\.3vw/);
});

test('orbital hero keeps permanent rear/front token copies and updates them without React frame renders', () => {
  const scene = read('src/components/home/HeroOrbitalScene.tsx');
  const css = read('src/app/globals.css');

  assert.match(scene, /const TOKENS[\s\S]*verse[\s\S]*usdt[\s\S]*usdc[\s\S]*pol/);
  assert.match(scene, /TOKENS\.map\(\(token\)/);
  assert.match(scene, /rearRefs\.current\[token\.id\]/);
  assert.match(scene, /frontRefs\.current\[token\.id\]/);
  assert.match(scene, /IntersectionObserver/);
  assert.match(scene, /timeRef\.current \+= dt/);
  assert.match(scene, /smoothstep\(-0\.16, 0\.16, z\)/);
  assert.doesNotMatch(scene, /style\.zIndex|dataset\.depth|setElapsed|poses\.filter/);
  for (const asset of ['/tokens/usdt.svg', '/tokens/usdc.svg', '/brand/verse/verse-icon-official.png', '/tokens/pol.svg']) {
    assert.match(scene, new RegExp(asset.replaceAll('/', '\\/').replace('.', '\\.')));
  }
  assert.match(css, /\.qp-orbit-ring--rear/);
  assert.match(css, /\.qp-orbit-ring--front/);
  assert.match(css, /\.qp-cube-asset/);
  assert.doesNotMatch(css, /rotateY\(360deg\)/);
});

test('navbar uses supplied horizontal QuestPay logo and locks mobile page scroll', () => {
  const navbar = read('src/components/Navbar.tsx');
  assert.match(navbar, /questpay-logo-horizontal\.svg/);
  assert.match(navbar, /document\.body\.style\.overflow/);
});

test('order creation API rejects unauthenticated and incomplete-profile requests before touching payment logic', () => {
  const route = read('src/app/api/orders/route.ts');
  assert.match(route, /getSession\(\)/);
  assert.match(route, /status:\s*401/);
  assert.match(route, /onboardingCompletedAt/);
  assert.match(route, /status:\s*409/);
  assert.match(route, /account_id:\s*session\.accountId/);
  // The auth/profile gate must run before any quote/payment work, not after.
  const authGateIndex = route.indexOf('status: 401');
  const quoteIndex = route.indexOf('createPaymentQuote(');
  assert.ok(authGateIndex !== -1 && quoteIndex !== -1 && authGateIndex < quoteIndex);
});

test('checkout page gates anonymous and incomplete-profile sessions server-side', () => {
  const checkout = read('src/app/checkout/[slug]/page.tsx');
  assert.match(checkout, /getSession\(\)/);
  assert.match(checkout, /CheckoutAuthGate/);
  assert.match(checkout, /redirect\(`\/onboarding/);
});

test('profile migration and APIs never trust a client-supplied account_id', () => {
  const migration = read('supabase/migrations/20260712_questpay_v6_profile_onboarding.sql');
  assert.match(migration, /account_profiles/);
  assert.match(migration, /preferred_chain/);
  assert.match(migration, /onboarding_completed_at/);
  assert.match(migration, /orders_account_id_fkey/);

  for (const file of ['src/app/api/profile/route.ts', 'src/app/api/profile/onboarding/route.ts']) {
    const src = read(file);
    assert.match(src, /getSession\(\)/, file);
    assert.match(src, /status:\s*401/, file);
    assert.doesNotMatch(src, /body\.accountId|req\.accountId/, file);
  }
});

test('every logout control submits POST instead of navigating to the POST-only endpoint', () => {
  const account = read('src/app/account/page.tsx');
  const studioShell = read('src/components/StudioShell.tsx');
  const accessDenied = read('src/app/studio/access-denied/page.tsx');

  for (const source of [account, studioShell, accessDenied]) {
    assert.match(source, /<form[^>]+action=["']\/api\/auth\/logout["'][^>]+method=["']post["']/i);
    assert.doesNotMatch(source, /<a[^>]+href=["']\/api\/auth\/logout["']/i);
  }
});

test('logout always clears the canonical session cookie even if server-side revocation fails', () => {
  const route = read('src/app/api/auth/logout/route.ts');
  assert.match(route, /import\s*\{[^}]*SESSION_COOKIE[^}]*destroySession|import\s*\{[^}]*destroySession[^}]*SESSION_COOKIE/);
  assert.match(route, /try\s*\{\s*await destroySession\(\);\s*\}\s*catch/s);
  assert.match(route, /cookies\.set\(SESSION_COOKIE,\s*["']{2}/);
  assert.match(route, /Cache-Control["']?,\s*["']no-store/);
});
