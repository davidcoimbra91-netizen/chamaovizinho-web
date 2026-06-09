import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'

export default async function MinhasPropostasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pp } = await supabase
    .from('provider_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!pp) redirect('/')

  const { data: offers } = await supabase
    .from('offers')
    .select('id, status, created_at, service_request_id, message, price')
    .eq('provider_id', pp.id)
    .order('created_at', { ascending: false })

  // Fetch pedidos
  const pedidoIds = (offers ?? []).map((o: any) => o.service_request_id)
  const { data: pedidos } = pedidoIds.length > 0
    ? await supabase.from('service_requests').select('id, title, category, city, status').in('id', pedidoIds)
    : { data: [] }

  const stats = {
    total: offers?.length ?? 0,
    pendentes: offers?.filter((o: any) => o.status === 'pending').length ?? 0,
    aceites: offers?.filter((o: any) => o.status === 'accepted').length ?? 0,
    recusados: offers?.filter((o: any) => o.status === 'rejected').length ?? 0,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>As minhas propostas</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { n: stats.total, l: 'Total', color: '#2C1A0E' },
            { n: stats.pendentes, l: 'Pendentes', color: '#C85A1A' },
            { n: stats.aceites, l: 'Aceites', color: '#3B6D11' },
            { n: stats.recusados, l: 'Recusados', color: '#9B7A5A' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif' }}>{s.n}</div>
              <div style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Lista */}
        {offers && offers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {offers.map((offer: any) => {
              const pedido = pedidos?.find((p: any) => p.id === offer.service_request_id)
              return (
                <div key={offer.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{
                      background: offer.status === 'accepted' ? '#EAF3DE' : offer.status === 'rejected' ? '#FFEBEE' : '#FBF0E8',
                      color: offer.status === 'accepted' ? '#3B6D11' : offer.status === 'rejected' ? '#C62828' : '#C85A1A',
                      borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600,
                    }}>
                      {offer.status === 'accepted' ? '✓ Aceite' : offer.status === 'rejected' ? 'Recusado' : 'Pendente'}
                    </span>
                    <span style={{ fontSize: 11, color: '#B09070' }}>{new Date(offer.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  {pedido && (
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>{pedido.title}</p>
                  )}
                  {pedido?.city && <p style={{ fontSize: 12, color: '#7A6048', marginBottom: 8 }}>📍 {pedido.city}</p>}
                  {offer.message && <p style={{ fontSize: 13, color: '#5A3E28', lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>"{offer.message}"</p>}
                  {offer.price && <p style={{ fontSize: 13, fontWeight: 600, color: '#C85A1A' }}>€ {offer.price}</p>}
                  {pedido && (
                    <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <Link href={`/pedidos/${pedido.id}`}
                        style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 500 }}>
                        Ver pedido
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📬</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Ainda não enviaste propostas</p>
            <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 16 }}>Explora os pedidos da vizinhança.</p>
            <Link href="/explorar" className="btn-primary">Explorar pedidos</Link>
          </div>
        )}
      </div>
    </div>
  )
}
