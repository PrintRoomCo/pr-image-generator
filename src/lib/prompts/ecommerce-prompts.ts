import {
  getEcommerceBrief,
  getEcommercePresetLabel,
  type EcommerceGenerationConfig,
  type EcommerceImageType,
} from '@/types/ecommerce'

export interface EcommercePromptOptions {
  config: EcommerceGenerationConfig
  inputLabel?: string
  referenceCount: number
}

function buildBriefContext(config: EcommerceGenerationConfig): string {
  const brief = getEcommerceBrief(config)
  if (!brief) {
    return `Legacy prompt instructions: ${config.prompt}`
  }

  const contextPairs = [
    ['Workflow', brief.workflowType === 'proposal' ? 'Client proposal visuals' : 'Web-ready merchandising assets'],
    ['Preset', getEcommercePresetLabel(brief.presetKey)],
    ['Project', brief.projectName],
    ['Client', brief.clientName],
    ['Brand', brief.clientBrand],
    ['Audience', brief.audience],
    ['Tone', brief.tone],
    ['Usage context', brief.usageContext],
    ['Merchandising goal', brief.merchandisingGoal],
    ['Channel', brief.channel],
    ['Page type', brief.pageType],
    ['Background style', brief.backgroundStyle],
    ['Output intent', brief.outputIntent],
    ['Destination tags', brief.destinationTags?.join(', ')],
    ['Custom note', brief.customNote],
  ]

  const lines = contextPairs
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([label, value]) => `${label}: ${value}`)

  if (config.prompt.trim()) {
    lines.push(`Prompt summary: ${config.prompt.trim()}`)
  }

  return lines.join('\n')
}

const ECOMMERCE_PROMPTS: Record<EcommerceImageType, (opts: EcommercePromptOptions) => string> = {
  lifestyle: (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a premium lifestyle image for The Print Room.
Keep the product design, cut, branding, colourway, and material details unchanged from the reference image${opts.referenceCount > 1 ? 's' : ''}.
Style the product in a polished editorial scene with commercially credible lighting, realistic props, and premium composition.
This asset must feel ready for either a proposal deck or a live merchandising placement depending on the brief context.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
${buildBriefContext(opts.config)}`,

  'white-background': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a clean white-background ecommerce product shot for The Print Room.
Keep the product design, colourway, proportions, branding, and trim details unchanged from the reference image${opts.referenceCount > 1 ? 's' : ''}.
Place the product on a pure white or seamless neutral background with even studio lighting, consistent margins, and clean edges.
No props or styling elements unless the brief explicitly requests a light support treatment.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
${buildBriefContext(opts.config)}`,

  hero: (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a hero image for The Print Room using the uploaded product as the featured subject.
Keep the product design, colourway, branding, and construction details unchanged while placing it in a premium composition with clear hierarchy.
The result should feel strong enough for a proposal opener or a campaign landing-page banner, with room for surrounding layout if needed.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
${buildBriefContext(opts.config)}`,

  'size-guide': (opts) => `Use the uploaded product image${opts.referenceCount > 1 ? 's' : ''} as the exact product reference.
Create a precise size-guide or technical support image for The Print Room.
Lay the garment flat or in a clearly measurable presentation, preserve the exact product shape and details, and keep the output highly legible.
Measurement references should feel production-friendly, neat, and suitable for operational or ecommerce support usage.
${opts.inputLabel ? `Product label: ${opts.inputLabel}.` : ''}
${buildBriefContext(opts.config)}`,
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
