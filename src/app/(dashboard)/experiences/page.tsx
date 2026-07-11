import { Suspense } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { SearchInput } from "@/components/shared/search-input"
import { ExperienceListSkeleton } from "@/components/shared/experience-list-skeleton"
import { ExperienceFilters } from "@/modules/experiences/components/experience-filters"
import { ExperienceList } from "@/modules/experiences/components/experience-list"
import { getExperiences } from "@/modules/experiences/experience.actions"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Experiences | CASAtlas",
}

async function ExperienceContent({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const experiences = await getExperiences({
    query: params.query,
    status: params.status as "DRAFT" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION" | "ARCHIVED" | undefined,
    strand: params.strand as "CREATIVITY" | "ACTIVITY" | "SERVICE" | undefined,
    sortBy: (params.sortBy as "date" | "title" | "updatedAt") ?? "date",
    sortOrder: "desc",
  })

  const hasFilters = params.query || params.status || params.strand

  if (experiences.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={hasFilters ? "No matching experiences" : "No experiences yet"}
        description={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Create your first CAS experience to start documenting your journey."
        }
        action={
          hasFilters ? undefined : (
            <Link href="/experiences/new">
              <Button>Create Experience</Button>
            </Link>
          )
        }
      />
    )
  }

  return <ExperienceList experiences={experiences} />
}

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiences"
        description="Manage your CAS experiences"
        action={
          <Link href="/experiences/new">
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              New Experience
            </Button>
          </Link>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Suspense>
            <SearchInput placeholder="Search experiences..." className="w-full max-w-sm" />
          </Suspense>
        </div>

        <Suspense>
          <ExperienceFilters />
        </Suspense>

        <Suspense fallback={<ExperienceListSkeleton />}>
          <ExperienceContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
