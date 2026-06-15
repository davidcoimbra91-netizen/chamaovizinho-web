import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileText, Receipt, Users, BarChart2, Settings, List, CreditCard, BookOpen } from 'lucide-react'
import DashboardBanner from '@/components/ui/DashboardBanner'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  brouillon: { label: 'Rascunho', bg: '#F3F4F6', color: '#6B7280' },
  enviado: { label: 'Enviado', bg: '#EFF6FF', color: '#3B82F6' },
  aceite: { label: 'Aceite', bg: '#EAF3DE', color: '#3B6D11' },
  recusado: { label: 'Recusado', bg: '#FFEBEE', color: '#C62828' },
  pago: { label: 'Pago', bg: '#FEF9E7', color: '#F57F17' },
}

const NAV_ITEMS = [
  { label: 'Resumo', href: '/dashboard/faturacao', icon: BarChart2, active: true },
  { label: 'Orçamentos', href: '/dashboard/faturacao?tipo=devis', icon: FileText },
  { label: 'Faturas', href: '/dashboard/faturacao?tipo=fatura', icon: Receipt },
  { label: 'Clientes', href: '/dashboard/faturacao/clientes', icon: Users },
  { label: 'Pagamentos', href: '/dashboard/faturacao?tipo=pagamentos', icon: CreditCard },
  { label: 'Relatórios', href: '/dashboard/faturacao?tipo=relatorios', icon: BookOpen },
  { label: 'Definições', href: '/dashboard/faturacao/definicoes', icon: Settings },
]

