"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export async function removeEvidence(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" }
    }

    const parsed = z.string().min(1, "Invalid evidence ID").safeParse(id)
    if (!parsed.success) {
      return { success: false, error: "Invalid evidence ID" }
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { experience: { select: { userId: true } } },
    })

    if (!evidence || evidence.experience.userId !== session.user.id) {
      return { success: false, error: "Evidence not found" }
    }

    await prisma.evidence.delete({ where: { id } })

    revalidatePath(`/experiences/${evidence.experienceId}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove evidence"
    return { success: false, error: message }
  }
}
