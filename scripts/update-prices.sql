-- ===========================================================================
-- Meenazo — price update for the PANEL DATABASE
-- ===========================================================================
-- WHY THIS FILE EXISTS
--
-- Prices live in two places and they are NOT the same store:
--
--   • data/products.ts  — ships with the code. The website's product pages
--                         read this, so a deploy changes what customers SEE.
--   • `products` table  — the panel database. lib/orderCapture.ts prices every
--                         order from HERE (loadCatalog uses the DB whenever it
--                         has rows, and only falls back to the file when it is
--                         empty). This is what a customer is CHARGED.
--
-- Deploying code does not touch the database. That is why the shop showed the
-- new price while the panel — and the amount actually charged at checkout —
-- kept the old one.
--
-- HOW TO RUN (on the server, against the PRODUCTION panel database):
--
--   mysql -u <PANEL_DB_USER> -p <PANEL_DB_NAME> < scripts/update-prices.sql
--
-- Take a backup first:
--
--   mysqldump -u <PANEL_DB_USER> -p <PANEL_DB_NAME> products > products-backup.sql
--
-- AFTER RUNNING: open the panel and press **Publish** (Site settings → Publish)
-- so data/generated/products.json is rewritten from the DB and every surface
-- agrees.
-- ===========================================================================

-- What the prices are right now, before anything changes.
SELECT slug, price AS mrp, sale_price AS selling FROM `products`
WHERE slug IN ('slimpax', 'diasuddhi', 'joshveda');

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- SLIMPAX — 1,990 / 3,499 / 4,799   (MRP = 2× selling, so "Flat 50% OFF" holds)
-- ---------------------------------------------------------------------------
UPDATE `products`
SET `price` = 3980, `sale_price` = 1990
WHERE `slug` = 'slimpax';

-- Variant prices are patched key-by-key with JSON_SET rather than by writing a
-- whole new array, so anything else already stored on a variant (its SKU, unit,
-- label) survives untouched. Guarded on JSON_VALID: JSON_SET on a NULL or
-- malformed column returns NULL, which would erase the pack list entirely.
UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price',  3980, '$[0].salePrice', 1990,
      '$[1].price',  7960, '$[1].salePrice', 3499,
      '$[2].price', 11940, '$[2].salePrice', 4799)
WHERE `slug` = 'slimpax' AND `variants` IS NOT NULL AND JSON_VALID(`variants`);

-- ---------------------------------------------------------------------------
-- DIASUDDHI — 1,499 / 2,599 / 3,599      (was 999 / 1,799 / 2,499)
-- ---------------------------------------------------------------------------
UPDATE `products`
SET `price` = 2998, `sale_price` = 1499
WHERE `slug` = 'diasuddhi';

UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price', 2998, '$[0].salePrice', 1499,
      '$[1].price', 5996, '$[1].salePrice', 2599,
      '$[2].price', 8994, '$[2].salePrice', 3599)
WHERE `slug` = 'diasuddhi' AND `variants` IS NOT NULL AND JSON_VALID(`variants`);

-- ---------------------------------------------------------------------------
-- JOSHVEDA — 1,990 / 3,499 / 4,799       (was 2,299 / 3,999 / 5,499)
-- ---------------------------------------------------------------------------
UPDATE `products`
SET `price` = 3980, `sale_price` = 1990
WHERE `slug` = 'joshveda';

UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price',  3980, '$[0].salePrice', 1990,
      '$[1].price',  7960, '$[1].salePrice', 3499,
      '$[2].price', 11940, '$[2].salePrice', 4799)
WHERE `slug` = 'joshveda' AND `variants` IS NOT NULL AND JSON_VALID(`variants`);

-- ---------------------------------------------------------------------------
-- Prepaid discount: 20% → 15%
-- Patched inside the settings JSON so nothing else in it is disturbed.
-- ---------------------------------------------------------------------------
UPDATE `settings`
SET `svalue` = JSON_SET(`svalue`, '$.prepaidDiscountPercent', 15)
WHERE `skey` = 'site' AND JSON_VALID(`svalue`);

COMMIT;

-- Verify: these must match the table in the deploy notes exactly.
SELECT slug, price AS mrp, sale_price AS selling,
       JSON_EXTRACT(variants, '$[*].salePrice') AS variant_selling_prices
FROM `products`
WHERE slug IN ('slimpax', 'diasuddhi', 'joshveda');

SELECT JSON_EXTRACT(svalue, '$.prepaidDiscountPercent') AS prepaid_percent
FROM `settings` WHERE skey = 'site';
