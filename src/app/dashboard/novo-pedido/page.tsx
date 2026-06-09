'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

export default function NovoPedidoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    budget: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data, error: err } = await supabase
      .from('service_requests')
      .insert({
        client_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        budget: form.budget ? parseFloat(form.budget) : 0,
        status: 'open',
        is_archived: false,
      })
      .select()
      .single()

    if (err) { setError('Erro ao publicar pedido. Tenta novamente.'); setLoading(false); return }
    router.push(`/pedidos/${data.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Publicar novo pedido</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Gratuito · Recebe propostas em minutos</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {error && (
            <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C62828' }}>{error}</div>
          )}

          {/* Título */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Título do pedido <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reparar fuga na cozinha"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
            />
          </div>

          {/* Categoria */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Categoria <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CATEGORIES.filter(c => c.slug !== 'outros').map(cat => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.slug }))}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `0.5px solid ${form.category === cat.slug ? cat.color : '#EDE6DC'}`,
                    background: form.category === cat.slug ? cat.bg : '#FAF7F2',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: form.category === cat.slug ? cat.color : '#7A6048', lineHeight: 1.2, textAlign: 'center' }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Descrição</label>
            <textarea
              placeholder="Descreve o trabalho que precisas, materiais necessários, acesso, etc."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none' }}
            />
          </div>

          {/* Cidade + Orçamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
                Cidade <span style={{ color: '#C85A1A' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lisboa"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
              />
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Orçamento (€)</label>
              <input
                type="number"
                placeholder="0"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.title || !form.category || !form.city}
            style={{
              padding: '16px', borderRadius: 14, background: loading || !form.title || !form.category || !form.city ? '#EDE6DC' : '#C85A1A',
              color: loading || !form.title || !form.category || !form.city ? '#9B7A5A' : '#fff',
              border: 'none', fontSize: 16, fontWeight: 700, cursor: loading || !form.title || !form.category || !form.city ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}>
            {loading ? 'A publicar...' : 'Publicar pedido grátis →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9B7A5A' }}>Gratuito · Sem compromisso · Recebe propostas em minutos</p>
        </form>
      </div>
    </div>
  )
}
