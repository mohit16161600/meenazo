/**
 * The catalogue cache's shared seam — tag name and bust signal.
 *
 * This module has no imports of its own, on purpose: lib/catalog.ts reads the
 * database through lib/panelCrud.ts, and lib/panelCrud.ts must drop the
 * catalogue cache after a write. If either imported the other for that, the
 * two would form a cycle — harmless today, silently broken the day the import
 * order shifts. Both instead meet here, one level down.
 *
 * The bust signal is a tiny registry rather than a direct import for the same
 * reason: lib/catalog.ts REGISTERS its cache-clearing function at load, and
 * lib/panelCrud.ts FIRES the signal after a products/categories write without
 * ever importing lib/catalog.ts.
 */
export const CATALOG_TAG = "catalog";

const busters: Array<() => void> = [];

/** Called by lib/catalog.ts once, at module load. */
export function onCatalogBust(fn: () => void): void {
  busters.push(fn);
}

/** Empty every registered catalogue cache. Never throws. */
export function bustCatalog(): void {
  for (const fn of busters) {
    try {
      fn();
    } catch {
      /* one broken buster must not stop the others */
    }
  }
}
