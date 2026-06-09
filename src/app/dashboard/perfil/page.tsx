'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { Suspense } from 'react'

function PerfilForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'prestador' ? 'prestador' : 'perfil')
  const [profile, setProfile] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [form, setForm] = useState({ name: '', city: '', bio: '', phone: '' })
  const [providerForm, setProviderForm] = useState({
    business_name: '', service_description: '', company_city: '',
    years_experience: '', service_categories: [] as string[],
    availability_notes: '', provider_type: 'Particular',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      if (p) setForm({ name: p.name ?? '', city: p.city ?? '', bio: p.bio ?? '', phone: p.phone ?? '' })

      const { data: pp } = await supabase.from('provider_profiles').select('*').eq('user_id', user.id).single()
      setProviderProfile(pp)
      if (pp) setProviderForm({
        business_name: pp.business_name ?? '',
        service_description: pp.service_description ?? '',
        company_city: pp.company_city ?? '',
        years_experience: pp.years_experience?.toString() ?? '',
        service_categories: pp.service_categories ?? [],
        availability_notes: pp.availability_notes ?? '',
        provider_type: pp.provider_type ?? 'Particular',
      })

      setLoading(false)
    }
    load()
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_profiles').update({
      name: form.name,
      city: form.city,
      bio: form.bio,
      phone: form.phone,
    }).eq('id', user.id)

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  const saveProviderProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const data = {
      user_id: user.id,
      business_name: providerForm.business_name,
      service_description: providerForm.service_description,
      company_city: providerForm.company_city,
      years_experience: providerForm.years_experience ? parseInt(providerForm.years_experience) : null,
      service_categories: providerForm.service_categories,
      availability_notes: providerForm.availability_notes,
      provider_type: providerForm.provider_type,
      is_active: true,
    }

    if (providerProfile) {
      await supabase.from('provider_profiles').update(data).eq('id', providerProfile.id)
    } else {
      await supabase.from('provider_profiles').insert(data)
      await supabase.from('user_profiles').update({ is_provider: true }).eq('id', user.id)
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
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

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Configurações</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 }}>
          {[{ key: 'perfil', label: 'Perfil' }, { key: 'prestador', label: 'Perfil Prestador' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: activeTab === tab.key ? '#C85A1A' : 'transparent', color: activeTab === tab.key ? '#fff' : '#7A6048', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {success && (
          <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#3B6D11', marginBottom: 14 }}>
            ✓ Guardado com sucesso!
          </div>
        )}

        {activeTab === 'perfil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'name', label: 'Nome completo', placeholder: 'O teu nome' },
              { key: 'city', label: 'Cidade', placeholder: 'Ex: Lisboa' },
              { key: 'phone', label: 'Telemóvel', placeholder: 'Ex: 912 345 678' },
            ].map(field => (
              <div key={field.key} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Bio</label>
              <textarea
                placeholder="Fala um pouco sobre ti..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none' }}
              />
            </div>
            <button onClick={saveProfile} disabled={saving}
              style={{ padding: '14px', borderRadius: 12, background: '#C85A1A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'A guardar...' : 'Guardar perfil'}
            </button>
          </div>
        )}

        {activeTab === 'prestador' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#854A1A' }}>
              {providerProfile ? '✓ Tens um perfil de prestador ativo.' : 'Cria o teu perfil de prestador para poderes enviar propostas.'}
            </div>

            {[
              { key: 'business_name', label: 'Nome do negócio / Nome profissional', placeholder: 'Ex: João Silva Canalizador' },
              { key: 'company_city', label: 'Cidade de trabalho', placeholder: 'Ex: Lisboa' },
              { key: 'years_experience', label: 'Anos de experiência', placeholder: 'Ex: 5', type: 'number' },
            ].map(field => (
              <div key={field.key} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>{field.label}</label>
                <input
                  type={field.type ?? 'text'}
                  placeholder={field.placeholder}
                  value={(providerForm as any)[field.key]}
                  onChange={e => setProviderForm(f => ({ ...f, [field.key]: e.target.value }))}
                  style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 10 }}>Serviços que ofereces</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {CATEGORIES.filter(c => c.slug !== 'outros').map(cat => (
                  <button key={cat.slug} type="button" onClick={() => toggleCategory(cat.slug)}
                    style={{
                      padding: '8px 6px', borderRadius: 10,
                      border: `0.5px solid ${providerForm.service_categories.includes(cat.slug) ? cat.color : '#EDE6DC'}`,
                      background: providerForm.service_categories.includes(cat.slug) ? cat.bg : '#FAF7F2',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <span style={{ fontSize: 11, color: providerForm.service_categories.includes(cat.slug) ? cat.color : '#7A6048', lineHeight: 1.2, textAlign: 'center' }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 8 }}>Descrição dos serviços</label>
              <textarea
                placeholder="Descreve os serviços que ofereces, a tua experiência e diferenciais..."
                value={providerForm.service_description}
                onChange={e => setProviderForm(f => ({ ...f, service_description: e.target.value }))}
                rows={4}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#2C1A0E', outline: 'none', resize: 'none' }}
              />
            </div>

            <button onClick={saveProviderProfile} disabled={saving}
              style={{ padding: '14px', borderRadius: 12, background: '#C85A1A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
