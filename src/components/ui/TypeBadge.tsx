'use client'

import { TYPE_LOGOS } from '@/lib/profile-utils'

interface TypeBadgeProps {
  /** provider_profiles.provider_type — affiche le logo correspondant */
  providerType?: string | null
  /** ignoré — les clients n'ont pas de badge (aligné avec l'app mobile) */
  isClient?: boolean
  /** Taille du badge en px (défaut 22) */
  size?: number
}

/**
 * Petit logo de type affiché en bas-droite de l'avatar.
 * Uniquement pour les prestataires (providerType requis).
 * À placer dans un conteneur `position: relative`.
 */
export default function TypeBadge({ providerType, size = 22 }: TypeBadgeProps) {
  const src = providerType ? TYPE_LOGOS[providerType] ?? null : null

  if (!src) return null

  return (
    <img
      src={src}
      alt={providerType ?? ''}
      style={{
        position: 'absolute',
        bottom: -3,
        right: -3,
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 4,
        background: '#fff',
        padding: 1,
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        zIndex: 2,
      }}
    />
  )
}
