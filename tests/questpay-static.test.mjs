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

test('hero uses one true-3D R3F scene with physical depth, XYZ medallions and fallback', () => {
  const pkg = JSON.parse(read('package.json'));
  const wrapper = read('src/components/home/HeroOrbitalScene.tsx');
  const canvas = read('src/components/home/hero3d/QuestPayHeroCanvas.tsx');
  const cube = read('src/components/home/hero3d/VerseCube.tsx');
  const orbits = read('src/components/home/hero3d/OrbitSystem.tsx');
  const curve = read('src/components/home/hero3d/orbitCurve.ts');
  const medallion = read('src/components/home/hero3d/TokenMedallion.tsx');
  const css = read('src/app/globals.css') + read('src/app/parity.css');

  for (const dep of ['three', '@react-three/fiber', '@react-three/drei']) assert.ok(pkg.dependencies[dep], dep);
  assert.match(wrapper, /dynamic\([\s\S]*ssr:\s*false[\s\S]*Hero3DFallback/);
  assert.match(canvas, /<Canvas[\s\S]*dpr=[\s\S]*frameloop=[\s\S]*QuestPayScene/);
  assert.match(canvas, /AdaptiveDpr/);
  assert.match(cube, /colorWrite=\{false\}/);
  assert.match(cube, /meshPhysicalMaterial/);
  assert.match(cube, /questpay-mark-512\.png/);
  assert.match(cube, /SurfaceFractures/);
  assert.match(curve, /CatmullRomCurve3[\s\S]*arcLengthDivisions[\s\S]*updateArcLengths/);
  assert.match(orbits, /getPointAt[\s\S]*position\.copy/);
  assert.match(medallion, /cylinderGeometry/);
  assert.match(medallion, /rotation\.x/);
  assert.match(medallion, /rotation\.y/);
  assert.match(medallion, /rotation\.z/);
  assert.doesNotMatch(wrapper + orbits + medallion, /style\.zIndex|dataset\.depth|translate3d\(x,\s*y,\s*0\)/);
  assert.match(css, /\.qp-hero3d/);
  assert.doesNotMatch(css, /\.qp-orbit-token-layer|\.qp-orbit-ring--front|\.qp-cube-mark-wrap/);
  for (const asset of ['public/brand/verse/cube-front-verse-albedo.png', 'public/brand/verse/cube-front-verse-emissive.png', 'public/brand/verse/cube-front-verse-roughness.png', 'public/hero/questpay-hero-fallback.webp', 'public/tokens/hero/pol-dark.png', 'public/tokens/hero/usdt-dark.png', 'public/tokens/hero/verse-dark.png', 'public/tokens/hero/usdc-dark.png']) assert.ok(existsSync(new URL(asset, root)), asset);
});

test('hero reference repair keeps a compact obsidian core, exterior orbits, and dense responsive particles', () => {
  const config = read('src/components/home/hero3d/hero3d.config.ts');
  const cube = read('src/components/home/hero3d/VerseCube.tsx');
  const particles = read('src/components/home/hero3d/ParticleField.tsx');
  const scene = read('src/components/home/hero3d/QuestPayScene.tsx');
  const orbitSystem = read('src/components/home/hero3d/OrbitSystem.tsx');
  const orbitCurve = read('src/components/home/hero3d/orbitCurve.ts');

  assert.match(config, /CUBE_SIZE[^=]*= \[2\.04, 1\.8768, 1\.7748\]/);
  assert.match(config, /CUBE_BASE_ROTATION[^=]*= \[0\.366519, -0\.488692, 0\]/);
  assert.match(config, /id: "pol"[\s\S]*phase: Math\.PI/);
  assert.match(config, /id: "usdt"[\s\S]*phase: 0/);
  assert.match(config, /id: "verse"[\s\S]*phase: Math\.PI \/ 2/);
  assert.match(config, /id: "usdc"[\s\S]*phase: \(3 \* Math\.PI\) \/ 2/);
  // Tighter exterior orbits (pol/usdt/verse/usdc) — keep medallions close to the cube core.
  assert.match(config, /radius: \[1\.95, 0\.98, 1\.28\]/);
  assert.match(config, /radius: \[2\.15, 1\.24, 1\.4\]/);
  assert.match(config, /size: \.24/);
  assert.match(cube, /questpay-mark-512\.png/);
  assert.match(cube, /RoundedBox/);
  assert.match(cube, /radius=\{\.055\}/);
  assert.match(cube, /bevelSegments=\{2\}/);
  assert.match(cube, /lineWidth=\{7\}/);
  assert.match(cube, /lineWidth=\{3\.2\}/);
  assert.match(cube, /lineWidth=\{1\.7\}/);
  assert.match(cube, /GlassPanels/);
  assert.match(cube, /transmission: \.28/);
  assert.match(cube, /VisibleEdgeGlow/);
  assert.doesNotMatch(cube, /<Edges/);
  assert.match(cube, /depthWrite/);
  assert.match(cube, /SurfaceFractures/);
  assert.match(orbitSystem, /mobile \? \.88 : 1\.15/);
  assert.match(orbitCurve, /haloGeometry/);
  assert.doesNotMatch(cube, /cube-front-verse-albedo/);
  // Cleaner particle density (quality-aware) — avoid sparkle noise.
  assert.match(particles, /mobile \? 18 : 36/);
  assert.match(particles, /quality === "low" \? \(mobile \? 12 : 22\)/);
  // Clean composition: no postprocessing composer / bloom component.
  assert.match(scene, /mobile \? 0\.9 : 0\.88/);
  assert.match(scene, /cubeScale = mobile \? 0\.9/);
  assert.doesNotMatch(scene, /from ["']@react-three\/postprocessing["']/);
  assert.doesNotMatch(scene, /<EffectComposer|<Bloom\b/);
  assert.match(read('src/components/home/hero3d/OrbitSystem.tsx'), /mobile \? \.88 : 1\.15/);
  const medallion = read('src/components/home/hero3d/TokenMedallion.tsx');
  assert.doesNotMatch(medallion, /rotation\.y \+=/);
  assert.match(medallion, /rotation\.x[\s\S]*rotation\.y[\s\S]*rotation\.z/);
});

test('how-it-works removes the section chip rail and creator/legal/footer routes stay explicit', () => {
  const how = read('src/app/how-it-works/page.tsx');
  const navbar = read('src/components/Navbar.tsx');
  const creators = read('src/app/for-creators/page.tsx');
  const footer = read('src/components/Footer.tsx');
  const terms = read('src/components/legal/TermsModalLink.tsx');
  const servicesPreview = read('src/components/HomeServicesPreview.tsx');

  assert.doesNotMatch(how, /How QuestPay works sections/);
  assert.doesNotMatch(how, /\["overview", "service", "brief"/);
  assert.match(navbar, /href: "\/how-it-works", label: "How It Works"/);
  assert.match(navbar, /window\.scrollTo\(\{ top: 0/);
  assert.match(navbar, /href: "\/for-creators", label: "For Creators"/);
  assert.match(creators, /How to become a creator/);
  assert.match(creators, /Creator features/);
  assert.match(creators, /What creators get/);
  assert.match(footer, /https:\/\/t\.me\/kenshi25/);
  assert.match(footer, /© \{new Date\(\)\.getFullYear\(\)\} ryuken25/);
  assert.doesNotMatch(footer, /Build \{buildSha\}|SITE\.disclaimer|How It Works|Pricing|Services<\/Link>/);
  assert.match(terms, /createPortal/);
  assert.match(terms, /role="dialog"/);
  assert.match(servicesPreview, /trustItems/);
  assert.match(servicesPreview, /Service packages/);
  assert.match(servicesPreview, /actually sell\./);
  assert.match(servicesPreview, /lg:grid-cols-3/);
  assert.match(servicesPreview, /CardArtwork/);
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

test('order create allocates unique 4-digit amount suffix and payment window expiry', () => {
  const route = read('src/app/api/orders/route.ts');
  const suffixLib = read('src/lib/payments/amount-suffix.ts');
  const migration = read('supabase/migrations/20260721_questpay_v7_amount_suffix.sql');
  const verifyRoute = read('src/app/api/orders/[publicOrderId]/verify-payment/route.ts');
  const orderGet = read('src/app/api/orders/[publicOrderId]/route.ts');
  const verifyLib = read('src/lib/verify-payment.ts');

  assert.match(route, /createUniqueOrderAmount/);
  assert.match(route, /amount_suffix:\s*suffixed\.amountSuffix/);
  assert.match(route, /unique_amount_suffix:\s*suffixed\.amountSuffixPadded/);
  assert.match(route, /amount_human:\s*suffixed\.amountHuman/);
  assert.match(route, /amount_raw:\s*suffixed\.amountRaw/);
  assert.match(route, /PAYMENT_WINDOW_SECONDS/);
  assert.match(route, /payment_expires_at:\s*paymentExpiresAt/);

  assert.match(suffixLib, /AMOUNT_SUFFIX_MIN = 1/);
  assert.match(suffixLib, /AMOUNT_SUFFIX_MAX = 9999/);
  assert.match(suffixLib, /awaiting_payment/);
  assert.match(suffixLib, /status:\s*"cancelled"/);
  assert.match(suffixLib, /order_cancelled_payment_expired/);
  assert.match(suffixLib, /formatAmountWithUniqueSuffix/);

  assert.match(migration, /amount_suffix integer/);
  assert.match(migration, /unique_amount_suffix text/);
  assert.match(migration, /idx_orders_active_unique_amount_suffix/);
  assert.match(migration, /orders_active_payment_amount_unique/);
  assert.match(migration, /payment_window_expired/);
  assert.match(migration, /amount_mismatch/);
  assert.match(migration, /work_submitted_at/);

  assert.match(verifyRoute, /cancelOrderIfPaymentExpired/);
  assert.match(verifyRoute, /amountRaw:\s*String\(order\.amount_raw\)/);
  assert.match(verifyRoute, /status:\s*"cancelled"/);
  assert.match(orderGet, /cancelOrderIfPaymentExpired/);
  assert.match(orderGet, /paymentExpiresAt/);
  assert.match(verifyLib, /value !== expectedRaw/);
  assert.match(verifyLib, /transferredRaw !== expectedRaw/);
});

test('checkout lets guests draft privately, requires auth before review, and redirects incomplete profiles', () => {
  const checkout = read('src/app/checkout/[slug]/page.tsx');
  const brief = read('src/components/checkout/CheckoutBriefForm.tsx');
  assert.match(checkout, /getSession\(\)/);
  assert.match(checkout, /authenticated=\{Boolean\(session\)\}/);
  assert.match(checkout, /redirect\(`\/onboarding/);
  assert.match(brief, /if \(!authenticated\)/);
  assert.match(brief, /setAuthOpen\(true\)/);
  assert.match(brief, /<AuthModal/);
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
  assert.match(route, /NextResponse\.redirect\(new URL\(["']\/["']/);
});

test('wallet authentication cancellation invalidates stale attempts and times out safely', () => {
  const panel = read('src/components/auth/AuthPanel.tsx');
  const manifest = read('src/lib/wallet-provider-manifest.ts');
  assert.match(manifest, /"cancelled"/);
  assert.match(manifest, /"timeout"/);
  assert.match(panel, /walletAttempt\.current/);
  assert.match(panel, /const isCurrent/);
  assert.match(panel, /75_000/);
  assert.match(panel, /disconnectAsync/);
  assert.match(panel, /abandonIfStale/);
  assert.match(panel, /walletAttempt\.current === attempt \+ 1/);
});

test('premium workflow uses kit assets, one active story panel, and real audience anchors', () => {
  const story = read('src/components/home/ProductPreviewRow.tsx');
  const benefits = read('src/components/home/BuyerCreatorBenefits.tsx');
  const how = read('src/app/how-it-works/page.tsx');
  assert.match(story, /AnimatePresence/);
  assert.match(story, /key=\{current\.id\}/);
  assert.match(story, /import\("gsap\/ScrollTrigger"\)/);
  assert.match(benefits, /creator-flow-illustration\.svg/);
  assert.match(benefits, /buyer-flow-illustration\.svg/);
  assert.match(how, /creator-workflow/);
  assert.match(how, /buyer-workflow/);
  for (const asset of ['flow-01-service.svg', 'flow-02-brief.svg', 'flow-03-payment.svg', 'flow-04-tracking.svg', 'flow-05-receipt.svg', 'flow-06-dashboard.svg', 'creator-flow-illustration.svg', 'buyer-flow-illustration.svg', 'workflow-particle-field.svg']) {
    assert.ok(existsSync(new URL(`public/assets/how-it-works/${asset}`, root)), asset);
  }
});

test('custody release foundation: tables, server-only release, studio cannot force paid/released', () => {
  const migration = read('supabase/migrations/20260721_questpay_v9_work_submissions_releases.sql');
  const releaseLib = read('src/lib/payments/release.ts');
  const statusLib = read('src/lib/payments/order-status.ts');
  const studioStatus = read('src/app/api/studio/orders/[id]/status/route.ts');
  const releaseRoute = read('src/app/api/orders/[publicOrderId]/release/route.ts');
  const acceptRoute = read('src/app/api/orders/[publicOrderId]/accept/route.ts');
  const workSubmit = read('src/app/api/orders/[publicOrderId]/work-submit/route.ts');
  const envExample = read('.env.example');
  const studioOrderPage = read('src/app/studio/orders/[id]/page.tsx');

  assert.match(migration, /create table if not exists public\.work_submissions/);
  assert.match(migration, /create table if not exists public\.releases/);
  assert.match(migration, /releases_order_id_unique/);
  assert.match(migration, /releases_idempotency_key_unique/);
  assert.match(migration, /idempotency_key/);

  assert.match(releaseLib, /import \"server-only\"/);
  assert.match(releaseLib, /status !== \"accepted\"/);
  assert.match(releaseLib, /NEXT_PUBLIC_ENABLE_REAL_PAYMENTS|REAL_PAYMENTS_ENABLED/);
  assert.match(releaseLib, /QUESTPAY_RELEASE_PRIVATE_KEY/);
  assert.match(releaseLib, /PAYMENT_MIN_CONFIRMATIONS/);
  assert.match(releaseLib, /signer_missing/);
  assert.match(releaseLib, /alreadyReleased/);
  assert.doesNotMatch(releaseLib, /NEXT_PUBLIC_QUESTPAY_RELEASE|window\.|localStorage/);

  const serverConfig = read('src/lib/server-config.ts');
  assert.match(serverConfig, /PAYMENT_MIN_CONFIRMATIONS/);
  assert.match(serverConfig, /parseRealPaymentsEnabled|REAL_PAYMENTS_ENABLED/);
  assert.match(serverConfig, /hasReleaseSignerConfigured/);
  assert.match(serverConfig, /getPaymentGateStatus/);
  // Default enabled when configured: unset flag + custody ready.
  assert.match(serverConfig, /receiveAddressValid && hasReleaseSignerConfigured/);

  const verifyLibPayment = read('src/lib/verify-payment.ts');
  assert.match(verifyLibPayment, /PAYMENT_MIN_CONFIRMATIONS/);
  assert.doesNotMatch(verifyLibPayment, /MIN_CONFIRMATIONS = 3/);
  assert.doesNotMatch(verifyLibPayment, /PAYMENT_MIN_CONFIRMATIONS \|\| 3/);

  const healthRoute = read('src/app/api/health/route.ts');
  assert.match(healthRoute, /getPaymentGateStatus/);
  assert.match(healthRoute, /minConfirmations/);
  assert.match(healthRoute, /releaseReady/);
  assert.match(healthRoute, /paymentGate/);

  assert.match(statusLib, /STUDIO_ALLOWED_STATUSES/);
  assert.match(statusLib, /STUDIO_BLOCKED_STATUSES/);
  assert.match(statusLib, /\"paid\"/);
  assert.match(statusLib, /\"released\"/);
  assert.match(statusLib, /\"accepted\"/);
  assert.match(statusLib, /\"completed\"/);

  assert.match(studioStatus, /STUDIO_BLOCKED_STATUSES|isStudioAllowedStatus|canStudioTransition/);
  assert.doesNotMatch(studioStatus, /new Set\(\[\"pending\",\"paid\"/);
  // Studio must not allow free-form paid/completed force set.
  assert.match(studioStatus, /cannot be set from Studio|system-controlled|not allowed for Studio/);
  assert.match(studioStatus, /STUDIO_BLOCKED_STATUSES\.has\(status\)/);

  assert.match(releaseRoute, /releaseAcceptedOrder/);
  assert.match(releaseRoute, /getSession/);
  assert.match(releaseRoute, /REAL_PAYMENTS_ENABLED/);
  assert.match(releaseRoute, /hasReleaseSignerConfigured/);
  assert.match(acceptRoute, /markOrderAccepted/);
  assert.match(acceptRoute, /releaseAcceptedOrder/);
  assert.match(workSubmit, /work_submissions/);
  assert.match(workSubmit, /work_submitted/);

  assert.match(envExample, /QUESTPAY_RELEASE_PRIVATE_KEY/);
  assert.match(envExample, /NEXT_PUBLIC_ENABLE_REAL_PAYMENTS=false/);
  assert.match(envExample, /PAYMENT_MIN_CONFIRMATIONS=5/);

  assert.match(studioOrderPage, /STUDIO_ALLOWED_STATUSES|STUDIO_STATUS_OPTIONS/);
  assert.doesNotMatch(studioOrderPage, /\["pending","paid","reviewing","accepted"/);
});

test('creator applications + products CRUD foundation exists with role guards and Zod', () => {
  const migration = read('supabase/migrations/20260721_questpay_v8_creator_applications_products.sql');
  assert.match(migration, /create table if not exists public\.creator_applications/);
  assert.match(migration, /create table if not exists public\.creator_services/);
  assert.match(migration, /one_pending_per_account|status = 'pending'/);

  const schemas = read('src/lib/schemas.ts');
  assert.match(schemas, /createCreatorApplicationSchema/);
  assert.match(schemas, /createCreatorServiceSchema/);
  assert.match(schemas, /reviewCreatorApplicationSchema/);

  const store = read('src/lib/studio/store.ts');
  assert.match(store, /grantCreatorRole/);
  assert.match(store, /reviewApplication/);
  assert.match(store, /createService/);

  for (const file of [
    'src/app/api/studio/applications/route.ts',
    'src/app/api/studio/applications/[id]/route.ts',
    'src/app/api/studio/products/route.ts',
    'src/app/api/studio/products/[id]/route.ts',
  ]) {
    const src = read(file);
    assert.match(src, /getSession\(\)/, file);
    // 401 may be written as `{ status: 401 }` or `authError(401, ...)`.
    assert.match(src, /status:\s*401|authError\(\s*401/, file);
  }

  const appReview = read('src/app/api/studio/applications/[id]/route.ts');
  assert.match(appReview, /super_admin/);
  assert.match(appReview, /reviewCreatorApplicationSchema/);

  const productsPost = read('src/app/api/studio/products/route.ts');
  assert.match(productsPost, /creator/);
  assert.match(productsPost, /createCreatorServiceSchema/);

  assert.ok(existsSync(new URL('src/app/studio/request/page.tsx', root)));
  assert.ok(existsSync(new URL('src/app/studio/products/page.tsx', root)));
  assert.ok(existsSync(new URL('src/app/admin/creators/page.tsx', root)));
  assert.match(read('src/app/studio/request/page.tsx'), /CreatorApplicationForm|createApplication|getPendingApplication/);
  assert.match(read('src/app/studio/products/page.tsx'), /CreatorProductsPanel|listServicesForCreator/);
  assert.match(read('src/app/admin/creators/page.tsx'), /AdminCreatorsPanel|listAllApplications/);
});
