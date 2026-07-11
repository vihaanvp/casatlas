"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Something went wrong</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
