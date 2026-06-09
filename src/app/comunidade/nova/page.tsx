'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

const CATS = ['canalização', 'eletricidade', 'limpeza', 'jardinagem', 'pintura', 'bricolage', 'informatica', 'outros']

export default function NovaPerguntaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', category: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/auth?redirect=/comunidade/nova`); return }

    const { data, error: err } = await supabase
      .from('community_questions')
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category || null,
        is_published: true,
        answers_count: 0,
      })
      .select()
      .single()

    if (err) { setError('Erro ao publicar pergunta. Tenta novamente.'); setLoading(false); return }
    router.push(`/comunidade/${data.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/comunidade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Comunidade
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Fazer uma pergunta</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>A comunidade vai responder</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C62828' }}>{error}</div>}

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Pergunta <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Como sei se tenho uma fuga de água?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
            />
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Descrição</label>
            <textarea
              placeholder="Explica melhor a situação..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none' }}
            />
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 10 }}>Categoria</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map(cat => {
                const info = CATEGORIES.find(c => c.slug === cat)
                return (
                  <button key={cat} type="button"
                    onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))}
                    style={{
                      padding: '7px 14px', borderRadius: 99, border: `0.5px solid ${form.category === cat ? (info?.color ?? '#C85A1A') : '#EDE6DC'}`,
                      background: form.category === cat ? (info?.bg ?? '#FBF0E8') : '#FAF7F2',
                      color: form.category === cat ? (info?.color ?? '#C85A1A') : '#7A6048',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    }}>
                    {info?.icon} {info?.label ?? cat}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={loading || !form.title}
            style={{
              padding: '16px', borderRadius: 14,
              background: loading || !form.title ? '#EDE6DC' : '#C85A1A',
              color: loading || !form.title ? '#9B7A5A' : '#fff',
              border: 'none', fontSize: 16, fontWeight: 700,
              cursor: loading || !form.title ? 'default' : 'pointer',
            }}>
            {loading ? 'A publicar...' : 'Publicar pergunta →'}
          </button>
        </form>
      </div>
    </div>
  )
}
