// rewardService.ts
// Portage du rewardService de l'app mobile vers le web
// Tous les appels passent par le RPC award_reward_points — jamais d'insert direct

import { createClient } from '@/lib/supabase/client'

const award = async (
  userId: string,
  actionType: string,
  points: number,
  pedidoId: string | null = null,
  reviewId: string | null = null,
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('award_reward_points', {
      p_user_id:     userId,
      p_action_type: actionType,
      p_points:      points,
      p_pedido_id:   pedidoId  ?? null,
      p_review_id:   reviewId  ?? null,
      p_metadata:    metadata,
    })
    if (error) throw error
    return data
  } catch (e: any) {
    // Ne jamais bloquer le flux principal — rewards sont best-effort
    console.warn(`[Rewards] Failed to award ${points}pts (${actionType}):`, e?.message)
    return null
  }
}

export const RewardService = {

  // ── Actions client ──────────────────────────────────────────────────────────

  /** Pedido publié → +1 pt client */
  onPedidoCreated: (userId: string, pedidoId: string) =>
    award(userId, 'pedido_created', 1, pedidoId, null, { note: 'client created pedido' }),

  /** Offre acceptée → +1 pt client + +1 pt prestataire */
  onOfferAccepted: async (clientId: string, providerId: string, pedidoId: string, offerId: string) => {
    await Promise.all([
      award(clientId,   'offer_accepted',          1, pedidoId, null, { offer_id: offerId }),
      award(providerId, 'offer_accepted_provider', 1, pedidoId, null, { offer_id: offerId }),
    ])
  },

  /**
   * Client confirme travail terminé → +2 pts client
   * Si le prestataire a déjà confirmé → +3 pts prestataire (double confirmation)
   */
  onJobConfirmedByClient: async (clientId: string, providerId: string, pedidoId: string) => {
    const supabase = createClient()
    await award(clientId, 'job_confirmed_client', 2, pedidoId)

    // Vérifier si le prestataire a déjà confirmé
    const { data: tx } = await supabase
      .from('reward_transactions')
      .select('id')
      .eq('user_id', providerId)
      .eq('pedido_id', pedidoId)
      .eq('action_type', 'job_confirmed_provider')
      .neq('status', 'void')
      .limit(1)

    if (tx && tx.length > 0) {
      await Promise.all([
        award(clientId,   'job_completed_both', 0, pedidoId, null, { note: 'both confirmed' }),
        award(providerId, 'job_completed_both', 3, pedidoId, null, { note: 'both confirmed' }),
      ])
    }
  },

  /**
   * Prestataire confirme travail terminé → enregistre confirmation
   * Si le client a déjà confirmé → +3 pts prestataire (double confirmation)
   */
  onJobConfirmedByProvider: async (providerId: string, clientId: string, pedidoId: string) => {
    const supabase = createClient()
    await award(providerId, 'job_confirmed_provider', 0, pedidoId)

    // Vérifier si le client a déjà confirmé
    const { data: tx } = await supabase
      .from('reward_transactions')
      .select('id')
      .eq('user_id', clientId)
      .eq('pedido_id', pedidoId)
      .eq('action_type', 'job_confirmed_client')
      .neq('status', 'void')
      .limit(1)

    if (tx && tx.length > 0) {
      await Promise.all([
        award(clientId,   'job_completed_both', 0, pedidoId, null, { note: 'both confirmed' }),
        award(providerId, 'job_completed_both', 3, pedidoId, null, { note: 'both confirmed' }),
      ])
    }
  },

  // ── Actions review ──────────────────────────────────────────────────────────

  /**
   * Review laissée :
   * - Auteur +1 (review_left)
   * - Auteur +1 si commentaire ≥ 50 chars (review_text_bonus)
   * - Utilisateur noté +1 si note ≥ 4 (positive_review_received)
   */
  onReviewLeft: async (
    authorId: string,
    reviewedUserId: string,
    pedidoId: string,
    reviewId: string | null,
    rating: number,
    comment: string
  ) => {
    await award(authorId, 'review_left', 1, pedidoId, reviewId)

    if (comment && comment.trim().length >= 50) {
      await award(authorId, 'review_text_bonus', 1, pedidoId, reviewId, {
        comment_length: comment.trim().length,
      })
    }

    if (rating >= 4) {
      await award(reviewedUserId, 'positive_review_received', 1, pedidoId, reviewId, { rating })
    }
  },

  // ── Lecture ────────────────────────────────────────────────────────────────

  getProfile: async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('reward_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  },
}
