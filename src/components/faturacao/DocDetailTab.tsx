'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft, Printer, CheckCircle, XCircle, DollarSign, Pencil, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Rascunho', bg: '#F3F4F6', color: '#6B7280' },
  envoye: { label: 'Enviado', bg: '#EFF6FF', color: '#3B82F6' },
  accepte: { label: 'Aceite', bg: '#EAF3DE', color: '#3B6D11' },
  refuse: { label: 'Recusado', bg: '#FFEBEE', color: '#C62828' },
  paye: { label: 'Pago', bg: '#FEF9E7', color: '#F57F17' },
}

const TRANSITIONS: Record<string, (isFatura: boolean) => string[]> = {
  brouillon: () => ['envoye'],
  envoye: (f) => f ? ['accepte', 'refuse', 'paye'] : ['accepte', 'refuse'],
  accepte: (f) => f ? ['paye'] : [],
  refuse: () => [],
  paye: () => [],
}

const STATUS_LABELS: Record<string, string> = {
  envoye: 'Enviar ao cliente',
  accepte: 'Marcar aceite',
  refuse: 'Marcar recusado',
  paye: 'Marcar como pago',
}

export default function DocDetailTab({ docId }: { docId: string }) {
  const supabase = createClient()
  const [doc, setDoc] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [client, setClient] = useState<any>(null)
  const [bp, setBp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [docRes, bpRes] = await Promise.all([
      supabase.from('billing_documents').select('*').eq('id', docId).single(),
      supabase.from('billing_profiles').select('*').eq('user_id', user.id).single(),
    ])
    const d = docRes.data
    if (!d) { setLoading(false); return }
    setDoc(d); setBp(bpRes.data)
    const [linesRes, clientRes] = await Promise.all([
      supabase.from('billing_lines').select('*').eq('document_id', docId).order('sort_order'),
      d.client_id ? supabase.from('billing_clients').select('*').eq('id', d.client_id).single() : Promise.resolve({ data: null }),
    ])
    setLines(linesRes.data ?? [])
    setClient(clientRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [docId])

  const handleStatus = async (status: string) => {
    setUpdatingStatus(status); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error: e } = await supabase.from('billing_documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', docId).eq('provider_id', user.id)
    if (e) { setError(e.message) }
    else { setDoc((d: any) => ({ ...d, status })) }
    setUpdatingStatus(null)
  }

  const handleConvert = async () => {
    setConverting(true); setError('')
    const res = await fetch(`/api/billing/${docId}/convert`, { method: 'POST' })
    if (res.redirected) {
      // extract new doc id from redirect URL
      const url = new URL(res.url)
      const newId = url.pathname.split('/').pop()
      window.location.href = `/dashboard/faturacao?id=${newId}`
    } else if (!res.ok) {
      setError('Erro ao converter. Tenta novamente.')
      setConverting(false)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#9B7A5A' }}>A carregar...</div>
  if (!doc) return <div style={{ textAlign: 'center', padding: 60, color: '#C62828' }}>Documento não encontrado.</div>

  const st = STATUS_MAP[doc.status] ?? STATUS_MAP.brouillon
  const isFatura = doc.type === 'fatura'
  const nextStatuses = (TRANSITIONS[doc.status] ?? (() => []))(isFatura)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9B7A5A', textDecoration: 'none', marginBottom: 8 }}>
            <ArrowLeft size={12} /> Faturação
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{doc.number}</h1>
          <p style={{ fontSize: 14, color: '#7A6048' }}>
            {isFatura ? 'Fatura' : 'Orçamento'} · {new Date(doc.date).toLocaleDateString('pt-PT')}
          </p>
        </div>
        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '5px 14px', fontSize: 14, fontWeight: 600 }}>{st.label}</span>
      </div>

      {error && <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#C62828' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14 }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Disclaimer */}
          <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#854A1A' }}>
            ℹ️ Documento sem valor fiscal. Deve ser validado por um contabilista.
          </div>

          {/* De / Para */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>De</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{bp?.business_name ?? 'Prestador'}</p>
              {bp?.nif && <p style={{ fontSize: 13, color: '#7A6048' }}>NIF: {bp.nif}</p>}
              {bp?.address && <p style={{ fontSize: 13, color: '#7A6048' }}>{bp.address}</p>}
              {bp?.iban && <p style={{ fontSize: 13, color: '#7A6048' }}>IBAN: {bp.iban}</p>}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Para</p>
              {client ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{client.name}</p>
                  {client.nif && <p style={{ fontSize: 13, color: '#7A6048' }}>NIF: {client.nif}</p>}
                  {client.email && <p style={{ fontSize: 13, color: '#7A6048' }}>{client.email}</p>}
                  {client.address && <p style={{ fontSize: 13, color: '#7A6048' }}>{client.address}, {client.city}</p>}
                </>
              ) : <p style={{ fontSize: 14, color: '#9B7A5A' }}>—</p>}
            </div>
          </div>

          {/* Linhas */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Serviços</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAF7F2' }}>
                  {['Descrição', 'Qtd.', 'Preço unit.', 'IVA', 'Total'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: 12, color: '#9B7A5A', fontWeight: 600, borderBottom: '0.5px solid #EDE6DC' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line: any) => (
                  <tr key={line.id} style={{ borderBottom: '0.5px solid #F0E8DC' }}>
                    <td style={{ padding: '10px 10px', fontSize: 14, color: '#2C1A0E' }}>{line.description}</td>
                    <td style={{ padding: '10px 10px', fontSize: 13, color: '#7A6048', textAlign: 'right' }}>{line.quantity}</td>
                    <td style={{ padding: '10px 10px', fontSize: 13, color: '#7A6048', textAlign: 'right' }}>{line.unit_price.toFixed(2)} €</td>
                    <td style={{ padding: '10px 10px', fontSize: 13, color: '#7A6048', textAlign: 'right' }}>{line.vat_rate === 0 ? 'Isento' : `${line.vat_rate}%`}</td>
                    <td style={{ padding: '10px 10px', fontSize: 14, fontWeight: 600, color: '#2C1A0E', textAlign: 'right' }}>{line.line_total.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <div style={{ minWidth: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#7A6048' }}><span>Sub-total</span><span>{doc.subtotal?.toFixed(2)} €</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: '#7A6048', borderBottom: '0.5px solid #EDE6DC' }}><span>IVA</span><span>{doc.vat_amount?.toFixed(2)} €</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, color: '#C85A1A' }}><span>Total</span><span>{doc.total?.toFixed(2)} €</span></div>
              </div>
            </div>
          </div>

          {doc.notes && (
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px', fontSize: 14, color: '#5A3E28', lineHeight: 1.6 }}>
              {doc.notes}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Assinado */}
          {doc.signature && (
            <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} /> Assinado pelo cliente
              </p>
              {doc.signed_at && (
                <p style={{ fontSize: 12, color: '#3B6D11' }}>Em {new Date(doc.signed_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              )}
            </div>
          )}

          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* PDF */}
            <a href={`/api/billing/print/${docId}`} target="_blank" rel="noreferrer"
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#C85A1A', fontSize: 14, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
              <Printer size={13} /> Exportar PDF
            </a>

            {/* Editar */}
            <Link href={`/dashboard/faturacao/novo?edit=${docId}`}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#E8F0FE', fontSize: 14, color: '#1A73E8', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
              <Pencil size={13} /> {!isFatura ? 'Criar revisão' : 'Editar fatura'}
            </Link>

            {/* Converter devis → fatura */}
            {!isFatura && doc.status === 'accepte' && (
              <button onClick={handleConvert} disabled={converting}
                style={{ width: '100%', padding: '10px', borderRadius: 10, background: '#EAF3DE', border: '0.5px solid #C8E6C9', fontSize: 14, color: '#2E7D32', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FileText size={13} /> {converting ? 'A converter...' : 'Converter em Fatura'}
              </button>
            )}

            {/* Transitions */}
            {nextStatuses.map(status => (
              <button key={status} onClick={() => handleStatus(status)} disabled={!!updatingStatus}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: status === 'paye' ? '#EAF3DE' : status === 'accepte' ? '#E8F0FE' : status === 'refuse' ? '#FFEBEE' : '#F3F4F6',
                  color: status === 'paye' ? '#3B6D11' : status === 'accepte' ? '#1A73E8' : status === 'refuse' ? '#C62828' : '#6B7280',
                }}>
                {status === 'paye' ? <DollarSign size={13} /> : status === 'accepte' ? <CheckCircle size={13} /> : status === 'refuse' ? <XCircle size={13} /> : null}
                {updatingStatus === status ? 'A guardar...' : STATUS_LABELS[status] ?? status}
              </button>
            ))}

            <Link href="/dashboard/faturacao/novo"
              style={{ padding: '10px', borderRadius: 10, border: '0.5px solid #EDE6DC', fontSize: 13, color: '#7A6048', textDecoration: 'none', fontWeight: 500, textAlign: 'center' as const }}>
              Novo documento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
