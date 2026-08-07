import { notFound, redirect } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ExperienceForm } from "@/modules/experiences/components/experience-form"
import { getExperience } from "@/modules/experiences/experience.actions"
import { auth } from "@/modules/auth/auth"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const experience = await getExperience(id)
  if (!experience) return { title: "Not Found | CASAtlas" }
  return { title: `Edit ${experience.title} | CASAtlas` }
}

export default async function ExperienceEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const experience = await getExperience(id)

  if (!experience) notFound()

  // Only the owner may edit, and only while the experience is a draft or
  // needs revision — editing a submitted/approved experience bypasses review.
  if (experience.userId !== session?.user?.id) {
    redirect(`/experiences/${id}`)
  }
  if (experience.status !== "DRAFT" && experience.status !== "NEEDS_REVISION") {
    redirect(`/experiences/${id}`)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit Experience"
        description={`Editing: ${experience.title}`}
      />

      <ExperienceForm mode="edit" experience={experience} />
    </div>
  )
}
