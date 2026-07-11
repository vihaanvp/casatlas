import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { storage } from "@/modules/uploads"
import { uploadConfig } from "@/config/upload"
import { NextResponse } from "next/server"

function getEvidenceType(mimeType: string): "IMAGE" | "VIDEO" | "PDF" {
  if (mimeType.startsWith("image/")) return "IMAGE"
  if (mimeType.startsWith("video/")) return "VIDEO"
  return "PDF"
}

function isAllowed(mimeType: string): boolean {
  return (
    uploadConfig.allowedTypes.image.includes(mimeType as typeof uploadConfig.allowedTypes.image[number]) ||
    uploadConfig.allowedTypes.video.includes(mimeType as typeof uploadConfig.allowedTypes.video[number]) ||
    uploadConfig.allowedTypes.document.includes(mimeType as typeof uploadConfig.allowedTypes.document[number])
  )
}

function getExtension(filename: string, mimeType: string): string {
  const fromName = filename.split(".").pop()?.toLowerCase()
  if (fromName && fromName.length <= 4) return fromName
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "application/pdf": "pdf",
  }
  return map[mimeType] ?? "bin"
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const experienceId = formData.get("experienceId") as string | null

    if (!file || !experienceId) {
      return NextResponse.json({ error: "Missing file or experienceId" }, { status: 400 })
    }

    if (!isAllowed(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    if (file.size > uploadConfig.maxFileSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Verify experience ownership
    const experience = await prisma.experience.findFirst({
      where: { id: experienceId, userId: session.user.id, deletedAt: null },
    })
    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    // Generate key: userId/experienceId/timestamp-random.ext
    const ext = getExtension(file.name, file.type)
    const key = `${session.user.id}/${experienceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await storage.put(key, buffer, {
      contentType: file.type,
      size: file.size,
      filename: file.name,
    })

    const evidence = await prisma.evidence.create({
      data: {
        experienceId,
        type: getEvidenceType(file.type),
        url: result.url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    })

    return NextResponse.json(evidence, { status: 201 })
  } catch (error) {
    console.error("Upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
