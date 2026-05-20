'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Check, X, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CollabRequest {
  id: string
  sidequest_id: string
  status: string
  sidequests: {
    title: string
    xp_earned: number
    profiles: { username: string; display_name: string | null }
  }
}

export default function CollabRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<CollabRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { xp: number; leveledUp: boolean }>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('sidequest_collabs')
        .select('*, sidequests(title, xp_earned, profiles(username, display_name))')
        .eq('invited_user_id', userId).eq('status', 'pending')
      setRequests((data || []) as unknown as CollabRequest[])
      setLoading(false)
    }
    load()
  }, [userId])

  async function respond(collabId: string, accept: boolean) {
    setResponding(collabId)
    const res = await fetch('/api/collab-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collabId, accept }),
    })
    const data = await res.json()
    if (accept && data.xpEarned) {
      setResults(prev => ({ ...prev, [collabId]: { xp: data.xpEarned, leveledUp: data.leveledUp } }))
    }
    setRequests(prev => prev.filter(r => r.id !== collabId))
    setResponding(null)
  }

  if (loading || requests.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-orange-400" /> Richieste co-op ({requests.length})
      </h2>
      <div className="space-y-2">
        {requests.map(r => {
          const result = results[r.id]
          const author = r.sidequests?.profiles
          const halfXP = Math.round((r.sidequests?.xp_earned || 50) / 2)

          if (result) {
            return (
              <div key={r.id} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-sm text-emerald-400 font-semibold">
                  ✓ Co-op accettata! +{result.xp} XP guadagnati
                  {result.leveledUp && ' 🎉 LEVEL UP!'}
                </p>
              </div>
            )
          }

          return (
            <div key={r.id} className="bg-zinc-900 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(author?.display_name || author?.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <Link href={`/profile/${author?.username}`} className="font-semibold hover:text-orange-400">
                      {author?.display_name || author?.username}
                    </Link>
                    {' '}ti ha invitato in co-op
                  </p>
                  <Link href={`/sidequest/${r.sidequest_id}`} className="text-sm text-orange-400 hover:text-orange-300 font-medium">
                    {r.sidequests?.title}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Accettando guadagni ~{halfXP} XP
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => respond(r.id, true)} disabled={responding === r.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                  <Check className="w-4 h-4" /> Accetta
                  <span className="text-xs opacity-80"><Zap className="w-3 h-3 inline" />+{halfXP} XP</span>
                </button>
                <button onClick={() => respond(r.id, false)} disabled={responding === r.id}
                  className="px-4 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-400 text-sm py-2 rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
