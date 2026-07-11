import { writeFile, readFile, unlink, mkdir } from "fs/promises"
import { join, dirname } from "path"
import type { StorageProvider, FileMetadata, StorageResult } from "./storage.provider"

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads"

export class LocalStorageProvider implements StorageProvider {
  private baseDir = UPLOAD_DIR

  async put(key: string, data: Buffer, metadata: FileMetadata): Promise<StorageResult> {
    const filePath = join(this.baseDir, key)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, data)

    return {
      key,
      url: `/api/files/${key}`,
      size: metadata.size,
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const filePath = join(this.baseDir, key)
      return await readFile(filePath)
    } catch {
      return null
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.baseDir, key)
    await unlink(filePath)
  }

  getUrl(key: string): string {
    return `/api/files/${key}`
  }
}

// Singleton
export const storage = new LocalStorageProvider()
