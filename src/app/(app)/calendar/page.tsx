import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarView from '@/components/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get friend IDs
  const { data: friendships } = await supabase
    .from('friendships').select('requester_id, addressee_id').eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const friendIds = (friendships || []).map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  )
  const feedUserIds = [user.id, ...friendIds]

  // Fetch all sidequests for calendar (no limit, just id/title/happened_at/user_id/profile)
  const { data: raw } = await supabase
    .from('sidequests')
    .select('id, title, happened_at, user_id, xp_earned, is_published, vouches(id), profiles(username, display_name, avatar_url, level)')
    .in('user_id', feedUserIds)
    .eq('is_published', true)
    .order('happened_at', { ascending: true })

  const events = (raw || []).map((sq: any) => ({
    id: sq.id,
    title: sq.title,
    happened_at: sq.happened_at,
    user_id: sq.user_id,
    xp_earned: sq.xp_earned,
    is_verified: (sq.vouches?.length || 0) >= 2,
    profile: sq.profiles,
    isOwn: sq.user_id === user.id,
  }))

  const friendProfiles = feedUserIds.length > 1
    ? (raw || []).filter((sq: any) => sq.user_id !== user.id)
        .reduce((acc: any[], sq: any) => {
          if (!acc.find((p: any) => p.id === sq.user_id)) {
            acc.push({ id: sq.user_id, ...sq.profiles })
          }
          return acc
        }, [])
    : []

  return <CalendarView events={events} currentUserId={user.id} friendProfiles={friendProfiles} />
}
