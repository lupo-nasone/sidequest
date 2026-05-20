import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSidequest } from '@/lib/analyze'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sidequestId } = await req.json()
  if (!sidequestId) return NextResponse.json({ error: 'Missing sidequestId' }, { status: 400 })

  const { data: sq } = await supabase
    .from('sidequests')
    .select('*, sidequest_media(*)')
    .eq('id', sidequestId)
    .eq('user_id', user.id)
    .single()

  if (!sq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const imageUrls = sq.sidequest_media
    .filter((m: { media_type: string; url: string }) => m.media_type === 'photo')
    .map((m: { url: string }) => m.url)

  const result = await analyzeSidequest(sq.title, sq.description, imageUrls)

  await supabase
    .from('sidequests')
    .update({
      xp_earned: result.xp,
      ai_analysis: result.analysis,
      ai_rating: result.rating,
    })
    .eq('id', sidequestId)

  // Update XP for each media description
  for (let i = 0; i < result.mediaDescriptions.length; i++) {
    const media = sq.sidequest_media.filter((m: { media_type: string }) => m.media_type === 'photo')[i]
    if (media) {
      await supabase
        .from('sidequest_media')
        .update({ ai_description: result.mediaDescriptions[i] })
        .eq('id', media.id)
    }
  }

  // Update user total XP via RPC
  await supabase.rpc('update_user_xp', {
    p_user_id: user.id,
    p_xp_delta: result.xp,
  })

  return NextResponse.json(result)
}
