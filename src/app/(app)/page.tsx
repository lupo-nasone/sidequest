import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedClient from '@/components/FeedClient'
import type { SidequestWithProfile } from '@/types/database'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: friendships } = await supabase
    .from('friendships').select('requester_id, addressee_id').eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships || []).map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )
  const feedUserIds = [user.id, ...friendIds]

  const { data: rawSidequests } = await supabase
    .from('sidequests')
    .select('*, profiles(*), sidequest_media(*), likes(id, user_id), comments(id), vouches(id, user_id)')
    .in('user_id', feedUserIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(60)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidequests: SidequestWithProfile[] = (rawSidequests as any[] || []).map((sq: any) => ({
    ...sq,
    likes_count: sq.likes?.length || 0,
    comments_count: sq.comments?.length || 0,
    vouches_count: sq.vouches?.length || 0,
    user_has_liked: (sq.likes || []).some((l: { user_id: string }) => l.user_id === user.id),
    user_has_vouched: (sq.vouches || []).some((v: { user_id: string }) => v.user_id === user.id),
    is_verified: (sq.vouches?.length || 0) >= 2,
  }))

  return <FeedClient sidequests={sidequests} currentUserId={user.id} friendIds={friendIds} />
}
