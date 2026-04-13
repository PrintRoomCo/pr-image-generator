import Replicate from 'replicate'

let _replicate: Replicate | null = null

export function getReplicate(): Replicate {
  if (!_replicate) {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN is required')
    }
    _replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  }
  return _replicate
}

export const NANO_BANANA_PRO_MODEL = 'google/nano-banana-pro'
export const REMOVE_BG_MODEL = 'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1'

export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN
}

export function estimateCost(
  numImages: number,
  includeBackgroundRemoval: boolean = true
): { low: number; high: number } {
  const generationCost = { low: numImages * 0.02, high: numImages * 0.04 }
  const bgCost = includeBackgroundRemoval ? numImages * 0.003 : 0
  return {
    low: generationCost.low + bgCost,
    high: generationCost.high + bgCost,
  }
}
