// Pure helpers for serving uploaded evidence. Kept side-effect free so they
// can be unit-tested without auth/DB/filesystem.

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
}

/** Reject traversal/empty segments before touching the filesystem. */
export function isSafeKey(key: string): boolean {
  if (!key) return false
  const segments = key.split("/")
  // ponytail: keys are always {userId}/{experienceId}/{file} — enforce shape.
  if (segments.length < 3) return false
  return !segments.some((s) => s === "" || s === "." || s === "..")
}

export function contentTypeFor(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return MIME_MAP[ext] ?? "application/octet-stream"
}

/** Response headers for inline preview + save-as with the original name. */
export function fileHeaders(filename: string, size: number): Record<string, string> {
  // Quote + strip path separators so the stored segment can't inject headers.
  const safe = filename.split("/").pop()?.replace(/["\r\n]/g, "") || "file"
  return {
    "Content-Type": contentTypeFor(filename),
    "Content-Length": String(size),
    // Inline so images/PDFs/videos preview; the UI's download link
    // (`<a download>`) still forces save-as with the original filename.
    "Content-Disposition": `inline; filename="${safe}"`,
    "Accept-Ranges": "bytes",
    // Authenticated + user-private: never allow shared caches to store these.
    "Cache-Control": "private, max-age=3600, immutable",
    // Same-origin framing so the in-app PDF <iframe> works; the global
    // DENY header would otherwise block all previews.
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "frame-ancestors 'self'",
  }
}
