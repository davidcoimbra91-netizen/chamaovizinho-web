'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Send, Search, ArrowLeft, Calendar, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notifyNewMessage } from '@/lib/notificationService'
import { CATEGORIES } from '@/types'

const HEADER_IMGS = [
  '/icons/header 1.jpg',
  '/icons/header 2.jpg',
  '/icons/header 3.jpg',
  '/icons/header 4.jpg',
]

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null as string | null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

interface Props {
  currentUser: { id: string; profile: any }
  initialConvId?: string | null
}

function parseRdvContent(content: string): { isRdv: boolean; isConfirmed: boolean; date?: string; start?: string; end?: string | null; notes?: string | null; address?: string | null } | null {
  if (!content?.startsWith('__RDV__')) return null
  try {
    const payload = JSON.parse(content.replace('__RDV__', ''))
    return {
      isRdv: true,
      isConfirmed: payload.__rdv__ === 'confirmed',
      date: payload.date,
      start: payload.start,
      end: payload.end || null,
      notes: payload.notes || null,
      address: payload.address || null,
    }
  } catch {
    return null
  }
}

function RdvBubble({ rdv }: { rdv: ReturnType<typeof parseRdvContent> }) {
  if (!rdv) return null
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        {rdv.isConfirmed ? '✅ Encontro confirmado' : '📅 Proposta de encontro'}
      </div>
      <div>📆 {rdv.date} · {rdv.start}{rdv.end ? ` → ${rdv.end}` : ''}</div>
      {rdv.notes && <div>📌 {rdv.notes}</div>}
      {rdv.address && <div>📍 {rdv.address}</div>}
    </div>
  )
}

