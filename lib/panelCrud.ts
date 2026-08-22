import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { bustCatalog } from "./catalogTag";
import { getModel, type Model } from "./panelModels";
import { ensureSerialIds } from "./serialIds";
import {
  rowToApi,
  buildInsert,
  buildUpdate,
} from "./panelMap";
import { getSession } from "./panelAuth";
import { canAccess, editableFields } from "./panelRoles";

const now = () => new Date().toISOString();

/* --------------------------- low-level queries -------------------------- */

export interface ListOpts {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: string; // raw, validated against columns
}

export async function listRows(
  model: Model,
  opts: ListOpts = {}
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const pool = getPanelPool();
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.q && model.searchCols?.length) {
    const like = `%${opts.q}%`;
    where.push(
      "(" + model.searchCols.map((c) => `\`${c}\` LIKE ?`).join(" OR ") + ")"
    );
    model.searchCols.forEach(() => params.push(like));
  }

  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const orderSql = model.defaultSort ? ` ORDER BY ${model.defaultSort}` : "";

  // Clamp to a safe integer range. `?limit=abc` / `?limit=1e400` used to reach
  // SQL as NaN/Infinity and 500 the whole endpoint.
  const clampInt = (v: unknown, min: number, max: number): number | null => {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return null;
    return Math.min(max, Math.max(min, n));
  };

  let limitSql = "";
  const limit = clampInt(opts.limit, 1, 1000);
  if (opts.limit !== undefined && limit !== null) {
    const offset = clampInt(opts.offset ?? 0, 0, 1_000_000) ?? 0;
    limitSql = ` LIMIT ${limit} OFFSET ${offset}`;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM \`${model.table}\`${whereSql}${orderSql}${limitSql}`,
    params
  );
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM \`${model.table}\`${whereSql}`,
    params
  );

  return {
    items: rows.map((r) => rowToApi(model, r)),
    total: Number(countRows[0]?.n ?? rows.length),
  };
}

export async function getRow(
  model: Model,
  id: string
): Promise<Record<string, unknown> | null> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM \`${model.table}\` WHERE \`${model.pkCol}\` = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  return rowToApi(model, rows[0]);
}

/**
 * Catalogue rows are read live by the storefront (lib/catalog.ts), so any write
 * to one has to drop that cache or the shop keeps serving the old price until
 * the window lapses. Publish does this too; doing it on the write itself is
 * what makes a panel edit take effect on its own, without a second step.
 *
 * Deliberately narrow — only the models the storefront reads live. Never
 * throws: a cache that refuses to clear must not fail the save.
 */
function revalidateIfCatalog(model: Model): void {
  if (model.name !== "products" && model.name !== "categories") return;
  try {
    // Fires the registered handler in lib/catalog.ts, which clears the
    // in-process cache and revalidates every storefront route.
    bustCatalog();
  } catch (err) {
    console.error("[panelCrud] catalog revalidation failed:", (err as Error)?.message);
  }
}

export async function insertRow(
  model: Model,
  obj: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const pool = getPanelPool();

  // Serial-number pk: MySQL assigns the next S.No (1, 2, 3, …) itself — the
  // id is NEVER generated or client-supplied. Also self-migrates legacy
  // string-id tables the first time any such insert happens in a process.
  if (model.pkAuto) {
    await ensureSerialIds();
    delete obj[model.pk];
    const { sql, values } = buildInsert(model, obj, now());
    const [res] = await pool.query<ResultSetHeader>(sql, values);
    const id = res.insertId;
    const created = await getRow(model, String(id));
    return created ?? { ...obj, [model.pk]: id };
  }

  // generate a primary key when the model doesn't take a user-supplied one
  if (!model.pkFromUser && !obj[model.pk]) {
    obj[model.pk] = `${model.name.slice(0, 3)}-${randomUUID().slice(0, 12)}`;
  }
  const { sql, values } = buildInsert(model, obj, now());
  await pool.query(sql, values);
  const created = await getRow(model, String(obj[model.pk]));
  return created ?? obj;
}

export async function updateRow(
  model: Model,
  id: string,
  obj: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const pool = getPanelPool();
  const { sql, values } = buildUpdate(model, obj, now());
  await pool.query(sql, [...values, id]);
  revalidateIfCatalog(model);
  return getRow(model, id);
}

export async function deleteRow(model: Model, id: string): Promise<boolean> {
  const pool = getPanelPool();
  const [res] = await pool.query(
    `DELETE FROM \`${model.table}\` WHERE \`${model.pkCol}\` = ?`,
    [id]
  );
  revalidateIfCatalog(model);
  return (res as { affectedRows?: number }).affectedRows ? true : false;
}

