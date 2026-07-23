import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * Neon / Postgres data layer for QuestPay.
 *
 * Provides:
 * - `pool` / `query` / `withClient` low-level helpers
 * - `db.from(table)` thin Supabase-compatible query builder so existing
 *   `.select().eq().single()` call sites keep working without Supabase.
 *
 * Google magic-link / OAuth still requires Supabase Auth (or a future
 * replacement). Wallet sessions + email/session tables live on Neon.
 */

type DbError = { message: string; code?: string; details?: string };

export type DbResult<T> = {
  data: T;
  error: DbError | null;
  count?: number | null;
  status?: number;
  statusText?: string;
};

function ok<T>(data: T, count?: number | null): DbResult<T> {
  return { data, error: null, count: count ?? null, status: 200, statusText: "OK" };
}

function fail<T>(message: string, code?: string): DbResult<T> {
  return {
    data: null as T,
    error: { message, code },
    count: null,
    status: 400,
    statusText: "ERROR",
  };
}

function quoteIdent(ident: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident)) {
    throw new Error(`invalid_identifier:${ident}`);
  }
  return `"${ident}"`;
}

function parseSelectList(columns: string): string {
  const trimmed = columns.trim();
  if (!trimmed || trimmed === "*") return "*";
  // Support nested select like `*, accounts(primary_email)` as a simple left join
  // placeholder — nested relations are expanded in QueryBuilder.execute.
  return trimmed;
}

/** Expand a minimal Supabase-style select into SQL + optional joins. */
function expandSelect(
  table: string,
  columns: string,
): { selectSql: string; joins: string[]; groupNeeded: boolean } {
  const trimmed = columns.trim() || "*";
  if (!trimmed.includes("(")) {
    if (trimmed === "*") return { selectSql: `${quoteIdent(table)}.*`, joins: [], groupNeeded: false };
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    const selectSql = parts
      .map((p) => {
        if (p === "*") return `${quoteIdent(table)}.*`;
        if (p.includes(".")) return p.split(".").map(quoteIdent).join(".");
        return `${quoteIdent(table)}.${quoteIdent(p)}`;
      })
      .join(", ");
    return { selectSql, joins: [], groupNeeded: false };
  }

  // e.g. "*, accounts(primary_email)"
  const joins: string[] = [];
  const selectParts: string[] = [];
  // Split on commas not inside parentheses
  const tokens: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of trimmed) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      tokens.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) tokens.push(buf.trim());

  for (const token of tokens) {
    const m = token.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]*)\)$/);
    if (m) {
      const rel = m[1];
      const relCols = m[2]
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      // Known FK conventions for QuestPay
      if (rel === "accounts" && table === "creator_applications") {
        joins.push(
          `left join ${quoteIdent("accounts")} on ${quoteIdent("accounts")}.id = ${quoteIdent(table)}.account_id`,
        );
        // Embed as JSON object under key "accounts"
        const jsonFields = relCols
          .map((c) => `'${c}', ${quoteIdent("accounts")}.${quoteIdent(c)}`)
          .join(", ");
        selectParts.push(`json_build_object(${jsonFields}) as ${quoteIdent("accounts")}`);
      } else {
        // Fallback: ignore unknown embeds
        selectParts.push("null");
      }
    } else if (token === "*") {
      selectParts.push(`${quoteIdent(table)}.*`);
    } else {
      selectParts.push(`${quoteIdent(table)}.${quoteIdent(token)}`);
    }
  }

  return {
    selectSql: selectParts.join(", "),
    joins,
    groupNeeded: false,
  };
}

type Filter =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "neq"; column: string; value: unknown }
  | { kind: "in"; column: string; values: unknown[] }
  | { kind: "is"; column: string; value: null | boolean }
  | { kind: "gt"; column: string; value: unknown }
  | { kind: "gte"; column: string; value: unknown }
  | { kind: "lt"; column: string; value: unknown }
  | { kind: "lte"; column: string; value: unknown }
  | { kind: "or"; expr: string };

