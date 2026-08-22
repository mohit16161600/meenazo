import mysql from "mysql2/promise";

/**
 * MySQL pool for the ClickPost EDD (estimated delivery date) database.
 * ---------------------------------------------------------------------------
 * A THIRD database, separate from both the panel and the CRM: it is a courier
 * dataset, refreshed by ClickPost rather than by this application, and nothing
 * here ever writes to it.
 *
 * Configure via env (.env.local — never commit the password):
 *   EDD_DB_HOST, EDD_DB_PORT, EDD_DB_USER, EDD_DB_PASSWORD, EDD_DB_NAME
 *
 * There is deliberately NO default password. If the env is missing, the pool
 * is never created and lookups report "unavailable" — far better than a live
 * shop quietly promising delivery dates it cannot actually look up.
 */
declare global {
  // eslint-disable-next-line no-var
  var __eddPool: mysql.Pool | undefined;
}

export const EDD_DB = {
  host: process.env.EDD_DB_HOST ?? "localhost",
  port: Number(process.env.EDD_DB_PORT ?? 3306),
  user: process.env.EDD_DB_USER ?? "",
  password: process.env.EDD_DB_PASSWORD ?? "",
  database: process.env.EDD_DB_NAME ?? "",
  /**
   * Collation requested during the connection handshake, as a NUMBER.
   *
   * Passing the string "utf8mb4" is what the other pools do, but the id that
   * string resolves to depends on the installed mysql2 version — newer ones map
   * it to 255 (`utf8mb4_0900_ai_ci`), which exists only in MySQL 8. Asking a
   * MariaDB server for 255 fails the handshake outright with
   * "Character set '#255' is not a compiled character set", which is exactly
   * how this connection was failing on the live box.
   *
   * 45 is `utf8mb4_general_ci` — present in MySQL 5.5+ and every MariaDB. Set
   * EDD_DB_CHARSET_ID to override if this particular server wants something
   * else (33 = utf8_general_ci is the most conservative fallback).
   */
  // `?? 45` alone is not enough: an env line written as `EDD_DB_CHARSET_ID=`
  // yields "" (not undefined), Number("") is 0, and mysql2 treats 0 as "no
  // preference" and silently sends 224 instead. Only a real positive integer
  // is honoured; anything else falls back to 45.
  charsetNumber: (() => {
    const raw = Number(process.env.EDD_DB_CHARSET_ID);
    return Number.isInteger(raw) && raw > 0 ? raw : 45;
  })(),
};

/** True when enough env is present to even attempt a connection. */
export function isEddConfigured(): boolean {
  return Boolean(EDD_DB.user && EDD_DB.database);
}

/**
 * Collations to try, in order, when the configured one is refused.
 *
 * Naming a single collation turned out not to be good enough. The live server
 * kept answering "Character set '#255' is not a compiled character set" no
 * matter which id the app asked for, so rather than keep guessing on someone
 * else's database, the pool now WORKS OUT which collation that server accepts
 * and stays on it.
 *
 * 45 = utf8mb4_general_ci, 224 = utf8mb4_unicode_ci, 33 = utf8_general_ci,
 * 8 = latin1_swedish_ci — the last is the fallback every MySQL and MariaDB
 * build has had since forever. The `edd` table holds pincodes and integers, so
 * even the narrowest of these carries the data safely.
 */
const CANDIDATE_COLLATIONS = [45, 224, 33, 8];

declare global {
  // eslint-disable-next-line no-var
  var __eddCollation: number | undefined;
  // eslint-disable-next-line no-var
  var __eddNoDatabase: boolean | undefined;
}

/**
 * @param selectDatabase false connects WITHOUT selecting a database.
 *
 * That sounds pointless until you meet a database whose own default collation
 * the server cannot load — a MySQL 8 dump restored onto MariaDB leaves
 * utf8mb4_0900_ai_ci (255) declared on the schema, and simply SELECTING that
 * database fails before any query runs. Every collation we could ask for then
 * returns the same "#255 is not a compiled character set", which is exactly
 * what the live server reported. Skipping the USE and naming the table in full
 * sidesteps the schema default entirely.
 */