/* ------------------------------- guards -------------------------------- */

export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Authenticate AND authorize: the session must exist and its role must be
 * allowed to touch `resource`. This is the real security boundary — the sidebar
 * only hides links, but every mutation still goes through here.
 */
export async function requireAccess(resource: string): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }
  if (!canAccess(session.role, resource)) {
    return NextResponse.json(
      { success: false, message: "You don't have access to this section." },
      { status: 403 }
    );
  }
  return null;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Drop any field the caller's role may not write.
 *
 * Silently dropping beats rejecting the whole request: the form legitimately
 * round-trips fields it displayed read-only, and failing the save would leave
 * the user staring at "403" with no idea which field caused it. What matters is
 * that the value never reaches SQL — a hidden input, a crafted curl or a stale
 * tab all land here, which is why this sits in the CRUD layer and not the form.
 */
async function scopeToRole(
  resource: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const session = await getSession();
  const allowed = editableFields(session?.role, resource);
  if (!allowed) return body;

  const scoped: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) scoped[k] = v;
  }
  return scoped;
}

/* --------------------------- handler factories -------------------------- */

/** Next 15 passes route params as a Promise. All panel item routes use [id]. */
type ItemCtx = { params: Promise<{ id: string }> };

/** GET (list) + POST (create) for /api/panel/<resource>. */
export function collectionHandlers(modelName: string) {
  const model = getModel(modelName)!;

  async function GET(req: Request) {
    const denied = await requireAccess(modelName);
    if (denied) return denied;
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? undefined;
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    const result = await listRows(model, {
      q,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return json({ success: true, ...result });
  }

  async function POST(req: Request) {
    const denied = await requireAccess(modelName);
    if (denied) return denied;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON body" }, 400);
    }
    try {
      const created = await insertRow(model, await scopeToRole(modelName, body));
      return json({ success: true, item: created }, 201);
    } catch (err) {
      return json(
        { success: false, message: dbError(err) },
        400
      );
    }
  }

  return { GET, POST };
}

/** GET/PUT/DELETE for /api/panel/<resource>/[id]. */
export function itemHandlers(modelName: string) {
  const model = getModel(modelName)!;

  async function GET(_req: Request, ctx: ItemCtx) {
    const denied = await requireAccess(modelName);
    if (denied) return denied;
    const { id } = await ctx.params;
    const row = await getRow(model, decodeURIComponent(id));
    if (!row) return json({ success: false, message: "Not found" }, 404);
    return json({ success: true, item: row });
  }

  async function PUT(req: Request, ctx: ItemCtx) {
    const denied = await requireAccess(modelName);
    if (denied) return denied;
    const { id } = await ctx.params;
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return json({ success: false, message: "Invalid JSON body" }, 400);
    }
    try {
      const updated = await updateRow(model, decodeURIComponent(id), await scopeToRole(modelName, body));
      if (!updated) return json({ success: false, message: "Not found" }, 404);
      return json({ success: true, item: updated });
    } catch (err) {
      return json({ success: false, message: dbError(err) }, 400);
    }
  }

  async function DELETE(_req: Request, ctx: ItemCtx) {
    const denied = await requireAccess(modelName);
    if (denied) return denied;
    const { id } = await ctx.params;
    const ok = await deleteRow(model, decodeURIComponent(id));
    return json({ success: ok });
  }

  return { GET, PUT, DELETE };
}

function dbError(err: unknown): string {
  const msg = (err as { code?: string; sqlMessage?: string })?.sqlMessage;
  const code = (err as { code?: string })?.code;
  if (code === "ER_DUP_ENTRY") return "A record with that id/slug/code already exists.";
  return msg || "Database error. Check your input and try again.";
}
