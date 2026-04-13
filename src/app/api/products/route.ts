import { NextResponse } from 'next/server'
import { getProductsWithViews } from '@/lib/products'

export async function GET() {
  try {
    const products = await getProductsWithViews()
    return NextResponse.json(products)
  } catch (error) {
    console.error('[GET /api/products] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
