'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, X, Check } from 'lucide-react'
import type { Profile } from '@/types/database'

interface CollabPickerProps {
  sidequestId: string
  onDone: () => void
}

export default function CollabPicker({ sidequestId, onDone }: CollabPickerProps) {
  const [friends, setFriends] = useState<Profile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function loadFriends() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: friendships } = await supabase.from('friendships').select('requester_id, addressee_id')
        .eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      const ids = (friendships || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      if (!ids.length) return

      const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids).order('username')
      setFriends(profiles || [])
    }
    loadFriends()
  }, [])

  async function invite() {
    if (!selected) return
    setSending(true)
    await fetch('/api/collab-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidequestId, invitedUserId: selected }),
    })
    setSent(true)
    setSending(false)
  }

  if (sent) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
        <Check className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
        <p className="text-sm text-emerald-400 font-semibold">Invito inviato!</p>
        <p className="text-xs text-zinc-500 mt-0.5">Il tuo amico riceverà una notifica nella pagina Amici</p>
        <button onClick={onDone} className="text-xs text-zinc-400 hover:text-white mt-3 underline">Continua</button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Invita un amico in co-op</h3>
        <span className="text-xs text-zinc-500 ml-auto">(opzionale)</span>
      </div>

      {friends.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-2">Nessun amico ancora. Aggiungine nella pagina Amici!</p>
      ) : (
        <div className="space-y-2 mb-4">
          {friends.map(f => (
            <button key={f.id} onClick={() => setSelected(selected === f.id ? null : f.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                selected === f.id ? 'bg-orange-500/15 border-orange-500/40' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
              }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(f.display_name || f.username)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{f.display_name || f.username}</p>
                <p className="text-xs text-zinc-500">Lv.{f.level} · {f.total_xp} XP</p>
              </div>
              {selected === f.id && <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onDone} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">
          Salta
        </button>
        {selected && (
          <button onClick={invite} disabled={sending}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
            {sending ? 'Invio...' : 'Invita'}
          </button>
        )}
      </div>
    </div>
  )
}
