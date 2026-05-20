'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ShieldCheck, Zap } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday } from 'date-fns'
import { it } from 'date-fns/locale'

interface CalEvent {
  id: string
  title: string
  happened_at: string
  user_id: string
  xp_earned: number
  is_verified: boolean
  isOwn: boolean
  profile: { username: string; display_name: string | null; level: number }
}

interface FriendProfile {
  id: string
  username: string
  display_name: string | null
}

interface CalendarViewProps {
  events: CalEvent[]
  currentUserId: string
  friendProfiles: FriendProfile[]
}

const USER_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#eab308', '#06b6d4', '#ef4444']

export default function CalendarView({ events, currentUserId, friendProfiles }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine' | string>('all')

  // Assign stable colors to each user
  const colorMap = useMemo(() => {
    const map: Record<string, string> = { [currentUserId]: '#f97316' }
    friendProfiles.forEach((f, i) => { map[f.id] = USER_COLORS[(i + 1) % USER_COLORS.length] })
    return map
  }, [currentUserId, friendProfiles])

  const filteredEvents = useMemo(() => {
    if (filter === 'mine') return events.filter(e => e.isOwn)
    if (filter !== 'all') return events.filter(e => e.user_id === filter)
    return events
  }, [events, filter])

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) })
  const firstDow = (getDay(days[0]) + 6) % 7 // Monday-based

  const eventsForDay = (day: Date) =>
    filteredEvents.filter(e => isSameDay(new Date(e.happened_at), day))

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); setSelectedDay(null) }
  function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); setSelectedDay(null) }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">Calendario</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white w-28 text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </span>
          <button onClick={nextMonth} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Tutti' },
          { id: 'mine', label: 'I miei' },
          ...friendProfiles.map(f => ({ id: f.id, label: f.display_name || f.username })),
        ].map(opt => (
          <button key={opt.id} onClick={() => setFilter(opt.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}>
            {opt.id !== 'all' && opt.id !== 'mine' && (
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: colorMap[opt.id] }} />
            )}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-zinc-500">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 border-b border-r border-zinc-800/50" />
          ))}

          {days.map((day, i) => {
            const dayEvents = eventsForDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const today = isToday(day)
            const col = (firstDow + i) % 7

            return (
              <button key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-14 border-b border-r border-zinc-800/50 p-1 flex flex-col items-start transition-colors relative ${
                  isSelected ? 'bg-orange-500/15' : today ? 'bg-zinc-800/30' : 'hover:bg-zinc-800/20'
                } ${col === 6 ? 'border-r-0' : ''}`}>
                <span className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  today ? 'bg-orange-500 text-white' : isCurrentMonth ? 'text-zinc-300' : 'text-zinc-600'
                }`}>
                  {format(day, 'd')}
                </span>
                {/* Event dots */}
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 4).map(e => (
                    <span key={e.id} className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: colorMap[e.user_id] || '#f97316' }} />
                  ))}
                  {dayEvents.length > 4 && (
                    <span className="text-zinc-500 text-[10px] leading-none">+{dayEvents.length - 4}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      {friendProfiles.length > 0 && filter === 'all' && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Tu
          </div>
          {friendProfiles.map(f => (
            <div key={f.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorMap[f.id] }} />
              {f.display_name || f.username}
            </div>
          ))}
        </div>
      )}

      {/* Selected day events */}
      {selectedDay && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3 capitalize">
            {format(selectedDay, 'd MMMM yyyy', { locale: it })}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-6">Nessuna sidequest in questo giorno.</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(e => (
                <Link key={e.id} href={`/sidequest/${e.id}`}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-3 transition-colors group">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ background: colorMap[e.user_id] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">{e.title}</p>
                    <p className="text-xs text-zinc-500">{e.profile.display_name || e.profile.username}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {e.is_verified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    {e.xp_earned > 0 && (
                      <span className="text-xs font-bold text-orange-400 flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />{e.xp_earned}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Month stats */}
      {!selectedDay && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-3">
            Questo mese — {filteredEvents.filter(e => isSameMonth(new Date(e.happened_at), currentDate)).length} sidequest
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-black text-white">
                {filteredEvents.filter(e => isSameMonth(new Date(e.happened_at), currentDate)).reduce((s, e) => s + e.xp_earned, 0)}
              </p>
              <p className="text-xs text-zinc-500">XP guadagnati</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">
                {filteredEvents.filter(e => isSameMonth(new Date(e.happened_at), currentDate) && e.is_verified).length}
              </p>
              <p className="text-xs text-zinc-500">Verificate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
