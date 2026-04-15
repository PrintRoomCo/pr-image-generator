import { NextRequest, NextResponse } from 'next/server'
import { getGeneratedAsset, updateGeneratedAssetStatus } from '@/lib/generated-assets'
import { GENERATED_ASSET_STATUSES, type GeneratedAssetStatus } from '@/types/assets'

export const dynamic = 'force-dynamic'

function isGeneratedAssetStatus(value: string | null): value is GeneratedAssetStatus {
  return GENERATED_ASSET_STATUSES.includes(value as GeneratedAssetStatus)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params
    const asset = await getGeneratedAsset(assetId)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    console.error('[GET /api/assets/[assetId]] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params
    const body = await request.json().catch(() => ({}))
    const status = typeof body.status === 'string' ? body.status : null

    if (!isGeneratedAssetStatus(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const asset = await updateGeneratedAssetStatus(assetId, status)
    return NextResponse.json({ asset })
  } catch (error) {
    console.error('[PATCH /api/assets/[assetId]] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
