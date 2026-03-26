import type { DrinkProfile, AnimationFamily } from '../types'

/** Static drink catalog for Barcode MVP. Replace content with real menu data. */
export const drinkCatalog: DrinkProfile[] = [
  {
    id: 'pisco-colada',
    name: 'PISCO-COLADA',
    category: 'CLASSICS',
    price: 120,
    flavorProfile: 'Velvety/Tropical',
    ingredients: ['Pisco', 'Coconut Cream', 'Pineapple Juice', 'Lime'],
    animationFamily: 'tropical',
    colorPalette: ['#FFD166', '#06D6A0', '#118AB2'],
    spriteCharacter: 'pineapple',
    description: 'A tropical twist on the classic Pisco Sour, blended with coconut cream and fresh pineapple.',
  },
  {
    id: 'espresso-martini',
    name: 'ESPRESSO MARTINI',
    category: 'COFFEE_BASED',
    price: 130,
    flavorProfile: 'Bold/Rich',
    ingredients: ['Vodka', 'Espresso', 'Coffee Liqueur', 'Simple Syrup'],
    animationFamily: 'bold',
    colorPalette: ['#3D2B1F', '#C0845A', '#F5E6D3'],
    spriteCharacter: 'coffee_bean',
    description: 'A wake-me-up cocktail combining freshly pulled espresso with smooth vodka and coffee liqueur.',
  },
  {
    id: 'momo-sour',
    name: 'MOMO SOUR',
    category: 'CLASSICS',
    price: 115,
    flavorProfile: 'Fizzy/Sour',
    ingredients: ['Gin', 'Peach Liqueur', 'Lemon Juice', 'Egg White', 'Soda'],
    animationFamily: 'energetic',
    colorPalette: ['#FFAAA5', '#FF8B94', '#FFC3A0'],
    spriteCharacter: 'peach',
    description: 'A light and lively sour with peach liqueur and a silky egg white foam.',
  },
  {
    id: 'apple-tart',
    name: 'APPLE TART',
    category: 'DESSERT_INSPIRED',
    price: 125,
    flavorProfile: 'Sweet/Crisp',
    ingredients: ['Apple Brandy', 'Calvados', 'Cinnamon Syrup', 'Lemon', 'Cream'],
    animationFamily: 'elegant',
    colorPalette: ['#A8D8B9', '#FCEFB4', '#E8D5B7'],
    spriteCharacter: 'apple',
    description: 'Inspired by the classic French tarte tatin — warm apple brandy with cinnamon and a hint of cream.',
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

