import type { Achievement } from '@/types/database'

interface AchievementBadgeProps {
  achievement: Achievement
  earned?: boolean
}

export default function AchievementBadge({ achievement: a, earned = true }: AchievementBadgeProps) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      earned
        ? 'bg-zinc-800/80 border-zinc-700'
        : 'bg-zinc-900/40 border-zinc-800/40 opacity-40'
    }`}>
      <span className="text-2xl">{a.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${earned ? 'text-white' : 'text-zinc-500'}`}>{a.name}</p>
        <p className="text-xs text-zinc-500 line-clamp-1">{a.description}</p>
      </div>
      {a.xp_bonus > 0 && earned && (
        <span className="text-xs font-bold text-orange-400 flex-shrink-0">+{a.xp_bonus} XP</span>
      )}
    </div>
  )
}
