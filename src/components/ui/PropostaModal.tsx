'use client'

import { useState, useEffect } from 'react'
import { Send, X, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { notifyNewOffer } from '@/lib/notificationService'

interface Props {
  pedidoId: string
  pedidoTitle: string
  pedidoCity?: string | null
  pedidoBudget?: number | null
  pedidoDescription?: string | null
  externalOpen?: boolean
  onExternalClose?: () => void
}

export default function PropostaModal({ pedidoId, pedidoTitle, pedidoCity, pedidoBudget, pedidoDescription, externalOpen, onExternalClose }: Props) {
  const supabase = createClient()
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen! : internalOpen
  const setOpen = isControlled ? (v: boolean) => { if (!v) onExternalClose?.() } : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadySent, setAlreadySent] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ message: '', price: '', estimated_delay: '' })
  const [userId, setUserId] = useState<string | null>(null)
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)

  // Prefetch user + provider info when modal opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Tens de iniciar sessão para enviar uma proposta.'); setLoading(false); return }
        setUserId(user.id)

        const { data: pp } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single()
        if (!pp) { setError('Precisa de um perfil de prestador para enviar propostas.'); setLoading(false); return }
        setProviderProfileId(pp.id)

        // Check for existing proposal — try both provider_id formats
        const [byAuthId, byProfileId] = await Promise.all([
          supabase.from('offers').select('id, status').eq('service_request_id', pedidoId).eq('provider_id', user.id).maybeSingle(),
          supabase.from('offers').select('id, status').eq('service_request_id', pedidoId).eq('provider_id', pp.id).maybeSingle(),
        ])
        if (byAuthId.data || byProfileId.data) setAlreadySent(true)
      } catch (e: any) {
        setError('Erro ao carregar. Tenta novamente.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [open, pedidoId])

  const handleOpen = () => {
    setOpen(true)
    setSuccess(false)
    setAlreadySent(false)
    setError('')
    setForm({ message: '', price: '', estimated_delay: '' })
  }

  const handleClose = () => {
    if (submitting) return
    setOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message.trim()) { setError('A mensagem é obrigatória.'); return }
    if (form.price && isNaN(parseFloat(form.price))) { setError('O preço deve ser um valor numérico.'); return }
    if (!userId) { setError('Sessão expirada. Recarrega a página.'); return }

    setSubmitting(true)
    setError('')

    if (!providerProfileId) {
      setError('Perfil de prestador não encontrado. Recarrega a página.')
      setSubmitting(false)
      return
    }

    // provider_id = auth.uid() (confirmed by DB data)
    const { error: insertError } = await supabase.from('offers').insert({
      provider_id: userId,
      service_request_id: pedidoId,
      status: 'pending',
      message: form.message.trim(),
      price: form.price ? parseFloat(form.price) : null,
      estimated_delay: form.estimated_delay.trim() || null,
    })

    if (insertError) {
      console.error('[PropostaModal] Insert error:', insertError)
      const code = insertError.code ?? ''
      const msg = insertError.message ?? ''
      if (code === '23505' || msg.includes('duplicate')) {
        setAlreadySent(true)
      } else if (code === '42501' || msg.includes('permission') || msg.includes('policy')) {
        setError('Não tens permissão para enviar propostas. Verifica se o teu perfil de prestador está ativo.')
      } else if (code === '23503') {
        setError('Perfil de prestador inválido. Verifica o teu perfil e tenta novamente.')
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Erro de ligação. Verifica a tua internet e tenta novamente.')
      } else {
        setError(`Erro (${code || msg || 'desconhecido'}). Abre a consola do browser para detalhes.`)
      }
      setSubmitting(false)
      return
    }

    // Notifier le client qu'une nouvelle offre est arrivée (best-effort)
    try {
      const [pedidoRes, providerRes] = await Promise.all([
        supabase.from('service_requests').select('client_id, title').eq('id', pedidoId).single(),
        supabase.from('provider_profiles').select('business_name').eq('user_id', userId).single(),
      ])
      if (pedidoRes.data) {
        notifyNewOffer(
          pedidoRes.data.client_id,
          providerRes.data?.business_name ?? 'Prestador',
          pedidoRes.data.title,
          pedidoId
        ).catch(() => {})
      }
    } catch { /* best-effort */ }

    setSuccess(true)
    setSubmitting(false)
  }

  return (
    <>
      {/* Trigger button — only in uncontrolled mode */}
      {!isControlled && <button
        onClick={handleOpen}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px', borderRadius: 11, width: '100%',
          background: '#C85A1A', color: '#fff', border: 'none',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(200,90,26,0.45)',
        }}
      >
        <Send size={15} /> Enviar Proposta
      </button>}

      {/* Modal */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>

            {/* Header */}
            <div style={{ background: '#2C1A0E', borderRadius: '20px 20px 0 0', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Enviar proposta</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedidoTitle}</p>
              </div>
              <button onClick={handleClose} disabled={submitting}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>

              {/* Loading */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10 }}>
                  <div style={{ width: 20, height: 20, border: '2px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 14, color: '#9B7A5A' }}>A verificar...</span>
                </div>
              )}

              {/* Already sent */}
              {!loading && alreadySent && (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>📤</div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>Proposta já enviada</p>
                  <p style={{ fontSize: 14, color: '#7A6048' }}>Já enviaste uma proposta para este pedido. Aguarda a resposta do cliente.</p>
                  <button onClick={handleClose}
                    style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#EDE6DC', border: 'none', color: '#5A3E28', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Fechar
                  </button>
                </div>
              )}

              {/* Success */}
              {!loading && success && (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <CheckCircle size={32} color="#3B6D11" />
                  </div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>Proposta enviada!</p>
                  <p style={{ fontSize: 14, color: '#7A6048', maxWidth: 280, margin: '0 auto' }}>A tua proposta foi enviada com sucesso. O cliente irá analisá-la em breve.</p>
                  <button onClick={handleClose}
                    style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, background: '#3B6D11', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Fechar
                  </button>
                </div>
              )}

              {/* Form */}
              {!loading && !alreadySent && !success && (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Resumo do pedido */}
                  <div style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 11, padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>{pedidoTitle}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {pedidoCity && <span style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {pedidoCity}</span>}
                      {pedidoBudget && pedidoBudget > 0 && <span style={{ fontSize: 12, color: '#9B7A5A' }}>💶 Até €{pedidoBudget}</span>}
                    </div>
                    {pedidoDescription && (
                      <p style={{ fontSize: 12, color: '#7A6048', marginTop: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {pedidoDescription}
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#C62828', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      {error}
                    </div>
                  )}

                  {/* Mensagem */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>
                      Mensagem <span style={{ color: '#C85A1A' }}>*</span>
                    </label>
                    <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 7 }}>Apresenta-te e explica como podes resolver este pedido.</p>
                    <textarea
                      required
                      rows={4}
                      placeholder="Ex: Olá! Sou técnico de canalização com 10 anos de experiência. Posso visitar amanhã de manhã..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      maxLength={500}
                      style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 9, padding: '10px 12px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: 12, color: '#B09070', textAlign: 'right', marginTop: 3 }}>{form.message.length}/500</p>
                  </div>

                  {/* Preço + Disponibilidade */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Preço estimado (€)</label>
                      <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 6 }}>Opcional</p>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9B7A5A' }}>€</span>
                        <input
                          type="number" min="0" step="0.01" placeholder="0.00"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 9, padding: '9px 12px 9px 24px', fontSize: 14, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Disponibilidade</label>
                      <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 6 }}>Quando podes?</p>
                      <input
                        type="text" placeholder="Ex: Esta semana"
                        value={form.estimated_delay}
                        onChange={e => setForm(f => ({ ...f, estimated_delay: e.target.value }))}
                        style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 9, padding: '9px 12px', fontSize: 14, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Dica */}
                  <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 9, padding: '9px 12px', display: 'flex', gap: 7 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                    <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.5, margin: 0 }}>
                      Propostas com mensagem detalhada têm <strong>3× mais hipóteses</strong> de serem aceites.
                    </p>
                  </div>

                  {/* Botões */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={submitting}
                      style={{ padding: '11px 18px', borderRadius: 10, background: '#FAF7F2', border: '0.5px solid #EDE6DC', fontSize: 14, fontWeight: 600, color: '#7A6048', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.message.trim()}
                      style={{
                        flex: 1, padding: '11px', borderRadius: 10,
                        background: submitting || !form.message.trim() ? '#EDE6DC' : '#C85A1A',
                        color: submitting || !form.message.trim() ? '#9B7A5A' : '#fff',
                        border: 'none', fontSize: 14, fontWeight: 700,
                        cursor: submitting || !form.message.trim() ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      }}
                    >
                      {submitting
                        ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> A enviar...</>
                        : <><Send size={14} /> Enviar proposta</>
                      }
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
