"use server"

import { signOut } from "@/modules/auth/auth"

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
