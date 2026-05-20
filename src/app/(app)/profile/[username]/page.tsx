import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, Star, Trophy } from 'lucide-react'
import type { SidequestWithProfile, Achievement } from '@/types/database'
import SidequestCard from '@/components/SidequestCard'
import FriendButton from '@/components/FriendButton'
import Avatar from '@/components/Avatar'
import AchievementBadge from '@/components/AchievementBadge'
import XPModal from '@/components/XPModal'

function getLevelTitle(level: number): string {
  if (level < 3) return 'Novice Adventurer'
  if (level < 6) return 'Quest Seeker'
  if (level < 10) return 'Seasoned Explorer'
  if (level < 15) return 'Legendary Wanderer'
  return 'Mythic Hero'
}

function xpForNextLevel(currentXP: number): { current: number; needed: number; progress: number } {
  const level = 1 + Math.floor(Math.sqrt(currentXP / 100))
  const xpForCurrent = Math.pow(level - 1, 2) * 100
  const xpForNext = Math.pow(level, 2) * 100
  return {
    current: currentXP - xpForCurrent,
    needed: xpForNext - xpForCurrent,
    progress: ((currentXP - xpForCurrent) / (xpForNext - xpForCurrent)) * 100,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('username', username).single()
  if (!profile) return notFound()

  const isOwnProfile = user.id === profile.id

  const [{ data: raw }, { data: rawFriendship }, { data: allAchievements }, { data: earnedRaw }] = await Promise.all([
    supabase.from('sidequests').select('*, profiles(*), sidequest_media(*), likes(id, user_id), comments(id)')
      .eq('user_id', profile.id).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('friendships').select('*')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`)
      .maybeSingle(),
    supabase.from('achievements').select('*').order('category').order('xp_bonus'),
    supabase.from('user_achievements').select('achievement_id').eq('user_id', profile.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidequests: SidequestWithProfile[] = ((raw as any[]) || []).map((sq: any) => ({
    ...sq,
    likes_count: sq.likes?.length || 0,
    comments_count: sq.comments?.length || 0,
    user_has_liked: (sq.likes || []).some((l: { user_id: string }) => l.user_id === user.id),
  }))

  const earnedIds = new Set((earnedRaw || []).map(r => r.achievement_id))
  const achievements = (allAchievements || []) as Achievement[]
  const earnedAchievements = achievements.filter(a => earnedIds.has(a.id))
  const unearnedAchievements = achievements.filter(a => !earnedIds.has(a.id))

  const xp = xpForNextLevel(profile.total_xp)
  const totalLikes = sidequests.reduce((sum, sq) => sum + sq.likes_count, 0)
  const bestXP = sidequests.length > 0 ? Math.max(...sidequests.map(s => s.xp_earned)) : 0
  const bestRating = sidequests.filter(s => s.ai_rating).length > 0
    ? Math.max(...sidequests.filter(s => s.ai_rating).map(s => s.ai_rating || 0))
    : null

  return (
    <div>
      {/* Profile header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <Avatar profile={profile} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{profile.display_name || profile.username}</h1>
            <p className="text-zinc-500 text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-zinc-300 text-sm mt-1">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-white font-bold">{sidequests.length}</p>
                <p className="text-xs text-zinc-500">Quest</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{totalLikes}</p>
                <p className="text-xs text-zinc-500">Like</p>
              </div>
              <div className="text-center">
                <p className="text-orange-400 font-bold">{profile.total_xp}</p>
                <p className="text-xs text-zinc-500">XP</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 font-bold">{earnedIds.size}</p>
                <p className="text-xs text-zinc-500">Ach.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Level bar */}
        <div className="mt-5">
          <XPModal totalXP={profile.total_xp} currentLevel={profile.level}>
            <div className="flex items-center justify-between mb-1.5 w-full">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-white">Lv.{profile.level}</span>
                <span className="text-xs text-zinc-500">{getLevelTitle(profile.level)}</span>
              </div>
              <span className="text-xs text-zinc-500 hover:text-orange-400 transition-colors">{xp.current}/{xp.needed} XP ↗</span>
            </div>
          </XPModal>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, xp.progress)}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {!isOwnProfile && (
            <FriendButton currentUserId={user.id} targetUserId={profile.id} initialFriendship={rawFriendship || null} />
          )}
          {isOwnProfile && (
            <Link href="/profile/edit"
              className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-2 rounded-xl transition-colors">
              Modifica profilo
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {sidequests.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Best XP</span>
            </div>
            <p className="text-2xl font-black text-white">{bestXP}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Best Rating</span>
            </div>
            <p className="text-2xl font-black text-white">{bestRating !== null ? `${bestRating.toFixed(1)}/10` : '—'}</p>
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Achievement ({earnedIds.size}/{achievements.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {earnedAchievements.map(a => (
              <AchievementBadge key={a.id} achievement={a} earned />
            ))}
            {unearnedAchievements.map(a => (
              <AchievementBadge key={a.id} achievement={a} earned={false} />
            ))}
          </div>
        </div>
      )}

      {/* Sidequests */}
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Sidequest</h2>
      <div className="space-y-4">
        {sidequests.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-3">⚔️</p>
            <p className="text-zinc-500">Nessuna sidequest ancora.</p>
            {isOwnProfile && (
              <Link href="/new" className="text-orange-400 text-sm mt-1 inline-block hover:text-orange-300">
                Crea la tua prima!
              </Link>
            )}
          </div>
        ) : (
          sidequests.map(sq => (
            <SidequestCard key={sq.id} sidequest={sq} currentUserId={user.id} />
          ))
        )}
      </div>
    </div>
  )
}
