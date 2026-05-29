export type MappingMode = 'hardcoded' | 'firebase'

const HARDCODED_DRINK_IDS = [
  'irish-coffee',
  'mango-sticky-rice',
  'peanut',
  'pistachio',
  'salted-cc',
  'tangyuan',
] as const

export function coasterNumberFromId(coasterId: string): number | null {
  const match = coasterId.match(/(\d+)/)
  if (!match) return null
  const num = Number.parseInt(match[1], 10)
  return Number.isFinite(num) ? num : null
}

export function hardcodedDrinkIdForCoaster(coasterId: string): string | null {
  const coasterNumber = coasterNumberFromId(coasterId)
  if (coasterNumber === null) return null
  return HARDCODED_DRINK_IDS[coasterNumber - 1] ?? null
}
