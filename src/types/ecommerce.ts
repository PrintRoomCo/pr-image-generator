export type EcommerceImageType = 'lifestyle' | 'white-background' | 'hero' | 'size-guide'

export interface EcommerceGenerationConfig {
  imageTypes: EcommerceImageType[]
  style?: string
}

export interface GeneratedEcommerceImage {
  imageType: EcommerceImageType
  replicateOutputUrl: string
  storageUrl: string
  recordId: string
}

export interface EcommerceGenerationResult {
  productId: string
  productName: string
  generatedImages: GeneratedEcommerceImage[]
  errors: string[]
}
