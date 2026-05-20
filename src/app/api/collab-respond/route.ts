import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndAwardAchievements } from '@/lib/achievements'
import { getXPMultiplier, levelFromXP } from '@/lib/levels'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { collabId, accept } = await req.json()
  if (!collabId) return NextResponse.json({ error: 'Missing collabId' }, { status: 400 })

  const { data: collab } = await supabase.from('sidequest_collabs').select('*, sidequests(*)').eq('id', collabId).eq('invited_user_id', user.id).single()
  if (!collab) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const status = accept ? 'accepted' : 'declined'
  await supabase.from('sidequest_collabs').update({ status }).eq('id', collabId)

  if (accept) {
    // Award co-author half the XP of the sidequest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sq = collab.sidequests as unknown as { xp_earned: number }
    const halfXP = Math.round((sq?.xp_earned || 50) / 2)

    const { data: profile } = await supabase.from('profiles').select('level').eq('id', user.id).single()
    const multiplier = getXPMultiplier(profile?.level ?? 1)
    const finalXP = Math.round(halfXP * multiplier)

    await supabase.rpc('update_user_xp', { p_user_id: user.id, p_xp_delta: finalXP })

    const { data: updated } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single()
    const newLevel = levelFromXP(updated?.total_xp ?? 0)
    const leveledUp = newLevel > (profile?.level ?? 1)

    await checkAndAwardAchievements(supabase, user.id, 'sidequest_published', { sidequestId: collab.sidequest_id })

    return NextResponse.json({ ok: true, xpEarned: finalXP, leveledUp, newLevel: leveledUp ? newLevel : null })
  }

  return NextResponse.json({ ok: true })
}