type OrderBy = { column: string; ascending: boolean };

type MutationMode = "select" | "insert" | "update" | "upsert" | "delete";

class QueryBuilder<T = any> implements PromiseLike<DbResult<T>> {
  private table: string;
  private mode: MutationMode = "select";
  private selectCols = "*";
  private filters: Filter[] = [];
  private orders: OrderBy[] = [];
  private limitN: number | null = null;
  private offsetN: number | null = null;
  private insertRows: Record<string, unknown>[] | null = null;
  private updatePatch: Record<string, unknown> | null = null;
  private upsertOnConflict: string | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private returning = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*"): this {
    this.selectCols = columns;
    if (this.mode === "insert" || this.mode === "update" || this.mode === "upsert") {
      this.returning = true;
    } else {
      this.mode = "select";
    }
    return this;
  }

  insert(row: Record<string, unknown> | Record<string, unknown>[]): this {
    this.mode = "insert";
    this.insertRows = Array.isArray(row) ? row : [row];
    return this;
  }

  update(patch: Record<string, unknown>): this {
    this.mode = "update";
    this.updatePatch = patch;
    return this;
  }

  upsert(
    row: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string },
  ): this {
    this.mode = "upsert";
    this.insertRows = Array.isArray(row) ? row : [row];
    this.upsertOnConflict = opts?.onConflict || null;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  ilike(column: string, value: unknown): this {
    // Treat as case-insensitive equality for our adapter needs
    this.filters.push({ kind: "eq", column, value: String(value).toLowerCase() });
    return this;
  }

  rpc(_fn: string, _args?: Record<string, unknown>): PromiseLike<DbResult<any>> {
    // Not supported on Neon adapter — callers should use SQL helpers.
    return Promise.resolve(fail("rpc_not_supported", "RPC_UNSUPPORTED"));
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ kind: "neq", column, value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ kind: "in", column, values });
    return this;
  }

  is(column: string, value: null | boolean): this {
    this.filters.push({ kind: "is", column, value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ kind: "gt", column, value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ kind: "lt", column, value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ kind: "lte", column, value });
    return this;
  }

  /**
   * Minimal Supabase `.or()` support for patterns like:
   * `provider.eq.google,provider.eq.email`
   */
  or(expr: string): this {
    this.filters.push({ kind: "or", expr });
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: opts?.ascending !== false });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetN = from;
    this.limitN = to - from + 1;
    return this;
  }

  single(): PromiseLike<DbResult<T>> & this {
    this.wantSingle = true;
    this.limitN = this.limitN ?? 1;
    return this;
  }

  maybeSingle(): PromiseLike<DbResult<T>> & this {
    this.wantMaybeSingle = true;
    this.limitN = this.limitN ?? 1;
    return this;
  }

  then<TResult1 = DbResult<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private buildWhere(params: unknown[], startIndex = 1): { sql: string; nextIndex: number } {
    if (this.filters.length === 0) return { sql: "", nextIndex: startIndex };
    const parts: string[] = [];
    let i = startIndex;

    for (const f of this.filters) {
      if (f.kind === "eq") {
        parts.push(`${quoteIdent(f.column)} = $${i++}`);
        params.push(f.value);
      } else if (f.kind === "neq") {
        parts.push(`${quoteIdent(f.column)} <> $${i++}`);
        params.push(f.value);
      } else if (f.kind === "in") {
        if (f.values.length === 0) {
          parts.push("false");
        } else {
          const placeholders = f.values.map(() => `$${i++}`);
          parts.push(`${quoteIdent(f.column)} in (${placeholders.join(", ")})`);
          params.push(...f.values);
        }
      } else if (f.kind === "is") {
        if (f.value === null) parts.push(`${quoteIdent(f.column)} is null`);
        else if (f.value === true) parts.push(`${quoteIdent(f.column)} is true`);
        else parts.push(`${quoteIdent(f.column)} is false`);
      } else if (f.kind === "gt") {
        parts.push(`${quoteIdent(f.column)} > $${i++}`);
        params.push(f.value);
      } else if (f.kind === "gte") {
        parts.push(`${quoteIdent(f.column)} >= $${i++}`);
        params.push(f.value);
      } else if (f.kind === "lt") {
        parts.push(`${quoteIdent(f.column)} < $${i++}`);
        params.push(f.value);
      } else if (f.kind === "lte") {
        parts.push(`${quoteIdent(f.column)} <= $${i++}`);
        params.push(f.value);
      } else if (f.kind === "or") {
        // Parse: col.op.val,col.op.val  (val may contain dots for emails — only first two dots split)
        const orParts = f.expr.split(",").map((s) => s.trim()).filter(Boolean);
        const orSql: string[] = [];
        for (const part of orParts) {
          const m = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(eq|neq|is|gt|gte|lt|lte)\.(.*)$/);
          if (!m) continue;
          const [, col, op, rawVal] = m;
          if (op === "is" && rawVal === "null") {
            orSql.push(`${quoteIdent(col)} is null`);
          } else if (op === "eq") {
            orSql.push(`${quoteIdent(col)} = $${i++}`);
            params.push(rawVal);
          } else if (op === "neq") {
            orSql.push(`${quoteIdent(col)} <> $${i++}`);
            params.push(rawVal);
          } else if (op === "gt") {
            orSql.push(`${quoteIdent(col)} > $${i++}`);
            params.push(rawVal);
          } else if (op === "gte") {
            orSql.push(`${quoteIdent(col)} >= $${i++}`);
            params.push(rawVal);
          } else if (op === "lt") {
            orSql.push(`${quoteIdent(col)} < $${i++}`);
            params.push(rawVal);
          } else if (op === "lte") {
            orSql.push(`${quoteIdent(col)} <= $${i++}`);
            params.push(rawVal);
          }
        }
        if (orSql.length) parts.push(`(${orSql.join(" or ")})`);
      }
    }

    return { sql: parts.length ? ` where ${parts.join(" and ")}` : "", nextIndex: i };
  }

  private async execute(): Promise<DbResult<T>> {
    if (!hasDatabase) {
      return fail("database_not_configured", "DB_NOT_CONFIGURED");
    }

    try {
      if (this.mode === "select") {
        return await this.executeSelect();
      }
      if (this.mode === "insert") {
        return await this.executeInsert();
      }
      if (this.mode === "update") {
        return await this.executeUpdate();
      }
      if (this.mode === "upsert") {
        return await this.executeUpsert();
      }
      if (this.mode === "delete") {
        return await this.executeDelete();
      }
      return fail("unsupported_mode");
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      return fail(err.message || "query_failed", err.code);
    }
  }

  private async executeSelect(): Promise<DbResult<T>> {
    const params: unknown[] = [];
    const expanded = expandSelect(this.table, this.selectCols);
    const { sql: whereSql } = this.buildWhere(params);
    let sql = `select ${expanded.selectSql} from ${quoteIdent(this.table)}`;
    if (expanded.joins.length) sql += ` ${expanded.joins.join(" ")}`;
    sql += whereSql;
    if (this.orders.length) {
      sql +=
        " order by " +
        this.orders
          .map((o) => `${quoteIdent(o.column)} ${o.ascending ? "asc" : "desc"}`)
          .join(", ");
    }
    if (this.limitN != null) sql += ` limit ${Number(this.limitN)}`;
    if (this.offsetN != null) sql += ` offset ${Number(this.offsetN)}`;

    const result = await query<QueryResultRow>(sql, params);
    const rows = result.rows;

    if (this.wantSingle) {
      if (rows.length === 0) {
        return fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
      }
      if (rows.length > 1) {
        return fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
      }
      return ok(rows[0] as T, 1);
    }
    if (this.wantMaybeSingle) {
      if (rows.length === 0) return ok(null as T, 0);
      return ok(rows[0] as T, 1);
    }
    return ok(rows as T, rows.length);
  }

  private async executeInsert(): Promise<DbResult<T>> {
    if (!this.insertRows?.length) return fail("nothing_to_insert");
    const rows = this.insertRows;
    const columns = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );
    if (!columns.length) return fail("nothing_to_insert");

    const params: unknown[] = [];
    const valueGroups: string[] = [];
    for (const row of rows) {
      const placeholders: string[] = [];
      for (const col of columns) {
        params.push(serializeValue(row[col]));
        placeholders.push(`$${params.length}`);
      }
      valueGroups.push(`(${placeholders.join(", ")})`);
    }

    let sql = `insert into ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(", ")}) values ${valueGroups.join(", ")}`;
    if (this.returning || this.wantSingle || this.wantMaybeSingle || this.selectCols) {
      const ret = this.selectCols && this.selectCols !== "*" ? parseReturning(this.selectCols) : "*";
      sql += ` returning ${ret}`;
    }

    const result = await query<QueryResultRow>(sql, params);
    return this.wrapMutationRows(result.rows);
  }

  private async executeUpdate(): Promise<DbResult<T>> {
    if (!this.updatePatch || !Object.keys(this.updatePatch).length) {
      return fail("nothing_to_update");
    }
    const params: unknown[] = [];
    const sets: string[] = [];
    for (const [col, val] of Object.entries(this.updatePatch)) {
      params.push(serializeValue(val));
      sets.push(`${quoteIdent(col)} = $${params.length}`);
    }
    const { sql: whereSql } = this.buildWhere(params, params.length + 1);
    let sql = `update ${quoteIdent(this.table)} set ${sets.join(", ")}${whereSql}`;
    if (this.returning || this.wantSingle || this.wantMaybeSingle || this.selectCols !== "*") {
      const ret =
        this.selectCols && this.selectCols !== "*" && this.returning
          ? parseReturning(this.selectCols)
          : "*";
      // Always return rows when .select() was chained after update (Supabase style)
      if (this.returning || this.wantSingle || this.wantMaybeSingle) {
        sql += ` returning ${ret}`;
      }
    } else if (this.mode === "update") {
      // Supabase update without select still "succeeds"; we don't need rows.
    }

    // If caller chained .select() after update, returning was set in select().
    if (this.returning || this.wantSingle || this.wantMaybeSingle) {
      if (!sql.includes(" returning ")) {
        sql += " returning *";
      }
    }

    const result = await query<QueryResultRow>(sql, params);
    if (this.returning || this.wantSingle || this.wantMaybeSingle) {
      return this.wrapMutationRows(result.rows);
    }
    return ok(null as T, result.rowCount);
  }

  private async executeUpsert(): Promise<DbResult<T>> {
    if (!this.insertRows?.length) return fail("nothing_to_upsert");
    const rows = this.insertRows;
    const columns = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row).forEach((k) => set.add(k));
        return set;
      }, new Set<string>()),
    );
    const params: unknown[] = [];
    const valueGroups: string[] = [];
    for (const row of rows) {
      const placeholders: string[] = [];
      for (const col of columns) {
        params.push(serializeValue(row[col]));
        placeholders.push(`$${params.length}`);
      }
      valueGroups.push(`(${placeholders.join(", ")})`);
    }

    const conflict = this.upsertOnConflict
      ? this.upsertOnConflict
          .split(",")
          .map((c) => quoteIdent(c.trim()))
          .join(", ")
      : null;

    let sql = `insert into ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(", ")}) values ${valueGroups.join(", ")}`;
    if (conflict) {
      const updateCols = columns.filter((c) => c !== this.upsertOnConflict);
      if (updateCols.length) {
        sql += ` on conflict (${conflict}) do update set ${updateCols
          .map((c) => `${quoteIdent(c)} = excluded.${quoteIdent(c)}`)
          .join(", ")}`;
      } else {
        sql += ` on conflict (${conflict}) do nothing`;
      }
    }
    sql += " returning *";

    const result = await query<QueryResultRow>(sql, params);
    return this.wrapMutationRows(result.rows);
  }

  private async executeDelete(): Promise<DbResult<T>> {
    const params: unknown[] = [];
    const { sql: whereSql } = this.buildWhere(params);
    let sql = `delete from ${quoteIdent(this.table)}${whereSql}`;
    if (this.returning || this.wantSingle || this.wantMaybeSingle) {
      sql += " returning *";
      const result = await query<QueryResultRow>(sql, params);
      return this.wrapMutationRows(result.rows);
    }
    const result = await query(sql, params);
    return ok(null as T, result.rowCount);
  }

  private wrapMutationRows(rows: QueryResultRow[]): DbResult<T> {
    if (this.wantSingle) {
      if (rows.length !== 1) {
        return fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
      }
      return ok(rows[0] as T, 1);
    }
    if (this.wantMaybeSingle) {
      if (rows.length === 0) return ok(null as T, 0);
      return ok(rows[0] as T, 1);
    }
    // Supabase insert().select().single() is the common path; without single, return array
    // but many call sites use .insert().select("*").single() — already handled.
    // insert without select: data is null-ish array in supabase; we return rows if returning.
    if (this.returning) {
      // If only one row inserted and no single requested, still return array (Supabase default)
      return ok(rows as T, rows.length);
    }
    return ok((rows.length === 1 ? rows[0] : rows) as T, rows.length);
  }
}

