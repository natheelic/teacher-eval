import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Where an uploaded logo actually lives (ROADMAP 6.1). Written straight to
 * `public/uploads` rather than a hosted object-storage provider (no such
 * package exists in this app at all) — this app assumes a long-lived Node
 * server (see CLAUDE.md, same assumption the /docs page already makes about
 * reading a file off disk at request time), and Next's built-in static file
 * serving reads the `public/` directory from disk on every request rather
 * than baking a manifest at build time, so a file written here after boot is
 * served immediately with no restart. This would NOT survive a serverless
 * deploy target (no durable local disk, and possibly multiple instances with
 * no shared filesystem) — revisit if this app ever moves to one.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Deliberately excludes image/svg+xml: an SVG served from this app's own
// origin executes embedded script if a browser is ever pointed at the file
// URL directly (via <object>/<iframe>, or plain navigation) — unlike an
// <img src> reference, which does not execute it. Restricting to raster
// formats removes that stored-XSS surface entirely rather than trying to
// sanitize SVG markup.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export class InvalidLogoUpload extends Error {}

/**
 * Validates and writes an uploaded logo, returning its public URL path.
 * Throws InvalidLogoUpload with a user-facing message on a bad file.
 */
export async function saveLogoFile(file: File): Promise<string> {
  if (file.size === 0) {
    throw new InvalidLogoUpload("Choose an image file.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new InvalidLogoUpload("Image must be 2MB or smaller.");
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new InvalidLogoUpload("Use a PNG, JPEG, or WebP image.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return `/uploads/${filename}`;
}

/**
 * Best-effort: called when a logo is replaced or removed. Losing the old
 * file to a rare race or permissions error should never fail the request
 * that's replacing/removing it — same "never the reason an operation fails"
 * principle logAudit already follows.
 */
export async function deleteLogoFile(url: string | null): Promise<void> {
  if (!url) return;
  const filename = path.basename(url);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // Already gone, or never existed — nothing to do.
  }
}
