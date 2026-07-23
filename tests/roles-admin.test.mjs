import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

// The app source is TypeScript and there is no TS loader wired into
// `node --test`, so each behavioural spec below is an executable pure-JS mirror
// of the shipped decision, paired with a source-guard that asserts the real
// file still contains the same rule. The mirror proves the behaviour; the guard
// stops the mirror from silently drifting away from production code.

const CREATOR_WALLET = '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf';
const ESCROW_ADMIN_WALLET = '0xa111a8c806b1fac9d27650455344f5c2f144a743';

// ─────────────────── env-driven super_admin authorization ───────────────────

/** Mirror of src/lib/auth.ts getRootSuperAdminWallets(). */
function parseEnvAdminWallets(raw) {
  return (raw || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => /^0x[a-f0-9]{40}$/.test(entry));
}

/** Mirror of src/lib/auth.ts deriveRoles(): super_admin is env-derived only. */
function deriveRolesSpec({ dbRoles, walletAddrs = [], primaryEmail = '', envWallets = [], rootEmail = '' }) {
  const roles = new Set(dbRoles);
  roles.delete('super_admin'); // never trust a stored super_admin grant
  const envLower = envWallets.map((w) => w.toLowerCase());
  const hasAdminWallet = walletAddrs.some((w) => envLower.includes(String(w).toLowerCase()));
  const isRootEmail = rootEmail !== '' && primaryEmail.toLowerCase() === rootEmail.toLowerCase();
  if (hasAdminWallet || isRootEmail) roles.add('super_admin');
  return [...roles];
}

test('env admin allowlist parsing: lowercases, trims, drops malformed and blanks', () => {
  assert.deepEqual(
    parseEnvAdminWallets(` ${ESCROW_ADMIN_WALLET.toUpperCase()} , not-a-wallet, `),
    [ESCROW_ADMIN_WALLET],
  );
  assert.deepEqual(parseEnvAdminWallets(''), []);
  assert.deepEqual(parseEnvAdminWallets(undefined), []);
});

test('escrow wallet in ROOT_SUPER_ADMIN_WALLETS resolves to super_admin', () => {
  const roles = deriveRolesSpec({
    dbRoles: ['buyer', 'creator', 'super_admin'],
    walletAddrs: [ESCROW_ADMIN_WALLET],
    envWallets: [ESCROW_ADMIN_WALLET],
  });
  assert.ok(roles.includes('super_admin'), 'escrow wallet must be super_admin');
});

test('creator wallet 0xEa8A resolves to creator, never super_admin', () => {
  const roles = deriveRolesSpec({
    dbRoles: ['buyer', 'creator'],
    walletAddrs: [CREATOR_WALLET],
    envWallets: [ESCROW_ADMIN_WALLET],
  });
  assert.ok(roles.includes('creator'), 'creator wallet keeps creator');
  assert.ok(!roles.includes('super_admin'), 'creator wallet is NOT super_admin');
});

test('a stray DB super_admin grant cannot escalate a non-env wallet', () => {
  // Even if account_roles wrongly carries super_admin, the creator wallet must
  // not become admin — super_admin is re-derived from the env allowlist only.
  const roles = deriveRolesSpec({
    dbRoles: ['buyer', 'creator', 'super_admin'],
    walletAddrs: [CREATOR_WALLET],
    envWallets: [ESCROW_ADMIN_WALLET],
  });
  assert.ok(!roles.includes('super_admin'), 'stored super_admin must be stripped');
});

test('ROOT_EMAIL owner keeps super_admin; empty env means nobody is admin (fail-closed)', () => {
  const rootEmail = 'winayaarya@gmail.com';
  const owner = deriveRolesSpec({ dbRoles: ['buyer'], primaryEmail: rootEmail, rootEmail });
  assert.ok(owner.includes('super_admin'), 'ROOT_EMAIL behaviour preserved');

  const noEnv = deriveRolesSpec({ dbRoles: ['buyer', 'super_admin'], walletAddrs: [ESCROW_ADMIN_WALLET], envWallets: [] });
  assert.ok(!noEnv.includes('super_admin'), 'no env allowlist => no admin (no hardcoded fallback)');
});

