"use client"

import * as React from "react"

function Tooltip({ children, content, ...props }: React.HTMLAttributes<HTMLDivElement> & { content: string }) {
  const [show, setShow] = React.useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      {...props}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="rounded-md bg-[var(--color-text-primary)] px-3 py-1.5 text-xs text-[var(--color-background)] whitespace-nowrap shadow-md">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export { Tooltip }
