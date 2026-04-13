import { getReplicate, NANO_BANANA_PRO_MODEL } from '@/lib/ai/replicate-client'
import { supabaseServer } from '@/lib/supabase-server'
import { BasePipeline, type PipelineResult } from './base-pipeline'
import { buildEcommercePrompt, ECOMMERCE_NEGATIVE_PROMPT } from '@/lib/prompts/ecommerce-prompts'
import type { EcommerceImageType } from '@/types/ecommerce'
import type { JobType } from '@/types/jobs'
import type { StorageCategory } from '@/lib/storage'

export class EcommerceImagesPipeline extends BasePipeline {
  readonly jobType: JobType = 'ecommerce'
  readonly storageCategory: StorageCategory = 'ecommerce'

  async processProduct(productId: string, config: Record<string, unknown>): Promise<PipelineResult> {
    const product = await this.getProduct(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const imageTypes = (config.imageTypes || ['lifestyle', 'white-background']) as EcommerceImageType[]
    const result: PipelineResult = {
      productId,
      productName: product.name,
      generatedItems: [],
      errors: [],
    }

    for (const imageType of imageTypes) {
      try {
        const replicateUrl = await this.generateEcommerceImage(imageType, {
          category: product.category,
          brand: product.brand_name || undefined,
          productDescription: product.description || undefined,
        })

        // Background removal only for white-background type
        const applyBgRemoval = imageType === 'white-background'
        const storageUrl = await this.uploadImage(replicateUrl, productId, imageType, applyBgRemoval)

        // Insert into ecommerce_images table
        const { data: record, error } = await supabaseServer
          .from('generated_ecommerce_images')
          .insert({
            product_id: productId,
            image_type: imageType,
            file_url: storageUrl,
            metadata: {
              model: NANO_BANANA_PRO_MODEL,
              category: product.category,
              brand: product.brand_name,
            },
          })
          .select('id')
          .single()

        if (error) throw new Error(`Failed to save ecommerce_image: ${error.message}`)

        result.generatedItems.push({
          type: imageType,
          replicateOutputUrl: replicateUrl,
          storageUrl,
          recordId: record?.id || '',
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`[ecommerce] Failed ${imageType} for ${productId}:`, msg)
        result.errors.push(`${imageType}: ${msg}`)
      }
    }

    return result
  }

  private async generateEcommerceImage(
    imageType: EcommerceImageType,
    options: { category: string; brand?: string; productDescription?: string }
  ): Promise<string> {
    const prompt = buildEcommercePrompt(imageType, options)

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const replicate = getReplicate()
        const aspectRatio = imageType === 'hero' ? '16:9' : '1:1'

        const output = await replicate.run(NANO_BANANA_PRO_MODEL, {
          input: {
            prompt: `${prompt}\n\n${ECOMMERCE_NEGATIVE_PROMPT}`,
            aspect_ratio: aspectRatio,
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
        console.error(`[ecommerce] Attempt ${attempt}/${maxRetries} failed:`, error)

        if (lastError.message.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        } else if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    throw lastError || new Error('Failed to generate ecommerce image after retries')
  }
}

export const ecommerceImagesPipeline = new EcommerceImagesPipeline()
