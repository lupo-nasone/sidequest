import AccentPicker from '@/components/AccentPicker'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-sm mx-auto space-y-8">
      <h1 className="text-xl font-bold text-white">Impostazioni</h1>

      {/* Accent color */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Colore accent</h2>
        <AccentPicker />
      </section>

      {/* Account */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-4">Account</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 mb-0.5">Email</p>
            <p className="text-sm text-white">{user.email}</p>
          </div>
          <div className="px-4 py-3">
            <LogoutButton />
          </div>
        </div>
      </section>
    </div>
  )
}
