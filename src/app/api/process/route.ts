import { NextRequest, NextResponse } from 'next/server'
import { viewGenerationPipeline } from '@/lib/pipelines/view-generation'
import { ecommerceImagesPipeline } from '@/lib/pipelines/ecommerce-images'
import { techpackAssetsPipeline } from '@/lib/pipelines/techpack-assets'
import type { JobType } from '@/types/jobs'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobType = searchParams.get('jobType') as JobType | null

    const pipeline = jobType === 'ecommerce'
      ? ecommerceImagesPipeline
      : jobType === 'techpack'
        ? techpackAssetsPipeline
        : viewGenerationPipeline

    const result = await pipeline.processNextJob()

    if (!result) {
      return NextResponse.json({ message: 'No pending jobs' }, { status: 200 })
    }

    return NextResponse.json({
      jobId: result.jobId,
      results: result.results,
      totalGenerated: result.results.reduce((sum, r) => sum + r.generatedItems.length, 0),
      totalErrors: result.results.reduce((sum, r) => sum + r.errors.length, 0),
    })
  } catch (error) {
    console.error('[POST /api/process] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
