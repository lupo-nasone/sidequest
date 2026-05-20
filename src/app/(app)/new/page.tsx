'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, MapPin, Calendar, Loader2, Sparkles } from 'lucide-react'
import Image from 'next/image'
import CollabPicker from '@/components/CollabPicker'

interface MediaPreview {
  file: File
  previewUrl: string
  type: 'photo' | 'video'
}

export default function NewSidequestPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [happenedAt, setHappenedAt] = useState(new Date().toISOString().slice(0, 16))
  const [mediaFiles, setMediaFiles] = useState<MediaPreview[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'analyzing' | 'done' | 'collab'>('form')
  const [publishedSidequestId, setPublishedSidequestId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<{
    xp: number; baseXP?: number; multiplier?: number | null
    analysis: string; rating: number
    leveledUp?: boolean; newLevel?: number | null
    newAchievements?: { id: string; name: string; icon: string; xp_bonus: number }[]
  } | null>(null)
  const [error, setError] = useState('')

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const newMedia: MediaPreview[] = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'photo',
    }))
    setMediaFiles(prev => [...prev, ...newMedia].slice(0, 10))
  }

  function removeMedia(index: number) {
    setMediaFiles(prev => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setError('')
    setLoading(true)
    setStep('form')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Create sidequest record
    const { data: sq, error: sqError } = await supabase
      .from('sidequests')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        happened_at: new Date(happenedAt).toISOString(),
        is_published: true,
      })
      .select()
      .single()

    if (sqError || !sq) {
      setError('Errore nella creazione. Riprova.')
      setLoading(false)
      return
    }
    setPublishedSidequestId(sq.id)

    // Upload media files
    for (let i = 0; i < mediaFiles.length; i++) {
      const { file, type } = mediaFiles[i]
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${sq.id}/${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('sidequest-media')
        .upload(path, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('sidequest-media')
          .getPublicUrl(path)

        await supabase.from('sidequest_media').insert({
          sidequest_id: sq.id,
          url: publicUrl,
          storage_path: path,
          media_type: type,
          order_index: i,
        })
      }
    }

    // Trigger AI analysis
    setStep('analyzing')

    try {
      const res = await fetch('/api/analyze-sidequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sidequestId: sq.id }),
      })
      const data = await res.json()
      if (res.status === 503) {
        setError(data.error || "L'AI è momentaneamente sovraccarica. La sidequest è salvata — riprova tra qualche secondo.")
        setStep('form')
      } else {
        setAnalysisResult({ xp: data.xp, baseXP: data.baseXP, multiplier: data.multiplier, analysis: data.analysis, rating: data.rating, leveledUp: data.leveledUp, newLevel: data.newLevel, newAchievements: data.newAchievements || [] })
        setStep('done')
      }
    } catch {
      setStep('done')
      setAnalysisResult({ xp: 50, analysis: 'Sidequest salvata, analisi AI non disponibile al momento.', rating: 5 })
    }

    setLoading(false)
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <div>
          <h2 className="text-xl font-bold text-white mb-2">L&apos;AI sta analizzando la tua sidequest...</h2>
          <p className="text-zinc-400">Sto valutando quanto sei stato folle</p>
        </div>
      </div>
    )
  }

  if (step === 'done' && analysisResult) {
    return (
      <div className="flex flex-col items-center gap-6 text-center pt-8">
        <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-orange-500" />
        </div>

        {analysisResult.leveledUp && analysisResult.newLevel && (
          <div className="bg-yellow-500/15 border border-yellow-500/40 rounded-2xl px-6 py-4 text-center max-w-xs">
            <p className="text-3xl mb-1">🎉</p>
            <p className="text-lg font-black text-yellow-400">LEVEL UP!</p>
            <p className="text-white font-semibold">Sei al Livello {analysisResult.newLevel}</p>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-black text-white mb-1">+{analysisResult.xp} XP</h2>
          {analysisResult.multiplier && analysisResult.multiplier > 1 && analysisResult.baseXP && (
            <p className="text-sm text-emerald-400 mb-1">
              {analysisResult.baseXP} XP × {analysisResult.multiplier.toFixed(2)} (bonus livello)
            </p>
          )}
          <p className="text-orange-400 font-semibold">Rating: {analysisResult.rating}/10</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full text-left">
          <p className="text-sm font-semibold text-zinc-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Giudizio AI
          </p>
          <p className="text-zinc-200 leading-relaxed">{analysisResult.analysis}</p>
        </div>

        {analysisResult.newAchievements && analysisResult.newAchievements.length > 0 && (
          <div className="max-w-md w-full">
            <p className="text-sm font-semibold text-yellow-400 mb-3 text-center">🏆 Achievement sbloccati!</p>
            <div className="space-y-2">
              {analysisResult.newAchievements.map(a => (
                <div key={a.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">{a.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-white">{a.name}</p>
                  </div>
                  {a.xp_bonus > 0 && (
                    <span className="text-xs font-bold text-yellow-400">+{a.xp_bonus} XP</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-md w-full space-y-3">
          {publishedSidequestId && (
            <CollabPicker sidequestId={publishedSidequestId} onDone={() => router.push('/')} />
          )}
          <button onClick={() => router.push('/')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 px-8 rounded-xl transition-colors">
            Vai al feed
          </button>
        </div>
      </div>
    )
  }

  if (step === 'collab' && publishedSidequestId) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <CollabPicker sidequestId={publishedSidequestId} onDone={() => router.push('/')} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Nuova Sidequest</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Titolo *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Es: Ho scalato una montagna alle 3 di notte"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">Descrizione</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
            placeholder="Racconta cosa è successo... più dettagli = più XP"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />Quando
            </label>
            <input
              type="datetime-local"
              value={happenedAt}
              onChange={e => setHappenedAt(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />Dove
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Luogo"
            />
          </div>
        </div>

        {/* Media upload */}
        <div>
          <label className="block text-sm text-zinc-400 mb-1.5">
            Foto / Video <span className="text-zinc-600">(max 10)</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {mediaFiles.map((media, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-800">
                {media.type === 'photo' ? (
                  <Image src={media.previewUrl} alt="" fill className="object-cover" />
                ) : (
                  <video src={media.previewUrl} className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}

            {mediaFiles.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-orange-500 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-orange-400 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Aggiungi</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Caricamento...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Pubblica e ottieni XP</>
          )}
        </button>
      </form>
    </div>
  )
}