function parseReturning(columns: string): string {
  const trimmed = columns.trim();
  if (!trimmed || trimmed === "*") return "*";
  // Strip embeds for RETURNING
  return trimmed
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !p.includes("("))
    .map((p) => (p === "*" ? "*" : quoteIdent(p)))
    .join(", ") || "*";
}

function serializeValue(value: unknown): unknown {
  if (value === undefined) return null;
  // BigInt (e.g. a viem receipt's blockNumber/gasUsed) can't be bound by node-pg
  // nor JSON.stringify'd. Convert to string — both for a top-level bigint column
  // and for bigints nested inside a jsonb object (raw_receipt). Without this,
  // recording a verified payment throws "Do not know how to serialize a BigInt"
  // and the order never reaches `paid`.
  if (typeof value === "bigint") return value.toString();
  if (value !== null && typeof value === "object" && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    // jsonb columns accept objects; serialize with a BigInt-safe replacer.
    return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v));
  }
  return value;
}

// ────────────────────────────── Pool ──────────────────────────────

// Cache the Pool on globalThis (NOT a per-request/per-module Client). On Vercel a
// warm serverless instance reuses the same `__qpPgPool` across invocations, so we
// pay TCP+TLS+auth once and then just check out idle connections. A fresh Pool per
// request would exhaust Postgres/PgBouncer connection slots under load.
const globalForPg = globalThis as unknown as { __qpPgPool?: Pool };

