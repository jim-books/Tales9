import type { DrinkProfile, AnimationFamily } from '../types'

/** Static drink catalog for Barcode MVP. Replace content with real menu data. */
export const drinkCatalog: DrinkProfile[] = [
  {
    id: 'irish-coffee',
    name: 'IRISH COFFEE',
    category: 'COFFEE_BASED',
    price: 130,
    flavorProfile: 'Bold/Rich',
    ingredients: ['Irish Whiskey', 'Espresso', 'Brown Sugar', 'Fresh Cream'],
    animationFamily: 'bold',
    colorPalette: ['#3D2B1F', '#C0845A', '#F5E6D3'],
    spriteCharacter: 'irish_coffee',
    description: 'Warm whiskey and espresso topped with velvety cream — rich, comforting, and classic.',
  },
  {
    id: 'mango-sticky-rice',
    name: 'MANGO STICKY RICE',
    category: 'DESSERT_INSPIRED',
    price: 118,
    flavorProfile: 'Creamy/Tropical',
    ingredients: ['Rum', 'Mango', 'Coconut Cream', 'Sticky Rice Syrup', 'Lime'],
    animationFamily: 'tropical',
    colorPalette: ['#FFB347', '#FFD700', '#FFF8E7'],
    spriteCharacter: 'mangosticky_rice',
    description: 'Dessert-forward tropical serve with mango richness and a rice-cream finish.',
  },
  {
    id: 'peanut',
    name: 'PEANUT',
    category: 'DESSERT_INSPIRED',
    price: 122,
    flavorProfile: 'Nutty/Rich',
    ingredients: ['Peanut Butter Liqueur', 'Vodka', 'Cream', 'Salted Caramel', 'Crushed Peanuts'],
    animationFamily: 'bold',
    colorPalette: ['#8B5E3C', '#D4A574', '#F5E6D3'],
    spriteCharacter: 'peanut',
    description: 'Roasted peanut depth with salted caramel and cream — indulgent and nutty.',
  },
  {
    id: 'pistachio',
    name: 'PISTACHIO',
    category: 'DESSERT_INSPIRED',
    price: 126,
    flavorProfile: 'Smooth/Sweet',
    ingredients: ['Pistachio Liqueur', 'Gin', 'Orgeat', 'Lemon', 'Egg White'],
    animationFamily: 'elegant',
    colorPalette: ['#93C572', '#C8E6C9', '#F1F8E9'],
    spriteCharacter: 'pistachio',
    description: 'Silky pistachio sour with bright citrus and a frothy finish.',
  },
  {
    id: 'salted-cc',
    name: 'SALTED CC',
    category: 'DESSERT_INSPIRED',
    price: 128,
    flavorProfile: 'Rich/Sweet-Salty',
    ingredients: ['Whisky', 'Salted Caramel', 'Cream', 'Vanilla', 'Cocoa Bitters'],
    animationFamily: 'bold',
    colorPalette: ['#5C4033', '#D4A574', '#F5E6D3'],
    spriteCharacter: 'sb_cc',
    description: 'Decadent salted caramel and cream — bold, dessert-bar energy in a glass.',
  },
  {
    id: 'tangyuan',
    name: 'TANGYUAN',
    category: 'DESSERT_INSPIRED',
    price: 120,
    flavorProfile: 'Sweet/Creamy',
    ingredients: ['Rice Wine', 'Black Sesame', 'Coconut Milk', 'Brown Sugar', 'Ginger'],
    animationFamily: 'elegant',
    colorPalette: ['#F8F4E3', '#D7CCC8', '#8D6E63'],
    spriteCharacter: 'tangyuan',
    description: 'Inspired by the classic glutinous rice dessert — warm, sweet, and softly aromatic.',
  },
]

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
