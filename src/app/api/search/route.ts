import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"

// Ponytail: simple search route for the Cmd+K dialog.
// No full-text index needed — ILIKE on title/description covers current scale.

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ results: [] })
    }

    const query = request.nextUrl.searchParams.get("q")?.trim()
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const role = session.user.role
    const userId = session.user.id

    // Teachers see their assigned students' experiences AND their own.
    const experienceWhere: Prisma.ExperienceWhereInput = role === "ADMIN"
      ? { deletedAt: null, OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] }
      : role === "TEACHER"
        ? {
            deletedAt: null,
            OR: [
              { user: { teachers: { some: { teacherId: userId } } } },
              { userId },
            ],
            AND: { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] },
          }
        : {
            userId,
            deletedAt: null,
            OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
          }

    // Comment search: teachers/admins scoped to assigned students' experiences.
    const commentExperienceScope: Prisma.ExperienceWhereInput =
      role === "ADMIN" ? { deletedAt: null }
      : role === "TEACHER" ? { deletedAt: null, OR: [{ user: { teachers: { some: { teacherId: userId } } } }, { userId }] }
      : { userId, deletedAt: null }

    const [experiences, users, comments] = await Promise.all([
      prisma.experience.findMany({
        where: experienceWhere,
        select: {
          id: true,
          title: true,
          status: true,
          date: true,
          strands: { select: { strand: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      // Admins/teachers can search users
      (role === "ADMIN" || role === "TEACHER")
        ? prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, name: true, email: true, role: true },
            take: 5,
          })
        : Promise.resolve([]),
      // Search comments on own/assigned experiences
      prisma.comment.findMany({
        where: {
          content: { contains: query, mode: "insensitive" },
          experience: commentExperienceScope,
        },
        select: {
          id: true,
          content: true,
          experienceId: true,
          experience: { select: { title: true } },
        },
        take: 5,
      }),
    ])

    return NextResponse.json({
      experiences,
      users: Array.isArray(users) ? users : [],
      comments,
    })
  } catch (error) {
    console.error("Search failed:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
