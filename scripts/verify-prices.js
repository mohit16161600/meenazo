/**
 * Cross-check: do data/products.ts and scripts/update-prices.sql agree?
 *
 * The two must state the SAME prices — the file is what the shop displays, the
 * SQL is what the server will charge once it is run. A silent disagreement
 * between them is the exact bug this whole exercise is about, so it gets a
 * check rather than a careful reading.
 *
 *   node scripts/verify-prices.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const ts = fs.readFileSync(path.join(root, "data/products.ts"), "utf8");
const sql = fs.readFileSync(path.join(root, "scripts/update-prices.sql"), "utf8");

const SLUGS = ["slimpax", "diasuddhi", "joshveda"];
let failures = 0;

function check(label, a, b) {
  const ok = a === b && Number.isFinite(a);
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(16)} code=${a}  sql=${b}`);
}
function assert(ok, message) {
  if (!ok) {
    failures++;
    console.log(`  FAIL  ${message}`);
  } else {
    console.log(`  ok    ${message}`);
  }
}

/** Prices as data/products.ts states them. */
function fromCode(slug) {
  const start = ts.indexOf(`slug: "${slug}"`);
  if (start < 0) throw new Error(`${slug} not found in data/products.ts`);
  const chunk = ts.slice(start, start + 16000);
  const base = chunk.match(/price: (\d+),\s*\n\s*salePrice: (\d+)/);
  const re = /\{ label: "[^"]+"[^}]*price: (\d+), salePrice: (\d+) \}/g;
  const variants = [];
  let m;
  while ((m = re.exec(chunk)) && variants.length < 3) variants.push([Number(m[1]), Number(m[2])]);
  return { base: [Number(base[1]), Number(base[2])], variants };
}

/**
 * Prices as the SQL states them.
 *
 * Anchored on the slug at the END of each statement, not on a byte offset
 * before it — the first version sliced a fixed window backwards from the slug
 * and kept reading the PREVIOUS product's numbers, which reported six failures
 * that did not exist.
 */
function fromSql(slug) {
  const baseRe = new RegExp(
    "SET `price` = (\\d+), `sale_price` = (\\d+)\\s*\\r?\\nWHERE `slug` = '" + slug + "';"
  );
  const base = sql.match(baseRe);
  if (!base) throw new Error(`no base-price statement for ${slug}`);

  const varRe = new RegExp(
    "SET `variants` = JSON_SET\\(([\\s\\S]*?)\\)\\s*\\r?\\nWHERE `slug` = '" + slug + "' AND"
  );
  const body = sql.match(varRe);
  if (!body) throw new Error(`no variants statement for ${slug}`);

  const pairRe = /'\$\[(\d)\]\.price',\s*(\d+),\s*'\$\[\d\]\.salePrice',\s*(\d+)/g;
  const variants = [];
  let k;
  while ((k = pairRe.exec(body[1]))) variants[Number(k[1])] = [Number(k[2]), Number(k[3])];
  return { base: [Number(base[1]), Number(base[2])], variants };
}

for (const slug of SLUGS) {
  console.log(`\n== ${slug}`);
  const code = fromCode(slug);
  const db = fromSql(slug);

  check("base MRP", code.base[0], db.base[0]);
  check("base sale", code.base[1], db.base[1]);
  for (let i = 0; i < 3; i++) {
    check(`pack${i + 1} MRP`, code.variants[i][0], db.variants[i] ? db.variants[i][0] : NaN);
    check(`pack${i + 1} sale`, code.variants[i][1], db.variants[i] ? db.variants[i][1] : NaN);
  }

  // The announcement bar promises "Flat 50% OFF". That claim is made about the
  // PRODUCT price, so it is the single pack that has to be exactly half — the
  // multi-month packs are deliberately discounted deeper than 50% on top.
  assert(code.base[0] === code.base[1] * 2, "single pack is exactly 50% off");

  // MRP must scale with pack size, or the strike-through price is nonsense.
  for (let i = 1; i < 3; i++) {
    assert(
      code.variants[i][0] === code.variants[0][0] * (i + 1),
      `pack${i + 1} MRP is ${i + 1}× the single pack`
    );
  }

  // Buying more must never cost more than buying the same number singly —
  // the trap the old Joshveda prices had fallen into (2 packs cost ₹3,999 when
  // two singles were ₹3,980).
  for (let i = 1; i < 3; i++) {
    assert(
      code.variants[i][1] < code.variants[0][1] * (i + 1),
      `pack${i + 1} is cheaper than ${i + 1} singles`
    );
  }
}

console.log(
  failures === 0
    ? "\nPASS — code and SQL agree, and every pack is priced sanely."
    : `\n${failures} problem(s) found.`
);
process.exit(failures === 0 ? 0 : 1);
