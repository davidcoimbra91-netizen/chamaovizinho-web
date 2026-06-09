import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HeroBanner from '@/components/layout/HeroBanner'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  let providerProfile: any = null
  if (profile?.is_provider) {
    const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', user.id).single()
    providerProfile = data
  }

  const [requestsRes, reviewsRes] = await Promise.all([
    supabase.from('service_requests').select('id, title, status, created_at').eq('client_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewed_user_id', user.id),
  ])

  const name = profile?.name ?? user.email?.split('@')[0] ?? 'Vizinho'

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <HeroBanner title={`Olá, ${name}!`} subtitle="O que precisa hoje?" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Profile card */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#C85A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 500, margin: '0 auto 10px' }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{name}</p>
              <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 12 }}>{profile?.city ?? 'Portugal'}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/dashboard/perfil" style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, fontWeight: 500, color: '#7A6048', textAlign: 'center', textDecoration: 'none' }}>Editar Perfil</Link>
                {providerProfile && (
                  <Link href={`/prestadores/perfil/${providerProfile.id}`} style={{ flex: 1, padding: '7px 0', borderRadius: 8, background: '#C85A1A', border: 'none', fontSize: 12, fontWeight: 500, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Ver Público</Link>
                )}
              </div>
            </div>

            {/* Stats propostas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 10, fontWeight: 500 }}>As minhas propostas</p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 }}>
                {[
                  { n: 0, l: 'Pendentes' },
                  { n: 0, l: 'Aceites', green: true },
                  { n: 0, l: 'Recusados' },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: s.green ? '#3B6D11' : '#C85A1A', fontFamily: 'Lora, serif' }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: '#9B7A5A' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/propostas" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none' }}>Ver todas as propostas</Link>
            </div>

            {/* Quick actions */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 10, fontWeight: 500 }}>Ações rápidas</p>
              {[
                { icon: '📝', label: 'Publicar pedido', sub: 'Grátis', href: '/dashboard/novo-pedido' },
                { icon: '💬', label: 'Comunidade', sub: 'Fazer uma pergunta', href: '/comunidade' },
                { icon: '💡', label: 'Dica de hoje', sub: 'Ver dicas do dia', href: '/dicas' },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }}
                  className="last:border-0">
                  <div style={{ width: 30, height: 30, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{a.icon}</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E' }}>{a.label}</p>
                    <p style={{ fontSize: 11, color: '#9B7A5A' }}>{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Role toggle + header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 600, color: '#2C1A0E', flex: 1 }}>
                {profile?.is_provider ? 'Pedidos na Vizinhança' : 'Os meus pedidos'}
              </h2>
              {profile?.is_provider && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Cliente', 'Prestador'].map(r => (
                    <button key={r} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid #D4C4B0', background: r === 'Prestador' ? '#C85A1A' : '#fff', color: r === 'Prestador' ? '#fff' : '#7A6048' }}>{r}</button>
                  ))}
                </div>
              )}
            </div>

            {requestsRes.data && requestsRes.data.length > 0 ? (
              requestsRes.data.map((req: any) => (
                <div key={req.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ background: '#F5E8D6', color: '#854A1A', border: '0.5px solid #E0CCBB', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
                        {req.category ?? 'Geral'}
                      </span>
                      <span style={{ background: req.status === 'open' ? '#EAF3DE' : '#F0EDE8', color: req.status === 'open' ? '#3B6D11' : '#7A6048', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>
                        {req.status === 'open' ? 'em aberto' : req.status === 'completed' ? 'concluído' : req.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#B09070' }}>{new Date(req.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 10 }}>{req.title}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '0.5px solid #F0E8DC', paddingTop: 10 }}>
                    <Link href={`/dashboard/pedidos/${req.id}`} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 500 }}>
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>📝</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#2C1A0E', marginBottom: 6 }}>Ainda não tens pedidos</p>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 16 }}>Publica o teu primeiro pedido e recebe propostas.</p>
                <Link href="/dashboard/novo-pedido" className="btn-primary">Publicar pedido grátis</Link>
              </div>
            )}

            {profile?.is_admin && (
              <Link href="/dashboard/admin"
                style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <span style={{ fontSize: 20 }}>⚙️</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#C85A1A' }}>Painel de Administração</p>
                  <p style={{ fontSize: 12, color: '#9B7A5A' }}>Gerir utilizadores, pedidos e conteúdo</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
