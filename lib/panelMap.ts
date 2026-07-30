import type { Field, Model } from "./panelModels";

/**
 * Mapping helpers shared by the schema generator and the CRUD factory.
 * Keeps the camelCase(API) <-> snake_case(DB) + JSON/bool coercion in ONE place.
 */

function sqlTypeFor(f: Field): string {
  if (f.sqlType) return f.sqlType;
  switch (f.type) {
    case "string":
      return "VARCHAR(255)";
    case "text":
    case "json":
      return "LONGTEXT";
    case "int":
      return "INT";
    case "decimal":
      return "DECIMAL(3,1)";
    case "bool":
      return "TINYINT(1)";
    case "datetime":
      return "VARCHAR(40)";
    default:
      return "VARCHAR(255)";
  }
}

/**
 * Column definition for an `ALTER TABLE ... ADD COLUMN` (non-pk columns).
 * Used by the idempotent setup migration to add model fields that are missing
 * from an already-created table.
 */
export function columnDefinition(f: Field): string {
  const type = sqlTypeFor(f);
  if (f.type === "bool") return `\`${f.col}\` ${type} NOT NULL DEFAULT 0`;
  return `\`${f.col}\` ${type} NULL`;
}

/** CREATE TABLE IF NOT EXISTS ... for a model. */
export function ddlForModel(model: Model): string {
  const lines: string[] = [];
  const indexes: string[] = [];

  for (const f of model.fields) {
    const type = sqlTypeFor(f);
    let line = `  \`${f.col}\` ${type}`;
    if (f.col === model.pkCol) {
      line += " NOT NULL";
    } else if (f.type === "bool") {
      line += " NOT NULL DEFAULT 0";
    } else {
      line += " NULL";
    }
    lines.push(line);

    if (f.unique && f.col !== model.pkCol) {
      indexes.push(`  UNIQUE KEY \`uq_${model.table}_${f.col}\` (\`${f.col}\`)`);
    } else if (f.index) {
      indexes.push(`  KEY \`ix_${model.table}_${f.col}\` (\`${f.col}\`)`);
    }
  }

  lines.push(`  PRIMARY KEY (\`${model.pkCol}\`)`);

  const body = [...lines, ...indexes].join(",\n");
  return `CREATE TABLE IF NOT EXISTS \`${model.table}\` (\n${body}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
}

/** Convert a raw DB row to an API object (parse JSON, coerce bool/number). */
export function rowToApi(
  model: Model,
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of model.fields) {
    if (f.hidden) continue;
    const raw = row[f.col];
    out[f.key] = fromDbValue(f, raw);
  }
  return out;
}

export function fromDbValue(f: Field, raw: unknown): unknown {
  if (raw === null || raw === undefined) return f.type === "json" ? null : raw ?? null;
  switch (f.type) {
    case "json":
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      return raw;
    case "bool":
      return Boolean(Number(raw));
    case "int":
      return raw === "" ? null : Number(raw);
    case "decimal":
      return raw === "" ? null : Number(raw);
    default:
      return raw;
  }
}

/** Convert an API/plain value to what MySQL should store for this field. */
export function toDbValue(f: Field, val: unknown): unknown {
  switch (f.type) {
    case "json":
      return val === undefined ? null : JSON.stringify(val ?? null);
    case "bool":
      return val ? 1 : 0;
    case "int":
    case "decimal":
      if (val === "" || val === null || val === undefined) return null;
      return Number(val);
    default:
      if (val === undefined) return null;
      return val === null ? null : String(val);
  }
}

/**
 * Build the writable {cols, placeholders, values} for INSERT/UPDATE from an
 * API object. Skips auto-timestamps and hidden fields (handled by the caller).
 * On update, also skips the primary key.
 */
export function apiToRow(
  model: Model,
  obj: Record<string, unknown>,
  opts: { forInsert: boolean }
): { cols: string[]; values: unknown[] } {
  const cols: string[] = [];
  const values: unknown[] = [];
  for (const f of model.fields) {
    if (f.auto) continue;
    if (f.hidden) continue;
    if (!opts.forInsert && f.col === model.pkCol) continue;
    if (!(f.key in obj)) continue;
    cols.push(f.col);
    values.push(toDbValue(f, obj[f.key]));
  }
  return { cols, values };
}

export function fieldByKey(model: Model, key: string): Field | undefined {
  return model.fields.find((f) => f.key === key);
}

/**
 * Build a full INSERT for a model from an API object.
 *  - `updated_at` is always set to `now`.
 *  - `created_at` uses the provided value (seeding) or `now`.
 *  - hidden fields (password hashes) are only written when explicitly present.
 */
export function buildInsert(
  model: Model,
  obj: Record<string, unknown>,
  now: string
): { sql: string; values: unknown[] } {
  const cols: string[] = [];
  const values: unknown[] = [];
  for (const f of model.fields) {
    if (f.auto === "updated") {
      cols.push(f.col);
      values.push(now);
      continue;
    }
    if (f.auto === "created") {
      cols.push(f.col);
      values.push((obj[f.key] as string | undefined) ?? now);
      continue;
    }
    if (f.hidden) {
      if (f.key in obj) {
        cols.push(f.col);
        values.push(toDbValue(f, obj[f.key]));
      }
      continue;
    }
    if (f.key in obj) {
      cols.push(f.col);
      values.push(toDbValue(f, obj[f.key]));
    } else if (f.col === "created_at") {
      cols.push(f.col);
      values.push(now);
    }
  }
  const sql =
    `INSERT INTO \`${model.table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) ` +
    `VALUES (${cols.map(() => "?").join(", ")})`;
  return { sql, values };
}

/** Build an UPDATE ... SET for the fields present in `obj` (pk appended by caller). */
export function buildUpdate(
  model: Model,
  obj: Record<string, unknown>,
  now: string
): { sql: string; values: unknown[] } {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const f of model.fields) {
    if (f.col === model.pkCol) continue;
    if (f.auto === "created") continue;
    // System-managed audit fields (e.g. easyecom_synced) are never written from
    // a client update — only internal raw-SQL writers change them.
    if (f.immutable) continue;
    if (f.auto === "updated") {
      sets.push(`\`${f.col}\`=?`);
      values.push(now);
      continue;
    }
    if (f.hidden) {
      if (f.key in obj) {
        sets.push(`\`${f.col}\`=?`);
        values.push(toDbValue(f, obj[f.key]));
      }
      continue;
    }
    if (f.key in obj) {
      sets.push(`\`${f.col}\`=?`);
      values.push(toDbValue(f, obj[f.key]));
    }
  }
  const sql = `UPDATE \`${model.table}\` SET ${sets.join(", ")} WHERE \`${model.pkCol}\`=?`;
  return { sql, values };
}
