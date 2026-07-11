import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "STUDENT" | "TEACHER" | "ADMIN"
    } & DefaultSession["user"]
  }
}

declare module "next-auth" {
  interface JWT {
    role?: string
  }
}

export type { Experience, User, Evidence, UserSettings, LearningOutcome, CASStrand, ExperienceRevision, Comment, Notification, AuditLog, TeacherStudent } from "@prisma/client"
export type { ExperienceStatus, Strand, EvidenceType, Theme, Role, AuditAction, NotificationType } from "@prisma/client"
