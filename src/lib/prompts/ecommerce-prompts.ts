import type { EcommerceImageType } from '@/types/ecommerce'

export interface EcommercePromptOptions {
  category: string
  brand?: string
  productDescription?: string
  colorDescription?: string
  style?: string
}

const ECOMMERCE_PROMPTS: Record<EcommerceImageType, (opts: EcommercePromptOptions) => string> = {
  'lifestyle': (opts) => `Lifestyle product photography of a ${opts.colorDescription || 'neutral colored'} ${opts.category}.
${opts.brand ? `Brand: ${opts.brand}.` : ''}
The garment is styled in a real-world lifestyle setting - laid flat on a textured surface (light wood, marble, or linen).
Surrounded by complementary lifestyle props: coffee cup, sunglasses, phone, or small plant.
Warm natural lighting with soft shadows creating depth and atmosphere.
The garment is the clear hero of the image, taking up 60-70% of the frame.
High resolution 8K commercial lifestyle photography for e-commerce product pages.
${opts.productDescription ? `Product details: ${opts.productDescription}.` : ''}
Social media ready, Instagram aesthetic, modern and aspirational.
NO mannequin, NO model, NO hanger. Flat lay lifestyle composition.`,

  'white-background': (opts) => `Clean isolated product photography of a ${opts.colorDescription || 'neutral colored'} ${opts.category}.
${opts.brand ? `Brand: ${opts.brand}.` : ''}
The garment is photographed on a pure white seamless background.
Perfect even lighting with absolutely no shadows or color cast.
The product fills 80-85% of the frame with consistent margins on all sides.
Crisp sharp focus on fabric texture and construction details.
High resolution 8K commercial e-commerce product photography.
${opts.productDescription ? `Product details: ${opts.productDescription}.` : ''}
Amazon/Shopify product listing style - clean, professional, no distractions.
NO props, NO background elements, NO styling. Pure white isolated product shot.`,

  'hero': (opts) => `Wide format hero banner image for a ${opts.category} collection.
${opts.brand ? `Brand: ${opts.brand}.` : ''}
Multiple ${opts.colorDescription || 'neutral colored'} ${opts.category} garments arranged in a visually striking editorial composition.
Wide 16:9 aspect ratio suitable for website hero banners and collection pages.
Premium editorial photography style with cinematic lighting.
Muted, sophisticated color palette. Modern minimalist aesthetic.
${opts.productDescription ? `Product details: ${opts.productDescription}.` : ''}
High resolution, 8K quality. Suitable for large format website headers.
NO text, NO logos, NO models. Product-focused editorial flat lay.`,

  'size-guide': (opts) => `Technical product photography of a ${opts.colorDescription || 'neutral colored'} ${opts.category} for a size guide.
${opts.brand ? `Brand: ${opts.brand}.` : ''}
The garment is laid perfectly flat on a pure white background with a measuring tape or ruler visible alongside.
Key measurement points are clearly visible: chest width, body length, sleeve length.
The garment is pressed completely flat to show accurate proportions.
Even top-down lighting with no shadows distorting measurements.
High resolution 8K commercial product photography.
${opts.productDescription ? `Product details: ${opts.productDescription}.` : ''}
Technical reference style - precise, clear, and informative.`,
}

export function buildEcommercePrompt(imageType: EcommerceImageType, opts: EcommercePromptOptions): string {
  return ECOMMERCE_PROMPTS[imageType](opts)
}

export const ECOMMERCE_NEGATIVE_PROMPT = `blurry, low quality, distorted, warped, watermark, text overlay,
model wearing, mannequin, ghost mannequin, hanger,
3D render, CGI, illustration, cartoon, anime, painting, sketch, digital art,
dirty, stained, faded, discolored,
wrong proportions, deformed shape, cropped, cut off`
