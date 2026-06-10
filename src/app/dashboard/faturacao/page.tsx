import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Plus, FileText, Receipt, Users } from 'lucide-react'
import HeroBanner from '@/components/layout/HeroBanner'

export default async function FaturacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pp } = await supabase
    .from('provider_profiles')
    .select('id, provider_type')
    .eq('user_id', user.id)
    .single()

  if (!pp || (pp.provider_type !== 'Recibo Verde' && pp.provider_type !== 'Empresa')) {
    redirect('/')
  }

  const { data: docs } = await supabase
    .from('billing_documents')
    .select('id, type, status, number, date, total, client_id')
    .eq('provider_id', pp.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const clientIds = Array.from(new Set((docs ?? []).map((d: any) => d.client_id).filter(Boolean)))
  const { data: bclients } = clientIds.length > 0
    ? await supabase.from('billing_clients').select('id, name').in('id', clientIds)
    : { data: [] }

  const stats = {
    devis: (docs ?? []).filter((d: any) => d.type === 'devis').length,
    faturas: (docs ?? []).filter((d: any) => d.type === 'fatura').length,
    totalPago: (docs ?? []).filter((d: any) => d.status === 'pago').reduce((sum: number, d: any) => sum + (d.total ?? 0), 0),
    emEspera: (docs ?? []).filter((d: any) => d.status === 'enviado' || d.status === 'aceite').reduce((sum: number, d: any) => sum + (d.total ?? 0), 0),
  }

  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    brouillon: { label: 'Rascunho', bg: '#F3F4F6', color: '#6B7280' },
    enviado: { label: 'Enviado', bg: '#EFF6FF', color: '#3B82F6' },
    aceite: { label: 'Aceite', bg: '#EAF3DE', color: '#3B6D11' },
    recusado: { label: 'Recusado', bg: '#FFEBEE', color: '#C62828' },
    pago: { label: 'Pago', bg: '#FEF9E7', color: '#F57F17' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <HeroBanner title="Faturação" subtitle="Devis e faturas para os teus clientes" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Disclaimer */}
        <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <p style={{ fontSize: 12, color: '#854A1A', lineHeight: 1.5 }}>Estes documentos não têm valor fiscal. Devem ser validados por um contabilista.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { n: stats.devis, l: 'Devis este mês', color: '#C85A1A' },
            { n: stats.faturas, l: 'Faturas este mês', color: '#1A73E8' },
            { n: `${stats.totalPago.toFixed(0)}€`, l: 'Total pago', color: '#3B6D11' },
            { n: `${stats.emEspera.toFixed(0)}€`, l: 'Em espera', color: '#F9AB00' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 4 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#9B7A5A' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ações rápidas</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <Link href="/dashboard/faturacao/novo?type=devis" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', textAlign: 'center', background: '#FAF7F2' }}>
              <FileText size={22} color="#1A73E8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>Novo Devis</div>
              <div style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>Orçamento</div>
            </Link>
            <Link href="/dashboard/faturacao/novo?type=fatura" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', textAlign: 'center', background: '#FAF7F2' }}>
              <Receipt size={22} color="#C85A1A" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>Nova Fatura</div>
              <div style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>Recibo</div>
            </Link>
            <Link href="/dashboard/faturacao/clientes" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', textAlign: 'center', background: '#FAF7F2' }}>
              <Users size={22} color="#3B6D11" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>Clientes</div>
              <div style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>Gerir</div>
            </Link>
          </div>
        </div>

        {/* Documents récents */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Documentos recentes</p>
            <Link href="/dashboard/faturacao/novo" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={13} /> Novo
            </Link>
          </div>
          {docs && docs.length > 0 ? (
            <div style={{ border: '0.5px solid #EDE6DC', borderRadius: 10, overflow: 'hidden' }}>
              {docs.map((doc: any) => {
                const st = statusMap[doc.status] ?? statusMap.brouillon
                const client = bclients?.find((c: any) => c.id === doc.client_id)
                return (
                  <Link key={doc.id} href={`/dashboard/faturacao/${doc.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none', background: '#fff' }}
                    className="last:border-0 hover:bg-stone-50">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: doc.type === 'fatura' ? '#FBF0E8' : '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {doc.type === 'fatura' ? <Receipt size={15} color="#C85A1A" /> : <FileText size={15} color="#1A73E8" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{doc.number}</p>
                      <p style={{ fontSize: 11, color: '#9B7A5A' }}>{client?.name ?? 'Cliente'} · {doc.total?.toFixed(2)}€</p>
                    </div>
                    <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>{st.label}</span>
                    <span style={{ fontSize: 11, color: '#B09070', flexShrink: 0 }}>{new Date(doc.date).toLocaleDateString('pt-PT')}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📄</p>
              <p style={{ fontSize: 13, color: '#9B7A5A' }}>Ainda não tens documentos. Cria o teu primeiro devis ou fatura.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
