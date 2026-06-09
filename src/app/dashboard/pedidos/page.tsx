import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'
import { ArrowLeft, Plus } from 'lucide-react'

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

export default async function MeusPedidosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: pedidos } = await supabase
    .from('service_requests')
    .select('id, title, category, city, status, budget, created_at, is_archived')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Os meus pedidos</h1>
            <Link href="/dashboard/novo-pedido"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C85A1A', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
              <Plus size={14} /> Novo pedido
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {pedidos && pedidos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pedidos.map(pedido => {
              const cat = getCatInfo(pedido.category)
              return (
                <div key={pedido.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {cat.iconImg
                          ? <Image src={cat.iconImg} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                          : <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        }
                      </div>
                      <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{cat.label}</span>
                      <span style={{
                        background: pedido.status === 'open' ? '#EAF3DE' : pedido.status === 'completed' ? '#E8F0FE' : '#F0EDE8',
                        color: pedido.status === 'open' ? '#3B6D11' : pedido.status === 'completed' ? '#1A4DB0' : '#7A6048',
                        borderRadius: 99, padding: '2px 10px', fontSize: 12,
                      }}>
                        {pedido.status === 'open' ? 'em aberto' : pedido.status === 'completed' ? 'concluído' : pedido.status}
                      </span>
                      {pedido.is_archived && <span style={{ background: '#F0EDE8', color: '#9B7A5A', borderRadius: 99, padding: '2px 10px', fontSize: 12 }}>arquivado</span>}
                    </div>
                    <span style={{ fontSize: 11, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>{pedido.title}</p>
                  {pedido.city && <p style={{ fontSize: 12, color: '#7A6048', marginBottom: 10 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · € ${pedido.budget}` : ''}</p>}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '0.5px solid #F0E8DC', paddingTop: 10 }}>
                    <Link href={`/pedidos/${pedido.id}`}
                      style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 500 }}>
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>📝</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Ainda não tens pedidos</p>
            <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 16 }}>Publica o teu primeiro pedido gratuitamente.</p>
            <Link href="/dashboard/novo-pedido" className="btn-primary">Publicar pedido</Link>
          </div>
        )}
      </div>
    </div>
  )
}
