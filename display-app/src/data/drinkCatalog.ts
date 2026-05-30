import type { DrinkProfile, AnimationFamily } from '../types'

/**
 * Top-level folders under public/sprites/. Menu and catalog only include
 * drinks that map to one of these folders.
 */
export const PUBLIC_SPRITE_DRINK_FOLDERS = [
  'apple-tart',
  'irish-coffee',
  'mangosticky-rice',
  'peanut',
  'pistachio',
  'sb-cc',
  'tangyuan',
] as const

/** drinkCatalog id → public/sprites folder name */
export const DRINK_SPRITE_FOLDER: Record<string, (typeof PUBLIC_SPRITE_DRINK_FOLDERS)[number]> = {
  'apple-tart': 'apple-tart',
  'irish-coffee': 'irish-coffee',
  'mango-sticky-rice': 'mangosticky-rice',
  'peanut': 'peanut',
  'pistachio': 'pistachio',
  'strawberry-cheesecake': 'sb-cc',
  'tangyuan': 'tangyuan',
}

function hasPublicSpriteFolder(drink: DrinkProfile): boolean {
  const folder = DRINK_SPRITE_FOLDER[drink.id]
  return folder != null && (PUBLIC_SPRITE_DRINK_FOLDERS as readonly string[]).includes(folder)
}

