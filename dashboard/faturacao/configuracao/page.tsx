'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Upload, Building2, CreditCard, FileText, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const VAT_OPTIONS = [
  { value: 'isencao', label: 'Isenção art. 53°' },
  { value: '6', label: 'IVA 6%' },
  { value: '13', label: 'IVA 13%' },
  { value: '23', label: 'IVA 23%' },
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A3E28', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#C85A1A' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC',
  fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', outline: 'none', boxSizing: 'border-box',
}

export default function ConfiguracaoFaturacaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saved, setSaved] = useState(false)

  // Campos
  const [businessName, setBusinessName] = useState('')
  const [nif, setNif] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [iban, setIban] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [vatRegime, setVatRegime] = useState('isencao')
  const [defaultFooter, setDefaultFooter] = useState('')
  const [prefixDevis, setPrefixDevis] = useState('ORC')
  const [prefixFactura, setPrefixFactura] = useState('FAT')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase.from('billing_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setBusinessName(data.business_name ?? '')
        setNif(data.nif ?? '')
        setAddress(data.address ?? '')
        setCity(data.city ?? '')
        setPostalCode(data.postal_code ?? '')
        setIban(data.iban ?? '')
        setLogoUrl(data.logo_url ?? '')
        setVatRegime(data.vat_regime ?? 'isencao')
        setDefaultFooter(data.default_footer ?? '')
        setPrefixDevis(data.prefix_devis ?? 'ORC')
        setPrefixFactura(data.prefix_factura ?? 'FAT')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `billing_logo_${user.id}_${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('avatars').upload(fileName, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setLogoUrl(urlData.publicUrl)
    } catch (e) {
      alert('Erro ao carregar o logo. Tenta novamente.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    if (!businessName.trim()) { alert('O nome da empresa é obrigatório.'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        user_id: user.id,
        business_name: businessName.trim(),
        nif: nif.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        postal_code: postalCode.trim() || null,
        iban: iban.trim() || null,
        logo_url: logoUrl || null,
        vat_regime: vatRegime,
        default_footer: defaultFooter.trim() || null,
        prefix_devis: prefixDevis.trim().toUpperCase() || 'ORC',
        prefix_factura: prefixFactura.trim().toUpperCase() || 'FAT',
      }
      const { error } = await supabase.from('billing_profiles').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setSaved(true)
      setTimeout(() => { setSaved(false); router.push('/dashboard/faturacao') }, 1500)
    } catch (_) {
      alert('Erro ao guardar. Tenta novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      {/* Banner */}
      <div style={{ background: '#2C1A0E', padding: '18px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#C85A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings2 size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Configuração de Faturação</h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Preenche os teus dados para gerar documentos profissionais</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Aviso se vazio */}
          <div style={{ background: '#FBF0E8', border: '1px solid #C85A1A', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', marginBottom: 2 }}>Preenche estes dados antes de criar documentos</p>
              <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5 }}>O nome da empresa, NIF e IBAN aparecerão em todos os teus orçamentos e faturas. São obrigatórios para documentos profissionais.</p>
            </div>
          </div>

          {/* Logo */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={14} color="#C85A1A" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Logo da empresa</p>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {logoUrl ? (
                <div style={{ width: 120, height: 40, borderRadius: 8, overflow: 'hidden', border: '0.5px solid #EDE6DC', position: 'relative', background: '#FAF7F2' }}>
                  <Image src={logoUrl} alt="Logo" fill style={{ objectFit: 'contain' }} unoptimized />
                </div>
              ) : (
                <div style={{ width: 120, height: 40, borderRadius: 8, border: '1px dashed #D4C4B0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
                  <span style={{ fontSize: 11, color: '#B09070' }}>Sem logo</span>
                </div>
              )}
              <div>
                <button onClick={() => fileRef.current?.click()} disabled={uploadingLogo}
                  style={{ padding: '8px 16px', borderRadius: 9, border: '0.5px solid #C85A1A', background: '#fff', color: '#C85A1A', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {uploadingLogo ? 'A carregar...' : logoUrl ? 'Alterar logo' : '📷 Carregar logo'}
                </button>
                <p style={{ fontSize: 10, color: '#B09070', marginTop: 4 }}>Formato 3:1 recomendado (ex: 300×100px)</p>
              </div>
            </div>
          </div>

          {/* Dados da empresa */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={14} color="#C85A1A" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Dados da empresa</p>
            </div>

            <Field label="Nome da empresa" required>
              <input value={businessName} onChange={e => setBusinessName(e.target.value)}
                placeholder="Ex: João Silva Serviços" style={inputStyle} />
            </Field>

            <Field label="NIF">
              <input value={nif} onChange={e => setNif(e.target.value)}
                placeholder="000000000" maxLength={9} style={inputStyle} />
            </Field>

            <Field label="Morada">
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número..." style={inputStyle} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
              <Field label="Cidade">
                <input value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Lisboa" style={inputStyle} />
              </Field>
              <Field label="Código postal">
                <input value={postalCode} onChange={e => setPostalCode(e.target.value)}
                  placeholder="0000-000" style={inputStyle} />
              </Field>
            </div>
          </div>

          {/* Dados bancários */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={14} color="#3B6D11" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Dados bancários (RIB/IBAN)</p>
            </div>

            <Field label="IBAN">
              <input value={iban} onChange={e => setIban(e.target.value)}
                placeholder="PT50 0000 0000 0000 0000 0000 0" style={inputStyle} />
            </Field>
            <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: -8, marginBottom: 14 }}>Aparece nos documentos para facilitar o pagamento pelos clientes.</p>

            <Field label="Regime de IVA">
              <select value={vatRegime} onChange={e => setVatRegime(e.target.value)} style={{ ...inputStyle }}>
                {VAT_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Numeração e rodapé */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} color="#1A73E8" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Numeração e rodapé</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <Field label="Prefixo orçamentos">
                <input value={prefixDevis} onChange={e => setPrefixDevis(e.target.value.toUpperCase())}
                  placeholder="ORC" maxLength={6} style={inputStyle} />
              </Field>
              <Field label="Prefixo faturas">
                <input value={prefixFactura} onChange={e => setPrefixFactura(e.target.value.toUpperCase())}
                  placeholder="FAT" maxLength={6} style={inputStyle} />
              </Field>
            </div>
            <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: -8, marginBottom: 14 }}>Ex: ORC-2025-001 e FAT-2025-001</p>

            <Field label="Texto de rodapé padrão">
              <textarea value={defaultFooter} onChange={e => setDefaultFooter(e.target.value)} rows={3}
                placeholder="Ex: Obrigado pela sua confiança. Pagamento em 30 dias."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} />
            </Field>
          </div>

          {/* Botão guardar */}
          <button onClick={handleSave} disabled={saving || saved}
            style={{ padding: '14px', borderRadius: 12, background: saved ? '#3B6D11' : saving ? '#EDE6DC' : '#C85A1A', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: !saving && !saved ? '0 4px 16px rgba(200,90,26,0.3)' : 'none', transition: 'background 0.2s' }}>
            <Save size={16} />
            {saved ? '✓ Guardado com sucesso!' : saving ? 'A guardar...' : 'Guardar configuração'}
          </button>

        </div>
      </div>
    </div>
  )
}
