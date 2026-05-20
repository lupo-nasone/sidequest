import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sidequestId, invitedUserId } = await req.json()
  if (!sidequestId || !invitedUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Verify friendship
  const { data: friendship } = await supabase.from('friendships').select('id').eq('status', 'accepted')
    .or(`and(requester_id.eq.${user.id},addressee_id.eq.${invitedUserId}),and(requester_id.eq.${invitedUserId},addressee_id.eq.${user.id})`)
    .maybeSingle()
  if (!friendship) return NextResponse.json({ error: 'Not friends' }, { status: 403 })

  const { error } = await supabase.from('sidequest_collabs').insert({ sidequest_id: sidequestId, invited_user_id: invitedUserId })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
