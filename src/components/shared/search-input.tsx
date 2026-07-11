"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  placeholder?: string
  className?: string
  defaultValue?: string
}

function SearchInput({ placeholder = "Search...", className, defaultValue = "" }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState(defaultValue || searchParams.get("query") || "")

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (newValue: string) => {
    setValue(newValue)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue) {
        params.set("query", newValue)
      } else {
        params.delete("query")
      }
      router.push(`?${params.toString()}`, { scroll: false })
    }, 300)
  }

  const handleClear = () => {
    setValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("query")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-8 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ring)]"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
