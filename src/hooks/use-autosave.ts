"use client"

import { useCallback, useRef } from "react"

export function useAutosave<T>(
  save: (data: T) => Promise<void>,
  delay: number = 1000
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedDataRef = useRef<T | null>(null)

  const autosave = useCallback(
    (data: T) => {
      savedDataRef.current = data

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(async () => {
        if (savedDataRef.current !== null) {
          await save(savedDataRef.current)
        }
      }, delay)
    },
    [save, delay]
  )

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (savedDataRef.current !== null) {
      await save(savedDataRef.current)
    }
  }, [save])

  return { autosave, saveNow }
}
