import type { ViewType, CategoryPromptTemplates } from '@/types/views'

/**
 * Reference images base URL from Supabase Storage (reads from the design-tool's bucket)
 */
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images`
  : ''

/**
 * Category-to-reference image filename mapping
 */
const CATEGORY_REFERENCE_MAP: Record<string, { front: string; back: string }> = {
  'T-Shirt': { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  'Long Sleeve T-Shirt': { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  Polo: { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  'Tank Top': { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  Hoodie: { front: 'box-hood-front.png', back: 'box-hood-back.png' },
  Jacket: { front: 'box-hood-front.png', back: 'box-hood-back.png' },
  'Bomber Jacket': { front: 'box-hood-front.png', back: 'box-hood-back.png' },
  'Coach Jacket': { front: 'box-hood-front.png', back: 'box-hood-back.png' },
  Windbreaker: { front: 'box-hood-front.png', back: 'box-hood-back.png' },
  Crew: { front: 'crew-front.png', back: 'crew-back.png' },
  Sweatshirt: { front: 'crew-front.png', back: 'crew-back.png' },
  'Crew Neck': { front: 'crew-front.png', back: 'crew-back.png' },
  Crewneck: { front: 'crew-front.png', back: 'crew-back.png' },
  Cap: { front: 'cap-front.png', back: 'cap-back.png' },
  'Tote Bag': { front: 'tote front.png', back: 'tote front.png' },
  Pants: { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  Shorts: { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  Joggers: { front: 'PFM0_STTU788_C001.avif', back: 'PFM0_STTU788_C001.avif' },
  default: { front: 'crew-front.png', back: 'crew-back.png' },
}

export function getReferenceImageUrl(category: string, view: ViewType): string | null {
  if (!SUPABASE_STORAGE_URL) return null

  const categoryLower = category.toLowerCase()
  let referenceImages = CATEGORY_REFERENCE_MAP[category]

  if (!referenceImages) {
    if (categoryLower.includes('t-shirt') || categoryLower.includes('tee')) {
      referenceImages = CATEGORY_REFERENCE_MAP['T-Shirt']
    } else if (categoryLower.includes('hoodie') || categoryLower.includes('hood')) {
      referenceImages = CATEGORY_REFERENCE_MAP['Hoodie']
    } else if (categoryLower.includes('crew') || categoryLower.includes('sweatshirt')) {
      referenceImages = CATEGORY_REFERENCE_MAP['Crew']
    } else if (categoryLower.includes('cap') || categoryLower.includes('hat')) {
      referenceImages = CATEGORY_REFERENCE_MAP['Cap']
    } else if (categoryLower.includes('tote') || categoryLower.includes('bag')) {
      referenceImages = CATEGORY_REFERENCE_MAP['Tote Bag']
    } else if (categoryLower.includes('jacket') || categoryLower.includes('bomber')) {
      referenceImages = CATEGORY_REFERENCE_MAP['Jacket']
    } else {
      referenceImages = CATEGORY_REFERENCE_MAP.default
    }
  }

  const filename = view === 'back' ? referenceImages.back : referenceImages.front
  return `${SUPABASE_STORAGE_URL}/${encodeURIComponent(filename)}`
}

export const BRAND_STYLES: Record<string, string> = {
  'Earth Positive': 'organic cotton, sustainable eco-friendly fabric, slightly relaxed fit',
  'AS Colour': 'premium Australian streetwear, high-quality cotton, modern retail fit',
  'Stanley Stella': 'European organic cotton, contemporary sustainable fashion',
  'Gildan': 'classic American heavyweight cotton, traditional fit',
  'American Apparel': 'fitted modern cut, soft ringspun cotton, slim silhouette',
  'Continental Clothing': 'European quality organic cotton',
  'Cloke': 'performance fabric, athletic fit',
  'Biz Collection': 'corporate professional wear, structured fit',
  'JBs Wear': 'workwear quality, durable construction',
}

const SIDE_VIEW_PROMPT = (side: 'LEFT' | 'RIGHT', garment: string, extra: string = '') =>
  `${side} SIDE VIEW - TRUE 90° SIDE PROFILE:
Camera is positioned directly to the ${side} of the ${garment}, viewing it from the side.
You are looking at the garment FROM ITS ${side} SIDE.
The ${side} SIDE SEAM runs VERTICALLY through the CENTER of the image.
You can see the THICKNESS of the garment from this side angle.
The FRONT is on the FAR ${side === 'LEFT' ? 'RIGHT' : 'LEFT'} EDGE, NOT facing camera.
This is a PROFILE view showing the side silhouette.${extra}
Same flat lay style, white background, top-down perspective.`

const CATEGORY_PROMPTS: Record<string, CategoryPromptTemplates> = {
  'T-Shirt': {
    basePrompt: `Premium blank screenprint t-shirt for e-commerce flat lay photography.
Off-white or cream colored blank cotton t-shirt laid perfectly flat, top-down 90-degree camera angle.
The garment is professionally pressed with crisp clean edges, no wrinkles.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on cotton fabric weave texture.
Plain solid white/cream t-shirt with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Short sleeves symmetrically positioned. Premium quality screenprint-ready blank garment.
Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 't-shirt', '\nThe LEFT SLEEVE extends TOWARD the camera, pointing at you.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 't-shirt', '\nThe RIGHT SLEEVE extends TOWARD the camera, pointing at you.') },
      { view: 'back', promptSuffix: `BACK VIEW of the t-shirt:\nThe t-shirt is flipped over showing the entire back panel.\nFull back of the garment from collar to hem is visible.\nBoth sleeves laid out symmetrically.\nBack of the collar/neckline visible at top.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  'Long Sleeve T-Shirt': {
    basePrompt: `Professional e-commerce flat lay product photography of a blank cotton long sleeve t-shirt.
The long sleeve shirt is laid completely flat on a pure white seamless background, photographed from directly above with a 90-degree top-down camera angle.
Perfect studio lighting with soft diffused light eliminating all shadows.
IMPORTANT: Full length long sleeves extending to the wrists are clearly visible.
High resolution commercial product photo, 8K quality, sharp focus on fabric texture.
Plain solid color long sleeve shirt with no prints, logos, or graphics.
Professional apparel catalog photography style, clean and minimal.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'long sleeve shirt', '\nThe FULL LEFT LONG SLEEVE extends TOWARD the camera from shoulder to wrist cuff.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'long sleeve shirt', '\nThe FULL RIGHT LONG SLEEVE extends TOWARD the camera from shoulder to wrist cuff.') },
      { view: 'back', promptSuffix: `BACK VIEW of the long sleeve t-shirt:\nFlipped over showing entire back panel.\nBoth long sleeves laid out symmetrically, full length visible.\nBack of collar visible at top.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  Hoodie: {
    basePrompt: `Premium blank screenprint hoodie for e-commerce flat lay photography.
Off-white or cream colored blank cotton/fleece hoodie laid perfectly flat, top-down 90-degree camera angle.
The garment is professionally pressed with crisp clean edges, no wrinkles, boxy oversized silhouette.
Hood laid flat and spread out symmetrically above the neckline showing hood shape.
Kangaroo front pocket clearly visible. Drawstring cord visible.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on fleece fabric texture.
Plain solid white/cream hoodie with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Sleeves symmetrically positioned. Premium quality screenprint-ready blank garment.
Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'hoodie', '\nThe LEFT SLEEVE extends TOWARD the camera.\nThe SIDE PROFILE of the hood is visible at the top.\nThe FRONT (with kangaroo pocket) is on the FAR RIGHT EDGE, NOT facing camera.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'hoodie', '\nThe RIGHT SLEEVE extends TOWARD the camera.\nThe SIDE PROFILE of the hood is visible at the top.\nThe FRONT (with kangaroo pocket) is on the FAR LEFT EDGE, NOT facing camera.') },
      { view: 'back', promptSuffix: `BACK VIEW of the hoodie:\nFlipped over showing entire back panel.\nHood laid flat at top, back of hood visible.\nBoth sleeves laid out symmetrically.\nNo pocket visible (pocket is on front only).\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  Crew: {
    basePrompt: `Premium blank screenprint crewneck sweatshirt for e-commerce flat lay photography.
Off-white or cream colored blank cotton/fleece crew neck sweatshirt laid perfectly flat, top-down 90-degree camera angle.
The garment is professionally pressed with crisp clean edges, no wrinkles.
Classic crew neckline with ribbed collar clearly visible. NO HOOD - this is a crewneck NOT a hoodie.
Ribbed cuffs at wrists and ribbed hem at bottom of garment.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on fleece fabric texture.
Plain solid white/cream crewneck with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Sleeves symmetrically positioned. Premium quality screenprint-ready blank garment.
Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'crewneck', '\nThe LEFT SLEEVE with ribbed cuff extends TOWARD the camera.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'crewneck', '\nThe RIGHT SLEEVE with ribbed cuff extends TOWARD the camera.') },
      { view: 'back', promptSuffix: `BACK VIEW of the crew neck sweatshirt:\nFlipped over showing entire back panel.\nBoth sleeves with ribbed cuffs laid symmetrically.\nBack of the crew neckline visible at top.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  Polo: {
    basePrompt: `Professional e-commerce flat lay product photography of a blank polo shirt.
The polo is laid completely flat on a pure white seamless background, photographed from directly above with a 90-degree top-down camera angle.
Perfect studio lighting with soft diffused light eliminating all shadows.
Polo collar is laid flat and visible with buttons placket.
Short sleeves with ribbed cuffs.
High resolution commercial product photo, 8K quality, sharp focus on pique cotton fabric texture.
Plain solid color polo with no prints, logos, or graphics.
Professional apparel catalog photography style, clean and minimal.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'polo', '\nThe LEFT SLEEVE extends TOWARD the camera.\nThe polo collar is visible from its side profile.\nThe FRONT (with button placket) is on the FAR RIGHT EDGE, NOT facing camera.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'polo', '\nThe RIGHT SLEEVE extends TOWARD the camera.\nThe polo collar is visible from its side profile.\nThe FRONT (with button placket) is on the FAR LEFT EDGE, NOT facing camera.') },
      { view: 'back', promptSuffix: `BACK VIEW of the polo shirt:\nFlipped over showing entire back panel.\nBack of polo collar visible at top.\nBoth sleeves laid out symmetrically.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  'Tank Top': {
    basePrompt: `Professional e-commerce flat lay product photography of a blank cotton tank top singlet.
The tank top is laid completely flat on a pure white seamless background, photographed from directly above with a 90-degree top-down camera angle.
Perfect studio lighting with soft diffused light eliminating all shadows.
Sleeveless design with wide armholes clearly visible.
High resolution commercial product photo, 8K quality, sharp focus on fabric texture.
Plain solid color tank top with no prints, logos, or graphics.
Professional apparel catalog photography style, clean and minimal.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'tank top') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'tank top') },
      { view: 'back', promptSuffix: `BACK VIEW of the tank top:\nFlipped over showing entire back panel.\nBoth armholes and straps visible.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  'Tote Bag': {
    basePrompt: `Premium blank screenprint canvas tote bag for e-commerce flat lay photography.
Off-white or cream colored blank cotton canvas tote bag laid flat, top-down 90-degree camera angle.
The bag is neatly arranged with crisp clean edges, showing structured shape.
Bag handles/straps laid flat and symmetrically positioned at top.
Subtle soft drop shadow beneath the bag for depth and dimension.
High resolution 8K commercial product photography, sharp focus on canvas weave texture.
Plain solid white/cream tote bag with absolutely NO prints, NO logos, NO graphics.
Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'back', promptSuffix: `BACK VIEW of the tote bag:\nFlipped over showing the back panel of the bag.\nHandles laid flat and symmetrically positioned at top.\nSame flat lay style, subtle shadow, white background, top-down perspective.` },
    ],
  },

  Cap: {
    basePrompt: `Premium blank screenprint cap/hat for e-commerce flat lay photography.
Off-white or cream colored blank cotton cap laid flat, top-down 90-degree camera angle.
The cap is neatly arranged showing the front panel and curved brim clearly.
Structured 6-panel cap with clean stitching lines visible.
Subtle soft drop shadow beneath for depth and dimension.
High resolution 8K commercial product photography, sharp focus on fabric texture.
Plain solid white/cream cap with absolutely NO prints, NO logos, NO graphics, NO embroidery.
Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'back', promptSuffix: `BACK VIEW of the cap:\nCap flipped to show the back panel with adjustable strap/closure.\nBack opening and adjustment mechanism clearly visible.\nSame flat lay style, subtle shadow, white background, top-down perspective.` },
      { view: 'left', promptSuffix: `LEFT SIDE VIEW - TRUE 90° SIDE PROFILE:\nCamera is positioned directly to the LEFT of the cap.\nThe LEFT PANEL of the cap faces you, brim extends to the left.\nThe cap's SIDE PROFILE silhouette is visible.\nSame flat lay style, subtle shadow, white background, top-down perspective.` },
      { view: 'right', promptSuffix: `RIGHT SIDE VIEW - TRUE 90° SIDE PROFILE:\nCamera is positioned directly to the RIGHT of the cap.\nThe RIGHT PANEL of the cap faces you, brim extends to the right.\nThe cap's SIDE PROFILE silhouette is visible.\nSame flat lay style, subtle shadow, white background, top-down perspective.` },
    ],
  },

  'Bomber Jacket': {
    basePrompt: `Premium blank screenprint BOMBER JACKET for e-commerce flat lay photography.
CRITICAL: This is a BOMBER JACKET, NOT a hoodie. There is NO HOOD on this jacket.
Off-white or cream colored blank nylon/polyester bomber jacket laid perfectly flat, top-down 90-degree camera angle.
The jacket has a RIBBED ELASTIC COLLAR at the neckline (no hood), ribbed elastic cuffs at wrists, and ribbed elastic hem at bottom.
Classic bomber jacket silhouette with zip front closure.
NO HOOD - bomber jackets do not have hoods.
The garment is professionally pressed with crisp clean edges, no wrinkles.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on fabric texture.
Plain solid white/cream bomber jacket with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Sleeves symmetrically positioned. Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'bomber jacket', '\nThe LEFT SLEEVE with RIBBED ELASTIC CUFF extends TOWARD the camera.\nThe FRONT (with zipper) is on the FAR RIGHT EDGE, NOT facing camera.\nNO HOOD - this is a bomber jacket with ribbed collar only.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'bomber jacket', '\nThe RIGHT SLEEVE with RIBBED ELASTIC CUFF extends TOWARD the camera.\nThe FRONT (with zipper) is on the FAR LEFT EDGE, NOT facing camera.\nNO HOOD - this is a bomber jacket with ribbed collar only.') },
      { view: 'back', promptSuffix: `BACK VIEW of the bomber jacket:\nFlipped over showing entire back panel.\nRIBBED ELASTIC COLLAR at top of neckline - NO HOOD.\nBoth sleeves with ribbed cuffs laid symmetrically.\nRibbed elastic hem visible at bottom.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  'Coach Jacket': {
    basePrompt: `Premium blank screenprint COACH JACKET for e-commerce flat lay photography.
CRITICAL: This is a COACH JACKET, NOT a hoodie. There is NO HOOD on this jacket.
Off-white or cream colored blank nylon coach jacket laid perfectly flat, top-down 90-degree camera angle.
The jacket has a FOLD-DOWN COLLAR at the neckline (like a shirt collar, no hood), snap button front closure.
Classic coach jacket silhouette with straight hem, no elastic.
NO HOOD - coach jackets have a simple fold-down collar only.
The garment is professionally pressed with crisp clean edges, no wrinkles.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on nylon fabric texture.
Plain solid white/cream coach jacket with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Sleeves symmetrically positioned. Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'coach jacket', '\nThe LEFT SLEEVE extends TOWARD the camera.\nThe FRONT (with snap buttons) is on the FAR RIGHT EDGE, NOT facing camera.\nNO HOOD - coach jackets have a fold-down collar only.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'coach jacket', '\nThe RIGHT SLEEVE extends TOWARD the camera.\nThe FRONT (with snap buttons) is on the FAR LEFT EDGE, NOT facing camera.\nNO HOOD - coach jackets have a fold-down collar only.') },
      { view: 'back', promptSuffix: `BACK VIEW of the coach jacket:\nFlipped over showing entire back panel.\nBack of fold-down collar at top - NO HOOD.\nBoth sleeves laid symmetrically.\nStraight hem at bottom.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  Jacket: {
    basePrompt: `Premium blank screenprint JACKET for e-commerce flat lay photography.
CRITICAL: This is a JACKET without a hood. NO HOOD on this jacket.
Off-white or cream colored blank jacket laid perfectly flat, top-down 90-degree camera angle.
The jacket has a COLLAR at the neckline (no hood) with zip front closure.
The garment is professionally pressed with crisp clean edges, no wrinkles.
Subtle soft drop shadow beneath the garment for depth and dimension.
High resolution 8K commercial product photography, sharp focus on fabric texture.
Plain solid white/cream jacket with absolutely NO prints, NO logos, NO graphics, NO tags visible.
Sleeves symmetrically positioned. Clean minimal isolated product on seamless white background.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'jacket', '\nThe LEFT SLEEVE extends TOWARD the camera.\nThe FRONT (with zipper/buttons) is on the FAR RIGHT EDGE, NOT facing camera.\nNO HOOD - this jacket has a collar only.') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'jacket', '\nThe RIGHT SLEEVE extends TOWARD the camera.\nThe FRONT (with zipper/buttons) is on the FAR LEFT EDGE, NOT facing camera.\nNO HOOD - this jacket has a collar only.') },
      { view: 'back', promptSuffix: `BACK VIEW of the jacket:\nFlipped over showing entire back panel.\nCollar at top - NO HOOD.\nBoth sleeves laid symmetrically.\nSame flat lay style, white background, top-down perspective.` },
    ],
  },

  default: {
    basePrompt: `Professional e-commerce flat lay product photography of a blank apparel garment.
The garment is laid completely flat on a pure white seamless background, photographed from directly above with a 90-degree top-down camera angle.
Perfect studio lighting with soft diffused light eliminating all shadows.
High resolution commercial product photo, 8K quality, sharp focus on fabric texture.
Plain solid color garment with no prints, logos, or graphics.
Professional apparel catalog photography style, clean and minimal.`,
    views: [
      { view: 'left', promptSuffix: SIDE_VIEW_PROMPT('LEFT', 'garment') },
      { view: 'right', promptSuffix: SIDE_VIEW_PROMPT('RIGHT', 'garment') },
      { view: 'back', promptSuffix: 'BACK VIEW: Flipped over showing entire back panel of the garment.' },
    ],
  },
}

export const NEGATIVE_PROMPT = `blurry, low quality, distorted, warped, watermark, text, words, lettering,
logo, graphic, print, pattern, design on fabric, embroidery, embroidered, printed design,
model, person, mannequin, ghost mannequin, hanger, clothing rack, store display, retail environment,
wrinkled, creased, folded, bunched up, rumpled, messy,
harsh shadows, dark shadows, dramatic lighting, colored lighting, gradient background, colored background,
textured background, wood floor, carpet, concrete, studio backdrop visible,
3D render, CGI, illustration, cartoon, anime, painting, sketch, digital art,
multiple garments, stacked items, accessories, jewelry, watches,
visible tags, visible labels, price tags, barcodes, washing instructions,
cropped, cut off, partial view, zoomed in too close,
dirty, stained, faded, discolored, yellowed,
seams visible incorrectly, wrong proportions, deformed shape,
lifestyle photography, outdoor setting, nature background`

export const JACKET_NEGATIVE_PROMPT = `${NEGATIVE_PROMPT}, hood, hoodie, hooded, drawstring, kangaroo pocket`

export function getPromptTemplates(category: string): CategoryPromptTemplates {
  if (CATEGORY_PROMPTS[category]) return CATEGORY_PROMPTS[category]

  const categoryLower = category.toLowerCase()

  if (categoryLower.includes('bomber')) return CATEGORY_PROMPTS['Bomber Jacket']
  if (categoryLower.includes('coach')) return CATEGORY_PROMPTS['Coach Jacket']
  if (categoryLower.includes('jacket') && !categoryLower.includes('hood')) return CATEGORY_PROMPTS['Jacket']
  if (categoryLower.includes('t-shirt') || categoryLower.includes('tee')) {
    if (categoryLower.includes('long sleeve') || categoryLower.includes('l/s')) return CATEGORY_PROMPTS['Long Sleeve T-Shirt']
    return CATEGORY_PROMPTS['T-Shirt']
  }
  if (categoryLower.includes('hoodie') || categoryLower.includes('hooded')) return CATEGORY_PROMPTS['Hoodie']
  if (categoryLower.includes('crew') || categoryLower.includes('sweatshirt')) return CATEGORY_PROMPTS['Crew']
  if (categoryLower.includes('polo')) return CATEGORY_PROMPTS['Polo']
  if (categoryLower.includes('tank') || categoryLower.includes('singlet')) return CATEGORY_PROMPTS['Tank Top']
  if (categoryLower.includes('tote') || categoryLower.includes('bag')) return CATEGORY_PROMPTS['Tote Bag']
  if (categoryLower.includes('cap') || categoryLower.includes('hat')) return CATEGORY_PROMPTS['Cap']

  return CATEGORY_PROMPTS.default
}

function extractProductAttributes(description: string | null | undefined): string {
  if (!description) return ''
  const attributes: string[] = []

  const weightMatch = description.match(/(\d+)\s*gsm/i)
  if (weightMatch) {
    const gsm = parseInt(weightMatch[1])
    if (gsm < 160) attributes.push('lightweight fabric')
    else if (gsm < 200) attributes.push('midweight fabric')
    else if (gsm < 280) attributes.push('heavyweight fabric')
    else attributes.push('extra heavyweight fabric')
  }

  const fitMatch = description.match(/(relaxed fit|regular fit|slim fit|oversized|fitted|boxy|tailored)/i)
  if (fitMatch) attributes.push(fitMatch[1].toLowerCase())
  if (description.toLowerCase().includes('organic')) attributes.push('organic cotton')
  if (description.toLowerCase().includes('recycled')) attributes.push('recycled materials')

  return attributes.join(', ')
}

export function buildViewPrompt(
  category: string,
  view: ViewType,
  options?: { colorDescription?: string; brand?: string; productDescription?: string }
): string {
  const templates = getPromptTemplates(category)
  const viewTemplate = templates.views.find(v => v.view === view)
  if (!viewTemplate) throw new Error(`No prompt template found for view: ${view}`)

  let prompt = templates.basePrompt

  if (options?.brand && BRAND_STYLES[options.brand]) {
    prompt += `\nBrand style: ${BRAND_STYLES[options.brand]}.`
  }
  if (options?.productDescription) {
    const attributes = extractProductAttributes(options.productDescription)
    if (attributes) prompt += `\nProduct attributes: ${attributes}.`
  }
  if (options?.colorDescription) {
    prompt += `\nGarment color: ${options.colorDescription}.`
  }

  prompt += `\n\n${viewTemplate.promptSuffix}`
  return prompt
}

export function isJacketCategory(category: string): boolean {
  const lower = category.toLowerCase()
  return lower.includes('jacket') || lower.includes('bomber') || lower.includes('coach') || lower.includes('windbreaker')
}
