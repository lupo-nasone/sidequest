'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, MapPin, Star, Zap, Trash2, MoreHorizontal, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import type { SidequestWithProfile } from '@/types/database'
import Avatar from './Avatar'

interface SidequestCardProps {
  sidequest: SidequestWithProfile
  currentUserId: string
}

export default function SidequestCard({ sidequest: sq, currentUserId }: SidequestCardProps) {
  const router = useRouter()
  const [liked, setLiked] = useState(sq.user_has_liked)
  const [likesCount, setLikesCount] = useState(sq.likes_count)
  const [vouched, setVouched] = useState(sq.user_has_vouched)
  const [vouchCount, setVouchCount] = useState(sq.vouches_count)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  const isOwn = sq.user_id === currentUserId

  async function toggleLike() {
    const supabase = createClient()
    if (liked) {
      await supabase.from('likes').delete().match({ user_id: currentUserId, sidequest_id: sq.id })
      setLiked(false)
      setLikesCount(n => n - 1)
    } else {
      await supabase.from('likes').insert({ user_id: currentUserId, sidequest_id: sq.id })
      setLiked(true)
      setLikesCount(n => n + 1)
    }
  }

  async function toggleVouch() {
    if (isOwn) return
    const supabase = createClient()
    if (vouched) {
      await supabase.from('vouches').delete().match({ user_id: currentUserId, sidequest_id: sq.id })
      setVouched(false)
      setVouchCount(n => n - 1)
    } else {
      await supabase.from('vouches').insert({ user_id: currentUserId, sidequest_id: sq.id })
      setVouched(true)
      setVouchCount(n => n + 1)
    }
  }

  async function handleDelete() {
    if (!confirm('Sei sicuro di voler eliminare questa sidequest?')) return
    setDeleting(true)
    setShowMenu(false)
    const res = await fetch('/api/delete-sidequest', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidequestId: sq.id }),
    })
    if (res.ok) {
      setDeleted(true)
      router.refresh()
    }
    setDeleting(false)
  }

  const allMedia = [...sq.sidequest_media.filter(m => m.media_type === 'photo'), ...sq.sidequest_media.filter(m => m.media_type === 'video')]

  if (deleted) return null

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/profile/${sq.profiles.username}`}>
          <Avatar profile={sq.profiles} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${sq.profiles.username}`} className="font-semibold text-white hover:text-orange-400 transition-colors">
            {sq.profiles.display_name || sq.profiles.username}
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>{formatDistanceToNow(new Date(sq.happened_at), { addSuffix: true, locale: it })}</span>
            {sq.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />{sq.location}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sq.xp_earned > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              +{sq.xp_earned} XP
            </div>
          )}
          {isOwn && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded-lg transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-10 min-w-[130px]">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Eliminando...' : 'Elimina'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {allMedia.length > 0 && (
        <div className="relative aspect-square bg-zinc-800" onClick={() => setShowMenu(false)}>
          {allMedia[mediaIndex].media_type === 'photo' ? (
            <Image src={allMedia[mediaIndex].url} alt={sq.title} fill className="object-cover" />
          ) : (
            <video src={allMedia[mediaIndex].url} controls className="w-full h-full object-cover" />
          )}
          {allMedia.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {allMedia.map((_, i) => (
                <button key={i} onClick={() => setMediaIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === mediaIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
          {allMedia[mediaIndex].ai_description && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3">
              <p className="text-xs text-zinc-300 line-clamp-2">
                <Star className="w-3 h-3 inline mr-1 text-orange-400" />
                {allMedia[mediaIndex].ai_description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 pt-3" onClick={() => setShowMenu(false)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/sidequest/${sq.id}`}>
            <h3 className="font-bold text-white text-lg leading-snug hover:text-orange-400 transition-colors">
              {sq.title}
            </h3>
          </Link>
          {(sq.is_verified || vouchCount > 0) && (
            <div className={`flex items-center gap-1 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
              sq.is_verified || vouchCount >= 2
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-500'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {vouchCount >= 2 ? 'Verificata' : `${vouchCount}/2`}
            </div>
          )}
        </div>
        {sq.description && (
          <p className="text-zinc-400 text-sm line-clamp-3 mb-3">{sq.description}</p>
        )}
        {sq.ai_analysis && (
          <div className="bg-zinc-800/60 rounded-xl p-3 mb-3">
            <p className="text-xs text-orange-400 font-semibold mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" /> AI Rating: {sq.ai_rating}/10
            </p>
            <p className="text-xs text-zinc-300 line-clamp-2">{sq.ai_analysis}</p>
          </div>
        )}
        <div className="flex items-center gap-4 pt-1">
          <button onClick={toggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}>
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            {likesCount > 0 && <span className="font-medium">{likesCount}</span>}
          </button>
          <Link href={`/sidequest/${sq.id}`}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <MessageCircle className="w-5 h-5" />
            {sq.comments_count > 0 && <span className="font-medium">{sq.comments_count}</span>}
          </Link>

          {!isOwn && (
            <button onClick={toggleVouch}
              title={vouched ? 'Rimuovi testimonianza' : 'Testimonia che è successa davvero'}
              className={`flex items-center gap-1.5 text-sm transition-colors ml-auto ${
                vouched ? 'text-emerald-400' : 'text-zinc-500 hover:text-emerald-400'
              }`}>
              <ShieldQuestion className="w-5 h-5" />
              {vouchCount > 0 && <span className="font-medium">{vouchCount}</span>}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
