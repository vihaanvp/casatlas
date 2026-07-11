"use server"

import { auth } from "@/modules/auth/auth"
import { getNotifications, getUnreadCount, markAsRead } from "@/lib/notifications"
import { revalidatePath } from "next/cache"

export async function fetchNotifications(page?: number, unreadOnly?: boolean) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return getNotifications(session.user.id, { page, unreadOnly })
}

export async function fetchUnreadCount() {
  const session = await auth()
  if (!session?.user) return 0
  return getUnreadCount(session.user.id)
}

export async function markNotificationRead(notificationId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  await markAsRead(session.user.id, notificationId)
  revalidatePath("/")
  return { success: true }
}
