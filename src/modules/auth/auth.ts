import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

// Debug: log whether credentials are present (do not log the values)
console.debug("[NextAuth] Google client ID present:", !!process.env.GOOGLE_CLIENT_ID)
console.debug("[NextAuth] Google client secret present:", !!process.env.GOOGLE_CLIENT_SECRET)
console.debug("[NextAuth] GitHub client ID present:", !!process.env.GITHUB_CLIENT_ID)
console.debug("[NextAuth] GitHub client secret present:", !!process.env.GITHUB_CLIENT_SECRET)

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: (() => {
    const providers = []
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      )
    }
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      providers.push(
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })
      )
    }
    return providers
  })(),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Fetch role on first sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.role = (dbUser?.role as string) ?? "STUDENT"
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string
        session.user.role = (token.role as "STUDENT" | "TEACHER" | "ADMIN") ?? "STUDENT"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
})
