import type { EcommerceImageType } from '@/types/ecommerce'

export interface EcommercePromptOptions {
  inputLabel?: string
  prompt: string
  referenceCount: number
}

const ECOMMERCE_PROMPTS: Record<EcommerceImageType, (opts: EcommercePromptOptions) => string> = {
  'lifestyle': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a premium lifestyle ecommerce image for The Print Room.
Keep the product design, cut, branding, colourway, and material details unchanged from the reference image${opts.referenceCount > 1 ? 's' : ''}.
Style the product in a clean editorial scene with realistic props, soft natural light, and commercially polished composition.
The product must remain the hero of the image and occupy most of the frame.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
User instructions: ${opts.prompt}`,

  'white-background': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a clean white-background ecommerce product shot for The Print Room.
Keep the product design, colourway, proportions, branding, and trim details unchanged from the reference image${opts.referenceCount > 1 ? 's' : ''}.
Place the product on a pure white seamless background with even studio lighting and consistent margins.
No props or styling elements. The output should be suitable for product listings and print-room production review.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
User instructions: ${opts.prompt}`,

  'hero': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a wide hero/banner image for The Print Room using the uploaded product as the featured subject.
Keep the product design, colourway, branding, and construction details unchanged while placing it in a premium editorial composition.
Use a cinematic 16:9 layout with strong visual hierarchy and room for website merchandising.
No text overlays or logos in the output.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
User instructions: ${opts.prompt}`,

  'size-guide': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a precise size-guide style image for The Print Room.
Lay the garment flat, preserve the exact product shape and details, and show clear measurement references on a clean background.
Make the output highly legible and production-friendly, with the product fully visible and not cropped.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
User instructions: ${opts.prompt}`,
}

export function buildEcommercePrompt(imageType: EcommerceImageType, opts: EcommercePromptOptions): string {
  return ECOMMERCE_PROMPTS[imageType](opts)
}

export const ECOMMERCE_NEGATIVE_PROMPT = `blurry, low quality, distorted, warped, watermark, text overlay,
change the garment design, invent new branding, wrong colours, extra pockets, missing trims,
model wearing, mannequin, ghost mannequin, hanger,
3D render, CGI, illustration, cartoon, anime, painting, sketch, digital art,
dirty, stained, faded, discoloured,
wrong proportions, deformed shape, cropped, cut off`
