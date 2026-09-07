import { auth } from "@/modules/auth/auth"
import { storage } from "@/modules/uploads"
import { fileHeaders, isSafeKey } from "@/modules/uploads/file-headers"
import { canAccessExperience } from "@/modules/experiences/experience.service"
import type { Role } from "@prisma/client"
import { NextResponse } from "next/server"

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

    if (!isSafeKey(key)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Owner, admin, or teacher assigned to the student may view evidence.
    // Key format is {userId}/{experienceId}/{...}.
    const allowed = await canAccessExperience(path[1] ?? "", session.user.id, session.user.role as Role)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const buffer = await storage.get(key)
    if (!buffer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const filename = path[path.length - 1]
    return new NextResponse(new Uint8Array(buffer), {
      headers: fileHeaders(filename, buffer.length),
    })
  } catch (error) {
    console.error("Failed to serve file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
