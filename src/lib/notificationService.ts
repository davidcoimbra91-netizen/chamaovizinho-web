// notificationService.ts
// Portage du notificationService de l'app mobile vers le web
// Envoie push Expo + sauvegarde dans la table notifications

import { createClient } from '@/lib/supabase/client'

const sendAndSave = async (
  userId: string,
  title: string,
  body: string,
  type: string,
  data: Record<string, any> = {}
) => {
  const supabase = createClient()

  // 1. Récupérer le push_token de l'utilisateur
  const { data: up } = await supabase
    .from('user_profiles')
    .select('push_token')
    .eq('id', userId)
    .single()

  // 2. Envoyer push Expo si token disponible
  if (up?.push_token) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: up.push_token,
          sound: 'default',
          title,
          body,
          data: { type, ...data },
          channelId: 'default',
        }),
      })
    } catch (e) {
      console.warn('[Notif] Push failed:', e)
    }
  }

  // 3. Sauvegarder en base pour la cloche web
  try {
    await supabase.from('notifications').insert({
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      user_id: userId,
      type,
      title,
      body,
      data: { type, ...data },
      is_read: false,
    })
  } catch (e) {
    console.warn('[Notif] Save failed:', e)
  }
}

// ── Notifications spécifiques ────────────────────────────────────────────────

/** Quand un prestataire envoie une offre — notifie le client */
export const notifyNewOffer = async (
  clientUserId: string,
  providerName: string,
  requestTitle: string,
  requestId: string
) => {
  await sendAndSave(
    clientUserId,
    '💼 Nova proposta recebida!',
    `${providerName} enviou uma proposta para "${requestTitle}"`,
    'new_offer',
    { request_id: requestId, request_title: requestTitle }
  )
}

/** Quand le client accepte une offre — notifie le prestataire */
export const notifyOfferAccepted = async (
  providerUserId: string,
  requestTitle: string,
  conversationId: string | null
) => {
  await sendAndSave(
    providerUserId,
    '✅ Proposta aceite!',
    `A sua proposta para "${requestTitle}" foi aceite. Pode começar!`,
    'offer_accepted',
    { conversation_id: conversationId, request_title: requestTitle }
  )
}

/** Quand un message est envoyé — notifie le destinataire */
export const notifyNewMessage = async (
  receiverUserId: string,
  senderName: string,
  conversationId: string
) => {
  await sendAndSave(
    receiverUserId,
    '💬 Nova mensagem',
    `${senderName} enviou-lhe uma mensagem`,
    'new_message',
    { conversation_id: conversationId }
  )
}

/** Quand le client marque le travail comme terminé — notifie le prestataire */
export const notifyJobCompleted = async (
  recipientUserId: string,
  requestTitle: string,
  requestId: string
) => {
  await sendAndSave(
    recipientUserId,
    '🏆 Trabalho concluído!',
    `A conclusão de "${requestTitle}" foi confirmada. Obrigado!`,
    'job_completed',
    { request_id: requestId, request_title: requestTitle }
  )
}

/** Quand le prestataire annule un travail en cours — notifie le client */
export const notifyJobCancelled = async (
  clientUserId: string,
  providerName: string,
  requestTitle: string,
  requestId: string
) => {
  await sendAndSave(
    clientUserId,
    '⚠️ Trabalho cancelado',
    `${providerName} cancelou o trabalho "${requestTitle}". O seu pedido foi reaberto.`,
    'job_cancelled',
    { request_id: requestId, request_title: requestTitle }
  )
}
