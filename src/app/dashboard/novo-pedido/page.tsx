'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

export default function NovoPedidoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [geoLocating, setGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    city: '',
    budget: '',
    latitude: '',
    longitude: '',
  })

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


  const getLocation = () => {
    if (!navigator.geolocation) { setGeoError('Geolocalização não suportada pelo browser.'); return }
    setGeoLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setForm(f => ({ ...f, latitude: String(lat), longitude: String(lng) }))
        // Reverse geocode via Nominatim
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'pt' }
          })
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
          if (city) setForm(f => ({ ...f, city }))
        } catch {}
        setGeoLocating(false)
      },
      (err) => {
        setGeoError('Não foi possível obter a localização. Verifique as permissões.')
        setGeoLocating(false)
      },
      { timeout: 8000 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    // Upload photos
    const photoUrls: string[] = []
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('request_photos').upload(path, photo)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('request_photos').getPublicUrl(path)
        photoUrls.push(publicUrl)
      }
    }

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
        photos: photoUrls.length > 0 ? photoUrls : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
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
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Publicar novo pedido</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Gratuito · Recebe propostas em minutos</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {error && (
            <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#C62828' }}>{error}</div>
          )}

          {/* Título */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
              Título do pedido <span style={{ color: '#C85A1A' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reparar fuga na cozinha"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none' }}
            />
          </div>

          {/* Categoria */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
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
                  <div style={{ width: 32, height: 32, position: 'relative' }}>
                    {cat.iconImg
                      ? <Image src={cat.iconImg} alt={cat.label} fill style={{ objectFit: 'contain' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                    }
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: form.category === cat.slug ? cat.color : '#7A6048', lineHeight: 1.2, textAlign: 'center' }}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Descrição</label>
            <textarea
              placeholder="Descreve o trabalho que precisas, materiais necessários, acesso, etc."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none', resize: 'none' }}
            />
          </div>

          {/* Fotos */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Fotos</label>
            <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 12 }}>Adiciona até 5 fotos para facilitar as propostas</p>
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

          {/* Cidade + Orçamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>
                Cidade <span style={{ color: '#C85A1A' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lisboa"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none', marginBottom: 8 }}
              />
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLocating}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: geoLocating ? '#9B7A5A' : '#C85A1A', background: 'none', border: 'none', cursor: geoLocating ? 'default' : 'pointer', padding: 0, fontWeight: 600 }}
              >
                {geoLocating ? (
                  <><div style={{ width: 13, height: 13, border: '2px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> A obter localização...</>
                ) : (
                  <>📍 Usar localização atual</>
                )}
              </button>
              {geoError && <p style={{ fontSize: 13, color: '#C62828', marginTop: 6 }}>{geoError}</p>}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Orçamento (€)</label>
              <input
                type="number"
                placeholder="0"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 16, color: '#2C1A0E', outline: 'none' }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px', borderRadius: 14,
              background: loading ? '#EDE6DC' : '#C85A1A',
              color: loading ? '#9B7A5A' : '#fff',
              border: 'none', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: !loading ? '0 4px 16px rgba(200,90,26,0.3)' : 'none',
            }}>
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> A publicar...</>
            ) : (
              'Publicar pedido'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
