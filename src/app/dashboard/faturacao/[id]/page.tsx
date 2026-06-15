import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Printer, CheckCircle, XCircle, DollarSign } from 'lucide-react'

interface Props { params: { id: string } }

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Rascunho', bg: '#F3F4F6', color: '#6B7280' },
  enviado: { label: 'Enviado', bg: '#EFF6FF', color: '#3B82F6' },
  aceite: { label: 'Aceite', bg: '#EAF3DE', color: '#3B6D11' },
  recusado: { label: 'Recusado', bg: '#FFEBEE', color: '#C62828' },
  pago: { label: 'Pago', bg: '#FEF9E7', color: '#F57F17' },
}

export default async function BillingDocumentDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: doc } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!doc) notFound()

  const { data: lines } = await supabase
    .from('billing_lines')
    .select('*')
    .eq('document_id', params.id)
    .order('sort_order')

  const { data: client } = doc.client_id
    ? await supabase.from('billing_clients').select('*').eq('id', doc.client_id).single()
    : { data: null }

  const { data: pp } = await supabase
    .from('provider_profiles')
    .select('id, provider_type')
    .eq('user_id', user.id)
    .single()

  const { data: bp } = await supabase
    .from('billing_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const st = STATUS_MAP[doc.status] ?? STATUS_MAP.brouillon

  const transitions: Record<string, string[]> = {
    brouillon: ['enviado'],
    enviado: ['aceite', 'recusado', 'pago'],
    aceite: ['pago'],
    recusado: [],
    pago: [],
  }
  const nextStatuses = transitions[doc.status] ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '16px 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>{doc.number}</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                {doc.type === 'fatura' ? 'Fatura' : 'Devis / Orçamento'} · {new Date(doc.date).toLocaleDateString('pt-PT')}
              </p>
            </div>
            <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '4px 12px', fontSize: 14, fontWeight: 600 }}>{st.label}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Disclaimer */}
            <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#854A1A' }}>
              ℹ️ Este documento não tem valor fiscal. Deve ser validado por um contabilista.
            </div>

            {/* Client + prestador */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>De</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{bp?.business_name ?? 'Prestador'}</p>
                {bp?.nif && <p style={{ fontSize: 14, color: '#7A6048' }}>NIF: {bp.nif}</p>}
                {bp?.address && <p style={{ fontSize: 14, color: '#7A6048' }}>{bp.address}</p>}
                {bp?.iban && <p style={{ fontSize: 14, color: '#7A6048' }}>IBAN: {bp.iban}</p>}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Para</p>
                {client ? (
                  <>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{client.name}</p>
                    {client.nif && <p style={{ fontSize: 14, color: '#7A6048' }}>NIF: {client.nif}</p>}
                    {client.email && <p style={{ fontSize: 14, color: '#7A6048' }}>{client.email}</p>}
                    {client.address && <p style={{ fontSize: 14, color: '#7A6048' }}>{client.address}, {client.city}</p>}
                  </>
                ) : <p style={{ fontSize: 14, color: '#9B7A5A' }}>—</p>}
              </div>
            </div>

            {/* Lignes */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Serviços</p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAF7F2' }}>
                    {['Descrição', 'Qtd.', 'Preço unit.', 'IVA', 'Total'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Descrição' ? 'left' : 'right', fontSize: 13, color: '#9B7A5A', fontWeight: 600, borderBottom: '0.5px solid #EDE6DC' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(lines ?? []).map((line: any) => (
                    <tr key={line.id} style={{ borderBottom: '0.5px solid #F0E8DC' }}>
                      <td style={{ padding: '10px 12px', fontSize: 15, color: '#2C1A0E' }}>{line.description}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#7A6048', textAlign: 'right' }}>{line.quantity}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#7A6048', textAlign: 'right' }}>{line.unit_price.toFixed(2)} €</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#7A6048', textAlign: 'right' }}>{line.vat_rate === 0 ? 'Isento' : `${line.vat_rate}%`}</td>
                      <td style={{ padding: '10px 12px', fontSize: 15, fontWeight: 600, color: '#2C1A0E', textAlign: 'right' }}>{line.line_total.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totaux */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <div style={{ minWidth: 220 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#7A6048' }}><span>Sub-total</span><span>{doc.subtotal.toFixed(2)} €</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: '#7A6048', borderBottom: '0.5px solid #EDE6DC' }}><span>IVA</span><span>{doc.vat_amount.toFixed(2)} €</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16, fontWeight: 700, color: '#C85A1A' }}><span>Total</span><span>{doc.total.toFixed(2)} €</span></div>
                </div>
              </div>
            </div>

            {doc.notes && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px', fontSize: 15, color: '#5A3E28', lineHeight: 1.6 }}>
                {doc.notes}
              </div>
            )}
          </div>

          {/* Sidebar actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Print */}
              <form action={`/api/billing/print/${params.id}`} method="get" target="_blank">
                <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: 10, background: '#C85A1A', border: 'none', fontSize: 15, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Printer size={14} /> Exportar PDF
                </button>
              </form>

              {/* Transitions de statut */}
              {nextStatuses.map(status => (
                <form key={status} action={`/api/billing/${params.id}/status`} method="post">
                  <input type="hidden" name="status" value={status} />
                  <button type="submit" style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    background: status === 'pago' ? '#EAF3DE' : status === 'aceite' ? '#E8F0FE' : status === 'recusado' ? '#FFEBEE' : '#F3F4F6',
                    border: 'none', fontSize: 14,
                    color: status === 'pago' ? '#3B6D11' : status === 'aceite' ? '#1A73E8' : status === 'recusado' ? '#C62828' : '#6B7280',
                    fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                    {status === 'pago' ? <><DollarSign size={13} /> Marcar como pago</> : status === 'aceite' ? <><CheckCircle size={13} /> Marcar aceite</> : status === 'recusado' ? <><XCircle size={13} /> Marcar recusado</> : <>Enviar ao cliente</>}
                  </button>
                </form>
              ))}

              <Link href={`/dashboard/faturacao/novo`}
                style={{ padding: '10px', borderRadius: 10, border: '0.5px solid #EDE6DC', fontSize: 14, color: '#7A6048', textDecoration: 'none', fontWeight: 500, textAlign: 'center' }}>
                Novo documento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