export default function MensagensClient({ currentUser, initialConvId }: Props) {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [showList, setShowList] = useState(true)
  const headerImg = useMemo(() => HEADER_IMGS[Math.floor(Math.random() * HEADER_IMGS.length)], [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // RDV states
  const [showRdvModal, setShowRdvModal] = useState(false)
  const [rdvDate, setRdvDate] = useState('')
  const [rdvStart, setRdvStart] = useState('')
  const [rdvEnd, setRdvEnd] = useState('')
  const [rdvNotes, setRdvNotes] = useState('')
  const [rdvPhone, setRdvPhone] = useState('')
  const [rdvLoading, setRdvLoading] = useState(false)
  const [acceptRdvMsg, setAcceptRdvMsg] = useState<any>(null)
  const [rdvAddress, setRdvAddress] = useState('')
  const [rdvClientPhone, setRdvClientPhone] = useState('')
  const [rdvAcceptLoading, setRdvAcceptLoading] = useState(false)
  const [pedidoTitle, setPedidoTitle] = useState<string | null>(null)
  const [jobCard, setJobCard] = useState<any | null>(null)       // {title, city, created_at, budget, id}
  const [offerForJob, setOfferForJob] = useState<any | null>(null) // {price}
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null) // for "Ver perfil" link
  const [showJobPopup, setShowJobPopup] = useState(false)

  const fetchConversations = useCallback(async () => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, last_message, last_message_date, created_at, client_id, provider_id, service_request_id')
      .or(`client_id.eq.${currentUser.id},provider_id.eq.${currentUser.id}`)
      .order('last_message_date', { ascending: false })

    if (!convs) { setLoadingConvs(false); return }

    const allIds = Array.from(new Set([
      ...convs.map((c: any) => c.client_id),
      ...convs.map((c: any) => c.provider_id),
    ].filter(Boolean)))

    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .in('id', allIds)

    const merged = convs.map((c: any) => {
      const otherId = c.client_id === currentUser.id ? c.provider_id : c.client_id
      const other = users?.find((u: any) => u.id === otherId)
      return { ...c, other_user: other }
    })

    setConversations(merged)
    setLoadingConvs(false)
  }, [currentUser.id])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoadingMsgs(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-open conversation from URL param
  useEffect(() => {
    if (!initialConvId || conversations.length === 0) return
    const target = conversations.find(c => c.id === initialConvId)
    if (target) openConv(target)
  }, [initialConvId, conversations])

  useEffect(() => {
    if (!activeConv) return
    fetchMessages(activeConv.id)

    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv, fetchMessages])

  // Minimal insert — seules les colonnes réelles de public.messages
  const insertMessage = async (conversationId: string, senderId: string, receiverId: string, content: string) => {
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
    })
    return error
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)

    const receiverId = activeConv.client_id === currentUser.id ? activeConv.provider_id : activeConv.client_id
    const text = newMessage.trim()
    const error = await insertMessage(activeConv.id, currentUser.id, receiverId, text)

    if (!error) {
      await supabase.from('conversations').update({
        last_message: text,
        last_message_date: new Date().toISOString(),
      }).eq('id', activeConv.id)
      notifyNewMessage(receiverId, currentUser.profile?.name ?? 'Utilizador', activeConv.id).catch(() => {})
      setNewMessage('')
      fetchConversations()
    }
    setSending(false)
  }

  const handleSendRdv = async () => {
    if (!rdvDate || !rdvStart || !activeConv || rdvLoading) return
    setRdvLoading(true)
    try {
      const receiverId = activeConv.client_id === currentUser.id ? activeConv.provider_id : activeConv.client_id
      const dateDisplay = new Date(rdvDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })

      // 1. Insérer le rendez-vous
      const { error: apptError } = await supabase.from('appointments').insert({
        conversation_id: activeConv.id,
        service_request_id: activeConv.service_request_id || null,
        provider_id: activeConv.provider_id,
        client_id: activeConv.client_id,
        date: rdvDate,
        start_time: rdvStart,
        end_time: rdvEnd || null,
        notes: rdvNotes || null,
        status: 'pending',
        created_by: currentUser.id,
        provider_phone: rdvPhone || null,
      })
      if (apptError) { alert('Erro ao guardar o encontro. Tenta novamente.'); return }

      // 2. Envoyer le message __RDV__
      const payload = JSON.stringify({ __rdv__: 'proposed', date: dateDisplay, start: rdvStart, end: rdvEnd || null, notes: rdvNotes || null })
      const rdvContent = `__RDV__${payload}`
      const msgError = await insertMessage(activeConv.id, currentUser.id, receiverId, rdvContent)
      if (msgError) { alert('Encontro guardado mas erro ao enviar a mensagem. Tenta novamente.'); return }

      // 3. Mettre à jour la conversation
      await supabase.from('conversations').update({ last_message: rdvContent, last_message_date: new Date().toISOString() }).eq('id', activeConv.id)

      setShowRdvModal(false)
      setRdvDate(''); setRdvStart(''); setRdvEnd(''); setRdvNotes(''); setRdvPhone('')
      fetchConversations()
      fetchMessages(activeConv.id)
    } finally {
      setRdvLoading(false)
    }
  }

  const handleAcceptRdv = async () => {
    if (!acceptRdvMsg || !activeConv || rdvAcceptLoading) return
    setRdvAcceptLoading(true)
    try {
      // 1. Trouver et confirmer le rendez-vous lié à ce message
      const { data: appt } = await supabase.from('appointments')
        .select('id').eq('conversation_id', activeConv.id)
        .order('created_at', { ascending: false }).limit(1).single()

      if (appt) {
        const { error: updateError } = await supabase.from('appointments')
          .update({ status: 'confirmed', address: rdvAddress || null, client_phone: rdvClientPhone || null })
          .eq('id', appt.id)
        if (updateError) { alert('Erro ao confirmar o encontro. Tenta novamente.'); return }
      } else {
        alert('Encontro não encontrado. Pede ao prestador que proponha novamente.'); return
      }

      // 2. Envoyer le message de confirmation
      const basePayload = JSON.parse(acceptRdvMsg.content.replace('__RDV__', ''))
      const confirmPayload = JSON.stringify({ __rdv__: 'confirmed', date: basePayload.date, start: basePayload.start, end: basePayload.end || null, notes: basePayload.notes || null, address: rdvAddress || null })
      const confirmContent = `__RDV__${confirmPayload}`
      const receiverId = activeConv.client_id === currentUser.id ? activeConv.provider_id : activeConv.client_id
      const msgError = await insertMessage(activeConv.id, currentUser.id, receiverId, confirmContent)
      if (msgError) { alert('Encontro confirmado mas erro ao enviar a mensagem.') }

      await supabase.from('conversations').update({ last_message: confirmContent, last_message_date: new Date().toISOString() }).eq('id', activeConv.id)

      setAcceptRdvMsg(null)
      setRdvAddress(''); setRdvClientPhone('')
      fetchConversations()
      fetchMessages(activeConv.id)
    } finally {
      setRdvAcceptLoading(false)
    }
  }

  const openConv = async (conv: any) => {
    setActiveConv(conv)
    setShowList(false)
    setPedidoTitle(null)
    setJobCard(null)
    setOfferForJob(null)
    setProviderProfileId(null)

    if (conv.service_request_id) {
      const { data: sr } = await supabase
        .from('service_requests')
        .select('id, title, city, created_at, budget, photos, description, category, status')
        .eq('id', conv.service_request_id)
        .single()
      if (sr) {
        setPedidoTitle(sr.title)
        setJobCard(sr)
      }

      // Fetch offer price for this conv's provider
      const providerId = conv.provider_id
      if (providerId) {
        const { data: offer } = await supabase
          .from('offers')
          .select('price')
          .eq('service_request_id', conv.service_request_id)
          .eq('provider_id', providerId)
          .limit(1)
          .single()
        if (offer) setOfferForJob(offer)

        // Fetch provider_profile id for "Ver perfil" link
        const { data: pp } = await supabase
          .from('provider_profiles')
          .select('id')
          .eq('user_id', providerId)
          .single()
        if (pp) setProviderProfileId(pp.id)
      }
    }
  }

  const filteredConvs = search
    ? conversations.filter(c => c.other_user?.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', flexDirection: 'column' }}>

      {/* Job detail popup */}
      {showJobPopup && jobCard && (() => {
        const cat = getCatInfo(jobCard.category)
        return (
          <div onClick={() => setShowJobPopup(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(3px)' }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 540, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
              {/* Header */}
              <div style={{ padding: '16px 18px 12px', borderBottom: '0.5px solid #F0E8DC', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginBottom: 7 }}>
                      {cat.iconImg ? <img src={cat.iconImg} style={{ width: 11, height: 11, objectFit: 'contain' }} alt="" /> : cat.icon}
                      {cat.label}
                    </span>
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 19, fontWeight: 700, color: '#2C1A0E', margin: 0, lineHeight: 1.25 }}>{jobCard.title}</h2>
                  </div>
                  <button onClick={() => setShowJobPopup(false)}
                    style={{ background: '#FAF7F2', border: 'none', cursor: 'pointer', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={14} color="#9B7A5A" />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {jobCard.city && <span style={{ fontSize: 12, color: '#7A6048' }}>📍 {jobCard.city}</span>}
                  {jobCard.budget > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', background: '#F0FAF0', borderRadius: 6, padding: '2px 7px' }}>💶 €{jobCard.budget}</span>}
                  {offerForJob?.price && <span style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A' }}>Proposta: €{offerForJob.price}</span>}
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>📅 {new Date(jobCard.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {jobCard.photos?.length > 0 ? (
                  <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
                    <img src={jobCard.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, background: cat.bg, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                    {cat.iconImg ? <img src={cat.iconImg} style={{ width: 32, height: 32, objectFit: 'contain' }} alt="" /> : <span style={{ fontSize: 28 }}>{cat.icon}</span>}
                  </div>
                )}
                {jobCard.description && (
                  <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.7, margin: 0 }}>{jobCard.description}</p>
                )}
                <a href={`/pedidos/${jobCard.id}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                  Ver página completa →
                </a>
              </div>
            </div>
          </div>
        )
      })()}

      {/* RDV Proposal Modal */}
      {showRdvModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(44,26,14,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#FAF7F2', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#2C1A0E', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>📅 Propor encontro</p>
              <button onClick={() => setShowRdvModal(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#EEF4FF', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1D4ED8', lineHeight: 1.5 }}>
                📌 Propõe uma data e hora para te encontrares com o outro utilizador. Receberás uma confirmação quando aceitar.
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Data *</label>
                <input type="date" value={rdvDate} min={today} onChange={e => setRdvDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Hora início *</label>
                  <input type="time" value={rdvStart} onChange={e => setRdvStart(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Hora fim <span style={{ fontWeight: 400, color: '#9B7A5A' }}>(opcional)</span></label>
                  <input type="time" value={rdvEnd} onChange={e => setRdvEnd(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Notas <span style={{ fontWeight: 400, color: '#9B7A5A' }}>(opcional)</span></label>
                <textarea value={rdvNotes} onChange={e => setRdvNotes(e.target.value)} placeholder="Ex: trazer material, estacionar na rua X..." rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>O teu telemóvel <span style={{ fontWeight: 400, color: '#9B7A5A' }}>(opcional)</span></label>
                <input type="tel" value={rdvPhone} onChange={e => setRdvPhone(e.target.value)} placeholder="+351 9XX XXX XXX"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleSendRdv} disabled={!rdvDate || !rdvStart || rdvLoading}
                style={{ padding: '12px', borderRadius: 12, background: (!rdvDate || !rdvStart || rdvLoading) ? '#EDE6DC' : '#C85A1A', color: (!rdvDate || !rdvStart || rdvLoading) ? '#9B7A5A' : '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: (!rdvDate || !rdvStart || rdvLoading) ? 'default' : 'pointer' }}>
                {rdvLoading ? 'A enviar…' : '📅 Enviar proposta de encontro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RDV Accept Modal */}
      {acceptRdvMsg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(44,26,14,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#FAF7F2', borderRadius: 20, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: '#2C1A0E', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Confirmar encontro</p>
              <button onClick={() => { setAcceptRdvMsg(null); setRdvAddress(''); setRdvClientPhone('') }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(() => {
                const rdv = parseRdvContent(acceptRdvMsg.content)
                return (
                  <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '12px 14px', border: '0.5px solid #BBF7D0' }}>
                    <RdvBubble rdv={rdv} />
                  </div>
                )
              })()}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>A tua morada</label>
                <textarea value={rdvAddress} onChange={e => setRdvAddress(e.target.value)} placeholder="Rua, número, andar..." rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>O teu telemóvel <span style={{ fontWeight: 400, color: '#9B7A5A' }}>(opcional)</span></label>
                <input type="tel" value={rdvClientPhone} onChange={e => setRdvClientPhone(e.target.value)} placeholder="+351 9XX XXX XXX"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleAcceptRdv} disabled={rdvAcceptLoading}
                style={{ padding: '12px', borderRadius: 12, background: rdvAcceptLoading ? '#EDE6DC' : '#2E7D32', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: rdvAcceptLoading ? 'default' : 'pointer' }}>
                {rdvAcceptLoading ? 'A confirmar…' : '✅ Confirmar encontro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div style={{ flexShrink: 0, padding: '16px 0 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ position: 'relative', width: '100%', height: 110, borderRadius: 16, overflow: 'hidden' }}>
            <img src={headerImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(44,26,14,0.65) 0%, rgba(44,26,14,0.15) 60%, transparent 100%)' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 22 }}>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 2, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Mensagens</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Converse com vizinhos sobre os seus pedidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '16px', gap: 12 }}>

        {/* Lista conversas */}
        <div style={{
          width: 280, flexShrink: 0,
          background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, overflow: 'hidden', flexDirection: 'column' as any,
          display: 'flex',
        }}>
          <div style={{ padding: '12px', borderBottom: '0.5px solid #EDE6DC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '7px 10px' }}>
              <Search size={13} color="#9B7A5A" />
              <input
                type="text"
                placeholder="Pesquisar conversas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#2C1A0E', background: 'transparent' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              [1,2,3].map(i => (
                <div key={i} style={{ padding: '12px', borderBottom: '0.5px solid #F0E8DC', display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0E8DC' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: '#F0E8DC', borderRadius: 4, marginBottom: 6, width: '60%' }} />
                    <div style={{ height: 10, background: '#F0E8DC', borderRadius: 4, width: '80%' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length > 0 ? filteredConvs.map(conv => {
              const lastMsg = conv.last_message?.startsWith('__RDV__') ? '📅 Proposta de encontro' : conv.last_message
              return (
                <div
                  key={conv.id}
                  onClick={() => openConv(conv)}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '0.5px solid #F0E8DC',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer',
                    background: activeConv?.id === conv.id ? '#FBF0E8' : 'transparent',
                    borderLeft: activeConv?.id === conv.id ? '3px solid #C85A1A' : '3px solid transparent',
                  }}
                  className="hover:bg-orange-50">
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0 }}>
                    {conv.other_user?.profile_photo
                      ? <img src={conv.other_user.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A' }}>
                          {conv.other_user?.name?.charAt(0) ?? '?'}
                        </div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {conv.other_user?.name ?? 'Utilizador'}
                      </p>
                      <span style={{ fontSize: 12, color: '#B09070', flexShrink: 0, marginLeft: 4 }}>{formatTime(conv.last_message_date ?? conv.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#9B7A5A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {lastMsg ?? '...'}
                    </p>
                  </div>
                </div>
              )
            }) : (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#9B7A5A' }}>Sem conversas</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12,
          flexDirection: 'column' as any, overflow: 'hidden',
          display: 'flex',
        }}>
          {activeConv ? (
            <>
              {/* Chat header */}
              <div style={{ borderBottom: '0.5px solid #EDE6DC', flexShrink: 0 }}>
                {/* Ligne nom + ver perfil */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
<div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0 }}>
                    {activeConv.other_user?.profile_photo
                      ? <img src={activeConv.other_user.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A' }}>
                          {activeConv.other_user?.name?.charAt(0) ?? '?'}
                        </div>
                    }
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {activeConv.other_user?.name ?? 'Utilizador'}
                  </p>
                  {providerProfileId && (
                    <a href={`/prestadores/perfil/${providerProfileId}`} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#C85A1A', background: '#FBF0E8', border: '0.5px solid #F0D0B8', borderRadius: 7, padding: '4px 9px', textDecoration: 'none' }}>
                      Ver perfil →
                    </a>
                  )}
                </div>

                {/* Carte job succincte */}
                {jobCard && (
                  <div style={{ margin: '0 12px 10px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', margin: '0 0 4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                          📋 {jobCard.title}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          {jobCard.city && <span style={{ fontSize: 11, color: '#9B7A5A' }}>📍 {jobCard.city}</span>}
                          {jobCard.created_at && <span style={{ fontSize: 11, color: '#9B7A5A' }}>📅 {new Date(jobCard.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>}
                          {offerForJob?.price && <span style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A' }}>💶 €{offerForJob.price}</span>}
                        </div>
                      </div>
                      <button onClick={() => setShowJobPopup(true)}
                        style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', padding: 0, whiteSpace: 'nowrap' }}>
                        Ver detalhe →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <div style={{ width: 24, height: 24, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : messages.length > 0 ? messages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id
                  const rdv = parseRdvContent(msg.content)
                  const isProposedRdv = rdv && !rdv.isConfirmed && !isMe

                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: rdv ? '10px 14px' : '8px 12px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: rdv ? (isMe ? '#C85A1A' : '#FFF8F5') : (isMe ? '#C85A1A' : '#FAF7F2'),
                        border: rdv ? `1.5px solid ${isMe ? 'transparent' : '#F0D0B8'}` : (isMe ? 'none' : '0.5px solid #EDE6DC'),
                      }}>
                        {rdv
                          ? <div style={{ color: isMe ? '#fff' : '#2C1A0E' }}><RdvBubble rdv={rdv} /></div>
                          : <p style={{ fontSize: 15, color: isMe ? '#fff' : '#2C1A0E', lineHeight: 1.5 }}>{msg.content}</p>
                        }
                        <p style={{ fontSize: 12, color: isMe ? 'rgba(255,255,255,0.6)' : '#B09070', marginTop: 4, textAlign: 'right' }}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                      {isProposedRdv && (
                        <button onClick={() => setAcceptRdvMsg(msg)}
                          style={{ marginTop: 6, padding: '8px 16px', borderRadius: 10, background: '#2E7D32', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          ✅ Aceitar encontro
                        </button>
                      )}
                    </div>
                  )
                }) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 32 }}>💬</p>
                    <p style={{ fontSize: 15, color: '#9B7A5A' }}>Começa a conversa!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '0.5px solid #EDE6DC', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <button type="button" onClick={() => setShowRdvModal(true)}
                  title="Propor encontro"
                  style={{ width: 40, height: 40, borderRadius: 10, background: '#FBF0E8', border: '0.5px solid #EDE6DC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={17} color="#C85A1A" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  style={{ flex: 1, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 14px', fontSize: 15, color: '#2C1A0E', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 10, background: newMessage.trim() ? '#C85A1A' : '#F0E8DC', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={16} color={newMessage.trim() ? '#fff' : '#B09070'} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 32 }}>💬</p>
              <p style={{ fontSize: 14, color: '#9B7A5A' }}>Escolhe uma conversa à esquerda para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
