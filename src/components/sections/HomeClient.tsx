'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Plus, HelpCircle, Star, MapPin, Map } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { PEDIDO_TEMPLATES } from '@/lib/pedido-templates'
import type { PedidoTemplate } from '@/lib/pedido-templates'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { RewardService } from '@/lib/rewardService'
import { notifyOfferAccepted, notifyJobCompleted } from '@/lib/notificationService'
import ReviewModal from '@/components/ui/ReviewModal'

const PedidoWizard = dynamic(() => import('@/components/PedidoWizard'), { ssr: false })

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

function CatIcon({ slug, size = 36 }: { slug: string | null; size?: number }) {
  const cat = getCatInfo(slug)
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: cat.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      {cat.iconImg
        ? <Image src={cat.iconImg} alt="" fill style={{ objectFit: 'contain', padding: size * 0.15 }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>{cat.icon}</div>
      }
    </div>
  )
}

function Avatar({ name, photo, size = 34 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      {photo
        ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>{name?.charAt(0) ?? '?'}</div>
      }
    </div>
  )
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  open: { label: 'A receber propostas', bg: '#EAF3DE', color: '#3B6D11' },
  in_progress: { label: 'Em análise', bg: '#FFF3E0', color: '#E65100' },
  completed: { label: 'Trabalho concluído', bg: '#E8F0FE', color: '#1A4DB0' },
  cancelled: { label: 'Cancelado', bg: '#F0EDE8', color: '#7A6048' },
  pending: { label: 'Proposta recebida', bg: '#FBF0E8', color: '#C85A1A' },
}

const HEADER_IMGS = [
  '/icons/header 1.jpg',
  '/icons/header 2.jpg',
  '/icons/header 3.jpg',
  '/icons/header 4.jpg',
]

