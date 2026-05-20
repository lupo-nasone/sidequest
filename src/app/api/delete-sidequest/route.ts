import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sidequestId } = await req.json()
  if (!sidequestId) return NextResponse.json({ error: 'Missing sidequestId' }, { status: 400 })

  // Fetch media to delete from storage
  const { data: sq } = await supabase
    .from('sidequests')
    .select('*, sidequest_media(*)')
    .eq('id', sidequestId)
    .eq('user_id', user.id)
    .single()

  if (!sq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Remove XP from user
  if (sq.xp_earned > 0) {
    await supabase.rpc('update_user_xp', {
      p_user_id: user.id,
      p_xp_delta: -sq.xp_earned,
    })
  }

  // Delete storage files
  const paths = sq.sidequest_media.map((m: { storage_path: string }) => m.storage_path)
  if (paths.length > 0) {
    await supabase.storage.from('sidequest-media').remove(paths)
  }

  // Delete sidequest (cascades to media, likes, comments)
  await supabase.from('sidequests').delete().eq('id', sidequestId)

  return NextResponse.json({ ok: true })
}
