export interface LevelDef {
  level: number
  xpRequired: number
  title: string
  icon: string
  frameColor: string | null  // CSS class for avatar border
  xpMultiplier: number       // e.g. 1.10 = +10% XP
  reward: string | null
  rewardIcon: string | null
}

export const LEVELS: LevelDef[] = [
  { level: 1,  xpRequired: 0,     title: 'Novice Adventurer',  icon: '🌱', frameColor: null,                    xpMultiplier: 1.00, reward: null,                                  rewardIcon: null },
  { level: 2,  xpRequired: 100,   title: 'Wanderer',           icon: '👟', frameColor: null,                    xpMultiplier: 1.02, reward: '+2% XP bonus su ogni sidequest',      rewardIcon: '⚡' },
  { level: 3,  xpRequired: 400,   title: 'Quest Seeker',       icon: '🗺️', frameColor: 'frame-bronze',           xpMultiplier: 1.05, reward: 'Cornice Bronze sul profilo',          rewardIcon: '🥉' },
  { level: 4,  xpRequired: 900,   title: 'Trailblazer',        icon: '🔥', frameColor: 'frame-bronze',           xpMultiplier: 1.08, reward: '+8% XP su ogni sidequest',           rewardIcon: '⚡' },
  { level: 5,  xpRequired: 1600,  title: 'Explorer',           icon: '🧭', frameColor: 'frame-silver',           xpMultiplier: 1.12, reward: 'Cornice Silver sul profilo',          rewardIcon: '🥈' },
  { level: 6,  xpRequired: 2500,  title: 'Veteran Wanderer',   icon: '⚔️', frameColor: 'frame-silver',           xpMultiplier: 1.15, reward: 'Cornice Silver sul profilo',          rewardIcon: '🥈' },
  { level: 7,  xpRequired: 3600,  title: 'Daring Soul',        icon: '💥', frameColor: 'frame-silver',           xpMultiplier: 1.20, reward: '+20% XP su ogni sidequest',          rewardIcon: '📈' },
  { level: 8,  xpRequired: 4900,  title: 'Legendary Wanderer', icon: '🏆', frameColor: 'frame-gold',             xpMultiplier: 1.25, reward: 'Cornice Gold sul profilo',            rewardIcon: '🥇' },
  { level: 9,  xpRequired: 6400,  title: 'Epic Adventurer',    icon: '⚡', frameColor: 'frame-gold',             xpMultiplier: 1.30, reward: '+30% XP su ogni sidequest',          rewardIcon: '🚀' },
  { level: 10, xpRequired: 8100,  title: 'Mythic Hero',        icon: '👑', frameColor: 'frame-platinum',         xpMultiplier: 1.40, reward: 'Cornice Platinum + titolo esclusivo', rewardIcon: '💎' },
  { level: 12, xpRequired: 11664, title: 'Living Legend',      icon: '🌟', frameColor: 'frame-platinum',         xpMultiplier: 1.50, reward: '+50% XP — sei una leggenda',         rewardIcon: '🌟' },
  { level: 15, xpRequired: 19600, title: 'Transcendent',       icon: '🌈', frameColor: 'frame-rainbow',          xpMultiplier: 1.75, reward: 'Cornice Arcobaleno — rarità assoluta', rewardIcon: '🌈' },
  { level: 20, xpRequired: 36100, title: 'God of Sidequests',  icon: '🔱', frameColor: 'frame-rainbow',          xpMultiplier: 2.00, reward: 'XP x2 per sempre. Sei un dio.',       rewardIcon: '🔱' },
]

export function getLevelDef(level: number): LevelDef {
  let def = LEVELS[0]
  for (const l of LEVELS) {
    if (level >= l.level) def = l
    else break
  }
  return def
}

export function getNextLevelDef(level: number): LevelDef | null {
  for (const l of LEVELS) {
    if (l.level > level) return l
  }
  return null
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100
}

export function levelFromXP(xp: number): number {
  return 1 + Math.floor(Math.sqrt(xp / 100))
}

export function getXPMultiplier(level: number): number {
  return getLevelDef(level).xpMultiplier
}

export function xpProgress(totalXP: number): { current: number; needed: number; progress: number; level: number } {
  const level = levelFromXP(totalXP)
  const xpCurrent = xpForLevel(level)
  const xpNext = xpForLevel(level + 1)
  return {
    level,
    current: totalXP - xpCurrent,
    needed: xpNext - xpCurrent,
    progress: ((totalXP - xpCurrent) / (xpNext - xpCurrent)) * 100,
  }
}
