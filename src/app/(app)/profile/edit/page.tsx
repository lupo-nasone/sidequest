'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2 } from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setDisplayName(data.display_name || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url)
        setUsername(data.username)
      }
      setLoading(false)
    }
    load()
  }, [])

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()

    let newAvatarUrl = avatarUrl

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (uploadErr) {
        setError('Errore upload avatar: ' + uploadErr.message)
        setSaving(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      newAvatarUrl = publicUrl + '?t=' + Date.now()
    }

    const { error: err } = await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: newAvatarUrl,
    }).eq('id', userId)

    if (err) setError(err.message)
    else {
      router.push(`/profile/${username}`)
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const preview = avatarPreview || avatarUrl

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Modifica profilo</h1>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              {preview ? (
                <Image src={preview} alt="avatar" width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <span className="text-white text-3xl font-black">
                  {(displayName || username || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-400 text-white p-1.5 rounded-full transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500">Clicca per cambiare foto profilo</p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Nome visualizzato</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Il tuo nome" />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            placeholder="Descritti in una riga..." />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvataggio...</> : 'Salva modifiche'}
        </button>
      </form>
    </div>
  )
}
