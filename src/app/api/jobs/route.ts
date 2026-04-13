import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { isReplicateConfigured, estimateCost } from '@/lib/ai/replicate-client'
import type { CreateJobRequest, JobType } from '@/types/jobs'

export async function POST(request: NextRequest) {
  try {
    if (!isReplicateConfigured()) {
      return NextResponse.json({ error: 'Replicate API not configured' }, { status: 500 })
    }

    const body: CreateJobRequest = await request.json()
    const { jobType, productIds, config } = body

    if (!jobType || !productIds?.length || !config) {
      return NextResponse.json({ error: 'Missing required fields: jobType, productIds, config' }, { status: 400 })
    }

    // Calculate total images for cost estimate
    let totalImages = 0
    if ('views' in config) totalImages = productIds.length * config.views.length
    else if ('imageTypes' in config) totalImages = productIds.length * config.imageTypes.length
    else if ('assetTypes' in config) totalImages = productIds.length * config.assetTypes.length

    const { data: job, error } = await supabaseServer
      .from('generation_jobs')
      .insert({
        job_type: jobType,
        product_ids: productIds,
        config,
        status: 'pending',
        progress: { completed: 0, total: productIds.length },
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Failed to create job: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      job,
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
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    let query = supabaseServer
      .from('generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (jobType) query = query.eq('job_type', jobType)
    if (status) query = query.eq('status', status)

    const { data: jobs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('[GET /api/jobs] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
