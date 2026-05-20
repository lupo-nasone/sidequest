'use client'

import { useState } from 'react'
import { X, Lock, CheckCircle } from 'lucide-react'
import { LEVELS, xpProgress, getLevelDef } from '@/lib/levels'

interface XPModalProps {
  totalXP: number
  currentLevel: number
  children: React.ReactNode
}

export default function XPModal({ totalXP, currentLevel, children }: XPModalProps) {
  const [open, setOpen] = useState(false)
  const prog = xpProgress(totalXP)
  const currentDef = getLevelDef(currentLevel)

  return (
    <>
      <button onClick={() => setOpen(true)} className="hover:opacity-80 transition-opacity">
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-white">Livelli & Premi</h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {currentDef.icon} Lv.{currentLevel} {currentDef.title} · {totalXP} XP totali
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current progress */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <div className="flex justify-between text-xs text-zinc-400 mb-2">
                <span>Progresso verso Lv.{currentLevel + 1}</span>
                <span>{prog.current}/{prog.needed} XP</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, prog.progress)}%` }} />
              </div>
            </div>

            {/* Levels list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {LEVELS.map((lvl, i) => {
                const isReached = currentLevel >= lvl.level
                const isCurrent = currentLevel === lvl.level ||
                  (i < LEVELS.length - 1 && currentLevel < LEVELS[i + 1].level && currentLevel >= lvl.level)
                const isNext = !isReached && (i === 0 || currentLevel >= LEVELS[i - 1].level)

                return (
                  <div key={lvl.level}
                    className={`rounded-xl border p-3 transition-colors ${
                      isCurrent
                        ? 'bg-orange-500/15 border-orange-500/40'
                        : isReached
                        ? 'bg-zinc-800/50 border-zinc-700'
                        : 'bg-zinc-900/50 border-zinc-800 opacity-60'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                        isReached ? 'bg-zinc-700' : 'bg-zinc-800'
                      }`}>
                        {lvl.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isCurrent ? 'text-orange-400' : isReached ? 'text-white' : 'text-zinc-500'}`}>
                            Lv.{lvl.level}
                          </span>
                          <span className={`text-sm ${isCurrent ? 'text-white' : isReached ? 'text-zinc-300' : 'text-zinc-600'}`}>
                            {lvl.title}
                          </span>
                          {isCurrent && <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-semibold">TU</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500">{lvl.xpRequired.toLocaleString()} XP</span>
                          {lvl.xpMultiplier > 1 && (
                            <span className="text-xs text-emerald-400 font-medium">×{lvl.xpMultiplier.toFixed(2)} XP</span>
                          )}
                        </div>
                        {lvl.reward && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm">{lvl.rewardIcon}</span>
                            <span className={`text-xs ${isReached ? 'text-zinc-300' : 'text-zinc-600'}`}>{lvl.reward}</span>
                            {!isReached && <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
                            {isReached && lvl.reward && <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
