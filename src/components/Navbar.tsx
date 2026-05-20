'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, PlusCircle, Users, User, Sword, LogOut, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import XPModal from './XPModal'

interface NavbarProps {
  profile: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Feed' },
    { href: '/new', icon: PlusCircle, label: 'Nuova' },
    { href: '/friends', icon: Users, label: 'Amici' },
    { href: profile ? `/profile/${profile.username}` : '/login', icon: User, label: 'Profilo' },
    { href: '/settings', icon: Settings, label: 'Impostazioni' },
  ]

  return (
    <>
      {/* Top bar - desktop */}
      <header className="hidden md:flex sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-6 py-4 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sword className="w-6 h-6 text-orange-500" />
          <span className="font-bold text-lg tracking-tight">SideQuest</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile && (
            <XPModal totalXP={profile.total_xp} currentLevel={profile.level}>
              <div className="text-right">
                <p className="text-sm font-medium">{profile.display_name || profile.username}</p>
                <p className="text-xs text-orange-400 font-semibold hover:text-orange-300 transition-colors">Lv.{profile.level} · {profile.total_xp} XP ↗</p>
              </div>
            </XPModal>
          )}
          <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sword className="w-5 h-5 text-orange-500" />
          <span className="font-bold tracking-tight">SideQuest</span>
        </Link>
        {profile && (
          <span className="text-xs text-orange-400 font-semibold">Lv.{profile.level} · {profile.total_xp} XP</span>
        )}
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur border-t border-zinc-800 flex">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
              pathname === href ? 'text-orange-400' : 'text-zinc-500'
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
