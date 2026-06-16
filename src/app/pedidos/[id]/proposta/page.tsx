'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function EnviarPropostaPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [pedido, setPedido] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ message: '', price: '', availability: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: pedidoData } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!pedidoData) { router.push('/explorar'); return }
      setPedido(pedidoData)

      const { data: pp } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!pp) { router.push('/dashboard/perfil?tab=prestador'); return }
      setProviderProfile(pp)
      setLoading(false)
    }
    load()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error: err } = await supabase
      .from('offers')
      .insert({
        provider_id: providerProfile.id,
        service_request_id: params.id,
        status: 'pending',
        message: form.message,
        price: form.price ? parseFloat(form.price) : null,
        availability: form.availability,
      })

    if (err) { setError('Erro ao enviar proposta. Tenta novamente.'); setSubmitting(false); return }
    router.push(`/pedidos/${params.id}`)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={`/pedidos/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Voltar ao pedido
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Enviar proposta</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{pedido?.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C62828' }}>{error}</div>
          )}

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Mensagem para o cliente <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <textarea
              required
              placeholder="Apresenta-te, explica como podes ajudar e o que inclui a tua proposta..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Preço (€)</label>
              <input
                type="number"
                placeholder="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
              />
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Disponibilidade</label>
              <input
                type="text"
                placeholder="Ex: Esta semana"
                value={form.availability}
                onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.message}
            style={{
              padding: '16px', borderRadius: 14,
              background: submitting || !form.message ? '#EDE6DC' : '#C85A1A',
              color: submitting || !form.message ? '#9B7A5A' : '#fff',
              border: 'none', fontSize: 16, fontWeight: 700,
              cursor: submitting || !form.message ? 'default' : 'pointer',
            }}>
            {submitting ? 'A enviar...' : 'Enviar proposta →'}
          </button>
        </form>
      </div>
    </div>
  )
}