export default async function FaturacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase.from('user_profiles').select('name, profile_photo, is_pro').eq('id', user.id).single()
  const { data: pp } = await supabase.from('provider_profiles').select('id, provider_type, average_rating, reviews_count, is_verified, cover_photo').eq('user_id', user.id).single()

  if (!pp || (pp.provider_type !== 'Recibo Verde' && pp.provider_type !== 'Empresa')) {
    redirect('/')
  }

  const { data: billingProfile } = await supabase.from('billing_profiles').select('*').eq('user_id', user.id).single()

  const [docsRes, clientsRes, tipsFinanceiraRes, tipsGeralRes] = await Promise.all([
    supabase.from('billing_documents').select('id, type, status, number, date, due_date, total, client_id, created_at').eq('provider_id', user.id).order('created_at', { ascending: false }).limit(15),
    supabase.from('billing_clients').select('id, name, email').eq('provider_id', pp.id).order('name'),
    supabase.from('provider_tips').select('id, title, content').eq('is_published', true).eq('category', 'financeira').order('publish_date', { ascending: false }).limit(20),
    supabase.from('provider_tips').select('id, title, content').eq('is_published', true).eq('category', 'geral').order('publish_date', { ascending: false }).limit(20),
  ])

  const docs = docsRes.data ?? []
  const allClients = clientsRes.data ?? []

  // Tips rotativos por dia (server-side, sem JS client)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tipsFinanceira = tipsFinanceiraRes.data ?? []
  const tipsGeral = tipsGeralRes.data ?? []
  const tipFinanceira = tipsFinanceira.length > 0 ? tipsFinanceira[dayOfYear % tipsFinanceira.length] : null
  const tipGeral = tipsGeral.length > 0 ? tipsGeral[dayOfYear % tipsGeral.length] : null

  // Enrich docs with client names
  const clientIds = Array.from(new Set(docs.map((d: any) => d.client_id).filter(Boolean)))
  const clientMap: Record<string, string> = {}
  ;(allClients ?? []).forEach((c: any) => { clientMap[c.id] = c.name })

  // Stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthDocs = docs.filter((d: any) => new Date(d.created_at) >= monthStart)

  const stats = {
    orcamentos: monthDocs.filter((d: any) => d.type === 'devis').length,
    faturas: monthDocs.filter((d: any) => d.type === 'fatura').length,
    totalFaturado: docs.filter((d: any) => d.status === 'pago').reduce((s: number, d: any) => s + (d.total ?? 0), 0),
    emEspera: docs.filter((d: any) => d.status === 'enviado' || d.status === 'aceite').reduce((s: number, d: any) => s + (d.total ?? 0), 0),
  }

  // Top clients
  const clientTotals: Record<string, number> = {}
  docs.filter((d: any) => d.client_id && d.status === 'pago').forEach((d: any) => {
    clientTotals[d.client_id] = (clientTotals[d.client_id] ?? 0) + (d.total ?? 0)
  })
  const topClients = Object.entries(clientTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id, total]) => ({ id, name: clientMap[id] ?? 'Cliente', total }))

  // Faturas pendentes
  const pendingDocs = docs.filter((d: any) => d.status === 'enviado' || d.status === 'aceite').slice(0, 3)

  const firstName = (profile?.name ?? 'Prestador').split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <DashboardBanner firstName={firstName} coverPhoto={pp?.cover_photo ?? null} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 20 }}>

          {/* ── SIDEBAR ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Perfil */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', margin: '0 auto 10px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#C85A1A' }}>
                {profile?.profile_photo
                  ? <img src={profile.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : profile?.name?.charAt(0) ?? '?'
                }
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{profile?.name ?? 'Prestador'}</p>
              {pp?.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>✓ Verificado</span>}
              {pp.average_rating > 0 && (
                <p style={{ fontSize: 13, color: '#F9AB00', marginTop: 4 }}>⭐ {pp.average_rating.toFixed(1)} ({pp.reviews_count ?? 0})</p>
              )}
              <Link href="/dashboard/perfil" style={{ display: 'block', marginTop: 10, padding: '6px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 13, fontWeight: 600, color: '#7A6048', textDecoration: 'none' }}>
                Ver perfil público
              </Link>
            </div>

            {/* Menu nav */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '8px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px' }}>Menu</p>
              {NAV_ITEMS.map(item => (
                <Link key={item.label} href={item.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, textDecoration: 'none', background: item.active ? '#FBF0E8' : 'transparent', marginBottom: 2 }}>
                  <item.icon size={14} color={item.active ? '#C85A1A' : '#9B7A5A'} />
                  <span style={{ fontSize: 14, fontWeight: item.active ? 700 : 500, color: item.active ? '#C85A1A' : '#5A3E28' }}>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Plano */}
            <div style={{ background: profile?.is_pro ? 'linear-gradient(135deg,#2C1A0E,#4A2C1A)' : '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: profile?.is_pro ? 'rgba(255,255,255,0.6)' : '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Plano atual</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: profile?.is_pro ? '#C85A1A' : '#2C1A0E', marginBottom: 8 }}>{profile?.is_pro ? '⭐ Premium' : 'Básico'}</p>
              {['Mais visibilidade', 'Comissão reduzida', profile?.is_pro ? 'Relatórios avançados' : 'Relatórios básicos'].map(f => (
                <p key={f} style={{ fontSize: 13, color: profile?.is_pro ? 'rgba(255,255,255,0.7)' : '#7A6048', marginBottom: 3 }}>✓ {f}</p>
              ))}
              {!profile?.is_pro && (
                <Link href="/precos" style={{ display: 'block', marginTop: 10, padding: '8px', borderRadius: 9, background: '#C85A1A', textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  Fazer Upgrade
                </Link>
              )}
            </div>

          </div>

          {/* ── ZONA PRINCIPAL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Header */}
            <div>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Faturação</h1>
              <p style={{ fontSize: 15, color: '#7A6048' }}>Gere os seus documentos, clientes e pagamentos de forma simples e organizada.</p>
            </div>

            {/* Disclaimer */}
            <div style={{ background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
              <p style={{ fontSize: 14, color: '#1E40AF', lineHeight: 1.5 }}>
                <strong>Lembrete:</strong> As faturas devem ter número sequencial e ser emitidas até 5 dias após o serviço.
                <a href="#" style={{ color: '#1A73E8', textDecoration: 'none', marginLeft: 8 }}>Saber mais</a>
              </p>
            </div>

            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { n: stats.orcamentos, l: 'Orçamentos este mês', color: '#C85A1A', emoji: '📄', sub: '' },
                { n: stats.faturas, l: 'Faturas este mês', color: '#1A73E8', emoji: '🧾', sub: '' },
                { n: `${stats.totalFaturado.toFixed(0)}€`, l: 'Total faturado', color: '#3B6D11', emoji: '💶', sub: 'Este mês' },
                { n: `${stats.emEspera.toFixed(0)}€`, l: 'Em espera de pagamento', color: '#F9AB00', emoji: '⏳', sub: `${pendingDocs.length} ${pendingDocs.length === 1 ? 'fatura pendente' : 'faturas pendentes'}` },
              ].map(s => (
                <div key={s.l} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{s.emoji}</span>
                    <span style={{ fontSize: 13, color: '#9B7A5A', flex: 1 }}>{s.l}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.n}</div>
                  {s.sub && <div style={{ fontSize: 12, color: '#9B7A5A' }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* Ações rápidas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Ações rápidas</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <Link href="/dashboard/faturacao/novo?type=devis" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px', textAlign: 'center', background: '#FAF7F2' }}>
                  <FileText size={24} color="#1A73E8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E' }}>Novo Orçamento</div>
                  <div style={{ fontSize: 13, color: '#9B7A5A', marginTop: 2 }}>Criar orçamento</div>
                </Link>
                <Link href="/dashboard/faturacao/novo?type=fatura" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px', textAlign: 'center', background: '#FAF7F2' }}>
                  <Receipt size={24} color="#C85A1A" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E' }}>Nova Fatura</div>
                  <div style={{ fontSize: 13, color: '#9B7A5A', marginTop: 2 }}>Emitir fatura</div>
                </Link>
                <Link href="/dashboard/faturacao/clientes" style={{ textDecoration: 'none', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px', textAlign: 'center', background: '#FAF7F2' }}>
                  <Users size={24} color="#3B6D11" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E' }}>Adicionar Cliente</div>
                  <div style={{ fontSize: 13, color: '#9B7A5A', marginTop: 2 }}>Gerir clientes</div>
                </Link>
              </div>
            </div>

            {/* Documentos recentes */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Documentos recentes</p>
                <Link href="/dashboard/faturacao?tipo=todos" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {docs.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '0.5px solid #EDE6DC' }}>
                        {['Tipo', 'Número', 'Cliente', 'Data', 'Valor', 'Estado'].map(h => (
                          <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docs.slice(0, 8).map((doc: any) => {
                        const st = STATUS_MAP[doc.status] ?? STATUS_MAP.brouillon
                        return (
                          <tr key={doc.id} style={{ borderBottom: '0.5px solid #F0E8DC' }}>
                            <td style={{ padding: '10px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {doc.type === 'devis'
                                  ? <FileText size={13} color="#1A73E8" />
                                  : <Receipt size={13} color="#C85A1A" />
                                }
                                <span style={{ color: doc.type === 'devis' ? '#1A73E8' : '#C85A1A', fontWeight: 600 }}>
                                  {doc.type === 'devis' ? 'Orçamento' : 'Fatura'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 10px', color: '#5A3E28', fontWeight: 600 }}>{doc.number ?? '—'}</td>
                            <td style={{ padding: '10px 10px', color: '#5A3E28' }}>{clientMap[doc.client_id] ?? '—'}</td>
                            <td style={{ padding: '10px 10px', color: '#9B7A5A' }}>{doc.date ? new Date(doc.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                            <td style={{ padding: '10px 10px', color: '#2C1A0E', fontWeight: 700 }}>{doc.total != null ? `${Number(doc.total).toFixed(2)}€` : '—'}</td>
                            <td style={{ padding: '10px 10px' }}>
                              <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '3px 9px', fontSize: 13, fontWeight: 500 }}>{st.label}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📄</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda sem documentos</p>
                  <p style={{ fontSize: 14, color: '#9B7A5A', marginBottom: 14 }}>Cria o teu primeiro orçamento ou fatura.</p>
                  <Link href="/dashboard/faturacao/novo?type=devis" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Novo orçamento</Link>
                </div>
              )}
            </div>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* A receber */}
            {pendingDocs.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>A receber</p>
                  <Link href="/dashboard/faturacao?tipo=pendentes" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
                </div>
                <p style={{ fontSize: 26, fontWeight: 700, color: '#C85A1A', fontFamily: 'Lora, serif', marginBottom: 4 }}>{stats.emEspera.toFixed(2)}€</p>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 12 }}>{pendingDocs.length} {pendingDocs.length === 1 ? 'fatura pendente' : 'faturas pendentes'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pendingDocs.map((doc: any) => {
                    const st = STATUS_MAP[doc.status] ?? STATUS_MAP.enviado
                    return (
                      <div key={doc.id} style={{ padding: '10px 12px', background: '#FAF7F2', borderRadius: 10, border: '0.5px solid #EDE6DC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{doc.number ?? '—'}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{doc.total != null ? `${Number(doc.total).toFixed(0)}€` : '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#9B7A5A' }}>{clientMap[doc.client_id] ?? '—'}</span>
                          {doc.due_date && <span style={{ fontSize: 12, color: '#E65100' }}>Vence {new Date(doc.due_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Dica Financeira */}
            <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>💡 Dica Financeira</p>
              {tipFinanceira ? (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>{tipFinanceira.title}</p>
                  <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.5, marginBottom: 8 }}>{tipFinanceira.content}</p>
                </>
              ) : (
                <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.5, marginBottom: 8 }}>
                  Usa descrições claras nos teus documentos e anexa fotos do trabalho realizado.
                </p>
              )}
              <Link href="/dicas" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver mais dicas →</Link>
            </div>

            {/* Dica para ganhar mais */}
            {tipGeral && (
              <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 14, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>🎯 Dica para ganhar mais</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1B5E20', marginBottom: 4 }}>{tipGeral.title}</p>
                <p style={{ fontSize: 14, color: '#3B6D11', lineHeight: 1.5 }}>{tipGeral.content}</p>
              </div>
            )}

            {/* Clientes principais */}
            {topClients.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Clientes principais</p>
                  <Link href="/dashboard/faturacao/clientes" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topClients.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#C85A1A', flexShrink: 0 }}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{c.name}</p>
                          <p style={{ fontSize: 12, color: '#9B7A5A' }}>{docs.filter((d: any) => d.client_id === c.id).length} documentos</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#3B6D11' }}>{c.total.toFixed(0)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagamentos */}
            <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2E7D32', marginBottom: 6 }}>Recebe pagamentos mais rápido</p>
              <p style={{ fontSize: 13, color: '#3B6D11', lineHeight: 1.5, marginBottom: 10 }}>
                Liga o teu método de pagamento preferido e facilita o processo para os teus clientes.
              </p>
            
              <button style={{ width: '100%', padding: '8px', borderRadius: 9, background: '#3B6D11', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Configurar pagamentos
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
