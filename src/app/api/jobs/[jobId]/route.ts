import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { normalizeGenerationJob } from '@/types/jobs'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { data: job, error } = await supabaseServer
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(normalizeGenerationJob(job))
  } catch (error) {
    console.error('[GET /api/jobs/[jobId]] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { data: job } = await supabaseServer
      .from('generation_jobs')
      .select('status')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status === 'processing') {
      // Mark as failed instead of deleting
      await supabaseServer
        .from('generation_jobs')
        .update({ status: 'failed', error_message: 'Cancelled by user', completed_at: new Date().toISOString() })
        .eq('id', jobId)
    } else {
      await supabaseServer
        .from('generation_jobs')
        .delete()
        .eq('id', jobId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/jobs/[jobId]] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
