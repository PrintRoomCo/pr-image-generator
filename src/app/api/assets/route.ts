import { NextRequest, NextResponse } from 'next/server'
import { backfillRecentEcommerceAssets, listGeneratedAssets } from '@/lib/generated-assets'
import { GENERATED_ASSET_STATUSES, type GeneratedAssetStatus } from '@/types/assets'

export const dynamic = 'force-dynamic'

function isGeneratedAssetStatus(value: string | null): value is GeneratedAssetStatus {
  return GENERATED_ASSET_STATUSES.includes(value as GeneratedAssetStatus)
}

export async function GET(request: NextRequest) {
  try {
    await backfillRecentEcommerceAssets()

    const { searchParams } = new URL(request.url)
    const workflowType = searchParams.get('workflowType')
    const status = searchParams.get('status')
    const destinationTag = searchParams.get('destinationTag')
    const search = searchParams.get('search')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '48', 10)

    const assets = await listGeneratedAssets({
      workflowType,
      status: isGeneratedAssetStatus(status) ? status : undefined,
      destinationTag,
      search,
      userId,
      limit,
    })

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('[GET /api/assets] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
