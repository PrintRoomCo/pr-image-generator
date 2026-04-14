import { supabaseServer } from './supabase-server'
import { nanoid } from 'nanoid'

const BUCKET = 'generated-images'

export type StorageCategory = 'design-tool-assets' | 'ecommerce' | 'ecommerce-source' | 'techpacks'

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().toLowerCase()
  return trimmed.replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-')
}

async function uploadBuffer(
  buffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<string> {
  const { error } = await supabaseServer.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  const { data: urlData } = supabaseServer.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}

/**
 * Upload an image from a URL to Supabase Storage in the generated-images bucket.
 * Downloads the image first, then uploads as PNG.
 */
export async function uploadGeneratedImage(
  imageUrl: string,
  entityId: string,
  category: StorageCategory,
  filename: string
): Promise<string> {
  // Download image from Replicate
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`)
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer())
  const timestamp = Date.now()
  const uniqueId = nanoid(8)
  const storagePath = `${category}/${entityId}/${filename}-${timestamp}-${uniqueId}.png`

  return uploadBuffer(imageBuffer, storagePath, 'image/png')
}

export async function uploadSourceImage(
  file: File,
  clientId: string
): Promise<{
  id: string
  clientId: string
  originalFilename: string
  storageUrl: string
  storagePath: string
  mimeType: string
  sizeBytes: number
}> {
  const sourceId = crypto.randomUUID()
  const safeFilename = sanitizeFilename(file.name || `upload-${sourceId}.png`)
  const storagePath = `ecommerce-source/${clientId}/${sourceId}-${safeFilename}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const mimeType = file.type || 'application/octet-stream'
  const storageUrl = await uploadBuffer(fileBuffer, storagePath, mimeType)

  return {
    id: sourceId,
    clientId,
    originalFilename: file.name || safeFilename,
    storageUrl,
    storagePath,
    mimeType,
    sizeBytes: file.size,
  }
}

/**
 * Get the public URL for a storage path
 */
export function getStoragePublicUrl(path: string): string {
  const { data } = supabaseServer.storage
    .from(BUCKET)
    .getPublicUrl(path)
  return data.publicUrl
}
