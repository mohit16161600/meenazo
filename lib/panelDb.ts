import mysql from "mysql2/promise";

/**
 * MySQL connection pool for the ADMIN PANEL database (separate from the CRM).
 * Configure via env (.env.local):
 *   PANEL_DB_HOST, PANEL_DB_PORT, PANEL_DB_USER, PANEL_DB_PASSWORD, PANEL_DB_NAME
 *
 * Defaults target a stock XAMPP install (127.0.0.1 / root / no password /
 * database `meenazo_panel`). The pool is cached on globalThis so Next's dev
 * hot-reload and serverless invocations reuse one pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var __panelPool: mysql.Pool | undefined;
}

export const PANEL_DB = {
  host: process.env.PANEL_DB_HOST ?? "127.0.0.1",
  port: Number(process.env.PANEL_DB_PORT ?? 3306),
  user: process.env.PANEL_DB_USER ?? "root",
  password: process.env.PANEL_DB_PASSWORD ?? "",
  database: process.env.PANEL_DB_NAME ?? "meenazo_panel",
};

export function getPanelPool(): mysql.Pool {
  if (!globalThis.__panelPool) {
    globalThis.__panelPool = mysql.createPool({
      host: PANEL_DB.host,
      port: PANEL_DB.port,
      user: PANEL_DB.user,
      password: PANEL_DB.password,
      database: PANEL_DB.database,
      waitForConnections: true,
      connectionLimit: 8,
      charset: "utf8mb4",
      // Return DECIMAL/BIGINT as JS numbers where safe; keep dates as strings.
      dateStrings: true,
    });
  }
  return globalThis.__panelPool;
}

/**
 * A one-off connection WITHOUT selecting a database — used only by the setup
 * routine to `CREATE DATABASE IF NOT EXISTS` before the pool can connect.
 */
export async function createServerConnection(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: PANEL_DB.host,
    port: PANEL_DB.port,
    user: PANEL_DB.user,
    password: PANEL_DB.password,
    charset: "utf8mb4",
    multipleStatements: true,
  });
}

/** Small typed query helper for the panel pool. */
export async function panelQuery<T = mysql.RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const pool = getPanelPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

/** True if the panel database exists and has the `admin_users` table. */
export async function isPanelInstalled(): Promise<boolean> {
  try {
    const rows = await panelQuery<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = 'admin_users'",
      [PANEL_DB.database]
    );
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
}
