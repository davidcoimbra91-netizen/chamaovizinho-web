'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, CreditCard, Banknote, Euro, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const METHOD_OPTIONS = [
  { value: 'transferencia', label: 'Transferência bancária' },
  { value: 'multibanco', label: 'Multibanco / MB Way' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'numerario', label: 'Numerário' },
  { value: 'outro', label: 'Outro' },
]

const FILTER_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pago', label: 'Pagos' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'parcial', label: 'Parciais' },
  { key: 'vencido', label: 'Vencidos' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC',
  fontSize: 14, color: '#2C1A0E', background: '#FAF7F2', outline: 'none', boxSizing: 'border-box',
}

function fmt(n: number) { return n.toFixed(2).replace('.', ',') + ' €' }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('pt-PT') }

function isOverdue(doc: any) {
  if (!doc.due_date) return false
  if (doc.status === 'paye') return false
  return new Date(doc.due_date) < new Date()
}

function docPaymentStatus(doc: any) {
  if (doc.status === 'paye') return 'pago'
  if (doc.is_partially_paid) return 'parcial'
  if (isOverdue(doc)) return 'vencido'
  if (doc.status === 'envoye' || doc.status === 'accepte') return 'pendente'
  return 'outro'
}

function StatusBadge({ doc }: { doc: any }) {
  const st = docPaymentStatus(doc)
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pago:     { label: 'Pago',     bg: '#EAF3DE', color: '#3B6D11' },
    parcial:  { label: 'Parcial',  bg: '#FFF8E1', color: '#E65100' },
    vencido:  { label: 'Vencido',  bg: '#FFEBEE', color: '#C62828' },
    pendente: { label: 'Pendente', bg: '#EFF6FF', color: '#1D4ED8' },
    outro:    { label: 'Outro',    bg: '#F3F4F6', color: '#6B7280' },
  }
  const s = map[st] ?? map.outro
  return <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 600 }}>{s.label}</span>
}

