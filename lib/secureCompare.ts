import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison.
 *
 * `a === b` on a secret leaks its length and its matching prefix through
 * response timing. `timingSafeEqual` needs equal-length buffers, so we hide the
 * length difference by comparing byte-by-byte over the longer of the two and
 * folding the length check into the result.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  const len = Math.max(bufA.length, bufB.length, 1);
  const padA = Buffer.alloc(len);
  const padB = Buffer.alloc(len);
  bufA.copy(padA);
  bufB.copy(padB);
  // Both comparisons always run; `&` (not `&&`) avoids short-circuiting.
  return Boolean(timingSafeEqual(padA, padB) && bufA.length === bufB.length);
}
