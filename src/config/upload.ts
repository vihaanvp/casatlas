export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50 MB
  allowedTypes: {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm"],
    document: ["application/pdf"],
  },
  thumbnailSize: { width: 300, height: 300 },
  thumbnailFormat: "webp" as const,
} as const
