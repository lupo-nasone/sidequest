'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck, UserX, Clock } from 'lucide-react'
import type { Friendship } from '@/types/database'

interface FriendButtonProps {
  currentUserId: string
  targetUserId: string
  initialFriendship: Friendship | null
}

export default function FriendButton({ currentUserId, targetUserId, initialFriendship }: FriendButtonProps) {
  const [friendship, setFriendship] = useState<Friendship | null>(initialFriendship)
  const [loading, setLoading] = useState(false)

  async function sendRequest() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('friendships')
      .insert({ requester_id: currentUserId, addressee_id: targetUserId })
      .select()
      .single()
    if (data) setFriendship(data)
    setLoading(false)
  }

  async function acceptRequest() {
    if (!friendship) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendship.id)
      .select()
      .single()
    if (data) setFriendship(data)
    setLoading(false)
  }

  async function removeFriend() {
    if (!friendship) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('friendships').delete().eq('id', friendship.id)
    setFriendship(null)
    setLoading(false)
  }

  if (!friendship) {
    return (
      <button
        onClick={sendRequest}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
      >
        <UserPlus className="w-4 h-4" /> Aggiungi amico
      </button>
    )
  }

  if (friendship.status === 'pending') {
    // If current user sent the request
    if (friendship.requester_id === currentUserId) {
      return (
        <button
          onClick={removeFriend}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 text-sm font-medium py-2 rounded-xl transition-colors"
        >
          <Clock className="w-4 h-4" /> Richiesta inviata
        </button>
      )
    }
    // If current user received the request
    return (
      <div className="flex-1 flex gap-2">
        <button
          onClick={acceptRequest}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
        >
          <UserCheck className="w-4 h-4" /> Accetta
        </button>
        <button
          onClick={removeFriend}
          disabled={loading}
          className="px-4 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 text-sm font-medium py-2 rounded-xl transition-colors"
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={removeFriend}
      disabled={loading}
      className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50 text-zinc-400 text-sm font-medium py-2 rounded-xl transition-colors"
    >
      <UserCheck className="w-4 h-4" /> Amici
    </button>
  )
}
