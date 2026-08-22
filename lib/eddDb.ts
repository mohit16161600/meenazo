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
};

/** True when enough env is present to even attempt a connection. */
export function isEddConfigured(): boolean {
  return Boolean(EDD_DB.user && EDD_DB.database);
}

export function getEddPool(): mysql.Pool | null {
  if (!isEddConfigured()) return null;
  if (!globalThis.__eddPool) {
    globalThis.__eddPool = mysql.createPool({
      host: EDD_DB.host,
      port: EDD_DB.port,
      user: EDD_DB.user,
      password: EDD_DB.password,
      database: EDD_DB.database,
      waitForConnections: true,
      // Small: this is one indexed SELECT per pincode check, and the box also
      // runs the shop's own database.
      connectionLimit: 4,
      charset: "utf8mb4",
      dateStrings: true,
    });
  }
  return globalThis.__eddPool;
}
