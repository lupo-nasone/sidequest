'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'
import type { Profile, Friendship } from '@/types/database'
import FriendButton from './FriendButton'

interface SearchResult extends Profile {
  friendship: Friendship | null
  isFriendOfFriend?: boolean
}

interface SearchUsersProps {
  currentUserId: string
  friendIds: string[]
}

export default function SearchUsers({ currentUserId, friendIds }: SearchUsersProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // Load suggestions on mount
  useEffect(() => {
    async function loadSuggestions() {
      const supabase = createClient()

      // Get friendship map for current user
      const { data: friendships } = await supabase.from('friendships').select('*')
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      const friendMap = new Map<string, Friendship>()
      for (const f of (friendships || [])) {
        const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
        friendMap.set(otherId, f)
      }

      let friendsOfFriends: SearchResult[] = []

      // Friends of friends: get friends of each friend
      if (friendIds.length > 0) {
        const { data: fofFriendships } = await supabase.from('friendships').select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(friendIds.map(id => `requester_id.eq.${id},addressee_id.eq.${id}`).join(','))

        const fofIds = new Set<string>()
        for (const f of (fofFriendships || [])) {
          const a = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
          const b = friendIds.includes(f.requester_id) ? f.addressee_id : f.requester_id
          if (a !== currentUserId && !friendIds.includes(a)) fofIds.add(a)
          if (b !== currentUserId && !friendIds.includes(b)) fofIds.add(b)
        }

        if (fofIds.size > 0) {
          const { data: fofProfiles } = await supabase.from('profiles').select('*')
            .in('id', Array.from(fofIds)).order('total_xp', { ascending: false }).limit(8)
          friendsOfFriends = (fofProfiles || []).map(u => ({
            ...u, friendship: friendMap.get(u.id) || null, isFriendOfFriend: true,
          }))
        }
      }

      // Top users by XP as fallback
      const { data: topUsers } = await supabase.from('profiles').select('*')
        .neq('id', currentUserId)
        .not('id', 'in', `(${[...friendIds, ...friendsOfFriends.map(u => u.id), currentUserId].join(',') || currentUserId})`)
        .order('total_xp', { ascending: false }).limit(6)

      const topResults: SearchResult[] = (topUsers || []).map(u => ({
        ...u, friendship: friendMap.get(u.id) || null, isFriendOfFriend: false,
      }))

      setSuggestions([...friendsOfFriends, ...topResults])
    }
    loadSuggestions()
  }, [currentUserId, friendIds])

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const supabase = createClient()

    const { data: users } = await supabase.from('profiles').select('*').neq('id', currentUserId)
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(8)

    const { data: friendships } = await supabase.from('friendships').select('*')
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
    const friendMap = new Map<string, Friendship>()
    for (const f of (friendships || [])) {
      const otherId = f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      friendMap.set(otherId, f)
    }

    setResults((users || []).map(u => ({ ...u, friendship: friendMap.get(u.id) || null })))
    setSearching(false)
  }

  const displayList = query.length >= 2 ? results : suggestions
  const showSuggestionHeader = query.length < 2 && suggestions.length > 0

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input type="text" value={query} onChange={e => handleSearch(e.target.value)}
          placeholder="Cerca utenti per username..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors" />
      </div>

      {searching && <p className="text-zinc-500 text-sm mb-2">Ricerca...</p>}

      {showSuggestionHeader && (
        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-2 px-1">
          💡 Amici di amici e utenti top
        </p>
      )}

      {displayList.length > 0 && (
        <div className="space-y-2">
          {displayList.map(u => (
            <div key={u.id} className={`border rounded-xl p-3 flex items-center gap-3 ${
              u.isFriendOfFriend ? 'bg-orange-500/5 border-orange-500/20' : 'bg-zinc-900 border-zinc-800'
            }`}>
              <Link href={`/profile/${u.username}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(u.display_name || u.username)[0].toUpperCase()}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link href={`/profile/${u.username}`} className="font-semibold text-sm text-white hover:text-orange-400 transition-colors truncate">
                    {u.display_name || u.username}
                  </Link>
                  {u.isFriendOfFriend && <span className="text-xs text-orange-400 flex-shrink-0">amico di amico</span>}
                </div>
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
