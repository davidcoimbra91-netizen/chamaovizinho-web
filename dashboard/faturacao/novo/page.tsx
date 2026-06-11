'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Printer, Save, Send, Settings, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TEMPLATES = [
  { key: 'simples',     label: 'Simples',     desc: 'Limpo e minimalista',  icon: '📄' },
  { key: 'estruturado', label: 'Estruturado', desc: 'Tabelas com bordas',   icon: '📋' },
  { key: 'moderno',     label: 'Moderno',     desc: 'Bandeau laranja',      icon: '🎨' },
]

const VAT_OPTIONS = [
  { value: 'isencao', label: 'Isento' },
  { value: '6',  label: '6%' },
  { value: '13', label: '13%' },
  { value: '23', label: '23%' },
]

// FIX: style input éditable — pas de pointer-events:none
const inputStyle: React.CSSProperties = {
  padding: '7px 9px', borderRadius: 7, border: '0.5px solid #EDE6DC',
  fontSize: 12, outline: 'none', background: '#fff',
  color: '#2C1A0E', width: '100%', boxSizing: 'border-box',
}

function NovoBillingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [ppId, setPpId]                   = useState<string | null>(null)
  const [billingProfile, setBillingProfile] = useState<any>(null)
  const [clients, setClients]             = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [template, setTemplate]           = useState('simples')
  const [type, setType]                   = useState(searchParams.get('type') === 'fatura' ? 'fatura' : 'devis')
  const [lines, setLines]                 = useState([{ description: '', quantity: 1, unit_price: 0, vat_rate: 0 }])
  const [notes, setNotes]                 = useState('')
  const [dueDate, setDueDate]             = useState('')
  const [showPreview, setShowPreview]     = useState(false)
  const [showConfigPopup, setShowConfigPopup] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: pp } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single()
      if (!pp) { router.push('/'); return }
      setPpId(pp.id)

      const [bpRes, clientsRes] = await Promise.all([
        supabase.from('billing_profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('billing_clients').select('*').eq('provider_id', pp.id).order('name'),
      ])
      setBillingProfile(bpRes.data)
      setClients(clientsRes.data ?? [])

      // Popup si config incomplète (première fois)
      if (!bpRes.data?.business_name) {
        setShowConfigPopup(true)
      }

      setLoading(false)
    }
    load()
  }, [])

  const addLine    = () => setLines(l => [...l, { description: '', quantity: 1, unit_price: 0, vat_rate: 0 }])
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i))
  const updateLine = (i: number, field: string, value: any) =>
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line))

  const subtotal  = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0)
  const vatAmount = lines.reduce((s, l) => s + l.quantity * l.unit_price * (l.vat_rate / 100), 0)
  const total     = subtotal + vatAmount

  const handleSave = async (status: string) => {
    if (!ppId || !selectedClient) return
    if (!billingProfile?.business_name) { setShowConfigPopup(true); return }
    setSaving(true)

    const { data: numData } = await supabase.rpc('next_billing_number', { p_provider_id: ppId, p_type: type })
    const prefix = type === 'fatura' ? (billingProfile?.prefix_factura ?? 'FAT') : (billingProfile?.prefix_devis ?? 'ORC')
    const number = `${prefix}-${new Date().getFullYear()}-${String(numData ?? 1).padStart(3, '0')}`

    const { data: doc, error } = await supabase.from('billing_documents').insert({
      provider_id: ppId,
      client_id: selectedClient.id,
      type, status, number,
      date: new Date().toISOString().split('T')[0],
      due_date: dueDate || null,
      vat_regime: billingProfile?.vat_regime ?? 'isencao',
      subtotal, vat_amount: vatAmount, total, notes,
      footer_notes: billingProfile?.default_footer ?? null,
    }).select().single()

    if (!error && doc) {
      const lineInserts = lines.map((l, i) => ({
        document_id: doc.id,
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unit_price,
        vat_rate: l.vat_rate,
        line_total: l.quantity * l.unit_price * (1 + l.vat_rate / 100),
        sort_order: i,
      }))
      await supabase.from('billing_lines').insert(lineInserts)
      router.push(`/dashboard/faturacao/${doc.id}`)
    }
    setSaving(false)
  }

  const handlePrint = () => {
    if (!selectedClient || !billingProfile) { setShowConfigPopup(true); return }
    const html = generatePdfHtml(template, type, billingProfile, selectedClient, lines, notes, subtotal, vatAmount, total, dueDate)
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>

      {/* Popup config manquante */}
      {showConfigPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Configuração necessária</h2>
              <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.6 }}>
                Antes de criar orçamentos e faturas, precisas de preencher os teus dados de faturação: nome da empresa, NIF, IBAN e regime de IVA.
              </p>
            </div>
            <div style={{ background: '#FBF0E8', borderRadius: 10, padding: '10px 14px', marginBottom: 18 }}>
              <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5 }}>
                ✓ Nome da empresa · NIF · Morada<br />
                ✓ IBAN · Regime de IVA · Logo<br />
                ✓ Prefixos de numeração
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <Link href="/dashboard/faturacao/configuracao"
                style={{ display: 'block', padding: '12px', borderRadius: 12, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', boxShadow: '0 4px 16px rgba(200,90,26,0.3)' }}>
                ⚙️ Ir para Configuração
              </Link>
              <button onClick={() => setShowConfigPopup(false)}
                style={{ padding: '10px', borderRadius: 12, background: 'none', border: '0.5px solid #EDE6DC', color: '#9B7A5A', fontSize: 13, cursor: 'pointer' }}>
                Continuar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner */}
      <div style={{ background: '#2C1A0E', padding: '16px 0' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['devis', 'fatura'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  style={{ padding: '7px 16px', borderRadius: 99, border: 'none', background: type === t ? '#C85A1A' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {t === 'devis' ? '📄 Orçamento' : '🧾 Fatura'}
                </button>
              ))}
            </div>
            {/* Rappel Configuração */}
            <Link href="/dashboard/faturacao/configuracao"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, background: 'rgba(200,90,26,0.3)', border: '1px solid rgba(200,90,26,0.5)', textDecoration: 'none', fontSize: 11, color: '#E8A07A', fontWeight: 600 }}>
              <Settings size={12} /> Configuração
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Alerta config incompleta */}
        {!billingProfile?.business_name && (
          <Link href="/dashboard/faturacao/configuracao" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <p style={{ fontSize: 13, color: '#92400E', flex: 1 }}>
                <strong>Configuração incompleta</strong> — Preenche os teus dados de faturação para gerar documentos profissionais.
              </p>
              <span style={{ fontSize: 12, color: '#C85A1A', fontWeight: 700 }}>Configurar →</span>
            </div>
          </Link>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>

          {/* ── Formulário principal ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Cliente */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Cliente</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select value={selectedClient?.id ?? ''} onChange={e => setSelectedClient(clients.find(c => c.id === e.target.value) ?? null)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', outline: 'none' }}>
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Link href="/dashboard/faturacao/clientes/novo" style={{ padding: '9px 14px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, background: '#fff' }}>
                  <Plus size={13} /> Novo
                </Link>
              </div>
              {selectedClient && (
                <div style={{ background: '#FAF7F2', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#5A3E28', lineHeight: 1.6 }}>
                  <strong>{selectedClient.name}</strong>
                  {selectedClient.nif && <> · NIF: {selectedClient.nif}</>}<br />
                  {selectedClient.email && <>{selectedClient.email}<br /></>}
                  {selectedClient.address && <>{selectedClient.address}, {selectedClient.city}</>}
                </div>
              )}
            </div>

            {/* Date vencimento */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Data de vencimento</p>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 13, color: '#2C1A0E', background: '#FAF7F2', outline: 'none' }} />
            </div>

            {/* Linhas de serviços — FIX: inputs vraiment éditables */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Serviços / Produtos</p>
              <div style={{ border: '0.5px solid #EDE6DC', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 80px 90px 32px', background: '#FAF7F2', padding: '8px 12px', borderBottom: '0.5px solid #EDE6DC', gap: 6 }}>
                  {['Descrição', 'Qtd.', 'Preço unit.', 'IVA', 'Total', ''].map(h => (
                    <span key={h} style={{ fontSize: 10, color: '#9B7A5A', fontWeight: 600 }}>{h}</span>
                  ))}
                </div>
                {lines.map((line, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 80px 90px 32px', padding: '8px 12px', borderBottom: i < lines.length - 1 ? '0.5px solid #F0E8DC' : 'none', gap: 6, alignItems: 'center' }}>
                    {/* FIX: valeur contrôlée + onChange correct */}
                    <input
                      type="text"
                      value={line.description}
                      onChange={e => updateLine(i, 'description', e.target.value)}
                      placeholder="Descrição do serviço..."
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={line.quantity === 0 ? '' : line.quantity}
                      onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      value={line.unit_price === 0 ? '' : line.unit_price}
                      onChange={e => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      style={inputStyle}
                    />
                    <select
                      value={line.vat_rate}
                      onChange={e => updateLine(i, 'vat_rate', parseFloat(e.target.value))}
                      style={inputStyle}>
                      {VAT_OPTIONS.map(v => <option key={v.value} value={v.value === 'isencao' ? 0 : parseFloat(v.value)}>{v.label}</option>)}
                    </select>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>
                      {(line.quantity * line.unit_price * (1 + line.vat_rate / 100)).toFixed(2)} €
                    </span>
                    <button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} color="#9B7A5A" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', cursor: 'pointer', fontWeight: 500, width: '100%', justifyContent: 'center' }}>
                <Plus size={13} /> Adicionar linha
              </button>
            </div>

            {/* Notes */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Notas</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Observações, condições de pagamento..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', background: '#FAF7F2', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {/* Aperçu template */}
            {showPreview && selectedClient && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#FAF7F2', padding: '10px 16px', borderBottom: '0.5px solid #EDE6DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E' }}>📄 Pré-visualização — Template {TEMPLATES.find(t => t.key === template)?.label}</p>
                  <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B7A5A', fontSize: 12 }}>Fechar ✕</button>
                </div>
                <div style={{ height: 500, overflow: 'auto' }}>
                  <iframe
                    srcDoc={generatePdfHtml(template, type, billingProfile ?? { business_name: 'A tua empresa', nif: '000000000' }, selectedClient, lines, notes, subtotal, vatAmount, total, dueDate)}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Preview"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80, alignSelf: 'start' }}>

            {/* Template — FIX: preview ao clicar */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Template PDF</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {TEMPLATES.map(t => (
                  <button key={t.key} onClick={() => { setTemplate(t.key); if (selectedClient) setShowPreview(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: `${template === t.key ? '2px' : '0.5px'} solid ${template === t.key ? '#C85A1A' : '#EDE6DC'}`, background: template === t.key ? '#FBF0E8' : '#FAF7F2', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: template === t.key ? '#C85A1A' : '#2C1A0E' }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: '#9B7A5A' }}>{t.desc}</div>
                    </div>
                    {template === t.key && <span style={{ fontSize: 10, color: '#C85A1A' }}>✓</span>}
                  </button>
                ))}
              </div>
              <button onClick={() => selectedClient ? setShowPreview(v => !v) : alert('Seleciona um cliente primeiro.')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px', borderRadius: 9, border: '0.5px solid #EDE6DC', background: showPreview ? '#FBF0E8' : '#FAF7F2', color: showPreview ? '#C85A1A' : '#7A6048', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {showPreview ? <><EyeOff size={13} /> Fechar pré-visualização</> : <><Eye size={13} /> Ver pré-visualização</>}
              </button>
            </div>

            {/* Resumo */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Resumo</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7A6048' }}>
                  <span>Sub-total</span><span>{subtotal.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#7A6048', paddingBottom: 8, borderBottom: '0.5px solid #EDE6DC' }}>
                  <span>IVA</span><span>{vatAmount.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#2C1A0E', paddingTop: 4 }}>
                  <span>Total</span><span style={{ color: '#C85A1A' }}>{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <button onClick={() => handleSave('brouillon')} disabled={saving || !selectedClient}
                style={{ padding: '11px', borderRadius: 10, background: saving || !selectedClient ? '#EDE6DC' : '#C85A1A', border: 'none', fontSize: 13, color: saving || !selectedClient ? '#9B7A5A' : '#fff', fontWeight: 600, cursor: saving || !selectedClient ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Save size={14} /> {saving ? 'A guardar...' : 'Guardar rascunho'}
              </button>
              <button onClick={handlePrint} disabled={!selectedClient}
                style={{ padding: '11px', borderRadius: 10, background: '#fff', border: '0.5px solid #C85A1A', fontSize: 13, color: '#C85A1A', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Printer size={14} /> Exportar PDF
              </button>
              <button onClick={() => handleSave('enviado')} disabled={saving || !selectedClient}
                style={{ padding: '11px', borderRadius: 10, background: '#fff', border: '0.5px solid #EDE6DC', fontSize: 13, color: '#7A6048', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={14} /> Enviar ao cliente
              </button>
            </div>

            <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 10, color: '#854A1A', lineHeight: 1.5 }}>Este documento não tem valor fiscal. Deve ser validado por um contabilista.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function generatePdfHtml(template: string, type: string, bp: any, client: any, lines: any[], notes: string, subtotal: number, vatAmount: number, total: number, dueDate: string) {
  const title  = type === 'fatura' ? 'FATURA' : 'ORÇAMENTO'
  const date   = new Date().toLocaleDateString('pt-PT')
  const accent = '#E8622A'

  const linesHtml = lines.map(l => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${l.description || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${l.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${l.unit_price.toFixed(2)} €</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${l.vat_rate === 0 ? 'Isento' : l.vat_rate + '%'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${(l.quantity * l.unit_price * (1 + l.vat_rate / 100)).toFixed(2)} €</td>
    </tr>
  `).join('')

  const modern     = template === 'moderno'
  const structured = template === 'estruturado'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 0; }
    .header { ${modern ? `background:${accent};color:#fff;padding:28px 32px;margin:-20mm -20mm 28px;` : `border-bottom:2px solid ${accent};padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start;`} }
    .title { font-size:28px;font-weight:900; ${modern ? 'color:#fff;' : `color:${accent};`} }
    table { width:100%;border-collapse:collapse; }
    th { background:${modern ? accent : structured ? '#f5f5f5' : '#fafafa'};color:${modern ? '#fff' : '#555'};padding:9px 12px;text-align:left;font-size:12px; }
    td { font-size:13px; }
    .footer { margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#888; }
    .disclaimer { margin-top:20px;padding:10px 14px;background:#fff8f0;border:1px solid #ffd8b0;border-radius:6px;font-size:11px;color:#a0522d; }
  </style></head><body>
  <div class="header">
    ${modern
      ? `<div><div class="title">${title}</div><div style="font-size:13px;opacity:0.8;margin-top:4px;">${bp.business_name ?? ''}</div></div><div style="text-align:right;font-size:12px;opacity:0.8;">${date}</div>`
      : `<div><div class="title">${title}</div><div style="margin-top:6px;color:#555;">${bp.business_name ?? ''}</div></div><div style="text-align:right;color:#555;font-size:12px;">${date}</div>`
    }
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
    <div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">De</div>
      <strong>${bp.business_name ?? ''}</strong><br/>
      ${bp.nif ? `NIF: ${bp.nif}<br/>` : ''}
      ${bp.address ?? ''}<br/>${bp.city ?? ''}
      ${bp.iban ? `<br/>IBAN: ${bp.iban}` : ''}
    </div>
    <div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Para</div>
      <strong>${client.name}</strong><br/>
      ${client.nif ? `NIF: ${client.nif}<br/>` : ''}
      ${client.email ?? ''}<br/>
      ${client.address ?? ''} ${client.city ?? ''}
    </div>
  </div>
  ${dueDate ? `<p style="margin-bottom:20px;color:#555;font-size:12px;">Data de vencimento: <strong>${new Date(dueDate).toLocaleDateString('pt-PT')}</strong></p>` : ''}
  <table>
    <thead><tr>
      <th>Descrição</th><th style="text-align:center">Qtd.</th><th style="text-align:right">Preço unit.</th><th style="text-align:center">IVA</th><th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="min-width:220px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#555;font-size:12px;"><span>Sub-total</span><span>${subtotal.toFixed(2)} €</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#555;font-size:12px;border-bottom:1px solid #eee;"><span>IVA</span><span>${vatAmount.toFixed(2)} €</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:16px;color:${accent};"><span>Total</span><span>${total.toFixed(2)} €</span></div>
    </div>
  </div>
  ${notes ? `<div style="margin-top:20px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:12px;color:#555;">${notes}</div>` : ''}
  ${bp.default_footer ? `<div class="footer">${bp.default_footer}</div>` : ''}
  <div class="disclaimer">Gerado via Chama o Vizinho — Este documento não tem valor fiscal. Deve ser validado por um contabilista.</div>
  </body></html>`
}

export default function NovoBillingPage() {
  return <Suspense><NovoBillingForm /></Suspense>
}
