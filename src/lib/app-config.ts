import { prisma } from "@/lib/prisma"

/** Read a runtime config value, or null if never set. */
export async function getConfigValue(key: string): Promise<string | null> {
  const row = await prisma.appConfig.findUnique({ where: { key } })
  return row?.value ?? null
}

/** Upsert a runtime config value. */
export async function setConfigValue(key: string, value: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

/**
 * Registration gate: a DB-set value overrides the env default, so admins can
 * toggle it at runtime without a redeploy. Absent DB row → env default.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const db = await prisma.appConfig.findUnique({ where: { key: "ALLOW_REGISTRATION" } })
  if (db) return db.value !== "false"
  return process.env.ALLOW_REGISTRATION !== "false"
}
