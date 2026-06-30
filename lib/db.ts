import mysql from "mysql2/promise";

/**
 * Shared MySQL connection pool for the CRM database.
 * Configure via env (.env.local in dev, .env.production on the server):
 *   CRM_DB_HOST, CRM_DB_PORT, CRM_DB_USER, CRM_DB_PASSWORD, CRM_DB_NAME
 *
 * The pool is cached on globalThis so Next's dev hot-reload / serverless
 * invocations reuse one pool instead of opening a connection per request.
 */
declare global {
  // eslint-disable-next-line no-var
  var __crmPool: mysql.Pool | undefined;
}

export function getCrmPool(): mysql.Pool {
  if (!globalThis.__crmPool) {
    globalThis.__crmPool = mysql.createPool({
      host: process.env.CRM_DB_HOST ?? "127.0.0.1",
      port: Number(process.env.CRM_DB_PORT ?? 3306),
      user: process.env.CRM_DB_USER ?? "root",
      password: process.env.CRM_DB_PASSWORD ?? "",
      database: process.env.CRM_DB_NAME ?? "meenazo",
      waitForConnections: true,
      connectionLimit: 5,
      charset: "utf8mb4",
    });
  }
  return globalThis.__crmPool;
}
