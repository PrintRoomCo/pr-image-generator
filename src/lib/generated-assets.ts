import { supabaseServer } from '@/lib/supabase-server'
import {
  getEcommerceBriefSummary,
  getEcommerceDestinationTags,
  getEcommercePresetKey,
  getEcommerceWorkflowType,
  isEcommerceGenerationConfig,
  type EcommerceGenerationConfig,
} from '@/types/ecommerce'
import { normalizeGenerationJobs, type GenerationJob } from '@/types/jobs'
import type { PipelineGeneratedItem, PipelineResult } from '@/types/pipeline-results'
import {
  GENERATED_ASSET_STATUSES,
  normalizeGeneratedAsset,
  normalizeGeneratedAssets,
  type GeneratedAssetStatus,
  type GeneratedImageAsset,
} from '@/types/assets'

interface UpsertGeneratedAssetInput {
  job: GenerationJob
  config: EcommerceGenerationConfig
  result: PipelineResult
  item: PipelineGeneratedItem
}

interface AssetListFilters {
  workflowType?: string | null
  status?: GeneratedAssetStatus | null
  destinationTag?: string | null
  search?: string | null
  userId?: string | null
  limit?: number
}

function isGeneratedAssetStatus(value: string | null | undefined): value is GeneratedAssetStatus {
  return GENERATED_ASSET_STATUSES.includes(value as GeneratedAssetStatus)
}

export async function upsertGeneratedAsset({
  job,
  config,
  result,
  item,
}: UpsertGeneratedAssetInput): Promise<GeneratedImageAsset> {
  const { data: existingAsset } = await supabaseServer
    .from('generated_image_assets')
    .select('id, status')
    .eq('source_record_id', item.recordId)
    .maybeSingle()

  const payload = {
    id: existingAsset?.id,
    source_record_id: item.recordId,
    job_id: job.id,
    job_type: job.job_type,
    source_item_id: result.itemId,
    source_item_name: result.itemName,
    product_label: result.itemName,
    asset_type: item.type,
    workflow_type: getEcommerceWorkflowType(config),
    preset_key: getEcommercePresetKey(config) || null,
    destination_tags: getEcommerceDestinationTags(config),
    status: isGeneratedAssetStatus(existingAsset?.status) ? existingAsset.status : 'generated',
    storage_url: item.storageUrl,
    replicate_output_url: item.replicateOutputUrl || null,
    brief_summary: getEcommerceBriefSummary(config),
    source_portal: job.source_portal || 'standalone',
    user_id: job.user_id || null,
    user_email: job.user_email || null,
    user_display_name: job.user_display_name || null,
    metadata: {
      prompt: config.prompt,
      mode: config.mode,
      brief: config.brief || null,
      sourceImages: result.sourceImages || [],
    },
  }

  const { data, error } = await supabaseServer
    .from('generated_image_assets')
    .upsert(payload, { onConflict: 'source_record_id' })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to upsert generated asset: ${error.message}`)
  }

  const asset = normalizeGeneratedAsset(data)
  if (!asset) {
    throw new Error('Failed to normalize generated asset')
  }

  return asset
}

export async function backfillRecentEcommerceAssets(limit = 50): Promise<void> {
  const { data, error } = await supabaseServer
    .from('generation_jobs')
    .select('*')
    .eq('job_type', 'ecommerce')
    .in('status', ['completed', 'failed'])
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) {
    return
  }

  const jobs = normalizeGenerationJobs(data as GenerationJob[])

  for (const job of jobs) {
    if (!isEcommerceGenerationConfig(job.config)) continue

    const results = job.results as PipelineResult[]
    for (const result of results) {
      for (const item of result.generatedItems || []) {
        if (!item.recordId || !item.storageUrl) continue
        try {
          await upsertGeneratedAsset({
            job,
            config: job.config,
            result,
            item,
          })
        } catch {
          // Keep asset backfill best-effort so library reads still work.
        }
      }
    }
  }
}

export async function listGeneratedAssets(filters: AssetListFilters = {}): Promise<GeneratedImageAsset[]> {
  const limit = Math.min(Math.max(filters.limit || 48, 1), 200)

  let query = supabaseServer
    .from('generated_image_assets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters.workflowType) {
    query = query.eq('workflow_type', filters.workflowType)
  }

  if (filters.status && isGeneratedAssetStatus(filters.status)) {
    query = query.eq('status', filters.status)
  }

  if (filters.destinationTag) {
    query = query.contains('destination_tags', [filters.destinationTag])
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[,%_()]/g, '')
    query = query.or(
      `product_label.ilike.%${escaped}%,source_item_name.ilike.%${escaped}%,brief_summary.ilike.%${escaped}%`
    )
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to fetch generated assets: ${error.message}`)
  }

  return normalizeGeneratedAssets(data)
}

export async function getGeneratedAsset(assetId: string): Promise<GeneratedImageAsset | null> {
  const { data, error } = await supabaseServer
    .from('generated_image_assets')
    .select('*')
    .eq('id', assetId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return normalizeGeneratedAsset(data)
}

export async function updateGeneratedAssetStatus(
  assetId: string,
  status: GeneratedAssetStatus
): Promise<GeneratedImageAsset> {
  const { data, error } = await supabaseServer
    .from('generated_image_assets')
    .update({ status })
    .eq('id', assetId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update asset status: ${error.message}`)
  }

  const asset = normalizeGeneratedAsset(data)
  if (!asset) {
    throw new Error('Failed to normalize updated asset')
  }

  return asset
}
