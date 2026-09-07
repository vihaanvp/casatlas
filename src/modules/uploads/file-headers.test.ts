import { describe, it, expect } from "vitest"
import { isSafeKey, contentTypeFor, fileHeaders } from "./file-headers"

describe("isSafeKey", () => {
  it("accepts normal {userId}/{experienceId}/{file} keys", () => {
    expect(isSafeKey("u1/e1/1690000000-abc123.jpg")).toBe(true)
  })
  it("rejects traversal, empty segments, and short keys", () => {
    expect(isSafeKey("../../etc/passwd")).toBe(false)
    expect(isSafeKey("u1//file.jpg")).toBe(false)
    expect(isSafeKey("just-a-file.jpg")).toBe(false)
    expect(isSafeKey("")).toBe(false)
  })
})

describe("contentTypeFor", () => {
  it("maps known extensions case-insensitively", () => {
    expect(contentTypeFor("a.JPG")).toBe("image/jpeg")
    expect(contentTypeFor("b.pdf")).toBe("application/pdf")
    expect(contentTypeFor("c.mp4")).toBe("video/mp4")
  })
  it("falls back to octet-stream so unknown types download instead of sniff", () => {
    expect(contentTypeFor("evil.html")).toBe("application/octet-stream")
    expect(contentTypeFor("noext")).toBe("application/octet-stream")
  })
})

describe("fileHeaders", () => {
  it("allows inline preview + same-origin framing, never public caching", () => {
    const h = fileHeaders("1690000000-abc123.pdf", 1234)
    expect(h["Content-Type"]).toBe("application/pdf")
    expect(h["Content-Disposition"]).toContain("inline")
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN")
    expect(h["Cache-Control"]).toContain("private")
    expect(h["Accept-Ranges"]).toBe("bytes")
    expect(h["Content-Length"]).toBe("1234")
  })
})
