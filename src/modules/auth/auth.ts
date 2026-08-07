import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/config/auth"
import { isRegistrationOpen } from "@/lib/app-config"

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
    // Dev-only credentials login (AUTH_DEV_LOGIN=true). Not for production.
    if (authConfig.providers.credentials.enabled) {
      providers.push(
        Credentials({
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            const email =
              typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : ""
            if (!email) return null
            return prisma.user.findUnique({ where: { email } })
          },
        })
      )
    }
    return providers
  })(),
  // JWT strategy works for both OAuth and the dev credentials login (Auth.js
  // forbids database sessions when only the credentials provider is enabled).
  session: { strategy: "jwt" },
  callbacks: {
    // Block new registrations when registration is disabled; existing users
    // (matched by email) can still sign in. Registration state can be toggled
    // at runtime by an admin (DB override), falling back to the env default.
    async signIn({ user }) {
      if (await isRegistrationOpen()) return true
      if (!user.email) return false
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true },
      })
      return !!existing
    },
    // Carry id/role from the DB user into the JWT on sign-in.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as "STUDENT" | "TEACHER" | "ADMIN") ?? "STUDENT"
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
})