test('auth.ts derives super_admin from ROOT_SUPER_ADMIN_WALLETS and hardcodes NO admin wallet', () => {
  const auth = read('src/lib/auth.ts');
  // Env is the authz source.
  assert.match(auth, /ROOT_SUPER_ADMIN_WALLETS/);
  assert.match(auth, /getRootSuperAdminWallets/);
  assert.match(auth, /process\.env\[ROOT_SUPER_ADMIN_WALLETS_ENV\]/);
  assert.match(auth, /export async function deriveRoles/);
  assert.match(auth, /export async function isEnvSuperAdmin/);
  // super_admin is stripped from the DB grant then re-derived from env.
  assert.match(auth, /roles\.delete\("super_admin"\)/);
  // The old "both wallets are super_admin" hardcode is gone: neither the escrow
  // nor the creator wallet literal may remain as an authorization source.
  assert.doesNotMatch(auth, new RegExp(ESCROW_ADMIN_WALLET, 'i'));
  assert.doesNotMatch(auth, new RegExp(CREATOR_WALLET, 'i'));
  // getSession + requireRole must flow through the env-aware derivation.
  assert.match(auth, /const roleList = await deriveRoles\(/);
  assert.match(auth, /export async function getActiveRoles[\s\S]*return deriveRoles\(/);
});

// ─────────────────── admin archive/delete: refuse-paid guard ─────────────────

/** Mirror of the endpoint's DELETABLE_ORDER_STATUSES allowlist + refuse-paid. */
const DELETABLE_ORDER_STATUSES = new Set(['pending', 'awaiting_payment', 'expired', 'cancelled', 'archived']);
function isOrderRemovable({ status, paidAt = null, hasPayment = false }) {
  if (paidAt) return false; // paid_at set => money received
  if (hasPayment) return false; // any payment row => paid (defense-in-depth)
  return DELETABLE_ORDER_STATUSES.has(status); // allowlist => unknown fails closed
}

test('delete endpoint REFUSES paid / released / completed / accepted orders', () => {
  for (const status of ['paid', 'released', 'completed', 'accepted', 'work_submitted', 'payment_submitted', 'disputed', 'refunded']) {
    assert.equal(isOrderRemovable({ status }), false, `${status} must be un-deletable`);
  }
  // Paid detection is independent of status drift.
  assert.equal(isOrderRemovable({ status: 'awaiting_payment', paidAt: '2026-07-23T00:00:00Z' }), false);
  assert.equal(isOrderRemovable({ status: 'awaiting_payment', hasPayment: true }), false);
});

test('delete endpoint ALLOWS non-paid abandoned orders', () => {
  for (const status of ['awaiting_payment', 'expired', 'cancelled', 'pending']) {
    assert.equal(isOrderRemovable({ status }), true, `${status} must be deletable`);
  }
});

test('admin orders route: super_admin gate, refuse-paid guard, and audit-log write', () => {
  const route = read('src/app/api/admin/orders/[id]/route.ts');
  assert.match(route, /export async function DELETE/);
  assert.match(route, /export async function POST/); // soft-archive
  assert.match(route, /getSession/);
  assert.match(route, /roles\.includes\("super_admin"\)/);
  assert.match(route, /Super admin only/);
  // Allowlist statuses present (fail-closed on anything else).
  for (const status of ['pending', 'awaiting_payment', 'expired', 'cancelled', 'archived']) {
    assert.match(route, new RegExp(`"${status}"`), `allowlist must include ${status}`);
  }
  // Refuse-paid: paid_at + a payments-table existence check + a 409.
  assert.match(route, /paid_at IS NULL/);
  assert.match(route, /orderHasPayment/);
  assert.match(route, /FROM payments WHERE order_id/);
  assert.match(route, /order_not_deletable/);
  assert.match(route, /jsonError\(409/);
  // Audit-log write: actor, action, target, metadata.
  assert.match(route, /INSERT INTO admin_audit_log/);
  assert.match(route, /actor_account_id, action, target_account_id, metadata/);
  assert.match(route, /order_deleted/);
  assert.match(route, /order_archived/);
});

// ─────────────────── auto-expiry on read ─────────────────────────────────────

const ACTIVE_PAYMENT_STATUSES = new Set(['awaiting_payment', 'payment_submitted', 'pending']);
/** Mirror of src/lib/payments/order-expiry.ts isPaymentWindowExpired(). */
function isPaymentWindowExpiredSpec(order, now = new Date()) {
  if (!ACTIVE_PAYMENT_STATUSES.has(order.status)) return false;
  if (!order.payment_expires_at) return false;
  return new Date(order.payment_expires_at).getTime() < now.getTime();
}

test('awaiting_payment past its payment_expires_at is expired on read', () => {
  const now = new Date('2026-07-23T12:00:00Z');
  assert.equal(
    isPaymentWindowExpiredSpec({ status: 'awaiting_payment', payment_expires_at: '2026-07-23T11:59:59Z' }, now),
    true,
  );
  // Not yet elapsed, no window, or already-terminal → not expired.
  assert.equal(isPaymentWindowExpiredSpec({ status: 'awaiting_payment', payment_expires_at: '2026-07-23T12:30:00Z' }, now), false);
  assert.equal(isPaymentWindowExpiredSpec({ status: 'awaiting_payment', payment_expires_at: null }, now), false);
  assert.equal(isPaymentWindowExpiredSpec({ status: 'paid', payment_expires_at: '2026-07-23T00:00:00Z' }, now), false);
});

test('order-expiry helper + on-read call sites exist', () => {
  const expiry = read('src/lib/payments/order-expiry.ts');
  assert.match(expiry, /export function isPaymentWindowExpired/);
  assert.match(expiry, /ACTIVE_PAYMENT_STATUSES/);
  assert.match(expiry, /cancelOrderIfPaymentExpired/);
  // The order GET route still runs the idempotent on-read cancellation.
  const orderGet = read('src/app/api/orders/[publicOrderId]/route.ts');
  assert.match(orderGet, /cancelOrderIfPaymentExpiredSql/);
  assert.match(orderGet, /status = 'cancelled'/);
});

// ─────────────────── role → navbar mapping ───────────────────────────────────

/** Mirror of src/components/layout/nav.config.ts sessionRolesToNavRoles(). */
function sessionRolesToNavRolesSpec(authenticated, sessionRoles = []) {
  if (!authenticated) return ['guest'];
  const nav = ['buyer'];
  const isSuper = sessionRoles.includes('super_admin') || sessionRoles.includes('admin');
  const isCreator = sessionRoles.includes('creator') || isSuper;
  if (isCreator) nav.push('creator');
  if (isSuper) nav.push('admin');
  return nav;
}

test('role → nav mapping: guest / buyer / creator / admin', () => {
  assert.deepEqual(sessionRolesToNavRolesSpec(false, []), ['guest']);
  assert.deepEqual(sessionRolesToNavRolesSpec(true, ['buyer']), ['buyer']);
  assert.deepEqual(sessionRolesToNavRolesSpec(true, ['creator']), ['buyer', 'creator']);
  assert.deepEqual(sessionRolesToNavRolesSpec(true, ['super_admin']), ['buyer', 'creator', 'admin']);
});

test('nav.config + AppShell wire role → nav and refresh after login/logout', () => {
  const nav = read('src/components/layout/nav.config.ts');
  assert.match(nav, /export function sessionRolesToNavRoles/);
  assert.match(nav, /sessionRoles\.includes\("super_admin"\)/);
  assert.match(nav, /roles:\s*\["admin"\]/); // admin-only nav items exist
  const shell = read('src/components/layout/AppShell.tsx');
  // Session is re-derived on route change (post-SIWE redirect / post-logout),
  // not only on mount — AppShell lives in the persistent layout.
  assert.match(shell, /refreshSession/);
  assert.match(shell, /\[refreshSession, pathname\]/);
  assert.match(shell, /cache:\s*"no-store"/);
});

// ─────────────────── migration: creator/admin split + archive ────────────────

test('v12 migration splits the creator wallet off the super_admin account', () => {
  const migration = read('supabase/migrations/20260723_questpay_v12_admin_roles_order_hygiene.sql');
  // Dedicated creator account, buyer + creator only, never super_admin.
  assert.match(migration, /creator_account/);
  assert.match(migration, new RegExp(CREATOR_WALLET, 'i'));
  assert.match(migration, /'creator'/);
  assert.match(migration, /DELETE FROM account_roles\s*\n\s*WHERE account_id = creator_account AND role = 'super_admin'/);
  // Creator wallet no longer claims the root account.
  assert.match(migration, /root_identity_claims/);
  assert.match(migration, /target_account_id = EXCLUDED\.target_account_id/);
  // The escrow (super_admin) account must NOT be granted super_admin here again
  // (super_admin stays env-derived); creator account is only buyer/creator.
  assert.doesNotMatch(migration, /creator_account,\s*'super_admin'/);
  // Archive support for the delete/archive endpoint.
  assert.match(migration, /archived_at timestamptz/);
  assert.match(migration, /'archived'/);
});

// ─────────────── Task 1 hardening: F4 role inflation + F6 email-test ───────────

/**
 * Mirror of the FIXED src/lib/supabase-auth.ts resolveStudioIdentity() role
 * resolution: never inflate. Session roles pass through as-is; the ONLY extra
 * elevation is the env owner-email allowlist (ADMIN_EMAIL / ROOT_EMAIL) → super_admin.
 */
function studioEffectiveRolesSpec({ sessionRoles, email = '', allowlistedEmails = [] }) {
  const isAllowlisted =
    !!email && allowlistedEmails.map((e) => e.toLowerCase()).includes(email.toLowerCase());
  return isAllowlisted
    ? [...new Set([...sessionRoles, 'super_admin'])]
    : [...new Set(sessionRoles)];
}

test('F4: a plain creator studio user is NOT inflated to super_admin', () => {
  const roles = studioEffectiveRolesSpec({
    sessionRoles: ['buyer', 'creator'],
    email: 'someone-creator@example.com',
    allowlistedEmails: ['winayaarya@gmail.com'],
  });
  assert.ok(roles.includes('creator'), 'creator kept');
  assert.ok(!roles.includes('super_admin'), 'creator must NOT be inflated to super_admin');
});

test('F4: only the env owner-email allowlist elevates to super_admin', () => {
  const owner = studioEffectiveRolesSpec({
    sessionRoles: ['buyer'],
    email: 'winayaarya@gmail.com',
    allowlistedEmails: ['winayaarya@gmail.com'],
  });
  assert.ok(owner.includes('super_admin'), 'env owner-email → super_admin');
});

test('F4 end-to-end: a stale super_admin DB grant on a non-env account resolves NON-admin', () => {
  // Upstream: deriveRoles strips the stored super_admin (not in env allowlist)…
  const sessionRoles = deriveRolesSpec({
    dbRoles: ['buyer', 'creator', 'super_admin'],
    walletAddrs: [CREATOR_WALLET],
    envWallets: [ESCROW_ADMIN_WALLET],
  });
  assert.ok(!sessionRoles.includes('super_admin'), 'deriveRoles drops stale grant');
  // …downstream: the studio identity does not re-add it either.
  const studioRoles = studioEffectiveRolesSpec({
    sessionRoles,
    email: 'creator@example.com',
    allowlistedEmails: ['winayaarya@gmail.com'],
  });
  assert.ok(!studioRoles.includes('super_admin'), 'studio identity stays non-admin');
});

test('F4 source-guard: resolveStudioIdentity no longer inflates roles', () => {
  const src = read('src/lib/supabase-auth.ts');
  // The old blanket inflation must be gone.
  assert.doesNotMatch(
    src,
    /\[\s*\.\.\.roles\s*,\s*"super_admin"\s*,\s*"creator"\s*,\s*"buyer"\s*\]/,
    'must not inflate a studio user to super_admin+creator+buyer',
  );
  // Elevation is gated on the env owner-email allowlist only.
  assert.match(src, /isAllowlistedEmail\(email\)\s*\n?\s*\?\s*\(Array\.from\(new Set\(\[\s*\.\.\.roles\s*,\s*"super_admin"\s*\]\)\)/);
});

test('F6 source-guard: studio email-test route is super_admin only (env session role)', () => {
  const route = read('src/app/api/studio/email/test/route.ts');
  assert.match(route, /getSession/);
  assert.match(route, /roles\.includes\("super_admin"\)/);
  assert.match(route, /status:\s*403/);
  // Must NOT authorize via the any-creator studio gate anymore.
  assert.doesNotMatch(route, /requireStudioAdmin/);
});