/**
 * Base Postgres URL. Resolution order preserved for backward-compat:
 * DATABASE_URL → NEON_DATABASE_URL → POSTGRES_URL. This may be a *direct*
 * (non-pooled) Neon endpoint; the runtime Pool prefers the pooled variant below.
 */
export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    ""
  );
}

/**
 * Rewrite a Neon *direct* host to its PgBouncer *pooled* host by inserting the
 * `-pooler` suffix into the endpoint label:
 *   ep-cool-name-123456.ap-southeast-1.aws.neon.tech
 *   → ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech
 * Serverless (many short-lived instances) MUST talk to the pooled endpoint or it
 * quickly exhausts Postgres' ~100 backend slots. No-op for non-Neon hosts or hosts
 * that are already pooled. Any parse failure returns the input unchanged — we never
 * break an otherwise-working connection string for the sake of the rewrite.
 */
function toPooledUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    const host = u.hostname;
    if (!host.endsWith(".neon.tech")) return rawUrl; // only Neon has a -pooler host
    if (host.includes("-pooler.")) return rawUrl; // already pooled
    const dot = host.indexOf(".");
    if (dot <= 0) return rawUrl;
    const label = host.slice(0, dot);
    if (label.endsWith("-pooler")) return rawUrl;
    u.hostname = `${label}-pooler${host.slice(dot)}`;
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Connection string used for the runtime Pool. Prefers an explicitly-provisioned
 * pooled endpoint, then derives the pooled host from the base URL, then falls back
 * to the base URL as-is. Vercel's Neon integration already sets POSTGRES_URL to the
 * pooled host — that flows through getDatabaseUrl() and passes the rewrite untouched.
 */
