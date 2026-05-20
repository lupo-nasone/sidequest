'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout}
      className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
      <LogOut className="w-4 h-4" />
      Esci dall&apos;account
    </button>
  )
}
