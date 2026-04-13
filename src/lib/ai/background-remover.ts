import { getReplicate, REMOVE_BG_MODEL } from './replicate-client'

export interface BackgroundRemovalResult {
  success: boolean
  transparentUrl: string | null
  error: string | null
}

export async function removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
  if (!process.env.REPLICATE_API_TOKEN) {
    return { success: false, transparentUrl: null, error: 'REPLICATE_API_TOKEN not configured' }
  }

  try {
    const replicate = getReplicate()
    const output = await replicate.run(REMOVE_BG_MODEL, { input: { image: imageUrl } })

    let transparentUrl: string | null = null

    if (typeof output === 'string') {
      transparentUrl = output
    } else if (output && typeof output === 'object') {
      if ('url' in output && typeof (output as { url: () => string }).url === 'function') {
        transparentUrl = (output as { url: () => string }).url()
      } else if ('url' in output && typeof (output as { url: string }).url === 'string') {
        transparentUrl = (output as { url: string }).url
      } else if (Array.isArray(output) && output.length > 0) {
        transparentUrl = typeof output[0] === 'string' ? output[0] : null
      }
    }

    if (!transparentUrl) {
      return { success: false, transparentUrl: null, error: 'Could not extract URL from model output' }
    }

    return { success: true, transparentUrl, error: null }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[background-remover] Failed:', errorMessage)
    return { success: false, transparentUrl: null, error: errorMessage }
  }
}

export async function removeBackgroundBatch(imageUrls: string[]): Promise<BackgroundRemovalResult[]> {
  return Promise.all(imageUrls.map(removeBackground))
}

export function isBackgroundRemovalEnabled(): boolean {
  return process.env.ENABLE_BACKGROUND_REMOVAL !== 'false'
}
