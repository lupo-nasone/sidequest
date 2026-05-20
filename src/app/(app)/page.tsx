import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidequestCard from '@/components/SidequestCard'
import type { SidequestWithProfile } from '@/types/database'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get accepted friend IDs
  const { data: friendships } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships || []).map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )
  const feedUserIds = [user.id, ...friendIds]

  // Fetch sidequests with all related data
  const { data: rawSidequests } = await supabase
    .from('sidequests')
    .select(`
      *,
      profiles(*),
      sidequest_media(*),
      likes(id, user_id),
      comments(id)
    `)
    .in('user_id', feedUserIds)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(30)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sidequests: SidequestWithProfile[] = (rawSidequests as any[] || []).map((sq: any) => ({
    ...sq,
    likes_count: sq.likes?.length || 0,
    comments_count: sq.comments?.length || 0,
    user_has_liked: (sq.likes || []).some((l: { user_id: string }) => l.user_id === user.id),
  }))

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-5">Feed</h1>

      {sidequests.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⚔️</p>
          <p className="text-zinc-400 mb-2">Nessuna sidequest nel tuo feed.</p>
          <p className="text-zinc-600 text-sm">Aggiungi amici o pubblica la tua prima avventura!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sidequests.map(sq => (
            <SidequestCard key={sq.id} sidequest={sq} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  )
}
