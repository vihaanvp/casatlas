import { prisma } from "@/lib/prisma"
import { type NotificationType } from "@prisma/client"

/** Create an in-app notification. */
export async function createNotification(params: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  return prisma.notification.create({ data: params })
}

/** Get unread count for a user. */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } })
}

/** Get paginated notifications for a user. */
export async function getNotifications(userId: string, params?: { page?: number; pageSize?: number; unreadOnly?: boolean }) {
  const { page = 1, pageSize = 20, unreadOnly = false } = params ?? {}
  const skip = (page - 1) * pageSize
  const where = { userId, ...(unreadOnly && { read: false }) }

  const [notifications, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  return { notifications, total, unread, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/** Mark notification(s) as read. */
export async function markAsRead(userId: string, notificationId?: string): Promise<void> {
  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })
  }
}
