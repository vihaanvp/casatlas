"use server"

import { auth } from "@/modules/auth/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const themeSchema = z.enum(["DARK", "LIGHT"])

/** Persist the user's theme preference. "System" is client-side only. */
export async function updateTheme(theme: string) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: "You must be signed in" }

  const parsed = themeSchema.safeParse(theme)
  if (!parsed.success) return { success: false, error: "Invalid theme" }

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { theme: parsed.data },
    create: { userId: session.user.id, theme: parsed.data },
  })

  revalidatePath("/settings/appearance")
  return { success: true }
}
