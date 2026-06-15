'use client'

import { Star } from 'lucide-react'
import TypeBadge from '@/components/ui/TypeBadge'
import { CLIENT_LOGO } from '@/lib/profile-utils'

interface RequesterCardProps {
  client: {
    name?: string | null
    profile_photo?: string | null
    city?: string | null
    average_rating?: number | null
    reviews_count?: number | null
    last_seen?: string | null
  } | null
  size?: 'sm' | 'md'
}

function getOnlineStatus(lastSeen: string | null | undefined): { label: string; color: string } {
  if (!lastSeen) return { label: 'Inactivo', color: '#B09070' }
  const diff = Date.now() - new Date(lastSeen).getTime()
  const minutes = diff / 60000
  if (minutes < 5) return { label: 'Online agora', color: '#10B981' }
  if (minutes < 60) return { label: `Visto há ${Math.floor(minutes)}min`, color: '#10B981' }
  const hours = minutes / 60
  if (hours < 24) return { label: `Visto há ${Math.floor(hours)}h`, color: '#F9AB00' }
  const days = hours / 24
  if (days < 7) return { label: `Visto há ${Math.floor(days)}d`, color: '#B09070' }
  return { label: 'Inactivo', color: '#B09070' }
}

export default function RequesterCard({ client, size = 'md' }: RequesterCardProps) {
  if (!client) return null

  const avatarSize = size === 'sm' ? 32 : 38
  const nameSize = size === 'sm' ? 13 : 14
  const metaSize = size === 'sm' ? 11 : 12
  const online = getOnlineStatus(client.last_seen)
  const rating = client.average_rating ?? 0
  const reviews = client.reviews_count ?? 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: size === 'sm' ? '7px 10px' : '9px 12px',
      background: '#FAF7F2', borderRadius: 10,
      border: '0.5px solid #EDE6DC',
    }}>
      {/* Photo de profil + badge type client */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%',
          background: '#FBF0E8', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: avatarSize * 0.38, fontWeight: 700, color: '#C85A1A',
          border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          {client.profile_photo
            ? <img src={client.profile_photo} alt={client.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <img src={CLIENT_LOGO} alt="" style={{ width: '60%', height: '60%', objectFit: 'contain', opacity: 0.8 }} />}
        </div>
        <TypeBadge isClient size={size === 'sm' ? 16 : 18} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: nameSize, fontWeight: 700, color: '#2C1A0E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.name ?? 'Cliente'}
          </span>
          {/* Online dot */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: metaSize, color: online.color, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: online.color, display: 'inline-block', flexShrink: 0 }} />
            {online.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
          {client.city && (
            <span style={{ fontSize: metaSize, color: '#9B7A5A' }}>📍 {client.city}</span>
          )}
          {rating > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Star size={metaSize} color="#F9AB00" fill="#F9AB00" />
              <span style={{ fontSize: metaSize, fontWeight: 700, color: '#2C1A0E' }}>{rating.toFixed(1)}</span>
              {reviews > 0 && <span style={{ fontSize: metaSize, color: '#9B7A5A' }}>({reviews})</span>}
            </span>
          ) : reviews > 0 ? (
            <span style={{ fontSize: metaSize, color: '#9B7A5A' }}>{reviews} avaliações</span>
          ) : (
            <span style={{ fontSize: metaSize, color: '#B09070' }}>Novo utilizador</span>
          )}
        </div>
      </div>
    </div>
  )
}
