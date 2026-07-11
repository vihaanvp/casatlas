"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"

interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
  result?: { id: string; url: string; filename: string }
}

interface UseUploadOptions {
  experienceId: string
  onUploadComplete?: (result: { id: string; url: string; filename: string }) => void
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

function useUpload({ experienceId, onUploadComplete }: UseUploadOptions) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const abortRefs = useRef<Map<string, AbortController>>(new Map())

  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f))

    const formData = new FormData()
    formData.append("file", uploadFile.file)
    formData.append("experienceId", experienceId)

    const controller = new AbortController()
    abortRefs.current.set(uploadFile.id, controller)

    try {
      const xhr = new XMLHttpRequest()
      const result = await new Promise<{ id: string; url: string; filename: string }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, progress } : f))
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error(xhr.statusText || "Upload failed"))
          }
        })

        xhr.addEventListener("error", () => reject(new Error("Network error")))
        xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")))

        xhr.open("POST", "/api/upload")
        xhr.send(formData)
      })

      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "done", progress: 100, result } : f))
      toast.success(`Uploaded ${uploadFile.file.name}`)
      onUploadComplete?.(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      setFiles((prev) => prev.map((f) => f.id === uploadFile.id ? { ...f, status: "error", error: message } : f))
      toast.error(`Failed to upload ${uploadFile.file.name}`)
    } finally {
      abortRefs.current.delete(uploadFile.id)
    }
  }, [experienceId, onUploadComplete])

  const upload = useCallback((newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      progress: 0,
      status: "pending" as const,
    }))

    setFiles((prev) => [...prev, ...uploadFiles])
    uploadFiles.forEach(uploadFile)
  }, [uploadFile])

  const retry = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        uploadFile({ ...file, status: "pending", progress: 0, error: undefined })
        return prev.map((f) => f.id === id ? { ...f, status: "pending", progress: 0, error: undefined } : f)
      }
      return prev
    })
  }, [uploadFile])

  const remove = useCallback((id: string) => {
    const controller = abortRefs.current.get(id)
    if (controller) {
      controller.abort()
      abortRefs.current.delete(id)
    }
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== "done"))
  }, [])

  return { files, upload, retry, remove, clearCompleted }
}

export { useUpload, type UploadFile }
