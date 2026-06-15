'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, CheckCircle, Building2, CreditCard, FileText, Settings2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const VAT_OPTIONS = [
  { value: 'isencao', label: 'Isenção art. 53°', desc: 'Prestadores com volume < 14.500€/ano' },
  { value: '6',       label: 'IVA 6%',            desc: 'Taxa reduzida' },
  { value: '13',      label: 'IVA 13%',            desc: 'Taxa intermédia' },
  { value: '23',      label: 'IVA 23%',            desc: 'Taxa normal' },
]

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{label}</label>
      {hint && <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 2 }}>{hint}</p>}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 9,
  border: '0.5px solid #EDE6DC',
  fontSize: 14,
  color: '#2C1A0E',
  background: '#FAF7F2',
  outline: 'none',
  boxSizing: 'border-box',
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '0.5px solid #EDE6DC', background: '#FAF7F2' }}>
        <Icon size={15} color="#C85A1A" />
        <p style={{ fontSize: 13, fontWeight: 700, color: '#5A3E28', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

export default function DefinicoesFaturacaoPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

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
    async function load() {
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
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `billing_logo_${user.id}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setLogoUrl(urlData.publicUrl)
    } catch (e: any) {
      setError('Erro ao carregar logo: ' + (e.message ?? 'Tente novamente.'))
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSave = async () => {
    if (!businessName.trim()) { setError('O nome da empresa é obrigatório.'); return }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
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
        updated_at: new Date().toISOString(),
      }
      const { error: upsertError } = await supabase.from('billing_profiles').upsert(payload, { onConflict: 'user_id' })
      if (upsertError) throw upsertError
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Erro ao guardar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9B7A5A', fontSize: 15 }}>A carregar...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '16px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>Perfil de Faturação</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Dados que aparecem nos teus documentos PDF</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || uploadingLogo}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 99,
                background: saved ? '#3B6D11' : '#C85A1A',
                border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saving ? 'A guardar...' : saved ? 'Guardado!' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {error && (
          <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#C62828' }}>
            {error}
          </div>
        )}

        {/* Logo */}
        <Section icon={Upload} title="Logo da empresa">
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            {logoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{ height: 56, maxWidth: 180, objectFit: 'contain', borderRadius: 8, border: '0.5px solid #EDE6DC', background: '#fff', padding: 6 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 13, color: '#3B6D11', fontWeight: 600 }}>✓ Logo carregado</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{ fontSize: 13, color: '#C85A1A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    {uploadingLogo ? 'A carregar...' : 'Alterar logo'}
                  </button>
                  <button
                    onClick={() => setLogoUrl('')}
                    style={{ fontSize: 13, color: '#9B7A5A', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                style={{
                  width: '100%', padding: '18px', borderRadius: 10,
                  border: '1.5px dashed #C85A1A', background: '#FBF0E8',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Upload size={22} color="#C85A1A" />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#C85A1A', margin: 0 }}>
                  {uploadingLogo ? 'A carregar...' : 'Carregar logo'}
                </p>
                <p style={{ fontSize: 12, color: '#9B7A5A', margin: 0 }}>Formato 3:1 recomendado (ex: 300×100px). PNG ou JPG.</p>
              </button>
            )}
          </div>
        </Section>

        {/* Dados da empresa */}
        <Section icon={Building2} title="Dados da empresa">
          <Field label="Nome da empresa *">
            <input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Ex: João Silva Serviços" />
          </Field>
          <Field label="NIF" hint="Número de Identificação Fiscal">
            <input style={inputStyle} value={nif} onChange={e => setNif(e.target.value)} placeholder="000000000" maxLength={9} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Prefixo orçamento" hint="Ex: ORC → ORC-2025-001">
              <input style={inputStyle} value={prefixDevis} onChange={e => setPrefixDevis(e.target.value.toUpperCase())} placeholder="ORC" maxLength={6} />
            </Field>
            <Field label="Prefixo fatura" hint="Ex: FAT → FAT-2025-001">
              <input style={inputStyle} value={prefixFactura} onChange={e => setPrefixFactura(e.target.value.toUpperCase())} placeholder="FAT" maxLength={6} />
            </Field>
          </div>
        </Section>

        {/* Morada */}
        <Section icon={Settings2} title="Morada">
          <Field label="Morada">
            <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, andar..." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="Cidade">
              <input style={inputStyle} value={city} onChange={e => setCity(e.target.value)} placeholder="Lisboa" />
            </Field>
            <Field label="Código postal">
              <input style={inputStyle} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="1000-001" maxLength={8} />
            </Field>
          </div>
        </Section>

        {/* Dados bancários */}
        <Section icon={CreditCard} title="Dados bancários">
          <Field label="IBAN" hint="Aparecerá automaticamente nos PDFs para facilitar o pagamento.">
            <input style={inputStyle} value={iban} onChange={e => setIban(e.target.value)} placeholder="PT50 0000 0000 0000 0000 0000 0" />
          </Field>
        </Section>

        {/* Regime IVA */}
        <Section icon={FileText} title="Regime de IVA">
          <p style={{ fontSize: 13, color: '#9B7A5A', marginTop: -4 }}>Será aplicado por defeito nos novos documentos.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {VAT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setVatRegime(opt.value)}
                style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: vatRegime === opt.value ? '1.5px solid #C85A1A' : '0.5px solid #EDE6DC',
                  background: vatRegime === opt.value ? '#FBF0E8' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: vatRegime === opt.value ? '#C85A1A' : '#2C1A0E' }}>{opt.label}</span>
                  {vatRegime === opt.value && <CheckCircle size={14} color="#C85A1A" />}
                </div>
                <span style={{ fontSize: 12, color: '#9B7A5A' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
          {vatRegime === 'isencao' && (
            <div style={{ background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 9, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#1D4ED8', lineHeight: 1.5, margin: 0 }}>
                ℹ️ Menção automática nos PDFs: <em>"Isento de IVA — artigo 53.° do Código do IVA"</em>
              </p>
            </div>
          )}
        </Section>

        {/* Rodapé padrão */}
        <Section icon={FileText} title="Notas de rodapé padrão">
          <Field label="Texto do rodapé" hint="Aparecerá no fundo de todos os documentos PDF gerados.">
            <textarea
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'inherit' }}
              value={defaultFooter}
              onChange={e => setDefaultFooter(e.target.value)}
              placeholder="Ex: Obrigado pela preferência. Pagamento a 30 dias por transferência bancária. IBAN: PT50..."
            />
          </Field>
        </Section>

        {/* Save button (bottom) */}
        <button
          onClick={handleSave}
          disabled={saving || uploadingLogo}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 12,
            background: saved ? '#3B6D11' : '#C85A1A',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saving ? 'A guardar...' : saved ? 'Guardado com sucesso!' : 'Guardar perfil de faturação'}
        </button>

      </div>
    </div>
  )
}
