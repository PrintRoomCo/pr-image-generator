import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { isReplicateConfigured, estimateCost } from '@/lib/ai/replicate-client'
import { normalizeGenerationJob, normalizeGenerationJobs } from '@/types/jobs'
import type { CreateJobRequest, JobType } from '@/types/jobs'
import { getEcommerceInputCount, getEcommerceTotalImages, isEcommerceGenerationConfig } from '@/types/ecommerce'

export async function POST(request: NextRequest) {
  try {
    if (!isReplicateConfigured()) {
      return NextResponse.json({ error: 'Replicate API not configured' }, { status: 500 })
    }

    const body: CreateJobRequest = await request.json()
    const { jobType, config } = body

    if (!jobType || !config) {
      return NextResponse.json({ error: 'Missing required fields: jobType, config' }, { status: 400 })
    }

    let totalImages = 0
    let totalUnits = 0
    let productIds: string[] = 'productIds' in body && Array.isArray(body.productIds) ? body.productIds : []

    if (jobType === 'ecommerce') {
      if (!isEcommerceGenerationConfig(config) || config.inputs.length === 0 || config.imageTypes.length === 0 || !config.prompt.trim()) {
        return NextResponse.json({ error: 'Invalid ecommerce job config' }, { status: 400 })
      }

      productIds = productIds.length > 0 ? productIds : config.inputs.map(input => input.id)
      totalUnits = getEcommerceInputCount(config)
      totalImages = getEcommerceTotalImages(config)
    } else {
      if (!productIds.length) {
        return NextResponse.json({ error: 'Missing required field: productIds' }, { status: 400 })
      }

      totalUnits = productIds.length
      if ('views' in config) totalImages = productIds.length * config.views.length
      else if ('assetTypes' in config) totalImages = productIds.length * config.assetTypes.length
      else return NextResponse.json({ error: 'Invalid job config' }, { status: 400 })
    }

    const userId = request.headers.get('X-Staff-User-Id')
    const userEmail = request.headers.get('X-Staff-User-Email')
    const userDisplayName = request.headers.get('X-Staff-User-Name')
    const sourcePortal = request.headers.get('X-Source-Portal') || 'standalone'

    const { data: job, error } = await supabaseServer
      .from('generation_jobs')
      .insert({
        job_type: jobType,
        product_ids: productIds,
        config,
        status: 'pending',
        progress: { completed: 0, total: totalUnits },
        user_id: userId,
        user_email: userEmail,
        user_display_name: userDisplayName,
        source_portal: sourcePortal,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Failed to create job: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      job: normalizeGenerationJob(job),
      totalImages,
      costEstimate: estimateCost(totalImages, jobType === 'view'),
    })
  } catch (error) {
    console.error('[POST /api/jobs] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobType = searchParams.get('jobType') as JobType | null
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    let query = supabaseServer
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (jobType) query = query.eq('job_type', jobType)
    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(normalizeGenerationJobs(jobs || []))
  } catch (error) {
    console.error('[GET /api/jobs] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
