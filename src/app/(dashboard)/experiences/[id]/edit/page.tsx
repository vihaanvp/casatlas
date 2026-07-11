import { notFound } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { ExperienceForm } from "@/modules/experiences/components/experience-form"
import { getExperience } from "@/modules/experiences/experience.actions"
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
  const experience = await getExperience(id)

  if (!experience) notFound()

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
