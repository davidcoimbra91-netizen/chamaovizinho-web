'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RewardService } from '@/lib/rewardService'
import { notifyJobCompleted } from '@/lib/notificationService'
import ReviewModal from '@/components/ui/ReviewModal'

interface Props {
  pedidoId: string
  pedidoTitle: string
  authorId: string        // client user_id
  providerUserId: string  // provider user_id
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
}

export default function PedidoCompleteButton({
  pedidoId, pedidoTitle, authorId, providerUserId, providerProfile, providerUser,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const handleComplete = async () => {
    if (loading) return
    setLoading(true)
    try {
      await supabase.from('service_requests').update({ status: 'completed' }).eq('id', pedidoId)
      RewardService.onJobConfirmedByClient(authorId, providerUserId, pedidoId).catch(() => {})
      notifyJobCompleted(providerUserId, pedidoTitle, pedidoId).catch(() => {})
      setShowReview(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleComplete}
        disabled={loading}
        style={{
          width: '100%', padding: '10px', borderRadius: 9,
          background: loading ? '#EDE6DC' : '#1A4DB0',
          color: loading ? '#9B7A5A' : '#fff',
          border: 'none', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {loading ? 'A processar…' : '✓ Marcar como concluído'}
      </button>

      {showReview && (
        <ReviewModal
          pedidoId={pedidoId}
          pedidoTitle={pedidoTitle}
          authorId={authorId}
          reviewedUserId={providerUserId}
          providerProfile={providerProfile}
          providerUser={providerUser}
          onClose={() => { setShowReview(false); router.refresh() }}
          onDone={() => { setShowReview(false); router.refresh() }}
        />
      )}
    </>
  )
}
