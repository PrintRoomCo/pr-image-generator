import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import type { CreateJobRequest } from '@/types/jobs'

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.API_SHARED_SECRET

    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateJobRequest & { callbackUrl?: string } = await request.json()
    const { jobType, productIds, config } = body

    if (!jobType || !productIds?.length || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: job, error } = await supabaseServer
      .from('generation_jobs')
      .insert({
        job_type: jobType,
        product_ids: productIds,
        config,
        status: 'pending',
        progress: { completed: 0, total: productIds.length },
        source: 'design-tool-webhook',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: `Failed to create job: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({
      job,
      message: 'Job created. Poll GET /api/jobs/{jobId} for status.',
    })
  } catch (error) {
    console.error('[POST /api/webhooks] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
