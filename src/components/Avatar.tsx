import Image from 'next/image'
import type { Profile } from '@/types/database'

interface AvatarProps {
  profile: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-10 h-10 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-2xl' }
const px = { sm: 40, md: 48, lg: 64 }

export default function Avatar({ profile, size = 'md' }: AvatarProps) {
  const initial = (profile.display_name || profile.username)[0].toUpperCase()
  const dim = px[size]

  if (profile.avatar_url) {
    return (
      <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 relative`}>
        <Image src={profile.avatar_url} alt={initial} width={dim} height={dim} className="object-cover w-full h-full" />
      </div>
    )
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initial}
    </div>
  )
}
