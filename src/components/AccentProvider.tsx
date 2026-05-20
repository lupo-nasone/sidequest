'use client'

import { useEffect } from 'react'
import { ACCENT_COLORS, getAccentColor } from './AccentPicker'

function applyAccent(id: string) {
  const color = ACCENT_COLORS.find(c => c.id === id)
  if (!color) return
  document.documentElement.style.setProperty('--accent', color.hex)
}

export default function AccentProvider() {
  useEffect(() => {
    applyAccent(getAccentColor())

    function handler(e: Event) {
      applyAccent((e as CustomEvent<string>).detail)
    }
    document.addEventListener('accent-changed', handler)
    return () => document.removeEventListener('accent-changed', handler)
  }, [])

  return null
}
