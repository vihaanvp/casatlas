import { auth } from "@/modules/auth/auth"
import { storage } from "@/modules/uploads"
import { NextResponse } from "next/server"

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { path } = await params
    const key = path.join("/")

    // Path must start with the requesting user's ID
    if (path[0] !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const buffer = await storage.get(key)
    if (!buffer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const ext = path[path.length - 1].split(".").pop()?.toLowerCase() ?? ""
    const contentType = MIME_MAP[ext] ?? "application/octet-stream"

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Failed to serve file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
