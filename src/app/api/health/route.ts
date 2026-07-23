import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TEMPORARY DIAGNOSTIC — replaces the normal health payload so we can see the
// real error that is 500'ing production. Each suspect is imported dynamically
// inside its own try/catch so a module-load throw is CAUGHT and reported as JSON
// instead of crashing the route. Revert to the static health payload once fixed.
export async function GET() {
  const steps: Record<string, unknown> = {};

  const run = async (name: string, fn: () => Promise<unknown>) => {
    try {
      steps[name] = { ok: true, value: await fn() };
    } catch (e) {
      const err = e as Error;
      steps[name] = { ok: false, error: err?.message ?? String(e), stack: (err?.stack ?? "").split("\n").slice(0, 6) };
    }
  };

  await run("env", async () => ({
    hasDATABASE_URL: Boolean(process.env.DATABASE_URL),
    dbUrlLen: (process.env.DATABASE_URL || "").length,
    hasPOSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    hasRELEASE_KEY: Boolean(process.env.QUESTPAY_RELEASE_PRIVATE_KEY),
    realPayments: process.env.NEXT_PUBLIC_ENABLE_REAL_PAYMENTS ?? null,
    region: process.env.VERCEL_REGION ?? null,
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  }));

  await run("import server-config", async () => {
    const m = await import("@/lib/server-config");
    return { keys: Object.keys(m).length, gate: m.getPaymentGateStatus() };
  });

  await run("import services", async () => {
    const m = await import("@/lib/services");
    return { polygonTokens: m.getEnabledTokensForChain("polygon").map((t) => t.symbol) };
  });

  await run("import db", async () => {
    const m = await import("@/lib/db");
    return { hasDatabase: m.hasDatabase, pooledHost: (m.getPooledDatabaseUrl() || "").replace(/^(postgres[^:]*:\/\/)[^@]*@([^/?]+).*/, "$1***@$2") };
  });

  await run("db SELECT 1", async () => {
    const { query } = await import("@/lib/db");
    const r = await query<{ one: number }>("select 1 as one");
    return r.rows[0];
  });

  await run("db wallet_nonces probe", async () => {
    const { query } = await import("@/lib/db");
    const r = await query<{ c: string }>("select count(*)::text as c from wallet_nonces");
    return { count: r.rows[0]?.c };
  });

  const allOk = Object.values(steps).every((s) => (s as { ok: boolean }).ok);
  return NextResponse.json({ diagnostic: true, allOk, steps }, { status: 200 });
}
