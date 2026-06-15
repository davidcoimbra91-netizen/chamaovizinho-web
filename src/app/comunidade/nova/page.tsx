'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

const CATS = ['canalização', 'eletricidade', 'limpeza', 'jardinagem', 'pintura', 'bricolage', 'informatica', 'outros']

export default function NovaPerguntaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', description: '', category: '' })

  const handlePhotos = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - photos.length)
    setPhotos(p => [...p, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPhotoPreviews(p => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push(`/auth?redirect=/comunidade/nova`); return }

    // Upload photos
    const photoUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('community').upload(path, photo)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('community').getPublicUrl(path)
        photoUrls.push(publicUrl)
      }
    }

    const { data, error: err } = await supabase
      .from('community_questions')
      .insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        category: form.category || null,
        image_urls: photoUrls.length > 0 ? photoUrls : null,
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
          <Link href="/comunidade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Comunidade
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Fazer uma pergunta</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>A comunidade vai responder</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#C62828' }}>{error}</div>}

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Pergunta <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Como sei se tenho uma fuga de água?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none' }}
            />
          </div>

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Descrição</label>
            <textarea
              placeholder="Explica melhor a situação..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none', resize: 'none' }}
            />
          </div>

          {/* Fotos */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Fotos</label>
            <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 12 }}>Adiciona até 5 fotos para contextualizar a tua pergunta</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handlePhotos(e.target.files)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {photoPreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={src} alt="" fill style={{ objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(i)}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={10} color="#fff" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  style={{ width: 72, height: 72, borderRadius: 8, border: '1px dashed #D4C4B0', background: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                  <Upload size={16} color="#9B7A5A" />
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>Foto</span>
                </button>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 10 }}>Categoria</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map(cat => {
                const info = CATEGORIES.find(c => c.slug === cat)
                const selected = form.category === cat
                return (
                  <button key={cat} type="button"
                    onClick={() => setForm(f => ({ ...f, category: f.category === cat ? '' : cat }))}
                    style={{
                      padding: '7px 12px', borderRadius: 99,
                      border: `0.5px solid ${selected ? (info?.color ?? '#C85A1A') : '#EDE6DC'}`,
                      background: selected ? (info?.bg ?? '#FBF0E8') : '#FAF7F2',
                      color: selected ? (info?.color ?? '#C85A1A') : '#7A6048',
                      fontSize: 15, fontWeight: 500, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    {info?.iconImg
                      ? <div style={{ width: 16, height: 16, position: 'relative', flexShrink: 0 }}><Image src={info.iconImg} alt="" fill style={{ objectFit: 'contain' }} /></div>
                      : <span style={{ fontSize: 16 }}>{info?.icon}</span>
                    }
                    {info?.label ?? cat}
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
