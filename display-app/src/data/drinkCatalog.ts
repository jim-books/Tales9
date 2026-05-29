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
