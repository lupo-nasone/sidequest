'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import type { Profile, Friendship } from '@/types/database'
import FriendButton from './FriendButton'

interface SearchResult extends Profile {
  friendship: Friendship | null
}

export default function SearchUsers({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const supabase = createClient()

    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(5)

    if (!users) { setSearching(false); return }

    const { data: friendships } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)

    const friendMap = new Map<string, Friendship>()
    for (const f of (friendships || [])) {
      const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      friendMap.set(otherId, f)
    }

    setResults(users.map(u => ({ ...u, friendship: friendMap.get(u.id) || null })))
    setSearching(false)
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Cerca utenti per username..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      {searching && <p className="text-zinc-500 text-sm mt-2">Ricerca...</p>}

      {results.length > 0 && (
        <div className="mt-2 space-y-2">
          {results.map(u => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
              <Link href={`/profile/${u.username}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {(u.display_name || u.username)[0].toUpperCase()}
                </div>
              </Link>
              <div className="flex-1">
                <Link href={`/profile/${u.username}`} className="font-semibold text-sm text-white hover:text-orange-400 transition-colors">
                  {u.display_name || u.username}
                </Link>
                <p className="text-xs text-orange-400">Lv.{u.level} · {u.total_xp} XP</p>
              </div>
              <FriendButton currentUserId={currentUserId} targetUserId={u.id} initialFriendship={u.friendship} />
            </div>
          ))}
        </div>
      )}

      {!searching && query.length >= 2 && results.length === 0 && (
        <p className="text-zinc-600 text-sm mt-2">Nessun utente trovato.</p>
      )}
    </div>
  )
}
