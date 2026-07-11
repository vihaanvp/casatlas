export interface FileMetadata {
  contentType: string
  size: number
  filename: string
}

export interface StorageResult {
  key: string
  url: string
  size: number
}

export interface StorageProvider {
  put(key: string, data: Buffer, metadata: FileMetadata): Promise<StorageResult>
  get(key: string): Promise<Buffer | null>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}
