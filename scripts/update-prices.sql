-- ===========================================================================
-- Meenazo — price + pack fix for the PANEL DATABASE
-- ===========================================================================
-- WHY THIS FILE EXISTS
--
-- Prices live in two places and they are NOT the same store:
--
--   • data/products.ts  — ships with the code. The website's product pages
--                         read this, so a deploy changes what customers SEE.
--   • `products` table  — the panel database. lib/orderCapture.ts prices every
--                         order from HERE, and once this table has ANY rows it
--                         is fully authoritative — it does not inherit packs or
--                         prices from data/products.ts for the gaps.
--
-- Deploying code does not touch the database. That is why the shop showed
-- ₹1,990 while the checkout charged ₹2,299.
--
-- TWO PROBLEMS ARE FIXED HERE
--
--   1. `price` / `sale_price` still hold the old amounts.
--   2. `variants` is NULL. With no packs on the row, the server had nothing to
--      match "3 Bottles" against, so every pack was charged the SINGLE-bottle
--      price and the order recorded no pack name at all — meaning fulfilment
--      shipped one bottle for a three-bottle order.
--
-- HOW TO RUN (on the server, against the PRODUCTION panel database):
--
--   mysqldump -u <USER> -p <DB> products settings > panel-backup.sql   # first!
--   mysql -u <USER> -p <DB> < scripts/update-prices.sql
--
-- RUN THIS **BEFORE** DEPLOYING THE NEW CODE. The new build refuses a pack it
-- cannot find rather than under-charging for it, so on a database with empty
-- `variants` it would turn those orders away. Fix the data first, deploy second
-- — that order has no bad window in either direction.
--
-- AFTER RUNNING: open the panel and press **Publish** so
-- data/generated/products.json is rewritten from the DB and every surface agrees.
-- ===========================================================================

SET NAMES utf8mb4;

-- Before: what the server is charging today.
SELECT slug, price AS mrp, sale_price AS selling,
       JSON_EXTRACT(variants, '$[*].salePrice') AS pack_prices
FROM `products` WHERE slug IN ('slimpax', 'diasuddhi', 'joshveda');

START TRANSACTION;

/* -------------------------------------------------------------------------
   1. Base prices.  MRP is exactly 2× the selling price on every product, so
      the "Flat 50% OFF" line on the announcement bar stays literally true.
   ------------------------------------------------------------------------- */
UPDATE `products` SET `price` = 3980, `sale_price` = 1990 WHERE `slug` = 'slimpax';
UPDATE `products` SET `price` = 2998, `sale_price` = 1499 WHERE `slug` = 'diasuddhi';
UPDATE `products` SET `price` = 3980, `sale_price` = 1990 WHERE `slug` = 'joshveda';

/* -------------------------------------------------------------------------
   2a. Packs, where the row has NONE yet (the current state — `variants` NULL).
       Written in full, matching data/products.ts exactly.
   ------------------------------------------------------------------------- */
UPDATE `products` SET `variants` = '[{"label":"1 Bottle · 60 capsules","unit":"60 capsules","price":3980,"salePrice":1990},{"label":"2 Bottles · 120 capsules","unit":"120 capsules","price":7960,"salePrice":3499},{"label":"3 Bottles · 180 capsules","unit":"180 capsules","price":11940,"salePrice":4799}]'
WHERE `slug` = 'slimpax'
  AND (`variants` IS NULL OR `variants` = '' OR NOT JSON_VALID(`variants`) OR JSON_LENGTH(`variants`) = 0);

UPDATE `products` SET `variants` = '[{"label":"1 Bottle · 30 capsules","unit":"30 capsules","price":2998,"salePrice":1499},{"label":"2 Bottles · 60 capsules","unit":"60 capsules","price":5996,"salePrice":2599},{"label":"3 Bottles · 90 capsules","unit":"90 capsules","price":8994,"salePrice":3599}]'
WHERE `slug` = 'diasuddhi'
  AND (`variants` IS NULL OR `variants` = '' OR NOT JSON_VALID(`variants`) OR JSON_LENGTH(`variants`) = 0);

UPDATE `products` SET `variants` = '[{"label":"1 Bottle · 60 capsules","unit":"60 capsules","price":3980,"salePrice":1990},{"label":"2 Bottles · 120 capsules","unit":"120 capsules","price":7960,"salePrice":3499},{"label":"3 Bottles · 180 capsules","unit":"180 capsules","price":11940,"salePrice":4799}]'
WHERE `slug` = 'joshveda'
  AND (`variants` IS NULL OR `variants` = '' OR NOT JSON_VALID(`variants`) OR JSON_LENGTH(`variants`) = 0);

/* -------------------------------------------------------------------------
   2b. Packs, where the row ALREADY has them: patch the numbers key-by-key so
       anything else stored on a pack (its SKU, a custom label) survives.
       These are no-ops on a database that took branch 2a above.
   ------------------------------------------------------------------------- */
UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price',  3980, '$[0].salePrice', 1990,
      '$[1].price',  7960, '$[1].salePrice', 3499,
      '$[2].price', 11940, '$[2].salePrice', 4799)
WHERE `slug` = 'slimpax' AND JSON_VALID(`variants`) AND JSON_LENGTH(`variants`) >= 3;

UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price', 2998, '$[0].salePrice', 1499,
      '$[1].price', 5996, '$[1].salePrice', 2599,
      '$[2].price', 8994, '$[2].salePrice', 3599)
WHERE `slug` = 'diasuddhi' AND JSON_VALID(`variants`) AND JSON_LENGTH(`variants`) >= 3;

UPDATE `products`
SET `variants` = JSON_SET(`variants`,
      '$[0].price',  3980, '$[0].salePrice', 1990,
      '$[1].price',  7960, '$[1].salePrice', 3499,
      '$[2].price', 11940, '$[2].salePrice', 4799)
WHERE `slug` = 'joshveda' AND JSON_VALID(`variants`) AND JSON_LENGTH(`variants`) >= 3;

/* -------------------------------------------------------------------------
   3. Pay-online discount: 20% → 15%. Patched inside the settings JSON so
      nothing else in it is disturbed.
   ------------------------------------------------------------------------- */
UPDATE `settings`
SET `svalue` = JSON_SET(`svalue`, '$.prepaidDiscountPercent', 15)
WHERE `skey` = 'site' AND JSON_VALID(`svalue`);

COMMIT;

-- After: must read 1990 / 1499 / 1990, and three pack prices on every row.
SELECT slug, price AS mrp, sale_price AS selling,
       JSON_EXTRACT(variants, '$[*].salePrice') AS pack_prices
FROM `products` WHERE slug IN ('slimpax', 'diasuddhi', 'joshveda');

SELECT JSON_EXTRACT(svalue, '$.prepaidDiscountPercent') AS prepaid_percent
FROM `settings` WHERE skey = 'site';
