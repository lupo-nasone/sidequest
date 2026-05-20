'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { username: string; display_name: string | null }
}

interface CommentSectionProps {
  sidequestId: string
  comments: Comment[]
  currentUserId: string
}

export default function CommentSection({ sidequestId, comments: initial, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState(initial)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('comments')
      .insert({ user_id: currentUserId, sidequest_id: sidequestId, content: text.trim() })
      .select('*, profiles(username, display_name)')
      .single()

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComments(prev => [...prev, data as unknown as Comment])
      setText('')
    }
    setSending(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h3 className="font-semibold text-white mb-4">Commenti</h3>

      {comments.length === 0 && (
        <p className="text-zinc-600 text-sm mb-4">Nessun commento. Sii il primo!</p>
      )}

      <div className="space-y-3 mb-4">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(c.profiles.display_name || c.profiles.username)[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${c.profiles.username}`} className="text-sm font-semibold text-white hover:text-orange-400 transition-colors">
                  {c.profiles.display_name || c.profiles.username}
                </Link>
                <span className="text-xs text-zinc-600">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: it })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-0.5">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Scrivi un commento..."
          maxLength={500}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
