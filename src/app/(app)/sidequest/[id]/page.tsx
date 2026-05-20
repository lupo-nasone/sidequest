import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SidequestCard from '@/components/SidequestCard'
import CommentSection from '@/components/CommentSection'
import type { SidequestWithProfile } from '@/types/database'

export default async function SidequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: raw } = await supabase
    .from('sidequests')
    .select(`
      *,
      profiles(*),
      sidequest_media(*),
      likes(id, user_id),
      comments(*, profiles(username, display_name)),
      vouches(id, user_id)
    `)
    .eq('id', id)
    .single()

  if (!raw) return notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any
  const sidequest: SidequestWithProfile = {
    ...r,
    likes_count: r.likes?.length || 0,
    comments_count: r.comments?.length || 0,
    vouches_count: r.vouches?.length || 0,
    user_has_liked: (r.likes || []).some((l: { user_id: string }) => l.user_id === user.id),
    user_has_vouched: (r.vouches || []).some((v: { user_id: string }) => v.user_id === user.id),
    is_verified: (r.vouches?.length || 0) >= 2,
  }

  return (
    <div className="space-y-4">
      <SidequestCard sidequest={sidequest} currentUserId={user.id} />
      <CommentSection
        sidequestId={id}
        comments={r.comments || []}
        currentUserId={user.id}
      />
    </div>
  )
}
