export type ValidationResult = {
  isValid: boolean
  url: string
  reason?: string
  category?: 'placeholder' | 'empty' | 'invalid-format' | 'storage-missing' | 'network-error'
}

export type ValidationCache = Map<string, ValidationResult & { timestamp: number }>

const validationCache: ValidationCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export function isPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return true
  const placeholderPatterns = ['/api/placeholder', 'placeholder', 'example.com', 'localhost', 'data:image/svg']
  return placeholderPatterns.some(pattern => url.includes(pattern))
}

export function isValidSupabaseStorageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('supabase.co') && urlObj.pathname.includes('/storage/v1/object/public/')
  } catch {
    return false
  }
}

export function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/storage/v1/object/public/')
    if (pathParts.length !== 2) return null
    const [bucket, ...pathSegments] = pathParts[1].split('/')
    return { bucket, path: pathSegments.join('/') }
  } catch {
    return null
  }
}

export function validateImageUrlQuick(url: string | null | undefined): ValidationResult {
  if (url && validationCache.has(url)) {
    const cached = validationCache.get(url)!
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return { isValid: cached.isValid, url: cached.url, reason: cached.reason, category: cached.category }
    }
    validationCache.delete(url)
  }

  if (!url || url.trim() === '') {
    return { isValid: false, url: url || '', reason: 'Empty or null URL', category: 'empty' }
  }

  if (isPlaceholderUrl(url)) {
    const result: ValidationResult = { isValid: false, url, reason: 'Placeholder URL detected', category: 'placeholder' }
    validationCache.set(url, { ...result, timestamp: Date.now() })
    return result
  }

  if (!isValidSupabaseStorageUrl(url)) {
    const result: ValidationResult = { isValid: false, url, reason: 'Invalid Supabase Storage URL format', category: 'invalid-format' }
    validationCache.set(url, { ...result, timestamp: Date.now() })
    return result
  }

  const result: ValidationResult = { isValid: true, url }
  validationCache.set(url, { ...result, timestamp: Date.now() })
  return result
}

export function validateImageUrlsBatch(urls: (string | null | undefined)[]): ValidationResult[] {
  return urls.map(url => validateImageUrlQuick(url))
}

export function filterValidImageUrls<T extends { file_url?: string | null; url?: string | null }>(images: T[]): T[] {
  return images.filter(img => {
    const url = img.file_url || img.url
    return validateImageUrlQuick(url).isValid
  })
}
