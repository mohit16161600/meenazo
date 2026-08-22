/**
 * EDD database connection diagnostic — run this ON THE SERVER.
 *
 *   node scripts/check-edd.js
 *
 * The panel's System status can only report what the app's own pool returns.
 * When that keeps failing with a charset error the app cannot explain, this
 * connects directly with the same driver and the same credentials and reports
 * what the SERVER actually is, which collations it will accept, and which one
 * this machine's mysql2 picks for each way of asking — so the fix stops being
 * a guess.
 *
 * Reads the same .env the app does. Prints no passwords.
 */
const path = require("path");
const root = path.join(__dirname, "..");

const { loadEnvConfig } = require(path.join(root, "node_modules/@next/env"));
loadEnvConfig(root, false, { info: () => {}, error: () => {} });

const mysql = require(path.join(root, "node_modules/mysql2/promise"));
const ConnectionConfig = require(path.join(root, "node_modules/mysql2/lib/connection_config.js"));

const cfg = {
  host: process.env.EDD_DB_HOST || "localhost",
  port: Number(process.env.EDD_DB_PORT || 3306),
  user: process.env.EDD_DB_USER || "",
  password: process.env.EDD_DB_PASSWORD || "",
  database: process.env.EDD_DB_NAME || "",
};

function mask(s) {
  if (!s) return "(empty)";
  return s.slice(0, 2) + "…" + s.slice(-1) + ` (${s.length} chars)`;
}

(async () => {
  console.log("=== environment as the app sees it ===");
  console.log("  host       :", cfg.host + ":" + cfg.port);
  console.log("  user       :", cfg.user || "(empty)");
  console.log("  database   :", cfg.database || "(empty)");
  console.log("  password   :", mask(cfg.password));
  console.log("  charset id :", process.env.EDD_DB_CHARSET_ID || "(unset → app uses 45)");
  console.log("  mysql2     :", require(path.join(root, "node_modules/mysql2/package.json")).version);

  console.log("\n=== what this mysql2 sends for each way of asking ===");
  for (const opt of [{ charset: "utf8mb4" }, { charsetNumber: 45 }, { charsetNumber: 33 }]) {
    const label = JSON.stringify(opt);
    try {
      console.log("  " + label.padEnd(26) + "-> collation " + new ConnectionConfig(opt).charsetNumber);
    } catch (e) {
      console.log("  " + label.padEnd(26) + "-> error: " + e.message);
    }
  }

  if (!cfg.user || !cfg.database) {
    console.log("\nEDD_DB_USER / EDD_DB_NAME are not set — nothing to connect to.");
    process.exit(1);
  }

  console.log("\n=== connection attempts ===");
  let workingId = null;
  // 45 = utf8mb4_general_ci, 33 = utf8_general_ci, 224 = utf8mb4_unicode_ci,
  // 8 = latin1_swedish_ci (the last-resort default every server has),
  // 255 = utf8mb4_0900_ai_ci (MySQL 8 only — included to prove the point).
  for (const id of [45, 33, 224, 8, 255]) {
    try {
      const conn = await mysql.createConnection({ ...cfg, charsetNumber: id, connectTimeout: 8000 });
      const [rows] = await conn.query("SELECT COUNT(*) AS n FROM `edd`");
      console.log(`  collation ${String(id).padEnd(4)} OK   — ${rows[0].n} rows in edd`);
      if (workingId === null) workingId = id;
      await conn.end();
    } catch (e) {
      console.log(`  collation ${String(id).padEnd(4)} FAIL — ${String(e.message).slice(0, 110)}`);
    }
  }

  if (workingId === null) {
    console.log("\nNo collation worked. The failure is not the charset — check that the");
    console.log("user can reach this database at all:");
    console.log(`  mysql -h ${cfg.host} -u ${cfg.user} -p '${cfg.database}' -e "SELECT 1"`);
    process.exit(1);
  }

  console.log("\n=== server details (via the working connection) ===");
  const conn = await mysql.createConnection({ ...cfg, charsetNumber: workingId });
  for (const q of [
    "SELECT VERSION() AS v",
    "SELECT @@character_set_server AS cs, @@collation_server AS coll",
  ]) {
    try {
      const [r] = await conn.query(q);
      console.log("  " + JSON.stringify(r[0]));
    } catch (e) {
      console.log("  " + q + " -> " + e.message);
    }
  }
  const [colls] = await conn.query("SHOW COLLATION WHERE Charset IN ('utf8','utf8mb3','utf8mb4')");
  console.log("  utf8 collations available:", colls.map((c) => `${c.Collation}=${c.Id}`).join(", "));
  await conn.end();

  console.log(
    workingId === 45
      ? "\nRESULT: the app's default (45) works. If the panel still errors, the deployed\n        build is older than this file — redeploy and restart pm2."
      : `\nRESULT: add  EDD_DB_CHARSET_ID=${workingId}  to .env and restart pm2.`
  );
})().catch((e) => {
  console.error("\nDiagnostic itself failed:", e.message);
  process.exit(1);
});
