'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Já enviaste uma proposta para este pedido.',
  '42501': 'Não tens permissão para enviar propostas.',
  'PGRST116': 'O pedido já não está disponível.',
}

function getErrorMessage(err: any): string {
  if (!err) return ''
  const code = err.code ?? ''
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  if (err.message?.includes('duplicate')) return 'Já enviaste uma proposta para este pedido.'
  if (err.message?.includes('permission')) return 'Não tens permissão para enviar propostas.'
  if (err.message?.includes('network') || err.message?.includes('fetch')) return 'Erro de ligação. Verifica a tua internet e tenta novamente.'
  return 'Erro ao enviar proposta. Tenta novamente.'
}

export default function EnviarPropostaPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [pedido, setPedido] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [alreadySent, setAlreadySent] = useState(false)
  const [form, setForm] = useState({ message: '', price: '', availability: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [pedidoRes, ppRes] = await Promise.all([
        supabase.from('service_requests').select('id, title, category, city, status, budget, client_id, description').eq('id', params.id as string).single(),
        supabase.from('provider_profiles').select('id').eq('user_id', user.id).single(),
      ])

      if (!pedidoRes.data) { router.push('/explorar'); return }
      setPedido(pedidoRes.data)

      if (!ppRes.data) { router.push('/dashboard/perfil?tab=prestador'); return }
      setProviderProfile(ppRes.data)

      // Verificar se já enviou proposta
      const { data: existingOffer } = await supabase
        .from('offers')
        .select('id, status')
        .eq('service_request_id', params.id as string)
        .eq('provider_id', ppRes.data.id)
        .single()

      if (existingOffer) setAlreadySent(true)
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message.trim()) { setError('A mensagem é obrigatória.'); return }
    if (form.price && isNaN(parseFloat(form.price))) { setError('O preço deve ser um valor numérico.'); return }

    setSubmitting(true)
    setError('')

    try {
      const { error: err } = await supabase
        .from('offers')
        .insert({
          provider_id: providerProfile.id,
          service_request_id: params.id,
          status: 'pending',
          message: form.message.trim(),
          price: form.price ? parseFloat(form.price) : null,
          availability: form.availability.trim() || null,
        })

      if (err) {
        setError(getErrorMessage(err))
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => router.push(`/pedidos/${params.id}`), 2000)
    } catch (e: any) {
      setError('Erro de ligação. Verifica a tua internet e tenta novamente.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={36} color="#3B6D11" />
      </div>
      <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#2C1A0E' }}>Proposta enviada!</h2>
      <p style={{ fontSize: 14, color: '#7A6048', maxWidth: 320 }}>A tua proposta foi enviada com sucesso. O cliente irá analisá-la em breve.</p>
      <p style={{ fontSize: 12, color: '#9B7A5A' }}>A redirecionar...</p>
    </div>
  )

  if (alreadySent) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2', flexDirection: 'column', gap: 16, textAlign: 'center', padding: 32 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📤</div>
      <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E' }}>Proposta já enviada</h2>
      <p style={{ fontSize: 14, color: '#7A6048', maxWidth: 300 }}>Já enviaste uma proposta para este pedido. Aguarda a resposta do cliente.</p>
      <Link href={`/pedidos/${params.id}`}
        style={{ padding: '10px 24px', borderRadius: 10, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
        Ver pedido
      </Link>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      {/* Banner */}
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={`/pedidos/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Voltar ao pedido
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>Enviar proposta</h1>
          {pedido?.title && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{pedido.title}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Resumo do pedido */}
        {pedido && (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Pedido</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>{pedido.title}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {pedido.city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {pedido.city}</span>}
              {pedido.budget > 0 && <span style={{ fontSize: 12, color: '#9B7A5A' }}>💶 Orçamento: €{pedido.budget}</span>}
            </div>
            {pedido.description && <p style={{ fontSize: 12, color: '#7A6048', marginTop: 8, lineHeight: 1.5 }}>{pedido.description}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Erro */}
          {error && (
            <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C62828', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Mensagem */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>
              Mensagem para o cliente <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 10 }}>Apresenta-te, explica a tua experiência e como podes resolver este pedido.</p>
            <textarea
              required
              placeholder="Ex: Olá! Sou técnico de canalização com 10 anos de experiência. Posso visitar amanhã de manhã para avaliar o problema..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: '#B09070', marginTop: 5, textAlign: 'right' }}>{form.message.length}/500 caracteres</p>
          </div>

          {/* Preço + Disponibilidade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Preço estimado (€)</label>
              <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 8 }}>Opcional — podes discutir depois</p>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9B7A5A' }}>€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px 11px 28px', fontSize: 14, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px' }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Disponibilidade</label>
              <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 8 }}>Quando podes realizar o trabalho?</p>
              <input
                type="text"
                placeholder="Ex: Esta semana, manhãs"
                value={form.availability}
                onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Dica */}
          <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5 }}>
              Propostas com mensagens detalhadas e preço têm <strong>3× mais hipóteses</strong> de serem aceites.
            </p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={submitting || !form.message.trim()}
            style={{
              padding: '16px', borderRadius: 14,
              background: submitting || !form.message.trim() ? '#EDE6DC' : '#C85A1A',
              color: submitting || !form.message.trim() ? '#9B7A5A' : '#fff',
              border: 'none', fontSize: 15, fontWeight: 700,
              cursor: submitting || !form.message.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: !submitting && form.message.trim() ? '0 4px 16px rgba(200,90,26,0.3)' : 'none',
            }}>
            {submitting ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> A enviar...</>
            ) : (
              <><Send size={16} /> Enviar proposta</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