export function getPooledDatabaseUrl(): string {
  const explicit =
    process.env.DATABASE_URL_POOLED?.trim() ||
    process.env.NEON_POOLED_URL?.trim() ||
    "";
  if (explicit) return explicit;
  // Use the operator-provided DATABASE_URL AS-IS. Auto-rewriting the host to the
  // Neon `-pooler` variant broke prod (the pooled endpoint rejected the existing
  // connection params → every query 500'd). Pooling is now strictly opt-in via
  // DATABASE_URL_POOLED / NEON_POOLED_URL with a known-good pooled string.
  return getDatabaseUrl();
}

export const hasDatabase = Boolean(getDatabaseUrl());

export function getPool(): Pool {
  const url = getPooledDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!globalForPg.__qpPgPool) {
    const maxEnv = Number(process.env.PGPOOL_MAX);
    globalForPg.__qpPgPool = new Pool({
      connectionString: url,
      ssl: url.includes("sslmode=require") || url.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
      // Per-instance ceiling. With the shared PgBouncer pooler in front of Neon
      // this stays modest so N warm instances don't collectively overrun Postgres.
      max: Number.isFinite(maxEnv) && maxEnv > 0 ? maxEnv : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForPg.__qpPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  const pool = getPool();
  return pool.query<T>(text, params as any[]);
}

/** First row or null (no throw when empty). */
export async function queryOneOptional<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  if (!hasDatabase) return null;
  try {
    const result = await query<T>(text, params);
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

/** All rows or empty array (no throw). */
export async function queryManyOptional<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  if (!hasDatabase) return [];
  try {
    const result = await query<T>(text, params);
    return result.rows ?? [];
  } catch {
    return [];
  }
}

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    await client.query("begin");
    try {
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  });
}