export default function HomeClient({ profile, data }: { profile: any; data: any }) {
  const firstName = profile?.name?.split(' ')[0] ?? 'Vizinho'
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : null
  const points = data.rewardProfile?.approved_points_balance ?? 0
  const router = useRouter()
  const supabase = createClient()
  const [activeTemplate, setActiveTemplate] = useState<PedidoTemplate | null>(null)
  const [headerImg, setHeaderImg] = useState(HEADER_IMGS[0])
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const [pedidoOffers, setPedidoOffers] = useState<any[]>([])
  const [pedidoOffersLoading, setPedidoOffersLoading] = useState(false)
  const [acceptingOffer, setAcceptingOffer] = useState<string | null>(null)
  const [completingOffer, setCompletingOffer] = useState<string | null>(null)
  const [reviewTarget, setReviewTarget] = useState<any | null>(null) // offer to review after marking complete
  const [editPedido, setEditPedido] = useState<any | null>(null) // pedido to edit/delete
  const [editTitle, setEditTitle] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editBudget, setEditBudget] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editDeleting, setEditDeleting] = useState(false)
  const [myRequests, setMyRequests] = useState<any[]>(data.myRequests ?? [])
  useEffect(() => { setHeaderImg(HEADER_IMGS[Math.floor(Math.random() * 4)]) }, [])

  useEffect(() => {
    if (!selectedPedido) { setPedidoOffers([]); return }
    const fetchOffers = async () => {
      setPedidoOffersLoading(true)
      const { data: offersData } = await supabase
        .from('offers')
        .select('id, price, message, estimated_delay, status, provider_id')
        .eq('service_request_id', selectedPedido.id)
        .order('status', { ascending: false })
        .order('created_at', { ascending: false })
      if (!offersData) { setPedidoOffersLoading(false); return }
      const enriched = await Promise.all(offersData.map(async (o: any) => {
        const { data: pp } = await supabase.from('provider_profiles')
          .select('business_name, provider_type, profile_photo, company_city')
          .eq('user_id', o.provider_id).single()
        const { data: up } = await supabase.from('user_profiles')
          .select('name, profile_photo').eq('id', o.provider_id).single()
        return { ...o, provider_profile: pp, provider_user: up }
      }))
      setPedidoOffers(enriched)
      setPedidoOffersLoading(false)
    }
    fetchOffers()
  }, [selectedPedido?.id])

  const handleAcceptOffer = async (offer: any) => {
    if (!selectedPedido || acceptingOffer) return
    setAcceptingOffer(offer.id)
    try {
      await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
      await supabase.from('offers').update({ status: 'declined' })
        .eq('service_request_id', selectedPedido.id).neq('id', offer.id)
      await supabase.from('service_requests').update({ status: 'in_progress' }).eq('id', selectedPedido.id)
      setPedidoOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : { ...o, status: o.status === 'pending' ? 'declined' : o.status }))
      setSelectedPedido((prev: any) => ({ ...prev, status: 'in_progress' }))

      // Récompenses + notification prestataire (best-effort)
      RewardService.onOfferAccepted(profile.id, offer.provider_id, selectedPedido.id, offer.id).catch(() => {})

      // Trouver/créer la conversation pour le deep-link dans la notif
      let { data: convData } = await supabase.from('conversations')
        .select('id').eq('service_request_id', selectedPedido.id).eq('provider_id', offer.provider_id).limit(1)
      let convId = convData?.[0]?.id ?? null
      if (!convId) {
        const { data: newConv } = await supabase.from('conversations').insert({
          service_request_id: selectedPedido.id,
          client_id: profile.id,
          provider_id: offer.provider_id,
          last_message: 'Conversa iniciada',
          last_message_date: new Date().toISOString(),
        }).select('id').single()
        convId = newConv?.id ?? null
      }
      notifyOfferAccepted(offer.provider_id, selectedPedido.title, convId).catch(() => {})
    } finally {
      setAcceptingOffer(null)
    }
  }

  const goToConversation = async (offer: any) => {
    if (!selectedPedido) return
    let { data: convData } = await supabase.from('conversations')
      .select('id').eq('service_request_id', selectedPedido.id).eq('provider_id', offer.provider_id).limit(1)
    let convId = convData?.[0]?.id
    if (!convId) {
      const { data: newConv } = await supabase.from('conversations').insert({
        service_request_id: selectedPedido.id,
        client_id: profile.id,
        provider_id: offer.provider_id,
        last_message: 'Conversa iniciada',
        last_message_date: new Date().toISOString(),
      }).select('id').single()
      convId = newConv?.id
    }
    setSelectedPedido(null)
    router.push(`/dashboard/mensagens${convId ? `?conv=${convId}` : ''}`)
  }

  const handleMarkComplete = async (offer: any) => {
    if (!selectedPedido || completingOffer) return
    setCompletingOffer(offer.id)
    try {
      await supabase.from('service_requests').update({ status: 'completed' }).eq('id', selectedPedido.id)
      setSelectedPedido((prev: any) => ({ ...prev, status: 'completed' }))
      RewardService.onJobConfirmedByClient(profile.id, offer.provider_id, selectedPedido.id).catch(() => {})
      notifyJobCompleted(offer.provider_id, selectedPedido.title, selectedPedido.id).catch(() => {})
      setReviewTarget(offer)
    } finally {
      setCompletingOffer(null)
    }
  }

  const handleDeclineOffer = async (offer: any) => {
    if (!selectedPedido) return
    await supabase.from('offers').update({ status: 'declined' }).eq('id', offer.id)
    setPedidoOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'declined' } : o))
  }

  // Recusar prestador déjà accepté (job in_progress) → remet en open + pending
  const [cancellingProvider, setCancellingProvider] = useState(false)
  const handleCancelProvider = async () => {
    if (!selectedPedido || cancellingProvider) return
    const acceptedOffer = pedidoOffers.find(o => o.status === 'accepted')
    if (!acceptedOffer) return
    setCancellingProvider(true)
    try {
      await supabase.from('service_requests').update({ status: 'open' }).eq('id', selectedPedido.id)
      await supabase.from('offers').update({ status: 'declined' }).eq('id', acceptedOffer.id)
      // Remettre les autres offres declined en pending
      await supabase.from('offers').update({ status: 'pending' })
        .eq('service_request_id', selectedPedido.id)
        .neq('id', acceptedOffer.id)
        .eq('status', 'declined')
      setSelectedPedido((prev: any) => ({ ...prev, status: 'open' }))
      setPedidoOffers(prev => prev.map(o =>
        o.id === acceptedOffer.id ? { ...o, status: 'declined' }
        : o.status === 'declined' ? { ...o, status: 'pending' }
        : o
      ))
    } finally {
      setCancellingProvider(false)
    }
  }

  const stats = [
    { icon: '📋', label: 'Pedidos', value: myRequests.length, href: '/dashboard/pedidos' },
    { icon: '📩', label: 'Orçamentos', value: data.offersReceived ?? 0, href: '/dashboard/pedidos' },
    { icon: '💬', label: 'Mensagens', value: data.conversations?.length ?? 0, href: '/dashboard/mensagens' },
    { icon: '📅', label: 'Encontros', value: data.appointmentsCount ?? 0, href: '/dashboard/encontros' },
    { icon: '⭐', label: 'Avaliações', value: data.reviewsCount ?? 0, href: '/recompensas' },
  ]

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      {/* Popup édition pedido */}
      {editPedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E' }}>Editar pedido</p>
              <button onClick={() => setEditPedido(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9B7A5A' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A3E28', display: 'block', marginBottom: 5 }}>Título</label>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #D4C4B0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A3E28', display: 'block', marginBottom: 5 }}>Cidade</label>
                <input value={editCity} onChange={e => setEditCity(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #D4C4B0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A3E28', display: 'block', marginBottom: 5 }}>Orçamento (€)</label>
                <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #D4C4B0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A3E28', display: 'block', marginBottom: 5 }}>Descrição</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={4}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #D4C4B0', fontSize: 15, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={async () => {
                  if (editSaving) return
                  setEditSaving(true)
                  try {
                    const updates: any = { title: editTitle, city: editCity, description: editDescription }
                    if (editBudget) updates.budget = Number(editBudget)
                    await supabase.from('service_requests').update(updates).eq('id', editPedido.id)
                    setMyRequests(prev => prev.map(p => p.id === editPedido.id ? { ...p, ...updates } : p))
                    setEditPedido(null)
                  } finally {
                    setEditSaving(false)
                  }
                }}
                disabled={editSaving}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#C85A1A', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1 }}>
                {editSaving ? 'A guardar...' : '✓ Guardar'}
              </button>
              <button
                onClick={async () => {
                  if (editDeleting) return
                  if (!confirm('Tens a certeza que queres eliminar este pedido?')) return
                  setEditDeleting(true)
                  try {
                    await supabase.from('service_requests').delete().eq('id', editPedido.id)
                    setMyRequests(prev => prev.filter(p => p.id !== editPedido.id))
                    setEditPedido(null)
                  } finally {
                    setEditDeleting(false)
                  }
                }}
                disabled={editDeleting}
                style={{ padding: '10px 16px', borderRadius: 10, background: '#FEE2E2', color: '#DC2626', border: 'none', fontSize: 15, fontWeight: 700, cursor: editDeleting ? 'not-allowed' : 'pointer', opacity: editDeleting ? 0.7 : 1 }}>
                {editDeleting ? '...' : '🗑 Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup pedido com propostas — style ExplorarClient */}
      {selectedPedido && (() => {
        const cat = getCatInfo(selectedPedido.category)
        const st = STATUS_MAP[selectedPedido.status] ?? STATUS_MAP.open
        const offerStatusMap: Record<string, { label: string; color: string; bg: string }> = {
          pending:  { label: 'Pendente',   color: '#E65100', bg: '#FFF3E0' },
          accepted: { label: 'Aceite ✓',  color: '#2E7D32', bg: '#E8F5E9' },
          declined: { label: 'Recusado',  color: '#9E9E9E', bg: '#F3F4F6' },
        }
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setSelectedPedido(null) }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }}
          >
            <div
              style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 590, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── HEADER STICKY ── */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '0.5px solid #F0E8DC', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
                  {/* Gauche: badge + titre */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      {cat.iconImg ? <img src={cat.iconImg} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" /> : <span style={{ fontSize: 11 }}>{cat.icon}</span>}
                      {cat.label}
                    </span>
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 21, fontWeight: 700, color: '#2C1A0E', margin: 0, lineHeight: 1.25 }}>{selectedPedido.title}</h2>
                  </div>
                  {/* Droite: status + bouton fermer */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setSelectedPedido(null)} style={{ background: '#FAF7F2', border: 'none', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9B7A5A' }}>
                      ✕
                    </button>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{st.label}</span>
                  </div>
                </div>
                {/* Infos rapides */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  {selectedPedido.city && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#7A6048' }}>📍 {selectedPedido.city}</span>
                  )}
                  {selectedPedido.budget > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#2E7D32', background: '#F0FAF0', borderRadius: 6, padding: '2px 8px' }}>💶 €{selectedPedido.budget}</span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}>
                    📅 {new Date(selectedPedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Photo principale ou placeholder */}
                {selectedPedido.photos?.length > 0 ? (
                  <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', position: 'relative' }}>
                    <img src={selectedPedido.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, background: cat.bg, border: '0.5px solid #EDE6DC', height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {cat.iconImg
                      ? <img src={cat.iconImg} style={{ width: 36, height: 36, objectFit: 'contain', opacity: 0.45 }} alt="" />
                      : <span style={{ fontSize: 32, opacity: 0.45 }}>{cat.icon}</span>
                    }
                    <p style={{ fontSize: 13, color: '#9B7A5A', margin: 0 }}>Sem fotografias adicionadas</p>
                  </div>
                )}

                {/* Description */}
                {selectedPedido.description && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Descrição do pedido</p>
                    <p style={{ fontSize: 15, color: '#5A3E28', lineHeight: 1.7, margin: 0 }}>{selectedPedido.description}</p>
                  </div>
                )}

                {/* Propostas recebidas */}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>
                    Propostas recebidas {!pedidoOffersLoading && `(${pedidoOffers.length})`}
                  </p>

                  {/* Boutons globaux quand job in_progress */}
                  {selectedPedido.status === 'in_progress' && !pedidoOffersLoading && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      <button onClick={handleCancelProvider} disabled={cancellingProvider}
                        style={{ flex: 1, padding: '10px', borderRadius: 9, background: '#fff', border: '1px solid #EF4444', color: '#EF4444', fontSize: 13, fontWeight: 700, cursor: cancellingProvider ? 'default' : 'pointer' }}>
                        {cancellingProvider ? 'A recusar…' : '✕ Recusar prestador'}
                      </button>
                      <button onClick={() => { const acc = pedidoOffers.find(o => o.status === 'accepted'); if (acc) handleMarkComplete(acc) }} disabled={!!completingOffer}
                        style={{ flex: 1, padding: '10px', borderRadius: 9, background: completingOffer ? '#EDE6DC' : '#2E7D32', color: completingOffer ? '#9B7A5A' : '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: completingOffer ? 'default' : 'pointer' }}>
                        {completingOffer ? 'A processar…' : '✓ Marcar concluído'}
                      </button>
                    </div>
                  )}

                  {pedidoOffersLoading ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#9B7A5A', fontSize: 14 }}>A carregar propostas…</div>
                  ) : pedidoOffers.length === 0 ? (
                    <div style={{ padding: '16px', background: '#FBF0E8', borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, color: '#9B7A5A' }}>Ainda não recebeste propostas.</p>
                    </div>
                  ) : pedidoOffers.map(offer => {
                    const provName  = offer.provider_profile?.business_name || offer.provider_user?.name || 'Prestador'
                    const provPhoto = offer.provider_profile?.profile_photo  || offer.provider_user?.profile_photo
                    const provType  = offer.provider_profile?.provider_type
                    const offerSt   = offerStatusMap[offer.status] ?? { label: offer.status, color: '#9E9E9E', bg: '#F3F4F6' }
                    return (
                      <div key={offer.id} style={{
                        background: offer.status === 'accepted' ? '#F0FDF4' : '#FAF7F2',
                        border: offer.status === 'accepted' ? '1px solid #BBF7D0' : '0.5px solid #EDE6DC',
                        borderRadius: 12, padding: '14px', marginBottom: 10,
                      }}>
                        {/* Provider row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <Avatar name={provName} photo={provPhoto} size={44} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>{provName}</p>
                              {provType && (
                                <span style={{ fontSize: 11, fontWeight: 600, background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 7px', border: '0.5px solid #F0D0B8' }}>
                                  {provType === 'empresa' ? 'Empresa' : provType === 'profissional' ? 'Profissional' : 'Particular'}
                                </span>
                              )}
                              <span style={{ fontSize: 11, fontWeight: 600, background: offerSt.bg, color: offerSt.color, borderRadius: 99, padding: '2px 7px' }}>{offerSt.label}</span>
                            </div>
                            {offer.provider_profile?.company_city && (
                              <p style={{ fontSize: 12, color: '#9B7A5A', margin: 0 }}>📍 {offer.provider_profile.company_city}</p>
                            )}
                          </div>
                          {offer.price && <span style={{ fontSize: 16, fontWeight: 700, color: '#C85A1A', flexShrink: 0 }}>€{offer.price}</span>}
                        </div>

                        {/* Offer meta */}
                        {offer.estimated_delay && (
                          <p style={{ fontSize: 13, color: '#7A6048', marginBottom: 8 }}>⏱ {offer.estimated_delay}</p>
                        )}
                        {offer.message && (
                          <p style={{ fontSize: 13, color: '#5A4030', background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 10, lineHeight: 1.5, border: '0.5px solid #F0E8DC' }}>
                            &ldquo;{offer.message}&rdquo;
                          </p>
                        )}

                        {/* Actions par carte — seulement si pas declined */}
                        {offer.status !== 'declined' && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => goToConversation(offer)}
                              style={{ flex: 1, minWidth: 90, padding: '9px 10px', borderRadius: 9, background: '#FAF7F2', border: '0.5px solid #C85A1A', color: '#C85A1A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              💬 Mensagem
                            </button>
                            {offer.status === 'pending' && selectedPedido.status === 'open' && (
                              <>
                                <button onClick={() => handleDeclineOffer(offer)}
                                  style={{ flex: 1, minWidth: 70, padding: '9px 10px', borderRadius: 9, background: '#fff', border: '0.5px solid #D4C4B0', color: '#7A6048', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                                  ✕ Recusar
                                </button>
                                <button onClick={() => handleAcceptOffer(offer)} disabled={!!acceptingOffer}
                                  style={{ flex: 1, minWidth: 80, padding: '9px 10px', borderRadius: 9, background: acceptingOffer === offer.id ? '#EDE6DC' : '#2E7D32', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: acceptingOffer ? 'default' : 'pointer' }}>
                                  {acceptingOffer === offer.id ? '…' : '✓ Aceitar'}
                                </button>
                              </>
                            )}
                            {offer.status === 'accepted' && selectedPedido.status !== 'in_progress' && (
                              <div style={{ flex: 2, padding: '9px 10px', borderRadius: 9, background: '#E8F5E9', color: '#2E7D32', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                                ✓ Prestador aceite
                              </div>
                            )}
                          </div>
                        )}
                        {offer.status === 'declined' && (
                          <div style={{ padding: '7px 10px', background: '#F3F4F6', borderRadius: 8, fontSize: 12, color: '#9E9E9E', textAlign: 'center' }}>
                            Proposta recusada
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── FOOTER ── */}
              <div style={{ padding: '12px 20px', borderTop: '0.5px solid #EDE6DC', display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setSelectedPedido(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#EDE6DC', border: 'none', fontSize: 14, fontWeight: 600, color: '#7A6048', cursor: 'pointer' }}>
                  Fechar
                </button>
                <Link href={`/pedidos/${selectedPedido.id}`} onClick={() => setSelectedPedido(null)}
                  style={{ flex: 2, padding: '11px', borderRadius: 10, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', display: 'block', lineHeight: '1.4' }}>
                  Ver página completa →
                </Link>
              </div>
            </div>
          </div>
        )
      })()}
            {activeTemplate && <PedidoWizard template={activeTemplate} onClose={() => setActiveTemplate(null)} />}
            {reviewTarget && selectedPedido && (
              <ReviewModal
                pedidoId={selectedPedido.id}
                pedidoTitle={selectedPedido.title}
                authorId={profile.id}
                reviewedUserId={reviewTarget.provider_id}
                providerProfile={reviewTarget.provider_profile ?? null}
                providerUser={reviewTarget.provider_user ?? null}
                onClose={() => setReviewTarget(null)}
                onDone={() => { setReviewTarget(null); setSelectedPedido(null) }}
              />
            )}

      {/* ── BANDEAU HEADER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <img src={headerImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(44,26,14,0.6) 0%, rgba(44,26,14,0.1) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              Olá, {firstName}! 👋
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>O que precisa de fazer hoje?</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20 }} className="lg:grid-cols-[260px_1fr_280px] grid-cols-1">

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Carta perfil */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={profile?.name} photo={profile?.profile_photo} size={72} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, background: '#3B6D11', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12 }}>✓</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{profile?.name ?? 'Cliente'}</p>
                  <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 9px', fontSize: 13, fontWeight: 600 }}>✓ Cliente verificado</span>
                </div>
                {profile?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9B7A5A' }}>
                    <MapPin size={11} color="#9B7A5A" />
                    {profile.city}
                  </div>
                )}
                {memberSince && <p style={{ fontSize: 13, color: '#B09070' }}>Membro desde {memberSince}</p>}
                <Link href="/dashboard/perfil"
                  style={{ width: '100%', padding: '7px 0', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 14, fontWeight: 600, color: '#5A3E28', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  Ver perfil público
                </Link>
              </div>
            </div>

            {/* A minha atividade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>A minha atividade</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stats.map(s => (
                  <Link key={s.label} href={s.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 8, background: '#FAF7F2', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ fontSize: 14, color: '#5A3E28' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#C85A1A' }}>{s.value}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Próximos encontros */}
            {data.appointments?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>📅 Próximos encontros</p>
                  <Link href="/dashboard/encontros" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.appointments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} style={{ background: '#F0FDF4', border: '0.5px solid #BBF7D0', borderRadius: 10, padding: '10px 12px', borderLeft: '3px solid #2E7D32' }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#2C1A0E', margin: '0 0 4px' }}>
                        📅 {new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'long' })}
                      </p>
                      {appt.start_time && (
                        <p style={{ fontSize: 12, color: '#5A3E28', fontWeight: 600, margin: '0 0 2px' }}>
                          🕐 {appt.start_time.slice(0, 5)}{appt.end_time ? ` → ${appt.end_time.slice(0, 5)}` : ''}
                        </p>
                      )}
                      {appt.address && (
                        <p style={{ fontSize: 12, color: '#7A6048', margin: '0 0 2px' }}>📍 {appt.address}</p>
                      )}
                      {appt.notes && (
                        <p style={{ fontSize: 11, color: '#9B7A5A', fontStyle: 'italic', margin: 0 }}>📌 {appt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── CENTRO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Dica do Dia */}
            {data.dica ? (
              <Link href={`/dicas/${data.dica.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 160, background: '#2C1A0E' }}>
                  {data.dica.image_url && <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} unoptimized />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(44,26,14,0.85) 0%, rgba(44,26,14,0.6) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 700, width: 'fit-content', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      💡 Dica do dia
                    </span>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 8, maxWidth: 340, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {data.dica.title}
                    </p>
                    {data.dica.short_description && (
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, maxWidth: 320, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                        {data.dica.short_description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ borderRadius: 16, background: '#2C1A0E', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>A carregar dica do dia...</p>
              </div>
            )}

            {/* 🔥 Mais pedidos este mês */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>🔥 Mais pedidos este mês</p>
                <span style={{ fontSize: 13, color: '#9B7A5A' }}>Começa em 1 clique</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PEDIDO_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveTemplate(tpl)}
                    style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }}>
                      {tpl.iconImg
                        ? <Image src={tpl.iconImg} alt={tpl.label} fill style={{ objectFit: 'contain' }} />
                        : <span style={{ fontSize: 22 }}>{tpl.icon}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3 }}>{tpl.label}</p>
                      <p style={{ fontSize: 12, color: '#C85A1A', fontWeight: 600, marginTop: 2 }}>Pedir agora →</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3 ações rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { icon: Plus, label: 'Novo pedido', sub: 'Publicar uma demanda', href: '/dashboard/novo-pedido', color: '#C85A1A', bg: '#FBF0E8' },
                { icon: HelpCircle, label: 'Nova pergunta', sub: 'Perguntar à comunidade', href: '/comunidade/nova', color: '#9C27B0', bg: '#F3E5F5' },
                { icon: Map, label: 'Ver no mapa', sub: 'Profissionais perto', href: '/mapa', color: '#1A73E8', bg: '#E8F0FE' },
              ].map(a => (
                <Link key={a.label} href={a.href} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 12px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={17} color={a.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>{a.label}</p>
                    <p style={{ fontSize: 12, color: '#9B7A5A', lineHeight: 1.3 }}>{a.sub}</p>
                  </div>
                  <span style={{ fontSize: 13, color: a.color, fontWeight: 600 }}>→</span>
                </Link>
              ))}
            </div>

            {/* Os meus pedidos recentes */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Os meus pedidos recentes</p>
              </div>
              {myRequests.length > 0 ? myRequests.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                const st = STATUS_MAP[pedido.status] ?? STATUS_MAP.open
                return (
                  <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                    <CatIcon slug={pedido.category} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{pedido.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '1px 7px', fontSize: 12, fontWeight: 500 }}>{st.label}</span>
                        {pedido.city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {pedido.city}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => setSelectedPedido(pedido)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Ver
                      </button>
                      <button onClick={() => {
                        setEditPedido(pedido)
                        setEditTitle(pedido.title)
                        setEditCity(pedido.city ?? '')
                        setEditBudget(pedido.budget ? String(pedido.budget) : '')
                        setEditDescription(pedido.description ?? '')
                      }}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '0.5px solid #C85A1A', fontSize: 13, color: '#C85A1A', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📝</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda não tens pedidos</p>
                  <p style={{ fontSize: 14, color: '#9B7A5A', marginBottom: 14 }}>Publica o teu primeiro pedido gratuitamente.</p>
                  <Link href="/dashboard/novo-pedido" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Publicar pedido</Link>
                </div>
              )}
            </div>


            {/* Pergunta ao Vizinho */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A' }}>Tens dúvidas sobre a tua casa? A comunidade ajuda.</p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.questions?.map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, background: '#FBF0E8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HelpCircle size={13} color="#C85A1A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 1 }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
                <Link href="/comunidade/nova"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', background: '#FBF0E8', border: '0.5px dashed #C85A1A', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>
                  <Plus size={13} /> Fazer uma pergunta
                </Link>
              </div>
            </div>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Pontos */}
            <div style={{ background: '#2C1A0E', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Os meus pontos</p>
                <span style={{ fontSize: 16 }}>🏅</span>
              </div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#C85A1A', marginBottom: 4 }}>{points} pts</p>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${Math.min((points / 100) * 100, 100)}%`, background: '#C85A1A', borderRadius: 99 }} />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                {points < 100 ? `Faltam ${100 - points} pts para voucher 5€` : 'Pronto para resgatar!'}
              </p>
              <Link href="/recompensas" style={{ display: 'block', padding: '7px', borderRadius: 8, background: 'rgba(200,90,26,0.3)', textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#E8A07A' }}>
                Ver recompensas →
              </Link>
            </div>

            {/* Profissionais perto */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Profissionais perto de si</p>
                <Link href="/mapa" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.nearbyProviders?.length > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 10 }}>
                    {data.nearbyProviders.length} profissionais ativos num raio de 10 km
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.nearbyProviders.slice(0, 3).map((p: any) => (
                      <Link key={p.id} href={`/prestadores/perfil/${p.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        <Avatar name={p.user?.name ?? p.business_name} photo={p.user?.profile_photo} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.business_name ?? p.user?.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p.average_rating > 0 && <><Star size={10} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 12, color: '#5A3E28', fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span></>}
                            {p.distanceKm && <span style={{ fontSize: 12, color: '#9B7A5A' }}>· {p.distanceKm} km</span>}
                          </div>
                        </div>
                        {p.service_categories?.[0] && (() => {
                          const cat = getCatInfo(p.service_categories[0])
                          return <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 7px', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{cat.label}</span>
                        })()}
                      </Link>
                    ))}
                  </div>
                  <Link href="/mapa"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, padding: '8px', borderRadius: 9, border: '0.5px solid #EDE6DC', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#5A3E28' }}>
                    <MapPin size={12} color="#C85A1A" /> Ver todos no mapa
                  </Link>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 14, color: '#9B7A5A' }}>Ativa a localização para ver profissionais perto de ti.</p>
                  <Link href="/mapa" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver mapa →</Link>
                </div>
              )}
            </div>

            {/* Os meus encontros */}
            {data.appointments?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>📅 Os meus encontros</p>
                  <Link href="/dashboard/encontros" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.appointments.slice(0, 3).map((appt: any) => (
                    <div key={appt.id} style={{ background: '#F0FDF4', border: '0.5px solid #BBF7D0', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>
                          {new Date(appt.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        <span style={{ fontSize: 12, color: '#2E7D32', fontWeight: 600 }}>✓ Confirmado</span>
                      </div>
                      {(appt.start_time || appt.end_time) && (
                        <p style={{ fontSize: 13, color: '#5A3E28', margin: 0 }}>
                          🕐 {appt.start_time}{appt.end_time ? ` – ${appt.end_time}` : ''}
                        </p>
                      )}
                      {appt.address && (
                        <p style={{ fontSize: 12, color: '#7A6048', margin: '2px 0 0' }}>📍 {appt.address}</p>
                      )}
                      {appt.notes && (
                        <p style={{ fontSize: 12, color: '#9B7A5A', margin: '4px 0 0', lineHeight: 1.4 }}>{appt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                <Link href="/dashboard/encontros"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, padding: '8px', borderRadius: 9, border: '0.5px solid #EDE6DC', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#5A3E28' }}>
                  Ver todos os encontros →
                </Link>
              </div>
            )}

            {/* Pedidos na sua área */}
            {data.recentAreaRequests?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Pedidos na sua área</p>
                  <Link href="/explorar" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 10 }}>{data.recentAreaRequests.length} pedidos publicados hoje</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {data.recentAreaRequests.slice(0, 3).map((r: any) => {
                    const cat = getCatInfo(r.category)
                    const ago = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000)
                    return (
                      <Link key={r.id} href={`/pedidos/${r.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, textDecoration: 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 15 }}>{cat.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: '#9B7A5A' }}>{r.city} · Há {ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`}
</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