export default function PagamentosTab() {
  const supabase = createClient()
  const [docs, setDocs] = useState<any[]>([])
  const [clients, setClients] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('todos')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [registerDocId, setRegisterDocId] = useState<string | null>(null)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0])
  const [payMethod, setPayMethod] = useState('transferencia')
  const [payNotes, setPayNotes] = useState('')
  const [payPartial, setPayPartial] = useState(false)
  const [reminderSending, setReminderSending] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: docsData } = await supabase
        .from('billing_documents')
        .select('*')
        .eq('provider_id', user.id)
        .in('status', ['envoye', 'accepte', 'paye'])
        .order('date', { ascending: false })
        .limit(200)
      setDocs(docsData ?? [])
      // fetch clients
      const clientIds = Array.from(new Set((docsData ?? []).map((d: any) => d.client_id).filter(Boolean)))
      if (clientIds.length > 0) {
        const { data: clData } = await supabase.from('billing_clients').select('id, name').in('id', clientIds)
        const map: Record<string, any> = {}
        ;(clData ?? []).forEach((c: any) => { map[c.id] = c })
        setClients(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = docs.filter(d => {
    if (activeFilter === 'todos') return true
    return docPaymentStatus(d) === activeFilter
  })

  const totalPago = docs.filter(d => d.type === 'fatura' && d.status === 'paye').reduce((s, d) => s + (d.payment_amount ?? d.total ?? 0), 0)
  const totalPendente = docs.filter(d => docPaymentStatus(d) === 'pendente').reduce((s, d) => s + (d.total ?? 0), 0)
  const totalParcial = docs.filter(d => d.is_partially_paid && d.status !== 'paye').reduce((s, d) => s + (d.total ?? 0), 0)
  const totalVencido = docs.filter(d => docPaymentStatus(d) === 'vencido').reduce((s, d) => s + (d.total ?? 0), 0)

  const registerDoc = docs.find(d => d.id === registerDocId)

  const openRegister = (doc: any) => {
    setRegisterDocId(doc.id)
    setPayAmount(String(doc.total ?? ''))
    setPayDate(new Date().toISOString().split('T')[0])
    setPayMethod('transferencia')
    setPayNotes('')
    setPayPartial(false)
    setRegisterError('')
    setMenuOpenId(null)
  }

  const handleRegister = async () => {
    if (!registerDocId || !payAmount) return
    const amount = parseFloat(payAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) { setRegisterError('Valor inválido.'); return }
    setRegisterLoading(true); setRegisterError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRegisterLoading(false); return }
    const isPartial = payPartial && amount < (registerDoc?.total ?? 0)
    const newStatus = isPartial ? registerDoc?.status : 'paye'
    const { error } = await supabase.from('billing_documents')
      .update({
        payment_amount: amount,
        payment_date: payDate,
        payment_method: payMethod,
        payment_notes: payNotes || null,
        is_partially_paid: isPartial,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registerDocId)
      .eq('provider_id', user.id)
    if (error) { setRegisterError(error.message); setRegisterLoading(false); return }
    setDocs(prev => prev.map(d => d.id === registerDocId
      ? { ...d, payment_amount: amount, payment_date: payDate, payment_method: payMethod, payment_notes: payNotes, is_partially_paid: isPartial, status: newStatus }
      : d
    ))
    setRegisterLoading(false)
    setRegisterDocId(null)
  }

  const handleSendReminder = async (doc: any) => {
    setReminderSending(doc.id)
    setMenuOpenId(null)
    // Mark reminder sent (just update reminder_sent_at for now)
    await supabase.from('billing_documents').update({ reminder_sent_at: new Date().toISOString() }).eq('id', doc.id)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, reminder_sent_at: new Date().toISOString() } : d))
    setReminderSending(null)
    alert('Lembrete marcado. Integração de email em breve.')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9B7A5A' }}>A carregar...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Pagamentos</h1>
        <p style={{ fontSize: 14, color: '#7A6048' }}>Acompanha os pagamentos dos teus documentos enviados</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Recebido', value: totalPago, icon: CheckCircle, color: '#3B6D11', bg: '#EAF3DE' },
          { label: 'Pendente', value: totalPendente, icon: Clock, color: '#1D4ED8', bg: '#EFF6FF' },
          { label: 'Parcial', value: totalParcial, icon: Euro, color: '#E65100', bg: '#FFF8E1' },
          { label: 'Vencido', value: totalVencido, icon: AlertCircle, color: '#C62828', bg: '#FFEBEE' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
              <k.icon size={14} color={k.color} />
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#2C1A0E' }}>{fmt(k.value)}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveFilter(t.key)}
            style={{ padding: '7px 16px', borderRadius: 99, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: activeFilter === t.key ? '#C85A1A' : '#fff',
              color: activeFilter === t.key ? '#fff' : '#7A6048',
              boxShadow: '0 0 0 0.5px #EDE6DC',
            }}>
            {t.label} {activeFilter === t.key && `(${filtered.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>💳</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Nenhum documento aqui</p>
          <p style={{ fontSize: 14, color: '#9B7A5A' }}>Os documentos enviados aparecem aqui para acompanhar o pagamento.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAF7F2', borderBottom: '0.5px solid #EDE6DC' }}>
                {['Documento', 'Cliente', 'Data', 'Vencimento', 'Valor', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id} style={{ borderBottom: i < filtered.length - 1 ? '0.5px solid #F0E8DC' : 'none', background: isOverdue(doc) && doc.status !== 'paye' ? '#FFFBF5' : undefined }}>
                  <td style={{ padding: '12px 14px' }}>
                    <Link href={`/dashboard/faturacao?id=${doc.id}`} style={{ fontSize: 14, fontWeight: 700, color: '#C85A1A', textDecoration: 'none' }}>{doc.number}</Link>
                    <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 1 }}>{doc.type === 'fatura' ? 'Fatura' : 'Orçamento'}</p>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 14, color: '#2C1A0E' }}>
                    {doc.client_id && clients[doc.client_id] ? clients[doc.client_id].name : <span style={{ color: '#C0A98A' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 14, color: '#7A6048' }}>{fmtDate(doc.date)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 14, color: isOverdue(doc) && doc.status !== 'paye' ? '#C62828' : '#7A6048', fontWeight: isOverdue(doc) && doc.status !== 'paye' ? 600 : 400 }}>
                    {doc.due_date ? fmtDate(doc.due_date) : <span style={{ color: '#C0A98A' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>
                    {fmt(doc.total ?? 0)}
                    {doc.is_partially_paid && doc.payment_amount && (
                      <p style={{ fontSize: 12, color: '#E65100', fontWeight: 400, marginTop: 1 }}>Pago: {fmt(doc.payment_amount)}</p>
                    )}
                    {doc.reminder_sent_at && doc.status !== 'paye' && (
                      <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: 1 }}>🔔 Lembrete {fmtDate(doc.reminder_sent_at)}</p>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge doc={doc} /></td>
                  <td style={{ padding: '12px 14px', position: 'relative' }}>
                    {doc.status !== 'paye' && doc.type === 'fatura' && (
                      <>
                        <button onClick={() => setMenuOpenId(menuOpenId === doc.id ? null : doc.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 13, fontWeight: 600, color: '#5A3E28', cursor: 'pointer' }}>
                          Ações <ChevronDown size={12} />
                        </button>
                        {menuOpenId === doc.id && (
                          <div style={{ position: 'absolute', right: 14, top: 42, zIndex: 50, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 190 }}>
                            <button onClick={() => openRegister(doc)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', fontSize: 14, color: '#2C1A0E', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                              <CreditCard size={13} color="#C85A1A" /> Registar pagamento
                            </button>
                            <button onClick={() => handleSendReminder(doc)}
                              disabled={reminderSending === doc.id}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', borderTop: '0.5px solid #F0E8DC', fontSize: 14, color: '#7A6048', cursor: 'pointer', textAlign: 'left' }}>
                              <Clock size={13} /> {reminderSending === doc.id ? 'A enviar...' : 'Enviar lembrete'}
                            </button>
                            <Link href={`/dashboard/faturacao?id=${doc.id}`}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderTop: '0.5px solid #F0E8DC', fontSize: 14, color: '#7A6048', textDecoration: 'none' }}
                              onClick={() => setMenuOpenId(null)}>
                              <Banknote size={13} /> Ver documento
                            </Link>
                          </div>
                        )}
                      </>
                    )}
                    {doc.status === 'paye' && doc.payment_date && (
                      <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 600 }}>✓ {fmtDate(doc.payment_date)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registar Pagamento modal */}
      {registerDocId && registerDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setRegisterDocId(null) }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E' }}>Registar Pagamento</h2>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginTop: 2 }}>{registerDoc.number} · Total: {fmt(registerDoc.total ?? 0)}</p>
              </div>
              <button onClick={() => setRegisterDocId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#9B7A5A" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Valor recebido *</label>
                <input style={inputStyle} type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Data de pagamento</label>
                <input style={inputStyle} type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Método de pagamento</label>
                <select style={inputStyle} value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {METHOD_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>Notas (opcional)</label>
                <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' as const, fontFamily: 'inherit' }}
                  value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Referência bancária, observações..." />
              </div>
              {/* Partial toggle */}
              {parseFloat(payAmount.replace(',', '.')) < (registerDoc.total ?? 0) && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#5A3E28', cursor: 'pointer' }}>
                  <input type="checkbox" checked={payPartial} onChange={e => setPayPartial(e.target.checked)} />
                  Marcar como pagamento parcial (manter pendente)
                </label>
              )}
            </div>

            {registerError && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', borderRadius: 8, padding: '8px 12px' }}>{registerError}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRegister} disabled={registerLoading || !payAmount}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#C85A1A', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {registerLoading ? 'A guardar...' : 'Confirmar pagamento'}
              </button>
              <button onClick={() => setRegisterDocId(null)}
                style={{ padding: '12px 18px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#7A6048', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside menu closer */}
      {menuOpenId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  )
}
