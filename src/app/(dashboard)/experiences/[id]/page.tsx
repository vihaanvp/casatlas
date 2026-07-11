import { notFound } from "next/navigation"
import { auth } from "@/modules/auth/auth"
import { getExperience } from "@/modules/experiences/experience.actions"
import { getComments } from "@/modules/teacher/teacher.actions"
import { ExperienceDetail } from "@/modules/experiences/components/experience-detail"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const experience = await getExperience(id)
  if (!experience) return { title: "Not Found | CASAtlas" }
  return { title: `${experience.title} | CASAtlas` }
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [experience, session, comments] = await Promise.all([
    getExperience(id),
    auth(),
    getComments(id).catch(() => []), // graceful fallback
  ])

  if (!experience) notFound()

  const isReviewer = session?.user && (session.user.role === "TEACHER" || session.user.role === "ADMIN")

  return (
    <ExperienceDetail
      experience={experience}
      comments={comments}
      isReviewer={!!isReviewer}
      currentUserId={session?.user?.id}
    />
  )
}
