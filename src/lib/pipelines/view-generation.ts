import { getReplicate, NANO_BANANA_PRO_MODEL } from '@/lib/ai/replicate-client'
import { supabaseServer } from '@/lib/supabase-server'
import { BasePipeline } from './base-pipeline'
import {
  buildViewPrompt,
  getReferenceImageUrl,
  isJacketCategory,
  NEGATIVE_PROMPT,
  JACKET_NEGATIVE_PROMPT,
} from '@/lib/prompts/view-prompts'
import type { ViewType } from '@/types/views'
import type { JobType } from '@/types/jobs'
import type { StorageCategory } from '@/lib/storage'
import type { PipelineResult } from '@/types/pipeline-results'

export class ViewGenerationPipeline extends BasePipeline {
  readonly jobType: JobType = 'view'
  readonly storageCategory: StorageCategory = 'design-tool-assets'

  async processProduct(productId: string, config: Record<string, unknown>): Promise<PipelineResult> {
    const product = await this.getProduct(productId)
    if (!product) throw new Error(`Product ${productId} not found`)

    const views = (config.views || ['left', 'right', 'back']) as ViewType[]
    const result: PipelineResult = {
      itemId: productId,
      itemName: product.name,
      generatedItems: [],
      errors: [],
    }

    for (const view of views) {
      try {
        const replicateUrl = await this.generateView(product.category, view, {
          brand: product.brand_name || undefined,
          productDescription: product.description || undefined,
        })

        const storageUrl = await this.uploadImage(replicateUrl, productId, view)

        // Upsert into product_images table (shared with design-tool)
        const { data: record, error } = await supabaseServer
          .from('product_images')
          .upsert(
            {
              product_id: productId,
              view,
              file_url: storageUrl,
              position: this.getViewPosition(view),
              alt_text: `${product.name} - ${view} view`,
              dpi: 300,
            },
            { onConflict: 'product_id,view' }
          )
          .select('id')
          .single()

        if (error) throw new Error(`Failed to save product_image: ${error.message}`)

        result.generatedItems.push({
          type: view,
          replicateOutputUrl: replicateUrl,
          storageUrl,
          recordId: record?.id || '',
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`[view-generation] Failed ${view} for ${productId}:`, msg)
        result.errors.push(`${view}: ${msg}`)
      }
    }

    return result
  }

  private async generateView(
    category: string,
    view: ViewType,
    options?: { brand?: string; productDescription?: string }
  ): Promise<string> {
    const prompt = buildViewPrompt(category, view, options)
    const referenceImageUrl = getReferenceImageUrl(category, view)

    if (!referenceImageUrl) {
      throw new Error('Reference images not configured. Ensure NEXT_PUBLIC_SUPABASE_URL is set.')
    }

    const isJacket = isJacketCategory(category)
    const negativePrompt = isJacket ? JACKET_NEGATIVE_PROMPT : NEGATIVE_PROMPT

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const replicate = getReplicate()
        const output = await replicate.run(NANO_BANANA_PRO_MODEL, {
          input: {
            prompt: `${prompt}\n\nIMPORTANT: Match the exact professional flat lay photography style of the reference image. Generate a ${category} ${view} view with the same lighting, shadow style, white background, and premium e-commerce quality.${isJacket ? ' CRITICAL: This is a JACKET without a hood - DO NOT add a hood.' : ''} ${negativePrompt}`,
            image_input: [referenceImageUrl],
            aspect_ratio: '1:1',
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
          throw new Error('Unexpected output format from Nano Banana Pro')
        }

        return outputUrl
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`[view-generation] Attempt ${attempt}/${maxRetries} failed:`, error)

        const errorMessage = lastError.message || ''
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          const retryMatch = errorMessage.match(/retry_after[:\s]+(\d+)/i)
          const waitTime = retryMatch ? parseInt(retryMatch[1], 10) * 1000 : 10000
          await new Promise(resolve => setTimeout(resolve, waitTime))
        } else if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }

    throw lastError || new Error('Failed to generate view after retries')
  }

  private getViewPosition(view: ViewType): number {
    const positions: Record<ViewType, number> = {
      front: 0,
      back: 1,
      left: 2,
      right: 3,
      label: 4,
      neck: 5,
    }
    return positions[view] ?? 0
  }
}

export const viewGenerationPipeline = new ViewGenerationPipeline()
