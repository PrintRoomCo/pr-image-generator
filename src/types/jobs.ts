import type { ViewType } from './views'
import type { EcommerceImageType } from './ecommerce'
import type { TechpackAssetType } from './techpacks'

export type JobType = 'view' | 'ecommerce' | 'techpack'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type JobConfig =
  | { views: ViewType[] }
  | { imageTypes: EcommerceImageType[] }
  | { assetTypes: TechpackAssetType[] }

export interface JobProgress {
  completed: number
  total: number
  current_product_id?: string
  current_product_name?: string
}

export interface GenerationJob {
  id: string
  job_type: JobType
  product_ids: string[]
  config: JobConfig
  status: JobStatus
  progress: JobProgress
  results: unknown[]
  error_message?: string
  source: string
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export interface CreateJobRequest {
  jobType: JobType
  productIds: string[]
  config: JobConfig
}
