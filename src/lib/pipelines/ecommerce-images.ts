import { getReplicate, NANO_BANANA_PRO_MODEL } from '@/lib/ai/replicate-client'
import { BasePipeline } from './base-pipeline'
import { buildEcommercePrompt, ECOMMERCE_NEGATIVE_PROMPT } from '@/lib/prompts/ecommerce-prompts'
import {
  isEcommerceGenerationConfig,
  type EcommerceGenerationConfig,
  type EcommerceImageType,
  type EcommerceInputItem,
} from '@/types/ecommerce'
import type { JobType } from '@/types/jobs'
import type { StorageCategory } from '@/lib/storage'
import type { PipelineResult } from '@/types/pipeline-results'
import { nanoid } from 'nanoid'

export class EcommerceImagesPipeline extends BasePipeline {
  readonly jobType: JobType = 'ecommerce'
  readonly storageCategory: StorageCategory = 'ecommerce'

  async processProduct(productId: string, config: Record<string, unknown>): Promise<PipelineResult> {
    throw new Error(`Upload-backed ecommerce jobs do not use catalog product ${productId}: ${JSON.stringify(config)}`)
  }

  override async processNextJob(): Promise<{ jobId: string; results: PipelineResult[] } | null> {
    const jobId = await this.claimJob()
    if (!jobId) return null

    const job = await this.getJob(jobId)
    if (!job) return null

    const config = job.config
    if (!isEcommerceGenerationConfig(config)) {
      const errorMessage = 'Invalid ecommerce job config'
      await this.completeJob(jobId, [], 'failed', errorMessage)
      throw new Error(errorMessage)
    }

    const results: PipelineResult[] = []

    try {
      for (let i = 0; i < config.inputs.length; i++) {
        const input = config.inputs[i]

        await this.updateProgress(jobId, {
          completed: i,
          total: config.inputs.length,
          current_product_id: input.id,
          current_product_name: input.label,
        })

        try {
          results.push(await this.processInput(input, config))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[ecommerce] Failed input ${input.id}:`, errorMessage)
          results.push({
            itemId: input.id,
            itemName: input.label,
            generatedItems: [],
            errors: [errorMessage],
            sourceImages: input.sources.map(source => ({
              id: source.id,
              url: source.storageUrl,
              name: source.originalFilename,
              isPrimary: source.id === input.primarySourceId,
            })),
            prompt: config.prompt,
            mode: config.mode,
          })
        }
      }

      const hasErrors = results.some(result => result.errors.length > 0)
      const allFailed = results.every(result => result.generatedItems.length === 0 && result.errors.length > 0)

      await this.completeJob(
        jobId,
        results,
        allFailed ? 'failed' : 'completed',
        hasErrors ? `${results.reduce((sum, result) => sum + result.errors.length, 0)} errors during generation` : undefined
      )

      return { jobId, results }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.completeJob(jobId, results, 'failed', errorMessage)
      throw error
    }
  }

  private async processInput(input: EcommerceInputItem, config: EcommerceGenerationConfig): Promise<PipelineResult> {
    const result: PipelineResult = {
      itemId: input.id,
      itemName: input.label,
      generatedItems: [],
      errors: [],
      sourceImages: input.sources.map(source => ({
        id: source.id,
        url: source.storageUrl,
        name: source.originalFilename,
        isPrimary: source.id === input.primarySourceId,
      })),
      prompt: config.prompt,
      mode: config.mode,
    }

    const orderedSources = [...input.sources].sort((left, right) => {
      if (left.id === input.primarySourceId) return -1
      if (right.id === input.primarySourceId) return 1
      return 0
    })

    for (const imageType of config.imageTypes) {
      try {
        const replicateUrl = await this.generateEcommerceImage(imageType, input, config.prompt, orderedSources.map(source => source.storageUrl))
        const applyBgRemoval = imageType === 'white-background'
        const storageUrl = await this.uploadImage(replicateUrl, input.id, imageType, applyBgRemoval)

        result.generatedItems.push({
          type: imageType,
          replicateOutputUrl: replicateUrl,
          storageUrl,
          recordId: nanoid(),
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`[ecommerce] Failed ${imageType} for ${input.id}:`, msg)
        result.errors.push(`${imageType}: ${msg}`)
      }
    }

    return result
  }

  private async generateEcommerceImage(
    imageType: EcommerceImageType,
    input: EcommerceInputItem,
    userPrompt: string,
    sourceUrls: string[]
  ): Promise<string> {
    const prompt = buildEcommercePrompt(imageType, {
      inputLabel: input.label,
      prompt: userPrompt,
      referenceCount: sourceUrls.length,
    })

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const replicate = getReplicate()
        const aspectRatio = imageType === 'hero' ? '16:9' : '1:1'

        const output = await replicate.run(NANO_BANANA_PRO_MODEL, {
          input: {
            prompt: `${prompt}\n\n${ECOMMERCE_NEGATIVE_PROMPT}`,
            image_input: sourceUrls,
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