/** Static drink catalog for Barcode MVP — synced to venue menu. */
const allDrinkProfiles: DrinkProfile[] = [
  {
    id: 'apple-tart',
    name: 'APPLE TART',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'fruity / sweet',
    ingredients: ['caramelised apple', 'mix spices', 'vanilla', 'chardonnay', 'vodka'],
    animationFamily: 'tropical',
    colorPalette: ['#8B4513', '#D2691E', '#FFF8E7'],
    spriteCharacter: 'apple_tart',
    description: 'Warm and golden, like the first bite of a tart fresh from the oven — cozy, gently sweet, and quietly indulgent.',
    orbitalPreset: {
      lines: [
        { radius: 45, width: 1.0, speed: 0, alpha: 0.4, colorIndex: 2 },
        { radius: 65, width: 1.0, dashCount: 30, dashRatio: 0.4, speed: -0.12, alpha: 0.5, colorIndex: 1 }
      ],
      particles: [
        { radius: 65, count: 3, size: 2.5, speed: 0.35, alpha: 0.8, colorIndex: 2 },
        { radius: 45, count: 1, size: 3.0, speed: -0.4, alpha: 0.6, colorIndex: 1 }
      ],
      waves: [
        { radius: 52, width: 3.5, amplitude: 6, wavelength: 7, speed: 0.28, alpha: 0.75, colorIndex: 1, glow: true }
      ],
      spokes: []
    }
  },
  {
    id: 'irish-coffee',
    name: 'SPICED IRISH COFFEE',
    category: 'COFFEE_BASED',
    price: 118,
    flavorProfile: 'creamy / spice',
    ingredients: ['dark roast cold brew', 'mix spices', 'cream', 'irish whiskey'],
    animationFamily: 'bold',
    colorPalette: ['#3D2B1F', '#C0845A', '#F5E6D3'],
    spriteCharacter: 'irish_coffee',
    description: 'A slow-sip hug on a cool night — rich, warming, and mellow, with dark coffee depth and a soft spiced finish.',
    orbitalPreset: {
      lines: [
        { radius: 40, width: 1.0, speed: 0, alpha: 0.4, colorIndex: 1 },
        { radius: 55, width: 1.0, speed: 0, alpha: 0.35, colorIndex: 1 },
        { radius: 70, width: 1.8, dashCount: 60, dashRatio: 0.5, speed: 0.05, alpha: 0.5, colorIndex: 2 }
      ],
      particles: [
        { radius: 70, count: 4, size: 2.0, speed: 0.15, alpha: 0.6, colorIndex: 2 }
      ],
      waves: [
        { radius: 32, width: 1.2, amplitude: 1.5, wavelength: 12, speed: 0.1, alpha: 0.4, colorIndex: 1 }
      ],
      spokes: [
        { innerRadius: 20, outerRadius: 75, count: 4, width: 1.5, speed: 0.02, alpha: 0.6, colorIndex: 2, crosshair: true },
        { innerRadius: 40, outerRadius: 48, count: 24, width: 1.0, speed: -0.05, alpha: 0.5, colorIndex: 1 },
        { innerRadius: 55, outerRadius: 62, count: 16, width: 1.2, speed: 0.04, alpha: 0.4, colorIndex: 2 }
      ]
    }
  },
  {
    id: 'mango-sticky-rice',
    name: 'MANGO STICKY RICE',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'fruity / silky',
    ingredients: ['mango', 'coconut milk', 'pineapple', 'sake', 'the botanist gin'],
    animationFamily: 'tropical',
    colorPalette: ['#FFB347', '#FFD700', '#FFF8E7'],
    spriteCharacter: 'mangosticky_rice',
    description: 'Sun-soaked and silky — tropical nostalgia in a glass, lush and creamy with a breezy vacation mood.',
    orbitalPreset: {
      lines: [
        { radius: 45, width: 1.2, dashCount: 24, dashRatio: 0.5, speed: 0.2, alpha: 0.4, colorIndex: 1 },
        { radius: 55, width: 1.0, speed: -0.15, alpha: 0.5, colorIndex: 0 },
        { radius: 70, width: 1.5, dashCount: 40, dashRatio: 0.5, speed: 0.1, alpha: 0.3, colorIndex: 1 }
      ],
      particles: [
        { radius: 55, count: 3, size: 2.5, speed: 0.5, alpha: 0.7, colorIndex: 2 },
        { radius: 70, count: 2, size: 3.0, speed: -0.2, alpha: 0.8, colorIndex: 0 }
      ],
      waves: [
        { radius: 60, width: 1.5, amplitude: 4, wavelength: 8, speed: -0.25, alpha: 0.5, colorIndex: 1 }
      ],
      spokes: []
    }
  },
  {
    id: 'peanut',
    name: 'PEANUT BUTTER WHISKEY SOUR',
    category: 'CLASSICS',
    price: 120,
    flavorProfile: 'nutty / citrus',
    ingredients: ['chamomile', 'fresh lemon', 'peanut butter washed whiskey'],
    animationFamily: 'bold',
    colorPalette: ['#8B5E3C', '#D4A574', '#F5E6D3'],
    spriteCharacter: 'peanut',
    description: 'Comfortingly bold with a bright edge — nutty warmth meets a lemony lift, familiar yet a little unexpected.',
    orbitalPreset: {
      lines: [
        { radius: 42, width: 1.2, speed: 0, alpha: 0.5, colorIndex: 2 },
        { radius: 54, width: 1.0, dashCount: 36, dashRatio: 0.5, speed: 0.08, alpha: 0.4, colorIndex: 1 },
        { radius: 68, width: 1.8, speed: 0, alpha: 0.45, colorIndex: 2 }
      ],
      particles: [
        { radius: 54, count: 3, size: 2.5, speed: -0.2, alpha: 0.7, colorIndex: 2 }
      ],
      waves: [
        { radius: 34, width: 1.0, amplitude: 2, wavelength: 14, speed: -0.15, alpha: 0.5, colorIndex: 1 }
      ],
      spokes: [
        { innerRadius: 20, outerRadius: 68, count: 8, width: 1.2, speed: 0.03, alpha: 0.5, colorIndex: 2, crosshair: true },
        { innerRadius: 42, outerRadius: 48, count: 32, width: 1.0, speed: -0.06, alpha: 0.45, colorIndex: 1 }
      ]
    }
  },
  {
    id: 'pistachio',
    name: 'PISTACHIO GELATO',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'creamy / buttery',
    ingredients: ['pistachio', 'butter biscuit', 'tokaji wine', 'butter washed bourbon'],
    animationFamily: 'elegant',
    colorPalette: ['#93C572', '#C8E6C9', '#F1F8E9'],
    spriteCharacter: 'pistachio',
    description: 'Smooth and luxurious, like gelato at midnight — buttery, unhurried, and quietly decadent.',
    orbitalPreset: {
      lines: [
        { radius: 45, width: 1.0, dashCount: 32, dashRatio: 0.5, speed: 0.15, alpha: 0.4, colorIndex: 1 },
        { radius: 60, width: 1.5, speed: 0, alpha: 0.5, colorIndex: 2 },
        { radius: 75, width: 0.8, dashCount: 48, dashRatio: 0.5, speed: -0.1, alpha: 0.3, colorIndex: 1 }
      ],
      particles: [
        { radius: 60, count: 2, size: 3.0, speed: 0.4, alpha: 0.8, colorIndex: 2 },
        { radius: 45, count: 1, size: 2.0, speed: -0.3, alpha: 0.6, colorIndex: 1 }
      ],
      waves: [
        { radius: 50, width: 1.5, amplitude: 5, wavelength: 6, speed: 0.3, alpha: 0.6, colorIndex: 0, glow: true }
      ],
      spokes: []
    }
  },
  {
    id: 'strawberry-cheesecake',
    name: 'STRAWBERRY CHEESECAKE',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'fruity / silky',
    ingredients: ['strawberry', 'cream cheese', 'oloroso', 'remy martin vsop'],
    animationFamily: 'elegant',
    colorPalette: ['#E91E63', '#F8BBD9', '#FFF0F5'],
    spriteCharacter: 'sb_cc',
    description: 'Soft, romantic indulgence — berries and cream in cocktail form, sweet, velvety, and a little fancy.',
    orbitalPreset: {
      lines: [
        { radius: 42, width: 1.0, speed: -0.1, alpha: 0.4, colorIndex: 1 },
        { radius: 58, width: 1.0, dashCount: 36, dashRatio: 0.5, speed: 0.18, alpha: 0.5, colorIndex: 1 },
        { radius: 72, width: 1.5, speed: -0.08, alpha: 0.35, colorIndex: 2 }
      ],
      particles: [
        { radius: 42, count: 2, size: 2.5, speed: 0.45, alpha: 0.8, colorIndex: 0 },
        { radius: 58, count: 1, size: 3.0, speed: -0.3, alpha: 0.7, colorIndex: 2 }
      ],
      waves: [
        { radius: 50, width: 2.0, amplitude: 5, wavelength: 5, speed: 0.35, alpha: 0.7, colorIndex: 0, glow: true }
      ],
      spokes: []
    }
  },
  {
    id: 'tangyuan',
    name: 'TANGYUAN',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'fizzy, sweet',
    ingredients: ['ginger', 'sesame oil', 'melon', 'applejack', 'pear cider'],
    animationFamily: 'energetic',
    colorPalette: ['#F8F4E3', '#D7CCC8', '#8D6E63'],
    spriteCharacter: 'tangyuan',
    description: 'Playful and effervescent — festive and fizzy, with a ginger spark and a sweet, warming surprise.',
    orbitalPreset: {
      lines: [
        { radius: 42, width: 0.8, dashCount: 20, dashRatio: 0.5, speed: 0.25, alpha: 0.45, colorIndex: 1 },
        { radius: 60, width: 1.0, speed: 0, alpha: 0.4, colorIndex: 0 },
        { radius: 74, width: 1.5, dashCount: 48, dashRatio: 0.5, speed: -0.08, alpha: 0.35, colorIndex: 1 }
      ],
      particles: [
        { radius: 60, count: 4, size: 2.2, speed: 0.4, alpha: 0.7, colorIndex: 0 },
        { radius: 74, count: 2, size: 3.0, speed: -0.15, alpha: 0.75, colorIndex: 1 }
      ],
      waves: [
        { radius: 50, width: 3.0, amplitude: 7, wavelength: 9, speed: -0.32, alpha: 0.8, colorIndex: 0, glow: true }
      ],
      spokes: []
    }
  },
]

