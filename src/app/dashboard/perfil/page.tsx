'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, MapPin, Camera, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

function PerfilForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'prestador' ? 'prestador' : 'perfil')
  const [profile, setProfile] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', city: '', bio: '', phone: '', latitude: '', longitude: '' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [providerForm, setProviderForm] = useState({
    business_name: '', business_description: '', service_description: '',
    company_city: '', company_address: '', company_postal_code: '',
    company_email: '', company_phone: '', company_website: '', company_nif: '',
    years_experience: '', service_categories: [] as string[],
    availability_notes: '', provider_type: 'Particular', legal_form: '',
    service_area: '', region: '', phone_public: false,
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)

      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      if (p) {
        setForm({ name: p.name ?? '', city: p.city ?? '', bio: p.bio ?? '', phone: p.phone ?? '', latitude: p.latitude?.toString() ?? '', longitude: p.longitude?.toString() ?? '' })
        if (p.profile_photo) setAvatarPreview(p.profile_photo)
      }

      const { data: pp } = await supabase.from('provider_profiles').select('*').eq('user_id', user.id).single()
      setProviderProfile(pp)
      if (pp) {
        setProviderForm({
          business_name: pp.business_name ?? '',
          business_description: pp.business_description ?? '',
          service_description: pp.service_description ?? '',
          company_city: pp.company_city ?? '',
          company_address: pp.company_address ?? '',
          company_postal_code: pp.company_postal_code ?? '',
          company_email: pp.company_email ?? '',
          company_phone: pp.company_phone ?? '',
          company_website: pp.company_website ?? '',
          company_nif: pp.company_nif ?? '',
          years_experience: pp.years_experience?.toString() ?? '',
          service_categories: pp.service_categories ?? [],
          availability_notes: pp.availability_notes ?? '',
          provider_type: pp.provider_type ?? 'Particular',
          legal_form: pp.legal_form ?? '',
          service_area: pp.service_area ?? '',
          region: pp.region ?? '',
          phone_public: pp.phone_public ?? false,
        })
        if (pp.cover_photo) setCoverPreview(pp.cover_photo)
      }
      setLoading(false)
    }
    load()
  }, [])

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords
      // Reverse geocoding via Nominatim
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      const data = await resp.json()
      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.municipality ?? ''
      setForm(f => ({ ...f, city, latitude: latitude.toString(), longitude: longitude.toString() }))
      setLocating(false)
    }, () => setLocating(false))
  }

  const uploadImage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const saveProfile = async () => {
    setSaving(true)
    let photoUrl = profile?.profile_photo ?? null

    if (avatarFile && userId) {
      const uploaded = await uploadImage(avatarFile, 'avatars', `${userId}-${Date.now()}.jpg`)
      if (uploaded) photoUrl = uploaded
    }

    await supabase.from('user_profiles').update({
      name: form.name, city: form.city, bio: form.bio, phone: form.phone,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      profile_photo: photoUrl,
    }).eq('id', userId!)

    setSuccess('Perfil guardado com sucesso!')
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
  }

  const saveProviderProfile = async () => {
    setSaving(true)
    let coverUrl = providerProfile?.cover_photo ?? null

    if (coverFile && userId) {
      const uploaded = await uploadImage(coverFile, 'avatars', `cover-${userId}-${Date.now()}.jpg`)
      if (uploaded) coverUrl = uploaded
    }

    const data = {
      user_id: userId,
      business_name: providerForm.business_name,
      business_description: providerForm.business_description,
      service_description: providerForm.service_description,
      company_city: providerForm.company_city,
      company_address: providerForm.company_address,
      company_postal_code: providerForm.company_postal_code,
      company_email: providerForm.company_email,
      company_phone: providerForm.company_phone,
      company_website: providerForm.company_website,
      company_nif: providerForm.company_nif,
      years_experience: providerForm.years_experience ? parseInt(providerForm.years_experience) : null,
      service_categories: providerForm.service_categories,
      availability_notes: providerForm.availability_notes,
      provider_type: providerForm.provider_type,
      legal_form: providerForm.legal_form,
      service_area: providerForm.service_area,
      region: providerForm.region,
      phone_public: providerForm.phone_public,
      cover_photo: coverUrl,
      is_active: true,
    }

    if (providerProfile) {
      await supabase.from('provider_profiles').update(data).eq('id', providerProfile.id)
    } else {
      await supabase.from('provider_profiles').insert(data)
      await supabase.from('user_profiles').update({ is_provider: true }).eq('id', userId!)
    }

    setSuccess('Perfil prestador guardado!')
    setTimeout(() => setSuccess(''), 3000)
    setSaving(false)
  }

  const toggleCategory = (slug: string) => {
    setProviderForm(f => ({
      ...f,
      service_categories: f.service_categories.includes(slug)
        ? f.service_categories.filter(c => c !== slug)
        : [...f.service_categories, slug]
    }))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const InputField = ({ label, value, onChange, placeholder, type = 'text', required = false }: any) => (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#C85A1A' }}>*</span>}
      </label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>Configurações</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
          {[{ key: 'perfil', label: '👤 Perfil' }, { key: 'prestador', label: '🔧 Perfil Prestador' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: activeTab === tab.key ? '#C85A1A' : 'transparent', color: activeTab === tab.key ? '#fff' : '#7A6048', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {success && <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#3B6D11', marginBottom: 14 }}>✓ {success}</div>}

        {activeTab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Avatar upload */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 14 }}>Foto de perfil</p>
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 12px' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#FBF0E8', position: 'relative' }}>
                  {avatarPreview
                    ? <Image src={avatarPreview} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#C85A1A' }}>{form.name?.charAt(0) ?? '?'}</div>
                  }
                </div>
                <button onClick={() => avatarRef.current?.click()}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: '#C85A1A', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={12} color="#fff" />
                </button>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)) }
                }} />
              <p style={{ fontSize: 11, color: '#9B7A5A' }}>Clica no ícone para mudar a foto</p>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InputField label="Nome completo" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} placeholder="O teu nome" required />
              <InputField label="Telemóvel" value={form.phone} onChange={(v: string) => setForm(f => ({ ...f, phone: v }))} placeholder="912 345 678" />
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Cidade</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="Ex: Lisboa" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    style={{ flex: 1, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none' }} />
                  <button onClick={getLocation} disabled={locating}
                    style={{ padding: '10px 14px', borderRadius: 10, background: '#FBF0E8', border: '0.5px solid #E0CCBB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#C85A1A', fontWeight: 600 }}>
                    <MapPin size={14} /> {locating ? '...' : 'GPS'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Bio</label>
                <textarea placeholder="Fala um pouco sobre ti..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <button onClick={saveProfile} disabled={saving}
              style={{ padding: '14px', borderRadius: 12, background: '#C85A1A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'A guardar...' : 'Guardar perfil'}
            </button>
          </div>
        )}

        {activeTab === 'prestador' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {providerProfile
              ? <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3B6D11' }}>✓ Perfil de prestador ativo</div>
              : <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#854A1A' }}>Cria o teu perfil para poderes enviar propostas.</div>
            }

            {/* Foto de capa */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 12 }}>Foto de capa do perfil</p>
              <div style={{ height: 120, borderRadius: 12, overflow: 'hidden', background: '#FAF7F2', position: 'relative', marginBottom: 10 }}>
                {coverPreview && <Image src={coverPreview} alt="" fill style={{ objectFit: 'cover' }} unoptimized />}
                <button onClick={() => coverRef.current?.click()}
                  style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(44,26,14,0.7)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Upload size={13} /> Alterar foto
                </button>
              </div>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)) }
                }} />
              <p style={{ fontSize: 11, color: '#9B7A5A' }}>Tamanho recomendado: 1200 × 400px</p>
            </div>

            {/* Tipo prestador */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 10 }}>Tipo de prestador</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Particular', 'Recibo Verde', 'Empresa'].map(t => (
                  <button key={t} onClick={() => setProviderForm(f => ({ ...f, provider_type: t }))}
                    style={{ flex: 1, padding: '9px 8px', borderRadius: 10, border: `0.5px solid ${providerForm.provider_type === t ? '#C85A1A' : '#EDE6DC'}`, background: providerForm.provider_type === t ? '#FBF0E8' : '#FAF7F2', color: providerForm.provider_type === t ? '#C85A1A' : '#7A6048', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Informações básicas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Informações básicas</p>
              <InputField label="Nome profissional / Negócio" value={providerForm.business_name} onChange={(v: string) => setProviderForm(f => ({ ...f, business_name: v }))} placeholder="Ex: João Silva Canalizador" required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <InputField label="Cidade de trabalho" value={providerForm.company_city} onChange={(v: string) => setProviderForm(f => ({ ...f, company_city: v }))} placeholder="Ex: Lisboa" />
                <InputField label="Região" value={providerForm.region} onChange={(v: string) => setProviderForm(f => ({ ...f, region: v }))} placeholder="Ex: Lisboa" />
              </div>
              <InputField label="Zona de serviço" value={providerForm.service_area} onChange={(v: string) => setProviderForm(f => ({ ...f, service_area: v }))} placeholder="Ex: Lisboa e arredores (50km)" />
              <InputField label="Anos de experiência" value={providerForm.years_experience} onChange={(v: string) => setProviderForm(f => ({ ...f, years_experience: v }))} placeholder="Ex: 5" type="number" />
            </div>

            {/* Contacto */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Contacto</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <InputField label="Telefone" value={providerForm.company_phone} onChange={(v: string) => setProviderForm(f => ({ ...f, company_phone: v }))} placeholder="912 345 678" />
                <InputField label="Email profissional" value={providerForm.company_email} onChange={(v: string) => setProviderForm(f => ({ ...f, company_email: v }))} placeholder="email@exemplo.com" type="email" />
              </div>
              <InputField label="Website" value={providerForm.company_website} onChange={(v: string) => setProviderForm(f => ({ ...f, company_website: v }))} placeholder="https://..." />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10 }}>
                <input type="checkbox" id="phone_public" checked={providerForm.phone_public} onChange={e => setProviderForm(f => ({ ...f, phone_public: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#C85A1A' }} />
                <label htmlFor="phone_public" style={{ fontSize: 13, color: '#2C1A0E', cursor: 'pointer' }}>
                  Mostrar telefone no perfil público
                  {!profile?.is_pro && <span style={{ fontSize: 11, color: '#C85A1A', marginLeft: 6 }}>(requer plano Premium)</span>}
                </label>
              </div>
            </div>

            {/* Empresa */}
            {(providerForm.provider_type === 'Empresa' || providerForm.provider_type === 'Recibo Verde') && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>
                  {providerForm.provider_type === 'Empresa' ? 'Dados da empresa' : 'Dados fiscais'}
                </p>
                {providerForm.provider_type === 'Empresa' && (
                  <InputField label="Forma jurídica" value={providerForm.legal_form} onChange={(v: string) => setProviderForm(f => ({ ...f, legal_form: v }))} placeholder="Ex: Unipessoal Lda." />
                )}
                <InputField label="NIF" value={providerForm.company_nif} onChange={(v: string) => setProviderForm(f => ({ ...f, company_nif: v }))} placeholder="Ex: 123456789" />
                <InputField label="Morada" value={providerForm.company_address} onChange={(v: string) => setProviderForm(f => ({ ...f, company_address: v }))} placeholder="Rua, número..." />
                <InputField label="Código postal" value={providerForm.company_postal_code} onChange={(v: string) => setProviderForm(f => ({ ...f, company_postal_code: v }))} placeholder="1000-001" />
              </div>
            )}

            {/* Serviços */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Serviços que ofereces</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {CATEGORIES.filter(c => c.slug !== 'outros').map(cat => (
                  <button key={cat.slug} onClick={() => toggleCategory(cat.slug)}
                    style={{ padding: '10px 6px', borderRadius: 10, border: `0.5px solid ${providerForm.service_categories.includes(cat.slug) ? cat.color : '#EDE6DC'}`, background: providerForm.service_categories.includes(cat.slug) ? cat.bg : '#FAF7F2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <span style={{ fontSize: 10, color: providerForm.service_categories.includes(cat.slug) ? cat.color : '#7A6048', lineHeight: 1.2, textAlign: 'center' }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descrições */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Descrição dos serviços</label>
                <textarea placeholder="Descreve os serviços que ofereces..." value={providerForm.service_description} onChange={e => setProviderForm(f => ({ ...f, service_description: e.target.value }))} rows={3}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Sobre o negócio</label>
                <textarea placeholder="Conta um pouco sobre a tua empresa ou experiência..." value={providerForm.business_description} onChange={e => setProviderForm(f => ({ ...f, business_description: e.target.value }))} rows={3}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 6 }}>Disponibilidade</label>
                <textarea placeholder="Ex: Disponível de segunda a sexta, 8h-18h..." value={providerForm.availability_notes} onChange={e => setProviderForm(f => ({ ...f, availability_notes: e.target.value }))} rows={2}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none' }} />
              </div>
            </div>

            <button onClick={saveProviderProfile} disabled={saving}
              style={{ padding: '14px', borderRadius: 12, background: '#C85A1A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'A guardar...' : providerProfile ? 'Guardar perfil prestador' : 'Criar perfil prestador'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PerfilPage() {
  return <Suspense><PerfilForm /></Suspense>
}
