import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Task 2 — order → creator assignment. Same convention as roles-admin.test.mjs:
// a pure-JS mirror of the shipped decision + a source-guard that the real file
// still encodes it (node --test has no TS loader).

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const CREATOR_ACCOUNT = '00000000-0000-4000-8000-000000000002';
const CREATOR_WALLET = '0xea8ab08eabbead7e3d28cb067ec7f638d40b39cf';

// ── order-create resolves a server-side creator, fail-closed ──────────────────

/** Mirror of POST /api/orders creator resolution. */
function resolveOrderCreatorSpec(mapping) {
  if (!mapping?.creator_account_id || !mapping?.creator_wallet) {
    return { ok: false, status: 409, reason: 'service_creator_unmapped' };
  }
  return {
    ok: true,
    creator_account_id: mapping.creator_account_id,
    creator_wallet: mapping.creator_wallet,
  };
}

test('order-create refuses a service with no creator mapping (fail-closed 409)', () => {
  assert.deepEqual(resolveOrderCreatorSpec(null), {
    ok: false,
    status: 409,
    reason: 'service_creator_unmapped',
  });
  // partial mapping is also refused (never create an unreleasable order)
  assert.equal(resolveOrderCreatorSpec({ creator_account_id: CREATOR_ACCOUNT }).ok, false);
  assert.equal(resolveOrderCreatorSpec({ creator_wallet: CREATOR_WALLET }).ok, false);
});

test('order-create stamps creator_account_id + creator_wallet from the mapping', () => {
  const r = resolveOrderCreatorSpec({ creator_account_id: CREATOR_ACCOUNT, creator_wallet: CREATOR_WALLET });
  assert.equal(r.ok, true);
  assert.equal(r.creator_account_id, CREATOR_ACCOUNT);
  assert.equal(r.creator_wallet, CREATOR_WALLET);
});

test('order-create source-guard: resolves service_creators, stamps creator, money-path intact', () => {
  const src = read('src/app/api/orders/route.ts');
  assert.match(src, /from\("service_creators"\)/);
  assert.match(src, /service_creator_unmapped/);
  assert.match(src, /status:\s*409/);
  assert.match(src, /creator_account_id:\s*serviceCreator\.creator_account_id/);
  assert.match(src, /creator_wallet:\s*serviceCreator\.creator_wallet/);
  // The frozen money path must still be present and unchanged in shape.
  assert.match(src, /createPaymentQuote\(/);
  assert.match(src, /createUniqueOrderAmount\(/);
  assert.match(src, /receive_address: QUESTPAY_RECEIVE_ADDRESS/);
  assert.match(src, /amount_raw: suffixed\.amountRaw/);
});

test('v14 migration creates service_creators and seeds the static catalog to the creator account', () => {
  const m = read('supabase/migrations/20260723_questpay_v14_service_creators.sql');
  assert.match(m, /CREATE TABLE IF NOT EXISTS public\.service_creators/);
  for (const slug of ['ux-quick-look', 'ui-review', 'quick-fix', 'component-build', 'landing-polish', 'integration-sprint']) {
    assert.match(m, new RegExp(`'${slug}'`), `seed must include ${slug}`);
  }
  assert.match(m, new RegExp(CREATOR_ACCOUNT));
  assert.match(m, new RegExp(CREATOR_WALLET, 'i'));
});

// ── per-creator scoping: creator sees only own, super_admin sees all ──────────

/** Mirror of the studio/dashboard order-list scoping decision. */
function studioOrderScopeSpec({ isSuper, accountId }) {
  return isSuper ? { filter: null } : { filter: { creator_account_id: accountId } };
}

test('studio scoping: creator filtered to own account, super_admin unfiltered', () => {
  assert.deepEqual(
    studioOrderScopeSpec({ isSuper: false, accountId: CREATOR_ACCOUNT }),
    { filter: { creator_account_id: CREATOR_ACCOUNT } },
  );
  assert.deepEqual(studioOrderScopeSpec({ isSuper: true, accountId: CREATOR_ACCOUNT }), { filter: null });
});

test('studio + dashboard order list pages source-guard: scope by creator_account_id unless super_admin', () => {
  for (const p of [
    'src/app/studio/orders/page.tsx',
    'src/app/studio/earnings/page.tsx',
    'src/app/studio/page.tsx',
    'src/app/dashboard/orders/page.tsx',
    'src/app/dashboard/page.tsx',
  ]) {
    const src = read(p);
    assert.match(src, /creator_account_id = \$/, `${p} must scope by creator_account_id`);
    assert.match(src, /super_admin/, `${p} must bypass for super_admin`);
  }
});

test('studio order DETAIL page source-guard: ownership gate (notFound non-owner, super bypass) — F1 IDOR', () => {
  const detail = read('src/app/studio/orders/[id]/page.tsx');
  assert.match(detail, /order\.creator_account_id !== user\.id/);
  assert.match(detail, /notFound\(\)/);
  assert.match(detail, /super_admin/);
});

// ── F2 status route + F3 work-submit/progress ownership ───────────────────────

test('studio status route source-guard: per-order creator ownership, super bypass (F2)', () => {
  const src = read('src/app/api/studio/orders/[id]/status/route.ts');
  assert.match(src, /creator_account_id/);
  assert.match(src, /order\.creator_account_id !== user\.id/);
  assert.match(src, /403/);
});

test('work-submit + progress enforce assigned-creator ownership (F3, now live via Task 2 data)', () => {
  const ws = read('src/app/api/orders/[publicOrderId]/work-submit/route.ts');
  assert.match(ws, /Creator role required/); // non-creator → 403
  assert.match(ws, /order\.creator_account_id !== session\.accountId/); // wrong creator → 403
  assert.match(ws, /Not the assigned creator/);
  const pr = read('src/app/api/orders/[publicOrderId]/progress/route.ts');
  assert.match(pr, /creator_account_id === session\.accountId/);
  assert.match(pr, /403/);
});
