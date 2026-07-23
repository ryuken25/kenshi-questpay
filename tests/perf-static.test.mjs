import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// path.join (not `new URL`) so bracketed segments like `[slug]` stay literal
// instead of being percent-encoded.
const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const exists = (p) => existsSync(path.join(root, p));

test('db pool is cached module/global-level and reused (not per-request)', () => {
  const db = read('src/lib/db.ts');
  // A single cached Pool hangs off globalThis so warm serverless instances reuse it.
  assert.match(db, /globalForPg\s*=\s*globalThis/);
  assert.match(db, /__qpPgPool\?:\s*Pool/);
  // getPool must GUARD on the cached instance — i.e. only construct when absent.
  assert.match(db, /if\s*\(\s*!globalForPg\.__qpPgPool\s*\)/);
  assert.match(db, /globalForPg\.__qpPgPool\s*=\s*new\s+Pool/);
  // Exactly one `new Pool(` in the whole module (no per-call construction).
  const poolCtors = db.match(/new\s+Pool\s*\(/g) || [];
  assert.equal(poolCtors.length, 1, 'expected a single Pool constructor');
});

test('db prefers a pooled (-pooler) Neon endpoint, backward-compatibly', () => {
  const db = read('src/lib/db.ts');
  assert.match(db, /export function getPooledDatabaseUrl\s*\(/);
  assert.match(db, /-pooler/);
  // The Pool must connect via the pooled resolver, not the raw base URL.
  assert.match(db, /getPool\s*\(\)\s*:\s*Pool\s*\{[\s\S]*?getPooledDatabaseUrl\(\)/);
  // Base resolver kept intact for backward compatibility.
  assert.match(db, /export function getDatabaseUrl\s*\(/);
});

test('loading.tsx skeletons exist for the data-heavy routes (no hard loads)', () => {
  const routes = [
    'src/app/loading.tsx', // `/` + global nav fallback
    'src/app/services/loading.tsx',
    'src/app/services/[slug]/loading.tsx',
    'src/app/orders/loading.tsx',
    'src/app/receipts/loading.tsx',
    'src/app/how-it-works/loading.tsx',
    'src/app/verify/loading.tsx',
  ];
  for (const r of routes) {
    assert.ok(exists(r), `missing loading skeleton: ${r}`);
    const src = read(r);
    // Lightweight, server-only skeletons: animated, and NOT client components.
    assert.match(src, /animate-pulse/, `${r} should render a pulsing skeleton`);
    assert.doesNotMatch(src, /^\s*["']use client["']/m, `${r} must stay a server component`);
  }
});

test('vercel.json pins the function region to Neon (sin1 = ap-southeast-1)', () => {
  const vercel = JSON.parse(read('vercel.json'));
  assert.ok(Array.isArray(vercel.regions), 'vercel.json must declare regions[]');
  assert.ok(vercel.regions.includes('sin1'), 'regions must include sin1');
});

test('next.config keeps the Hardhat toolchain out of function bundles', () => {
  const cfg = read('next.config.js');
  assert.match(cfg, /outputFileTracingExcludes/);
  assert.match(cfg, /hardhat/);
});