/**
 * Thin Supabase-like client used by the rest of the app.
 * Only implements the query surface QuestPay actually uses.
 */
export type DbClient = {
  from: (table: string) => QueryBuilder;
};

export function createDbClient(): DbClient {
  return {
    from(table: string) {
      return new QueryBuilder(table);
    },
  };
}

let _db: DbClient | null = null;

/** Shared singleton client (always returns a client; queries fail if DATABASE_URL missing). */
export function getDb(): DbClient {
  if (!_db) _db = createDbClient();
  return _db;
}

/**
 * Supabase-compatible entry used across the app.
 * Returns null when DATABASE_URL is not configured (graceful degrade).
 */
export function getSupabase(): DbClient | null {
  if (!hasDatabase) return null;
  return getDb();
}

/** Alias used by auth modules that previously used service-role Supabase. */
export function getServiceClient(): DbClient {
  if (!hasDatabase) throw new Error("database_not_configured");
  return getDb();
}

export async function pingDatabase(): Promise<boolean> {
  if (!hasDatabase) return false;
  try {
    await query("select 1 as ok");
    return true;
  } catch {
    return false;
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const res = await query<T>(text, params);
  return res.rows[0] ?? null;
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await query<T>(text, params);
  return res.rows;
}

// Re-export a SupabaseClient-compatible type alias so existing type imports can migrate gradually.
export type SupabaseClient = DbClient;


export async function q<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return query<T>(text, params);
}
export async function qOne<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return queryOneOptional<T>(text, params);
}
export async function qAll<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return queryManyOptional<T>(text, params);
}
