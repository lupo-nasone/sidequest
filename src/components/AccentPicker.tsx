'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

export const ACCENT_COLORS = [
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500', hex: '#f97316' },
  { id: 'red',    label: 'Red',    bg: 'bg-red-500',    hex: '#ef4444' },
  { id: 'pink',   label: 'Pink',   bg: 'bg-pink-500',   hex: '#ec4899' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', hex: '#a855f7' },
  { id: 'blue',   label: 'Blue',   bg: 'bg-blue-500',   hex: '#3b82f6' },
  { id: 'cyan',   label: 'Cyan',   bg: 'bg-cyan-500',   hex: '#06b6d4' },
  { id: 'green',  label: 'Green',  bg: 'bg-green-500',  hex: '#22c55e' },
  { id: 'yellow', label: 'Gold',   bg: 'bg-yellow-400', hex: '#facc15' },
]

export function getAccentColor(): string {
  if (typeof window === 'undefined') return 'orange'
  return localStorage.getItem('accent-color') || 'orange'
}

export default function AccentPicker() {
  const [selected, setSelected] = useState('orange')

  useEffect(() => {
    setSelected(getAccentColor())
  }, [])

  function pick(id: string) {
    setSelected(id)
    localStorage.setItem('accent-color', id)
    document.dispatchEvent(new CustomEvent('accent-changed', { detail: id }))
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="grid grid-cols-4 gap-3">
        {ACCENT_COLORS.map(c => (
          <button
            key={c.id}
            onClick={() => pick(c.id)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full ${c.bg} flex items-center justify-center`}>
              {selected === c.id && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
            </div>
            <span className="text-xs text-zinc-400">{c.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-600 mt-3 text-center">
        Il colore verrà applicato immediatamente
      </p>
    </div>
  )
}
