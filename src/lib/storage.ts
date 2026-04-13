import { supabaseServer } from './supabase-server'
import { nanoid } from 'nanoid'

const BUCKET = 'generated-images'

export type StorageCategory = 'design-tool-assets' | 'ecommerce' | 'techpacks'

/**
 * Upload an image from a URL to Supabase Storage in the generated-images bucket.
 * Downloads the image first, then uploads as PNG.
 */
export async function uploadGeneratedImage(
  imageUrl: string,
  productId: string,
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
  const storagePath = `${category}/${productId}/${filename}-${timestamp}-${uniqueId}.png`

  const { error } = await supabaseServer.storage
    .from(BUCKET)
    .upload(storagePath, imageBuffer, {
      contentType: 'image/png',
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabaseServer.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  return urlData.publicUrl
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
