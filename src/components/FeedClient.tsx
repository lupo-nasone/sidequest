'use client'

import { useState, useMemo } from 'react'
import SidequestCard from './SidequestCard'
import type { SidequestWithProfile } from '@/types/database'
import { ShieldCheck } from 'lucide-react'

interface FeedClientProps {
  sidequests: SidequestWithProfile[]
  currentUserId: string
  friendIds: string[]
}

type Filter = 'all' | 'mine' | 'friends' | 'verified'

export default function FeedClient({ sidequests, currentUserId, friendIds }: FeedClientProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    switch (filter) {
      case 'mine':     return sidequests.filter(sq => sq.user_id === currentUserId)
      case 'friends':  return sidequests.filter(sq => friendIds.includes(sq.user_id))
      case 'verified': return sidequests.filter(sq => sq.is_verified)
      default:         return sidequests
    }
  }, [sidequests, filter, currentUserId, friendIds])

  const tabs: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'Tutti' },
    { id: 'mine',     label: 'I miei' },
    { id: 'friends',  label: 'Amici' },
    { id: 'verified', label: '✓ Verificate' },
  ]

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === tab.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">⚔️</p>
          <p className="text-zinc-400 mb-1">Nessuna sidequest qui.</p>
          {filter === 'verified' && (
            <p className="text-zinc-600 text-sm flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Le sidequest vengono verificate da 2+ amici che testimoniano
            </p>
          )}
          {filter === 'all' && (
            <p className="text-zinc-600 text-sm">Aggiungi amici o pubblica la tua prima avventura!</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sq => (
            <SidequestCard key={sq.id} sidequest={sq} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
