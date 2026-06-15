'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, ChevronRight, Upload, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { PedidoTemplate } from '@/lib/pedido-templates'

export default function PedidoWizard({ template, onClose }: { template: PedidoTemplate; onClose: () => void }) {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const totalSteps = template.steps.length + 2 // étapes template + photos + détails

  const handlePhoto = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - photos.length)
    setPhotos(p => [...p, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(p => [...p, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i))
    setPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const handlePublish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

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

    const fullDescription = [template.buildDescription(answers), description].filter(Boolean).join('\n')

    const { data, error } = await supabase.from('service_requests').insert({
      client_id: user.id,
      title: template.buildTitle(answers),
      description: fullDescription || null,
      category: template.category,
      city,
      budget: budget ? parseFloat(budget) : 0,
      status: 'open',
      is_archived: false,
      photos: photoUrls.length > 0 ? photoUrls : null,
    }).select().single()

    if (!error && data) {
      router.push(`/pedidos/${data.id}`)
    } else {
      setLoading(false)
    }
  }

  const currentTemplateStep = step < template.steps.length ? template.steps[step] : null
  const isPhotosStep = step === template.steps.length
  const isDetailsStep = step === template.steps.length + 1
  const progressPct = ((step + 1) / totalSteps) * 100

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#FAF7F2', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background: '#2C1A0E', borderRadius: '20px 20px 0 0', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {template.iconImg && (
              <div style={{ width: 34, height: 34, position: 'relative', flexShrink: 0 }}>
                <Image src={template.iconImg} alt="" fill style={{ objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Lora, serif' }}>{template.label}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Passo {step + 1} de {totalSteps}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Progress */}
        <div style={{ height: 3, background: '#EDE6DC' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: '#C85A1A', transition: 'width 0.3s ease' }} />
        </div>

        <div style={{ padding: '24px 20px 20px' }}>

          {/* Étape template (options) */}
          {currentTemplateStep && (
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 19, fontWeight: 700, color: '#2C1A0E', marginBottom: 18 }}>
                {currentTemplateStep.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentTemplateStep.options.map(opt => (
                  <button key={opt}
                    onClick={() => { setAnswers(a => ({ ...a, [currentTemplateStep.id]: opt })); setStep(s => s + 1) }}
                    style={{ padding: '14px 16px', borderRadius: 12, border: '0.5px solid #EDE6DC', background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.1s' }}>
                    <span style={{ fontSize: 16, fontWeight: 500, color: '#2C1A0E' }}>{opt}</span>
                    <ChevronRight size={15} color="#D4C4B0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape photos */}
          {isPhotosStep && (
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 19, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>
                Adicionar fotos
              </p>
              <p style={{ fontSize: 15, color: '#9B7A5A', marginBottom: 18 }}>Opcional · Ajuda os profissionais a entender melhor</p>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files)} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {previews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={src} alt="" fill style={{ objectFit: 'cover' }} />
                    <button type="button" onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ width: 80, height: 80, borderRadius: 10, border: '1.5px dashed #D4C4B0', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer' }}>
                    <Upload size={18} color="#9B7A5A" />
                    <span style={{ fontSize: 12, color: '#9B7A5A' }}>Foto</span>
                  </button>
                )}
              </div>
              <button onClick={() => setStep(s => s + 1)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#C85A1A', border: 'none', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                Continuar →
              </button>
            </div>
          )}

          {/* Étape détails */}
          {isDetailsStep && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 19, fontWeight: 700, color: '#2C1A0E' }}>Últimos detalhes</p>
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>
                  Cidade <span style={{ color: '#C85A1A' }}>*</span>
                </label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Lisboa"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 16, color: '#2C1A0E', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>
                  Informações adicionais
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Detalhes que possam ajudar os profissionais..." rows={3}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 16, color: '#2C1A0E', outline: 'none', resize: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>
                  Orçamento estimado (€)
                </label>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Opcional"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 16, color: '#2C1A0E', outline: 'none' }} />
              </div>
              <button onClick={handlePublish} disabled={loading || !city}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading || !city ? '#EDE6DC' : '#C85A1A', border: 'none', fontSize: 16, fontWeight: 700, color: loading || !city ? '#9B7A5A' : '#fff', cursor: loading || !city ? 'default' : 'pointer' }}>
                {loading ? 'A publicar...' : 'Publicar pedido grátis →'}
              </button>
            </div>
          )}

          {/* Bouton retour */}
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9B7A5A', fontSize: 14, marginTop: 16, padding: 0 }}>
              <ArrowLeft size={13} /> Voltar
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
