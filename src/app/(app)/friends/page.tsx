import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FriendButton from '@/components/FriendButton'
import SearchUsers from '@/components/SearchUsers'
import CollabRequests from '@/components/CollabRequests'
import { Trophy } from 'lucide-react'
import type { Friendship, Profile } from '@/types/database'

interface FriendWithProfile extends Friendship {
  requester: Profile
  addressee: Profile
}

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawFriendships } = await supabase
    .from('friendships')
    .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const friendships = (rawFriendships || []) as unknown as FriendWithProfile[]
  const accepted = friendships.filter(f => f.status === 'accepted')
  const pendingReceived = friendships.filter(f => f.status === 'pending' && f.addressee_id === user.id)
  const friendIds = accepted.map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Amici</h1>

      <SearchUsers currentUserId={user.id} friendIds={friendIds} />

      {/* Pending friend requests */}
      {pendingReceived.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Richieste amicizia ({pendingReceived.length})
          </h2>
          <div className="space-y-2">
            {pendingReceived.map(f => {
              const friend = f.requester
              return (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                  <Link href={`/profile/${friend.username}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {(friend.display_name || friend.username)[0].toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${friend.username}`} className="font-semibold text-white hover:text-orange-400 transition-colors">
                      {friend.display_name || friend.username}
                    </Link>
                    <p className="text-xs text-orange-400">Lv.{friend.level} · {friend.total_xp} XP</p>
                  </div>
                  <FriendButton currentUserId={user.id} targetUserId={friend.id} initialFriendship={f} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Co-op requests */}
      <CollabRequests userId={user.id} />

      {/* Friends list */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          I tuoi amici ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4 text-center">Nessun amico ancora.</p>
        ) : (
          <div className="space-y-2">
            {accepted.map(f => {
              const friend = f.requester_id === user.id ? f.addressee : f.requester
              return (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                  <Link href={`/profile/${friend.username}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {(friend.display_name || friend.username)[0].toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${friend.username}`} className="font-semibold text-white hover:text-orange-400 transition-colors">
                      {friend.display_name || friend.username}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Trophy className="w-3 h-3 text-orange-500" />
                      <span className="text-orange-400">Lv.{friend.level}</span>
                      <span>·</span>
                      <span>{friend.total_xp} XP</span>
                    </div>
                  </div>
                  <FriendButton currentUserId={user.id} targetUserId={friend.id} initialFriendship={f} />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
