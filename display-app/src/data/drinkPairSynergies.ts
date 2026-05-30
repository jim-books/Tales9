export interface SynergyConfig {
  pairKey: string // "drinkIdA:drinkIdB" sorted alphabetically
  name: string
  description: string
  type: 'magnetic' | 'ribbon' | 'vortex' | 'aurora' | 'blossom' | 'orbit' | 'sparkle' | 'pulse'
  primaryColor: number
  secondaryColor: number
  particleCount: number
  speed: number // multiplier
  intensity: number // 0-1
  glow: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customParams?: Record<string, any>
}

// Helper to convert hex string (like '#FFB347') to Pixi number
export function hexStringToNum(hex: string): number {
  return parseInt(hex.replace(/^#/, ''), 16)
}

export const drinkPairSynergies: Record<string, SynergyConfig> = {
  // 1. Apple Tart + Spiced Irish Coffee
  'apple-tart:irish-coffee': {
    pairKey: 'apple-tart:irish-coffee',
    name: 'SPICED CRUMBLE',
    description: 'Warm baking spices meld with rich dark roast coffee. Cozy, velvety, and deeply aromatic.',
    type: 'magnetic',
    primaryColor: hexStringToNum('#8B4513'), // Apple brown
    secondaryColor: hexStringToNum('#C0845A'), // Spiced coffee latte
    particleCount: 20,
    speed: 1.0,
    intensity: 0.7,
    glow: true,
    customParams: { waveCount: 3, arcSpread: 0.5 }
  },

  // 2. Apple Tart + Mango Sticky Rice
  'apple-tart:mango-sticky-rice': {
    pairKey: 'apple-tart:mango-sticky-rice',
    name: 'TROPICAL TART',
    description: 'Crisp orchard apple collides with silky coconut mango. A refreshing dessert-scape.',
    type: 'ribbon',
    primaryColor: hexStringToNum('#D2691E'), // Apple caramel
    secondaryColor: hexStringToNum('#FFB347'), // Mango orange
    particleCount: 15,
    speed: 1.2,
    intensity: 0.65,
    glow: false,
    customParams: { ribbonWidth: 4, ribbonCount: 3 }
  },

  // 3. Apple Tart + Peanut Butter Sour
  'apple-tart:peanut': {
    pairKey: 'apple-tart:peanut',
    name: 'NUTTY POMME',
    description: 'Rich roasted peanut butter meets warm caramelized apple. Salty, sweet, and comforting.',
    type: 'pulse',
    primaryColor: hexStringToNum('#8B4513'),
    secondaryColor: hexStringToNum('#D4A574'), // Peanut tan
    particleCount: 12,
    speed: 0.8,
    intensity: 0.8,
    glow: true,
    customParams: { pulseRadius: 40, frequency: 2.0 }
  },

  // 4. Apple Tart + Pistachio Gelato
  'apple-tart:pistachio': {
    pairKey: 'apple-tart:pistachio',
    name: 'ORCHARD HARVEST',
    description: 'Earthy buttered pistachio matches comforting apple spice. A rich rustic masterpiece.',
    type: 'aurora',
    primaryColor: hexStringToNum('#93C572'), // Pistachio green
    secondaryColor: hexStringToNum('#FFF8E7'), // Apple cream
    particleCount: 18,
    speed: 0.9,
    intensity: 0.6,
    glow: true,
    customParams: { wavelength: 120, height: 35 }
  },

  // 5. Apple Tart + Strawberry Cheesecake
  'apple-tart:strawberry-cheesecake': {
    pairKey: 'apple-tart:strawberry-cheesecake',
    name: 'AUTUMN BERRIES',
    description: 'Crisp spiced apple meets decadent strawberry cream. Bright fruit flavors with warm undertones.',
    type: 'blossom',
    primaryColor: hexStringToNum('#E91E63'), // Strawberry pink
    secondaryColor: hexStringToNum('#FFF8E7'), // Apple cream
    particleCount: 22,
    speed: 1.1,
    intensity: 0.75,
    glow: true,
    customParams: { petalCount: 6, rotSpeed: 0.02 }
  },

  // 6. Apple Tart + Tangyuan
  'apple-tart:tangyuan': {
    pairKey: 'apple-tart:tangyuan',
    name: 'GINGERED POMME',
    description: 'Fizzy sesame and warm ginger wrap around crisp spiced apple. Spunky and effervescent.',
    type: 'sparkle',
    primaryColor: hexStringToNum('#D2691E'),
    secondaryColor: hexStringToNum('#F8F4E3'), // Tangyuan white
    particleCount: 25,
    speed: 1.5,
    intensity: 0.85,
    glow: true,
    customParams: { spawnRate: 0.5, gravity: -0.1 }
  },

  // 7. Spiced Irish Coffee + Mango Sticky Rice
  'irish-coffee:mango-sticky-rice': {
    pairKey: 'irish-coffee:mango-sticky-rice',
    name: 'COCOA COCONUT',
    description: 'Dark roast coffee meets tropical coconut milk. An exotic, creamy morning-style escape.',
    type: 'aurora',
    primaryColor: hexStringToNum('#3D2B1F'), // Coffee brown
    secondaryColor: hexStringToNum('#FFD700'), // Mango gold
    particleCount: 16,
    speed: 0.85,
    intensity: 0.6,
    glow: true,
    customParams: { bandCount: 4 }
  },

  // 8. Spiced Irish Coffee + Peanut Butter Sour
  'irish-coffee:peanut': {
    pairKey: 'irish-coffee:peanut',
    name: 'ROASTED MONARCH',
    description: 'Nutty peanut whiskey blends into robust spiced coffee. Rich, decadent, and deeply savory.',
    type: 'vortex',
    primaryColor: hexStringToNum('#3D2B1F'),
    secondaryColor: hexStringToNum('#8B5E3C'), // Peanut brown
    particleCount: 24,
    speed: 1.1,
    intensity: 0.8,
    glow: true,
    customParams: { spiralArms: 3, tightClass: 2.5 }
  },

  // 9. Spiced Irish Coffee + Pistachio Gelato
  'irish-coffee:pistachio': {
    pairKey: 'irish-coffee:pistachio',
    name: 'PISTACHIO MOCHA',
    description: 'Silky pistachio cream meets bold espresso whiskey. Luxurious, smooth, and deeply satisfying.',
    type: 'orbit',
    primaryColor: hexStringToNum('#93C572'),
    secondaryColor: hexStringToNum('#C0845A'),
    particleCount: 14,
    speed: 1.0,
    intensity: 0.7,
    glow: true,
    customParams: { orbitalCount: 2, ringRadius: 65 }
  },

  // 10. Spiced Irish Coffee + Strawberry Cheesecake
  'irish-coffee:strawberry-cheesecake': {
    pairKey: 'irish-coffee:strawberry-cheesecake',
    name: 'TIRAMISU VIBE',
    description: 'Decadent cream cheese and sweet strawberry contrast dark roasted whiskey espresso.',
    type: 'ribbon',
    primaryColor: hexStringToNum('#E91E63'),
    secondaryColor: hexStringToNum('#F5E6D3'), // Coffee cream
    particleCount: 18,
    speed: 0.95,
    intensity: 0.7,
    glow: false,
    customParams: { waveHeight: 25, thickness: 3 }
  },

  // 11. Spiced Irish Coffee + Tangyuan
  'irish-coffee:tangyuan': {
    pairKey: 'irish-coffee:tangyuan',
    name: 'SPICED CARAVAN',
    description: 'Fizzy sesame ginger overlaying dark espresso coffee. A warm, mystical Eastern fusion.',
    type: 'magnetic',
    primaryColor: hexStringToNum('#3D2B1F'),
    secondaryColor: hexStringToNum('#8D6E63'), // Sesame brown
    particleCount: 20,
    speed: 1.3,
    intensity: 0.75,
    glow: true,
    customParams: { jitter: 8, spacing: 30 }
  },

  // 12. Mango Sticky Rice + Peanut Butter Sour
  'mango-sticky-rice:peanut': {
    pairKey: 'mango-sticky-rice:peanut',
    name: 'TROPICAL SATAY',
    description: 'Lush sweet mango and coconut collide with roasted savory peanut whiskey. Intricately complex.',
    type: 'vortex',
    primaryColor: hexStringToNum('#FFB347'),
    secondaryColor: hexStringToNum('#8B5E3C'),
    particleCount: 16,
    speed: 1.0,
    intensity: 0.7,
    glow: true,
    customParams: { angleOffset: 45 }
  },

  // 13. Mango Sticky Rice + Pistachio Gelato
  'mango-sticky-rice:pistachio': {
    pairKey: 'mango-sticky-rice:pistachio',
    name: 'EXOTIC SUNSET',
    description: 'Silky pistachio butter pairs with golden coconut mango. Colorful, breezy, and fragrant.',
    type: 'blossom',
    primaryColor: hexStringToNum('#FFD700'),
    secondaryColor: hexStringToNum('#93C572'),
    particleCount: 20,
    speed: 1.1,
    intensity: 0.68,
    glow: true,
    customParams: { blossomScale: 1.2 }
  },

  // 14. Mango Sticky Rice + Strawberry Cheesecake
  'mango-sticky-rice:strawberry-cheesecake': {
    pairKey: 'mango-sticky-rice:strawberry-cheesecake',
    name: 'TROPICAL MELBA',
    description: 'Sweet strawberry puree meets lush golden mango coconut. A sun-soaked berry splash.',
    type: 'ribbon',
    primaryColor: hexStringToNum('#FFB347'),
    secondaryColor: hexStringToNum('#E91E63'),
    particleCount: 20,
    speed: 1.25,
    intensity: 0.75,
    glow: true,
    customParams: { frequency: 0.05, height: 40 }
  },

  // 15. Mango Sticky Rice + Tangyuan
  'mango-sticky-rice:tangyuan': {
    pairKey: 'mango-sticky-rice:tangyuan',
    name: 'FESTIVAL OF SUNS',
    description: 'Fizzy sesame-ginger syrup poured over sweet golden coconut mango rice. Exuberant!',
    type: 'sparkle',
    primaryColor: hexStringToNum('#FFD700'),
    secondaryColor: hexStringToNum('#F8F4E3'),
    particleCount: 28,
    speed: 1.4,
    intensity: 0.8,
    glow: true,
    customParams: { sparkleSize: 3.5 }
  },

  // 16. Peanut Butter Sour + Pistachio Gelato
  'peanut:pistachio': {
    pairKey: 'peanut:pistachio',
    name: 'DOUBLE NUT HARMONY',
    description: 'Earthy buttered pistachio combines with rich, salty peanut-washed whiskey. Deeply savory.',
    type: 'orbit',
    primaryColor: hexStringToNum('#D4A574'),
    secondaryColor: hexStringToNum('#93C572'),
    particleCount: 15,
    speed: 0.9,
    intensity: 0.65,
    glow: true,
    customParams: { sizeRatio: 0.7, ringCount: 3 }
  },

  // 17. Peanut Butter Sour + Strawberry Cheesecake
  'peanut:strawberry-cheesecake': {
    pairKey: 'peanut:strawberry-cheesecake',
    name: 'PB & JELLY',
    description: 'The ultimate childhood combo! Sweet strawberry jam meets decadent peanut butter whiskey.',
    type: 'pulse',
    primaryColor: hexStringToNum('#E91E63'),
    secondaryColor: hexStringToNum('#8B5E3C'),
    particleCount: 22,
    speed: 1.2,
    intensity: 0.9,
    glow: true,
    customParams: { heartbeat: true, range: 50 }
  },

  // 18. Peanut Butter Sour + Tangyuan
  'peanut:tangyuan': {
    pairKey: 'peanut:tangyuan',
    name: 'SESAME CRUNCH',
    description: 'Rich toasted peanut butter is layered with fizzy ginger sesame. Warmly nutty and sparkling.',
    type: 'magnetic',
    primaryColor: hexStringToNum('#D4A574'),
    secondaryColor: hexStringToNum('#8D6E63'),
    particleCount: 18,
    speed: 1.1,
    intensity: 0.7,
    glow: true,
    customParams: { lineCount: 4 }
  },

  // 19. Pistachio Gelato + Strawberry Cheesecake
  'pistachio:strawberry-cheesecake': {
    pairKey: 'pistachio:strawberry-cheesecake',
    name: 'BERRY ROYALE',
    description: 'Silky pistachio green biscuit meets lush cream cheese and strawberry. Elegant and regal.',
    type: 'blossom',
    primaryColor: hexStringToNum('#93C572'),
    secondaryColor: hexStringToNum('#E91E63'),
    particleCount: 24,
    speed: 0.95,
    intensity: 0.7,
    glow: true,
    customParams: { bloomDir: 1, depth: 30 }
  },

  // 20. Pistachio Gelato + Tangyuan
  'pistachio:tangyuan': {
    pairKey: 'pistachio:tangyuan',
    name: 'ORIENTAL GARDEN',
    description: 'Fizzy warm sesame ginger over cool, buttery pistachio biscuit wine. Refreshing and poetic.',
    type: 'aurora',
    primaryColor: hexStringToNum('#93C572'),
    secondaryColor: hexStringToNum('#FFF8E7'),
    particleCount: 16,
    speed: 1.0,
    intensity: 0.65,
    glow: true,
    customParams: { skew: 0.2 }
  },

  // 21. Strawberry Cheesecake + Tangyuan
  'strawberry-cheesecake:tangyuan': {
    pairKey: 'strawberry-cheesecake:tangyuan',
    name: 'FESTIVAL ROSÉ',
    description: 'Warm sesame-ginger bubbles rising through luxurious cream cheese strawberry fields.',
    type: 'sparkle',
    primaryColor: hexStringToNum('#E91E63'),
    secondaryColor: hexStringToNum('#F8F4E3'),
    particleCount: 30,
    speed: 1.35,
    intensity: 0.85,
    glow: true,
    customParams: { riseSpeed: -1.5, sparkleWiggle: 2 }
  }
}

// Fallback synergy when same-drink pairs occur (e.g. apple-tart + apple-tart)
export function getFallbackSynergy(drinkId: string, name: string, colorsStr: [string, string, string]): SynergyConfig {
  const colors = colorsStr.map(hexStringToNum) as [number, number, number]
  return {
    pairKey: `${drinkId}:${drinkId}`,
    name: `${name} DUET`,
    description: `A double-dose harmony of ${name}. Amplified vibes and synchronized resonances.`,
    type: 'pulse',
    primaryColor: colors[0],
    secondaryColor: colors[1] ?? colors[0],
    particleCount: 20,
    speed: 1.0,
    intensity: 0.8,
    glow: true,
    customParams: { frequency: 1.5, sameDrink: true }
  }
}
