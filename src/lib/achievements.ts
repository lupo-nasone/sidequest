import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SB = SupabaseClient<Database>

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  xp_bonus: number
  category: string
}

export async function checkAndAwardAchievements(
  supabase: SB,
  userId: string,
  trigger: 'sidequest_published' | 'friend_added' | 'like_received',
  meta?: { sidequestId?: string }
): Promise<AchievementDef[]> {
  const earned: AchievementDef[] = []

  // Existing achievements
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  const have = new Set((existing || []).map(r => r.achievement_id))

  async function award(id: string) {
    if (have.has(id)) return
    const { data: ach } = await supabase.from('achievements').select('*').eq('id', id).single()
    if (!ach) return
    const { error } = await supabase.from('user_achievements').insert({ user_id: userId, achievement_id: id })
    if (!error) {
      earned.push(ach as AchievementDef)
      have.add(id)
      if (ach.xp_bonus > 0) {
        await supabase.rpc('update_user_xp', { p_user_id: userId, p_xp_delta: ach.xp_bonus })
      }
    }
  }

  if (trigger === 'sidequest_published') {
    const { count } = await supabase
      .from('sidequests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_published', true)
    const n = count || 0

    if (n >= 1) await award('first_quest')
    if (n >= 5) await award('five_quests')
    if (n >= 10) await award('ten_quests')
    if (n >= 20) await award('twenty_quests')

    // Check current sidequest details
    if (meta?.sidequestId) {
      const { data: sq } = await supabase
        .from('sidequests')
        .select('*, sidequest_media(*)')
        .eq('id', meta.sidequestId)
        .single()

      if (sq) {
        if (sq.sidequest_media?.length > 0) await award('with_photo')
        if (sq.location) await award('explorer')
        if (sq.description && sq.description.length >= 200) await award('storyteller')
        if (sq.ai_rating && sq.ai_rating >= 9) await award('epic_rating')
        if (sq.xp_earned >= 500) await award('single_500xp')

        const hour = new Date(sq.happened_at).getHours()
        if (hour >= 0 && hour < 6) await award('night_owl')
      }
    }

    // XP milestones
    const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', userId).single()
    if (profile) {
      if (profile.total_xp >= 100) await award('xp_100')
      if (profile.total_xp >= 500) await award('xp_500')
      if (profile.total_xp >= 1000) await award('xp_1000')
      if (profile.total_xp >= 5000) await award('xp_5000')
    }
  }

  if (trigger === 'friend_added') {
    const { count } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    const n = count || 0
    if (n >= 1) await award('first_friend')
    if (n >= 5) await award('five_friends')
  }

  if (trigger === 'like_received') {
    await award('first_like')
  }

  return earned
}
