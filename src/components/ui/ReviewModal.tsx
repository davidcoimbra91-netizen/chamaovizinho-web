'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RewardService } from '@/lib/rewardService'

interface Props {
  pedidoId: string
  pedidoTitle: string
  authorId: string          // current user (client)
  reviewedUserId: string    // provider's user_id
  providerProfile: {
    business_name?: string
    provider_type?: string
    average_rating?: number
    reviews_count?: number
    is_verified?: boolean
  } | null
  providerUser: {
    name?: string
    profile_photo?: string
  } | null
  onClose: () => void
  onDone: () => void
}

function Avatar({ name, photo, size = 56 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      {photo
        ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>{name?.charAt(0) ?? '?'}</div>
      }
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <Star
            size={36}
            fill={(hover || value) >= n ? '#F59E0B' : 'none'}
            color={(hover || value) >= n ? '#F59E0B' : '#D4C4B0'}
            style={{ transition: 'all 0.1s' }}
          />
        </button>
      ))}
    </div>
  )
}

const STAR_LABELS = ['', 'Mau', 'Razoável', 'Bom', 'Muito bom', 'Excelente']
const PROVIDER_TYPE_LABELS: Record<string, string> = {
  individual: 'Particular',
  company: 'Empresa',
  freelancer: 'Freelancer',
}

export default function ReviewModal({
  pedidoId, pedidoTitle, authorId, reviewedUserId,
  providerProfile, providerUser, onClose, onDone,
}: Props) {
  const supabase = createClient()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const providerName = providerProfile?.business_name || providerUser?.name || 'Profissional'
  const avgRating = providerProfile?.average_rating ?? 0
  const reviewsCount = providerProfile?.reviews_count ?? 0
  const providerType = providerProfile?.provider_type
  const isVerified = providerProfile?.is_verified

  const handleSubmit = async () => {
    if (rating === 0) { setError('Selecione uma classificação'); return }
    setSubmitting(true)
    setError(null)
    try {
      const { data: rev, error: revErr } = await supabase.from('reviews').insert({
        author_id: authorId,
        reviewed_user_id: reviewedUserId,
        service_request_id: pedidoId,
        rating,
        comment: comment.trim() || null,
        is_public: true,
      }).select('id').single()

      if (revErr) throw revErr

      await RewardService.onReviewLeft(
        authorId, reviewedUserId, pedidoId,
        rev?.id ?? null, rating, comment.trim()
      ).catch(() => {})

      onDone()
    } catch (e: any) {
      setError('Erro ao enviar avaliação. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#FAF7F2', borderRadius: 20, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: '#2C1A0E', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>Avaliar profissional</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{pedidoTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Provider card */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={providerName} photo={providerUser?.profile_photo} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{providerName}</p>
                {isVerified && (
                  <span style={{ background: '#E8F0FE', color: '#1A4DB0', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, flexShrink: 0 }}>✓ Verificado</span>
                )}
              </div>
              {providerType && (
                <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 4 }}>{PROVIDER_TYPE_LABELS[providerType] ?? providerType}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={11} fill={avgRating >= n ? '#F59E0B' : 'none'} color={avgRating >= n ? '#F59E0B' : '#D4C4B0'} />
                ))}
                <span style={{ fontSize: 12, color: '#7A6048', marginLeft: 2 }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : '–'} ({reviewsCount})
                </span>
              </div>
            </div>
          </div>

          {/* Star rating */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 12 }}>Como classifica o trabalho?</p>
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <p style={{ fontSize: 13, color: '#C85A1A', fontWeight: 600, marginTop: 8 }}>{STAR_LABELS[rating]}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>
              Comentário <span style={{ fontWeight: 400, color: '#9B7A5A' }}>(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Descreva a sua experiência com este profissional..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
            />
            {comment.trim().length > 0 && comment.trim().length < 50 && (
              <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 4 }}>+1 ponto extra se ≥ 50 caracteres ({comment.trim().length}/50)</p>
            )}
          </div>

          {error && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', borderRadius: 8, padding: '8px 12px' }}>{error}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#EDE6DC', border: 'none', fontSize: 14, fontWeight: 600, color: '#7A6048', cursor: 'pointer' }}>
              Mais tarde
            </button>
            <button onClick={handleSubmit} disabled={submitting || rating === 0}
              style={{ flex: 2, padding: '11px', borderRadius: 10, background: submitting || rating === 0 ? '#EDE6DC' : '#C85A1A', border: 'none', fontSize: 14, fontWeight: 700, color: submitting || rating === 0 ? '#9B7A5A' : '#fff', cursor: submitting || rating === 0 ? 'default' : 'pointer' }}>
              {submitting ? 'A enviar...' : 'Enviar avaliação ★'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
