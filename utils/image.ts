import type { ImageAsset, ImageRef } from "@/types";

/**
 * Images are stored either as a bare path (`"/images/x.webp"`) or as an asset
 * object carrying its own alt text.
 *
 * Both forms are supported on purpose. Every image on the site predates the alt
 * system as a plain string, and a migration that rewrote them all would have to
 * invent alt text it doesn't have. Instead the two shapes coexist: old rows keep
 * working with a sensible derived alt, and anything saved through the panel from
 * now on carries the alt the editor actually wrote.
 *
 * Use `imgSrc()` and `imgAlt()` at every render site — never read `.src`
 * directly, or a plain-string record will render nothing.
 */

/** The URL/path to render, or undefined when there is no image. */
export function imgSrc(ref?: ImageRef | null): string | undefined {
  if (!ref) return undefined;
  const src = typeof ref === "string" ? ref : ref.src;
  const v = src?.trim();
  return v || undefined;
}

/**
 * Alt text for the image.
 *
 * `fallback` is what the image means in context — a product name, an article
 * title. It is required so a call site cannot accidentally ship an empty alt;
 * pass `""` explicitly for genuinely decorative art, which is the one case
 * where empty is the correct value rather than a missing one.
 */
export function imgAlt(ref: ImageRef | null | undefined, fallback: string): string {
  if (ref && typeof ref !== "string") {
    const written = ref.alt?.trim();
    if (written) return written;
  }
  return fallback;
}

/** Optional title attribute (tooltip), only ever set explicitly. */
export function imgTitle(ref?: ImageRef | null): string | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref.title?.trim() || undefined;
}

/** Caption rendered under the image, only ever set explicitly. */
export function imgCaption(ref?: ImageRef | null): string | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref.caption?.trim() || undefined;
}

/** Normalise any stored value into the object form (for editing). */
export function toAsset(ref?: ImageRef | null): ImageAsset {
  if (!ref) return { src: "" };
  return typeof ref === "string" ? { src: ref } : { ...ref };
}

/**
 * Collapse back to a bare string when nothing but `src` is set, so records the
 * editor opened but didn't annotate don't grow a pointless object wrapper.
 */
export function fromAsset(asset: ImageAsset): ImageRef | "" {
  const src = asset.src?.trim() ?? "";
  if (!src) return "";
  const extras = [asset.alt, asset.title, asset.caption].some((v) => v?.trim());
  if (!extras) return src;
  return {
    src,
    ...(asset.alt?.trim() ? { alt: asset.alt.trim() } : {}),
    ...(asset.title?.trim() ? { title: asset.title.trim() } : {}),
    ...(asset.caption?.trim() ? { caption: asset.caption.trim() } : {}),
  };
}
