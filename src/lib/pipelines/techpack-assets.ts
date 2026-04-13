import { getReplicate, NANO_BANANA_PRO_MODEL } from '@/lib/ai/replicate-client'
import { supabaseServer } from '@/lib/supabase-server'
import { BasePipeline, type PipelineResult } from './base-pipeline'
import { buildTechpackPrompt, TECHPACK_NEGATIVE_PROMPT } from '@/lib/prompts/techpack-prompts'
import type { TechpackAssetType } from '@/types/techpacks'
import type { JobType } from '@/types/jobs'
import type { StorageCategory } from '@/lib/storage'

export class TechpackAssetsPipeline extends BasePipeline {
  readonly jobType: JobType = 'techpack'
  readonly storageCategory: StorageCategory = 'techpacks'

  async processProduct(productId: string, config: Record<string, unknown>): Promise<PipelineResult> {
    const product = await this.getProduct(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const assetTypes = (config.assetTypes || ['flat-drawing', 'measurement-diagram']) as TechpackAssetType[]
    const result: PipelineResult = {
      productId,
      productName: product.name,
      generatedItems: [],
      errors: [],
    }

    for (const assetType of assetTypes) {
      try {
        const replicateUrl = await this.generateTechpackAsset(assetType, {
          category: product.category,
          brand: product.brand_name || undefined,
          productDescription: product.description || undefined,
        })

        // No background removal for tech pack assets (they're line drawings on white)
        const storageUrl = await this.uploadImage(replicateUrl, productId, assetType, false)

        // Insert into techpack_assets table
        const { data: record, error } = await supabaseServer
          .from('techpack_assets')
          .insert({
            product_id: productId,
            asset_type: assetType,
            file_url: storageUrl,
            metadata: {
              model: NANO_BANANA_PRO_MODEL,
              category: product.category,
              brand: product.brand_name,
            },
          })
          .select('id')
          .single()

        if (error) throw new Error(`Failed to save techpack_asset: ${error.message}`)

        result.generatedItems.push({
          type: assetType,
          replicateOutputUrl: replicateUrl,
          storageUrl,
          recordId: record?.id || '',
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`[techpack] Failed ${assetType} for ${productId}:`, msg)
        result.errors.push(`${assetType}: ${msg}`)
      }
    }

    return result
  }

  private async generateTechpackAsset(
    assetType: TechpackAssetType,
    options: { category: string; brand?: string; productDescription?: string }
  ): Promise<string> {
    const prompt = buildTechpackPrompt(assetType, options)

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const replicate = getReplicate()
        const output = await replicate.run(NANO_BANANA_PRO_MODEL, {
          input: {
            prompt: `${prompt}\n\n${TECHPACK_NEGATIVE_PROMPT}`,
            aspect_ratio: assetType === 'flat-drawing' ? '3:4' : '1:1',
            resolution: '2K',
            output_format: 'png',
            safety_filter_level: 'block_only_high',
          },
        })

        let outputUrl: string
        if (output && typeof output === 'object' && 'url' in output) {
          outputUrl = (output as { url: () => string }).url()
        } else if (typeof output === 'string') {
          outputUrl = output
        } else {
          throw new Error('Unexpected output format')
        }

        return outputUrl
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`[techpack] Attempt ${attempt}/${maxRetries} failed:`, error)

        if (lastError.message.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        } else if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    throw lastError || new Error('Failed to generate techpack asset after retries')
  }
}

export const techpackAssetsPipeline = new TechpackAssetsPipeline()
