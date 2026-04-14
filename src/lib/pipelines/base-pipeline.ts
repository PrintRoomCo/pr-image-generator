import { supabaseServer } from '@/lib/supabase-server'
import { uploadGeneratedImage, type StorageCategory } from '@/lib/storage'
import { removeBackground, isBackgroundRemovalEnabled } from '@/lib/ai/background-remover'
import type { JobType, GenerationJob, JobProgress } from '@/types/jobs'
import type { PipelineResult } from '@/types/pipeline-results'

export abstract class BasePipeline {
  abstract readonly jobType: JobType
  abstract readonly storageCategory: StorageCategory

  /**
   * Process a single product - implemented by each pipeline
   */
  abstract processProduct(
    productId: string,
    config: Record<string, unknown>
  ): Promise<PipelineResult>

  /**
   * Claim the next pending job for this pipeline type
   */
  async claimJob(): Promise<string | null> {
    const { data, error } = await supabaseServer.rpc('claim_next_generation_job', {
      p_job_type: this.jobType,
    })
    if (error) {
      console.error(`[${this.jobType}] Failed to claim job:`, error)
      return null
    }
    return data
  }

  /**
   * Update job progress
   */
  async updateProgress(jobId: string, progress: JobProgress): Promise<void> {
    const { error } = await supabaseServer.rpc('update_generation_progress', {
      p_job_id: jobId,
      p_completed: progress.completed,
      p_total: progress.total,
      p_current_product_id: progress.current_product_id || null,
      p_current_product_name: progress.current_product_name || null,
    })
    if (error) {
      console.error(`[${this.jobType}] Failed to update progress:`, error)
    }
  }

  /**
   * Complete a job with results
   */
  async completeJob(jobId: string, results: PipelineResult[], status: 'completed' | 'failed' = 'completed', errorMessage?: string): Promise<void> {
    const { error } = await supabaseServer.rpc('complete_generation_job', {
      p_job_id: jobId,
      p_results: results,
      p_status: status,
      p_error_message: errorMessage || null,
    })
    if (error) {
      console.error(`[${this.jobType}] Failed to complete job:`, error)
    }
  }

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<GenerationJob | null> {
    const { data, error } = await supabaseServer
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (error) return null
    return data as GenerationJob
  }

  /**
   * Fetch product details from the database
   */
  async getProduct(productId: string): Promise<{ id: string; name: string; category: string; description: string | null; brand_name: string | null } | null> {
    const { data, error } = await supabaseServer
      .from('products')
      .select('id, name, category, description, brand:brands!products_brand_id_fkey(name)')
      .eq('id', productId)
      .single()

    if (error || !data) return null

    const brand = Array.isArray(data.brand) ? data.brand[0] : data.brand
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      description: data.description,
      brand_name: brand?.name || null,
    }
  }

  /**
   * Upload generated image with optional background removal
   */
  async uploadImage(
    replicateUrl: string,
    entityId: string,
    filename: string,
    applyBgRemoval: boolean = true
  ): Promise<string> {
    let imageUrl = replicateUrl

    if (applyBgRemoval && isBackgroundRemovalEnabled()) {
      const bgResult = await removeBackground(replicateUrl)
      if (bgResult.success && bgResult.transparentUrl) {
        imageUrl = bgResult.transparentUrl
      } else {
        console.warn(`[${this.jobType}] Background removal failed, using original:`, bgResult.error)
      }
    }

    return uploadGeneratedImage(imageUrl, entityId, this.storageCategory, filename)
  }

  /**
   * Process the next pending job end-to-end
   */
  async processNextJob(): Promise<{ jobId: string; results: PipelineResult[] } | null> {
    const jobId = await this.claimJob()
    if (!jobId) return null

    const job = await this.getJob(jobId)
    if (!job) return null

    const results: PipelineResult[] = []
    const productIds = job.product_ids
    const config = job.config as Record<string, unknown>

    try {
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i]
        const product = await this.getProduct(productId)

        await this.updateProgress(jobId, {
          completed: i,
          total: productIds.length,
          current_product_id: productId,
          current_product_name: product?.name || 'Unknown',
        })

        try {
          const result = await this.processProduct(productId, config)
          results.push(result)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[${this.jobType}] Failed product ${productId}:`, errorMessage)
          results.push({
            itemId: productId,
            itemName: product?.name || 'Unknown',
            generatedItems: [],
            errors: [errorMessage],
          })
        }
      }

      const hasErrors = results.some(r => r.errors.length > 0)
      const allFailed = results.every(r => r.generatedItems.length === 0 && r.errors.length > 0)

      await this.completeJob(
        jobId,
        results,
        allFailed ? 'failed' : 'completed',
        hasErrors ? `${results.reduce((sum, r) => sum + r.errors.length, 0)} errors during generation` : undefined
      )

      return { jobId, results }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.completeJob(jobId, results, 'failed', errorMessage)
      throw error
    }
  }
}
