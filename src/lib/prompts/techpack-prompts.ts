import type { TechpackAssetType } from '@/types/techpacks'

export interface TechpackPromptOptions {
  category: string
  brand?: string
  productDescription?: string
  colorDescription?: string
}

const TECHPACK_PROMPTS: Record<TechpackAssetType, (opts: TechpackPromptOptions) => string> = {
  'flat-drawing': (opts) => `Technical flat drawing / technical sketch of a ${opts.category}.
Black line art on white background. Clean vector-style illustration.
Front and back views side by side showing the complete garment construction.
All seam lines, stitch lines, and construction details clearly visible.
Accurate proportions showing the true silhouette of the garment.
${opts.productDescription ? `Construction details: ${opts.productDescription}.` : ''}
Industry-standard fashion flat / tech flat style used in garment manufacturing.
NO shading, NO color fill, NO 3D effects. Pure line drawing only.
Professional technical illustration for a garment tech pack / specification sheet.`,

  'construction-detail': (opts) => `Close-up technical illustration showing construction details of a ${opts.category}.
Detailed line drawings of key construction points:
- Collar/neckline construction and stitching
- Seam types (flat lock, overlock, coverstitch)
- Hem finish detail
- Cuff construction
- Pocket placement and construction
${opts.productDescription ? `Specific details: ${opts.productDescription}.` : ''}
Black line art on white background. Technical illustration style.
Callout lines pointing to each construction detail with labels.
Professional garment construction reference sheet for manufacturing.`,

  'measurement-diagram': (opts) => `Technical measurement diagram for a ${opts.category}.
Clean line drawing of the garment with measurement arrows and dimension lines.
Key measurements labeled with letter codes (A, B, C, D, etc.):
- A: Chest width (armpit to armpit)
- B: Body length (shoulder to hem)
- C: Sleeve length (shoulder to cuff)
- D: Shoulder width
- E: Hem width
${opts.productDescription ? `Garment type: ${opts.productDescription}.` : ''}
Black line art on white background with red or blue dimension lines.
Industry-standard spec sheet measurement diagram format.
Front view with all measurement points clearly marked.`,

  'fabric-callout': (opts) => `Fabric specification reference sheet for a ${opts.category}.
Clean layout showing:
- Large fabric swatch sample (showing weave/knit texture close-up)
- Fabric composition breakdown (e.g., 100% organic cotton)
- Weight specification (GSM)
- Fabric type (jersey, fleece, canvas, pique, etc.)
${opts.productDescription ? `Fabric details: ${opts.productDescription}.` : ''}
${opts.colorDescription ? `Color: ${opts.colorDescription}.` : ''}
Technical reference style on white background.
Professional fabric specification sheet for garment manufacturing tech pack.`,

  'color-spec': (opts) => `Color specification sheet for a ${opts.colorDescription || 'neutral'} ${opts.category}.
Clean professional layout showing:
- Large color swatch block
- Pantone color code reference
- Hex color value
- RGB/CMYK values
- Color name
${opts.brand ? `Brand: ${opts.brand}.` : ''}
White background with the color swatch prominently displayed.
Professional color specification reference for garment manufacturing.
Clean, precise, technical format used in fashion tech packs.`,
}

export function buildTechpackPrompt(assetType: TechpackAssetType, opts: TechpackPromptOptions): string {
  return TECHPACK_PROMPTS[assetType](opts)
}

export const TECHPACK_NEGATIVE_PROMPT = `blurry, low quality, distorted, warped, watermark,
photograph, photo, realistic fabric, 3D render, lifestyle,
model, mannequin, hanger, store display,
cartoon style, anime, childish, unprofessional,
colored background, gradient, textured background`
