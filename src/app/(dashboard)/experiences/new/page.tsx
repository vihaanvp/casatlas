import { PageHeader } from "@/components/shared/page-header"
import { ExperienceForm } from "@/modules/experiences/components/experience-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Experience | CASAtlas",
}

export default function NewExperiencePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Experience"
        description="Create a new CAS experience"
      />

      <ExperienceForm mode="create" />
    </div>
  )
}