function buildPool(charsetNumber: number, selectDatabase = true): mysql.Pool {
  return mysql.createPool({
    host: EDD_DB.host,
    port: EDD_DB.port,
    user: EDD_DB.user,
    password: EDD_DB.password,
    ...(selectDatabase ? { database: EDD_DB.database } : {}),
    waitForConnections: true,
    // Small: this is one indexed SELECT per pincode check, and the box also
    // runs the shop's own database.
    connectionLimit: 4,
    // charsetNumber, not charset — see the note on EDD_DB above.
    charsetNumber,
    dateStrings: true,
  });
}

export function getEddPool(): mysql.Pool | null {
  if (!isEddConfigured()) return null;
  if (!globalThis.__eddPool) {
    globalThis.__eddPool = buildPool(globalThis.__eddCollation ?? EDD_DB.charsetNumber);
  }
  return globalThis.__eddPool;
}

/**
 * True when an error is about the character set rather than the data.
 *
 * Three different wordings show up for the same underlying problem, and the
 * first version of this matched only the first:
 *   • "Character set '#255' is not a compiled character set" — from the server
 *   • "Unknown collation" — also from the server
 *   • "Encoding not recognized: 'undefined'" — from mysql2 itself, thrown
 *     client-side when the id it was handed is not one it knows. Found by
 *     setting EDD_DB_CHARSET_ID=999 and watching the retry never fire.
 */
function isCharsetRefusal(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  return /character set|collation|encoding/i.test(msg);
}

/**
 * Run a query against the EDD database, negotiating the collation if needed.
 *
 * On a charset refusal it rebuilds the pool against the next candidate and
 * retries, then remembers the one that worked for the rest of the process, so
 * the negotiation happens at most once. Any other error is passed straight
 * through — a wrong password must not look like a charset problem.
 */
export async function eddQuery<T>(
  run: (pool: mysql.Pool) => Promise<T>
): Promise<T> {
  const pool = getEddPool();
  if (!pool) throw new Error("EDD database is not configured.");

  try {
    return await run(pool);
  } catch (err) {
    if (!isCharsetRefusal(err)) throw err;

    const tried = globalThis.__eddCollation ?? EDD_DB.charsetNumber;
    for (const id of CANDIDATE_COLLATIONS) {
      if (id === tried) continue;
      const candidate = buildPool(id);
      try {
        const out = await run(candidate);
        // It works — keep this pool and remember the collation.
        await globalThis.__eddPool?.end().catch(() => {});
        globalThis.__eddPool = candidate;
        globalThis.__eddCollation = id;
        console.log(`[edd] server accepted collation ${id}; using it from now on.`);
        return out;
      } catch (retryErr) {
        await candidate.end().catch(() => {});
        if (!isCharsetRefusal(retryErr)) throw retryErr;
      }
    }

    // Last resort: every collation was refused identically, which means the
    // refusal is not about what we asked for — the SCHEMA's own declared
    // collation is one this server cannot load, so merely selecting the
    // database fails. Connect without selecting it and let the caller name the
    // table in full.
    const bare = buildPool(45, false);
    try {
      const out = await run(bare);
      await globalThis.__eddPool?.end().catch(() => {});
      globalThis.__eddPool = bare;
      globalThis.__eddNoDatabase = true;
      console.log(
        "[edd] connected without selecting the database — the schema's own " +
          "collation is unusable on this server. Fix it properly with: " +
          `ALTER DATABASE \`${EDD_DB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`
      );
      return out;
    } catch {
      await bare.end().catch(() => {});
    }

    throw err;
  }
}

/**
 * Table reference for queries: bare when a database is selected, fully
 * qualified when the connection deliberately skipped one (see eddQuery).
 */
export function eddTable(): string {
  return globalThis.__eddNoDatabase ? `\`${EDD_DB.database}\`.\`edd\`` : "`edd`";
}
