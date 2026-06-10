'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Plus, HelpCircle, Star, MapPin, Send, FileText, Receipt, TrendingUp, Users, Zap, Clock, Target } from 'lucide-react'
import { CATEGORIES } from '@/types'

const TYPE_LOGOS: Record<string, string> = {
  'Particular': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20particular.png',
  'Recibo Verde': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro%20verde.png',
  'Empresa': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro.png',
}

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

function Avatar({ name, photo, size = 34 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      {photo
        ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>{name?.charAt(0) ?? '?'}</div>
      }
    </div>
  )
}

export default function HomeProvider({ profile, providerProfile, data }: { profile: any; providerProfile: any; data: any }) {
  const firstName = profile?.name?.split(' ')[0] ?? 'Vizinho'
  const coverPhoto = providerProfile?.cover_photo
  const canInvoice = providerProfile?.provider_type === 'Recibo Verde' || providerProfile?.provider_type === 'Empresa'
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : null

  const completedCount = data.completedCount ?? 0
  const monthGoal = 10
  const goalPct = Math.min((completedCount / monthGoal) * 100, 100)

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20 }} className="lg:grid-cols-[260px_1fr_280px] grid-cols-1">

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Carta perfil */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={profile?.name} photo={profile?.profile_photo} size={72} />
                  {profile?.is_pro && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#F9AB00', borderRadius: '50%', border: '2px solid #fff', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>⭐</div>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{profile?.name ?? 'Prestador'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                    {providerProfile?.is_verified && (
                      <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>✓ Verificado</span>
                    )}
                    {profile?.is_pro && (
                      <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>⭐ Premium</span>
                    )}
                    {providerProfile?.provider_type && (
                      <span style={{ background: '#F3F4F6', color: '#5A3E28', borderRadius: 99, padding: '2px 8px', fontSize: 10 }}>{providerProfile.provider_type}</span>
                    )}
                  </div>
                </div>
                {profile?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9B7A5A' }}>
                    <MapPin size={11} color="#9B7A5A" />
                    {profile.city}
                  </div>
                )}
                {providerProfile?.average_rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} color="#F9AB00" fill="#F9AB00" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{providerProfile.average_rating.toFixed(1)}</span>
                    <span style={{ fontSize: 11, color: '#9B7A5A' }}>({providerProfile.reviews_count ?? 0} avaliações)</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <Link href="/dashboard/perfil" style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 11, fontWeight: 600, color: '#7A6048', textAlign: 'center', textDecoration: 'none' }}>Editar</Link>
                  {providerProfile && <Link href={`/prestadores/perfil/${providerProfile.id}`} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: '#C85A1A', fontSize: 11, fontWeight: 600, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Ver público</Link>}
                </div>
              </div>
            </div>

            {/* A minha atividade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>A minha atividade</p>
              {[
                { icon: TrendingUp, label: 'Trabalhos concluídos', value: completedCount, color: '#C85A1A' },
                { icon: Star, label: 'Avaliação média', value: providerProfile?.average_rating ? `${providerProfile.average_rating.toFixed(1)} ⭐` : 'N/A', color: '#F9AB00' },
                { icon: Zap, label: 'Taxa de resposta', value: data.responseRate ?? '—', color: '#3B6D11' },
                { icon: Clock, label: 'Tempo médio resposta', value: data.avgResponseTime ?? '—', color: '#1A73E8' },
                { icon: Users, label: 'Clientes ativos', value: data.activeClients ?? 0, color: '#9C27B0' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <s.icon size={13} color={s.color} />
                    <span style={{ fontSize: 11, color: '#5A3E28' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Atividade da semana */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Atividade da semana</p>
              {[
                { emoji: '📋', label: 'novos pedidos', value: data.weeklyStats?.newPedidos ?? 0 },
                { emoji: '💬', label: 'novas mensagens', value: data.weeklyStats?.newMessages ?? 0 },
                { emoji: '✅', label: 'propostas aceites', value: data.weeklyStats?.acceptedOffers ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0' }}>
                  <span style={{ fontSize: 14 }}>{s.emoji}</span>
                  <span style={{ fontSize: 12, color: '#2C1A0E', fontWeight: 600 }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: '#9B7A5A' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Plano atual */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Plano atual</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: profile?.is_pro ? '#C85A1A' : '#2C1A0E', marginBottom: 8 }}>{profile?.is_pro ? '⭐ Premium' : 'Básico'}</p>
              {[
                profile?.is_pro ? 'Propostas ilimitadas' : 'Até 3 propostas/mês',
                'Mais visibilidade',
                profile?.is_pro ? 'Contacto direto com cliente' : 'Perfil básico',
              ].map(f => <p key={f} style={{ fontSize: 11, color: '#7A6048', marginBottom: 4 }}>✓ {f}</p>)}
              {!profile?.is_pro && (
                <Link href="/precos" style={{ display: 'block', marginTop: 10, padding: '8px', borderRadius: 9, background: 'linear-gradient(135deg,#df6a36,#cb5226)', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  🚀 Fazer Upgrade
                </Link>
              )}
            </div>

            {/* Dica para ganhar mais */}
            <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A', marginBottom: 6 }}>💡 Dica para ganhar mais</p>
              <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.5, marginBottom: 8 }}>
                Prestadores com mais de 5 fotos no perfil recebem 37% mais contactos.
              </p>
              <Link href="/dashboard/perfil" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Adicionar fotos agora →</Link>
            </div>

            {/* Ações rápidas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Link href="/explorar" style={{ background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <Plus size={17} color="#fff" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Encontrar Trabalhos</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Ver pedidos da vizinhança</p>
                </div>
              </Link>
              {canInvoice && (
                <>
                  <Link href="/dashboard/faturacao/novo?type=devis" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <FileText size={15} color="#1A73E8" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>Criar Orçamento</span>
                  </Link>
                  <Link href="/dashboard/faturacao/novo?type=fatura" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <Receipt size={15} color="#C85A1A" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>Criar Fatura</span>
                  </Link>
                </>
              )}
            </div>

          </div>

          {/* ── CENTRO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Saudação + cover */}
            <div>
              <div style={{ marginBottom: 14 }}>
                <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>
                  Olá, {firstName}! 👋
                </h1>
                <p style={{ fontSize: 14, color: '#7A6048' }}>Pronto para ajudar os teus vizinhos hoje?</p>
              </div>
              {/* Cover photo du prestataire */}
              <div style={{ borderRadius: 16, overflow: 'hidden', background: '#2C1A0E', position: 'relative', height: 120 }}>
                {coverPhoto && <Image src={coverPhoto} alt="" fill style={{ objectFit: 'cover', opacity: 0.6 }} unoptimized />}
                <div style={{ position: 'absolute', inset: 0, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Dica do Dia</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, maxWidth: 340 }}>{data.dica?.title ?? 'Vale a pena limpar os painéis solares?'}</p>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                </div>
              </div>
            </div>

            {/* 4 KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { emoji: '📋', value: data.weeklyStats?.newPedidos ?? 0, label: 'Pedidos novos', sub: 'Esta semana', color: '#C85A1A' },
                { emoji: '📤', value: data.propostas?.total ?? 0, label: 'Propostas enviadas', sub: 'Este mês', color: '#1A73E8' },
                { emoji: '⭐', value: data.propostas?.aceites ?? 0, label: 'Propostas aceites', sub: 'Este mês', color: '#3B6D11' },
                { emoji: '⏳', value: data.propostas?.pendentes ?? 0, label: 'Aguardam resposta', sub: 'Dos clientes', color: '#F9AB00' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#2C1A0E', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: '#9B7A5A', marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pergunta ao Vizinho */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A' }}>Responde às dúvidas da comunidade e ganha visibilidade.</p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.questions?.map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, background: '#FBF0E8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HelpCircle size={13} color="#C85A1A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <p style={{ fontSize: 10, color: '#9B7A5A' }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                        {q.category && <span style={{ fontSize: 10, color: getCatInfo(q.category).color }}>· {getCatInfo(q.category).label}</span>}
                      </div>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Pedidos da Vizinhança */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Pedidos da Vizinhança</p>
                  {data.pedidos?.length > 0 && <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>📍 {data.pedidos.length} pedidos perto de si</p>}
                </div>
                <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.pedidos?.length > 0 ? data.pedidos.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                const isNew = (Date.now() - new Date(pedido.created_at).getTime()) < 3600000
                return (
                  <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#FDFAF7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 15 }}>{cat.icon}</span>
                        </div>
                        <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                        {isNew && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>Novo</span>}
                      </div>
                      <span style={{ fontSize: 10, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{pedido.title}</p>
                    {pedido.city && <p style={{ fontSize: 11, color: '#7A6048', marginBottom: 9 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · €${pedido.budget}` : ''}</p>}
                    <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 9, display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <Link href={`/pedidos/${pedido.id}`} style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 11, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>Ver Detalhes</Link>
                      <Link href={`/pedidos/${pedido.id}/proposta`} style={{ padding: '6px 12px', borderRadius: 8, background: '#C85A1A', fontSize: 11, color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Send size={11} /> Enviar Proposta
                      </Link>
                    </div>
                  </div>
                )
              }) : (
                <p style={{ fontSize: 12, color: '#9B7A5A', textAlign: 'center', padding: '18px 0', fontStyle: 'italic' }}>Sem pedidos recentes na tua zona.</p>
              )}
            </div>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Pedidos perto */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Pedidos perto de si</p>
                <Link href="/mapa" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.pedidos?.length > 0 ? (
                <>
                  <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 10 }}>{data.pedidos.length} pedidos num raio de 10 km</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {data.pedidos.slice(0, 3).map((p: any) => {
                      const cat = getCatInfo(p.category)
                      return (
                        <Link key={p.id} href={`/pedidos/${p.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, textDecoration: 'none' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13 }}>{cat.icon}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</p>
                            <p style={{ fontSize: 10, color: '#9B7A5A' }}>{p.city}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  <Link href="/explorar" style={{ display: 'block', marginTop: 10, padding: '7px', borderRadius: 9, border: '0.5px solid #EDE6DC', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#5A3E28' }}>
                    Ver todos os pedidos
                  </Link>
                </>
              ) : (
                <p style={{ fontSize: 12, color: '#9B7A5A', fontStyle: 'italic' }}>Nenhum pedido próximo.</p>
              )}
            </div>

            {/* Clientes satisfeitos */}
            {data.recentReviews?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Clientes satisfeitos</p>
                  <Link href="/dashboard/perfil" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.recentReviews.slice(0, 2).map((r: any) => (
                    <div key={r.id} style={{ background: '#FAF7F2', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 1, marginBottom: 4 }}>
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={11} color="#F9AB00" fill="#F9AB00" />)}
                      </div>
                      {r.comment && <p style={{ fontSize: 11, color: '#5A3E28', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 4 }}>"{r.comment}"</p>}
                      <p style={{ fontSize: 10, color: '#9B7A5A', fontWeight: 600 }}>{r.author?.name ?? 'Cliente'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Objetivo do mês */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Target size={15} color="#C85A1A" />
                <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Objetivo do mês</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#C85A1A', fontFamily: 'Lora, serif', marginBottom: 2 }}>{completedCount} / {monthGoal}</p>
              <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 8 }}>trabalhos realizados</p>
              <div style={{ height: 8, background: '#F0E8DC', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${goalPct}%`, background: '#C85A1A', borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: '#7A6048' }}>
                {completedCount >= monthGoal ? '🏆 Objetivo atingido!' : `Faltam ${monthGoal - completedCount} trabalhos para ganhar + visibilidade!`}
              </p>
            </div>

            {/* A tua comunidade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>A tua comunidade</p>
                <Link href="/comunidade" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver comunidade →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} color="#C85A1A" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{data.stats?.providers ?? 0} profissionais ativos</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A' }}>na plataforma</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HelpCircle size={14} color="#3B6D11" />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{data.questions?.length ?? 0} perguntas recentes</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A' }}>aguardam resposta</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
