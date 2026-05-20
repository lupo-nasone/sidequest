import Image from 'next/image'
import type { Profile } from '@/types/database'
import { getLevelDef } from '@/lib/levels'

interface AvatarProps {
  profile: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'level'>
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-2xl' }
const px = { sm: 40, md: 48, lg: 64 }
const padding = { sm: 'p-0.5', md: 'p-0.5', lg: 'p-[3px]' }

const FRAMES: Record<string, string> = {
  'frame-bronze':   'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-800',
  'frame-silver':   'bg-gradient-to-br from-zinc-300 via-slate-400 to-zinc-500',
  'frame-gold':     'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500',
  'frame-platinum': 'bg-gradient-to-br from-cyan-200 via-blue-300 to-purple-300',
  'frame-rainbow':  'bg-gradient-to-br from-pink-500 via-yellow-400 to-cyan-400',
}

export default function Avatar({ profile, size = 'md' }: AvatarProps) {
  const initial = (profile.display_name || profile.username)[0].toUpperCase()
  const dim = px[size]
  const levelDef = getLevelDef(profile.level ?? 1)
  const frame = levelDef.frameColor ? FRAMES[levelDef.frameColor] : null

  const inner = (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 relative bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center`}>
      {profile.avatar_url ? (
        <Image src={profile.avatar_url} alt={initial} width={dim} height={dim} className="object-cover w-full h-full" />
      ) : (
        <span className="text-white font-bold">{initial}</span>
      )}
    </div>
  )

  if (!frame) return inner

  return (
    <div className={`${frame} rounded-full flex-shrink-0 ${padding[size]}`}>
      {inner}
    </div>
  )
}
