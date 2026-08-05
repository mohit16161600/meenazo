import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSession } from "@/lib/panelAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Image upload for the panel's image fields (blog cover, category art, banners,
 * testimonials). Until now those fields only accepted a URL, so the owner had to
 * host the picture somewhere else first.
 *
 * Files land in `public/images/uploads/` and are served straight back as
 * `/images/uploads/<name>`, which is exactly what the field stores - so an
 * uploaded image and a pasted URL are the same thing downstream.
 *
 * Any signed-in panel user may upload: every page that renders an image field is
 * already gated by its own role check, and a per-resource check here would just
 * be the same gate a second time. The real defences are below - a size cap, a
 * content-sniffed allow-list, and a generated filename that can never escape the
 * upload directory.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "uploads");
const PUBLIC_PREFIX = "/images/uploads";

/**
 * SVG is deliberately absent: it can carry <script>, and next.config enables
 * dangerouslyAllowSVG, so an uploaded SVG would be stored XSS on our own origin.
 */
const TYPES: { ext: string; mime: string; match: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    mime: "image/png",
    match: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "gif",
    mime: "image/gif",
    match: (b) => b.subarray(0, 6).toString("latin1") === "GIF87a" || b.subarray(0, 6).toString("latin1") === "GIF89a",
  },
  {
    ext: "webp",
    mime: "image/webp",
    match: (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    ext: "avif",
    mime: "image/avif",
    match: (b) =>
      b.subarray(4, 8).toString("latin1") === "ftyp" &&
      ["avif", "avis"].includes(b.subarray(8, 12).toString("latin1")),
  },
];

const ACCEPT = TYPES.map((t) => t.mime).join(", ");

/** Trust the bytes, not the browser-supplied content type. */
function sniff(buf: Buffer) {
  return TYPES.find((t) => t.match(buf)) ?? null;
}

/**
 * Build a filename from scratch. The original name only contributes lowercase
 * letters, digits and dashes, so "../../etc/passwd" collapses to "etcpasswd"
 * and the result always stays inside UPLOAD_DIR.
 */
function safeName(original: string, ext: string) {
  const base = path
    .basename(original || "image")
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "image"}-${randomBytes(6).toString("hex")}.${ext}`;
}

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return fail("Not authenticated", 401);

  let file: File | null = null;
  try {
    const form = await req.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return fail("Could not read the upload. Please try again.", 400);
  }
  if (!file) return fail("No file was attached.", 400);

  if (file.size === 0) return fail("That file is empty.", 400);
  if (file.size > MAX_BYTES) {
    return fail(
      `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_BYTES / 1024 / 1024} MB - please compress it and try again.`,
      413
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Re-check after reading: file.size is client-reported metadata.
  if (buf.length > MAX_BYTES) return fail("That image is over the 5 MB limit.", 413);

  const type = sniff(buf);
  if (!type) {
    return fail(
      "That file is not a supported image. Please upload a JPG, PNG, WebP, GIF or AVIF (SVG is not allowed).",
      415
    );
  }

  const name = safeName(file.name, type.ext);
  const dest = path.join(UPLOAD_DIR, name);
  // Belt and braces: the generated name cannot contain a separator, but assert it.
  if (path.dirname(path.resolve(dest)) !== path.resolve(UPLOAD_DIR)) {
    return fail("Invalid file name.", 400);
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(dest, buf);
  } catch (err) {
    console.error("[panel upload] write failed:", err);
    return fail("Could not save the file on the server. Please try again.", 500);
  }

  return NextResponse.json({
    success: true,
    url: `${PUBLIC_PREFIX}/${name}`,
    name,
    size: buf.length,
    mime: type.mime,
  });
}

/** Lets the field describe what it accepts without hard-coding the list twice. */
export async function GET() {
  const session = await getSession();
  if (!session) return fail("Not authenticated", 401);
  return NextResponse.json({ success: true, accept: ACCEPT, maxBytes: MAX_BYTES });
}
