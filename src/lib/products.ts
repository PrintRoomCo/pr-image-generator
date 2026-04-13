import { supabaseServer } from './supabase-server'
import { validateImageUrlQuick } from './image-validation'
import type { ProductWithViews } from '@/types/products'
import type { ViewType } from '@/types/views'

const ALL_VIEWS: ViewType[] = ['front', 'back', 'left', 'right', 'label', 'neck']

export async function getProductsWithViews(): Promise<ProductWithViews[]> {
  // Fetch active products with design-tool tag
  const { data: products, error } = await supabaseServer
    .from('products')
    .select(`
      id,
      name,
      description,
      category,
      brand:brands(id, name)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)
  if (!products) return []

  // Fetch all product images
  const productIds = products.map(p => p.id)
  const { data: images } = await supabaseServer
    .from('product_images')
    .select('product_id, view, file_url')
    .in('product_id', productIds)

  const imagesByProduct = new Map<string, { view: string; file_url: string }[]>()
  for (const img of images || []) {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, [])
    }
    imagesByProduct.get(img.product_id)!.push(img)
  }

  return products.map(product => {
    const productImages = imagesByProduct.get(product.id) || []
    const validImages = productImages.filter(img => validateImageUrlQuick(img.file_url).isValid)

    const existingViews = validImages.map(img => img.view as ViewType)
    const frontImage = validImages.find(img => img.view === 'front')

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: Array.isArray(product.brand) ? product.brand[0] || null : product.brand,
      frontImageUrl: frontImage?.file_url || null,
      hasFrontImage: !!frontImage,
      existingViews,
      missingViews: ALL_VIEWS.filter(v => !existingViews.includes(v)),
    }
  })
}