/** Drinks shown in the menu and available for orders — must have sprites in public/sprites/. */
export const drinkCatalog: DrinkProfile[] = allDrinkProfiles.filter(hasPublicSpriteFolder)

export const getDrinkById = (id: string): DrinkProfile | undefined =>
  drinkCatalog.find((d) => d.id === id)

// ─── Quiz logic ───────────────────────────────────────────────────────────────

export const quizQuestions = [
  {
    id: 'mood',
    question: "What's your mood today?",
    options: [
      { label: 'ADVENTUROUS & ENERGETIC', value: 'energetic' },
      { label: 'RELAXED & CALM', value: 'elegant' },
      { label: 'SOCIAL & PLAYFUL', value: 'tropical' },
      { label: 'SOPHISTICATED & REFINED', value: 'bold' },
    ],
  },
  {
    id: 'flavor',
    question: 'Which flavor profile calls to you?',
    options: [
      { label: 'FRUITY & FRESH', value: 'tropical' },
      { label: 'RICH & INTENSE', value: 'bold' },
      { label: 'LIGHT & FIZZY', value: 'energetic' },
      { label: 'SMOOTH & CREAMY', value: 'elegant' },
    ],
  },
  {
    id: 'spirit',
    question: 'What spirit base do you prefer?',
    options: [
      { label: 'VODKA / GIN', value: 'energetic' },
      { label: 'WHISKY / BRANDY', value: 'bold' },
      { label: 'RUM / PISCO', value: 'tropical' },
      { label: 'LIQUEURS & COFFEE', value: 'elegant' },
    ],
  },
  {
    id: 'sweetness',
    question: 'How sweet do you like it?',
    options: [
      { label: 'DRY', value: 'bold' },
      { label: 'SLIGHTLY SWEET', value: 'elegant' },
      { label: 'MODERATELY SWEET', value: 'energetic' },
      { label: 'SWEET & INDULGENT', value: 'tropical' },
    ],
  },
] as const

export type QuizAnswer = Record<string, AnimationFamily>

/** Score answers and return the best matching drink ID */
export function recommendDrink(answers: Record<string, string>): string {
  const scores: Record<AnimationFamily, number> = {
    energetic: 0,
    elegant: 0,
    tropical: 0,
    bold: 0,
  }

  for (const value of Object.values(answers)) {
    if (value in scores) {
      scores[value as AnimationFamily]++
    }
  }

  const topFamily = (Object.entries(scores) as [AnimationFamily, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0]

  const match = drinkCatalog.find((d) => d.animationFamily === topFamily)
  return match?.id ?? drinkCatalog[0].id
}
