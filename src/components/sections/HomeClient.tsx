'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Plus, HelpCircle, Star, MapPin, Map } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { PEDIDO_TEMPLATES } from '@/lib/pedido-templates'
import type { PedidoTemplate } from '@/lib/pedido-templates'
import dynamic from 'next/dynamic'

const PedidoWizard = dynamic(() => import('@/components/PedidoWizard'), { ssr: false })

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

function CatIcon({ slug, size = 36 }: { slug: string | null; size?: number }) {
  const cat = getCatInfo(slug)
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: cat.bg, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      {cat.iconImg
        ? <Image src={cat.iconImg} alt="" fill style={{ objectFit: 'contain', padding: size * 0.15 }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>{cat.icon}</div>
      }
    </div>
  )
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

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  open: { label: 'A receber propostas', bg: '#EAF3DE', color: '#3B6D11' },
  in_progress: { label: 'Em análise', bg: '#FFF3E0', color: '#E65100' },
  completed: { label: 'Trabalho concluído', bg: '#E8F0FE', color: '#1A4DB0' },
  cancelled: { label: 'Cancelado', bg: '#F0EDE8', color: '#7A6048' },
  pending: { label: 'Proposta recebida', bg: '#FBF0E8', color: '#C85A1A' },
}

const HEADER_IMGS = [
  '/icons/header 1.jpg',
  '/icons/header 2.jpg',
  '/icons/header 3.jpg',
  '/icons/header 4.jpg',
]

export default function HomeClient({ profile, data }: { profile: any; data: any }) {
  const firstName = profile?.name?.split(' ')[0] ?? 'Vizinho'
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : null
  const points = data.rewardProfile?.approved_points_balance ?? 0
  const [activeTemplate, setActiveTemplate] = useState<PedidoTemplate | null>(null)
  const [headerImg, setHeaderImg] = useState(HEADER_IMGS[0])
  useEffect(() => { setHeaderImg(HEADER_IMGS[Math.floor(Math.random() * 4)]) }, [])

  const stats = [
    { icon: '📋', label: 'Pedidos', value: data.myRequests?.length ?? 0, href: '/dashboard/pedidos' },
    { icon: '📩', label: 'Orçamentos', value: data.offersReceived ?? 0, href: '/dashboard/pedidos' },
    { icon: '💬', label: 'Mensagens', value: data.conversations?.length ?? 0, href: '/dashboard/mensagens' },
    { icon: '✅', label: 'Concluídos', value: data.completedCount ?? 0, href: '/dashboard/pedidos' },
    { icon: '⭐', label: 'Avaliações', value: data.reviewsCount ?? 0, href: '/recompensas' },
  ]

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      {activeTemplate && <PedidoWizard template={activeTemplate} onClose={() => setActiveTemplate(null)} />}

      {/* ── BANDEAU HEADER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <img src={headerImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(44,26,14,0.6) 0%, rgba(44,26,14,0.1) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              Olá, {firstName}! 👋
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>O que precisa de fazer hoje?</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20 }} className="lg:grid-cols-[260px_1fr_280px] grid-cols-1">

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Carta perfil */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={profile?.name} photo={profile?.profile_photo} size={72} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, background: '#3B6D11', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12 }}>✓</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{profile?.name ?? 'Cliente'}</p>
                  <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 9px', fontSize: 13, fontWeight: 600 }}>✓ Cliente verificado</span>
                </div>
                {profile?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9B7A5A' }}>
                    <MapPin size={11} color="#9B7A5A" />
                    {profile.city}
                  </div>
                )}
                {memberSince && <p style={{ fontSize: 13, color: '#B09070' }}>Membro desde {memberSince}</p>}
                <Link href="/dashboard/perfil"
                  style={{ width: '100%', padding: '7px 0', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 14, fontWeight: 600, color: '#5A3E28', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
                  Ver perfil público
                </Link>
              </div>
            </div>

            {/* A minha atividade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>A minha atividade</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stats.map(s => (
                  <Link key={s.label} href={s.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 8, background: '#FAF7F2', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ fontSize: 14, color: '#5A3E28' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#C85A1A' }}>{s.value}</span>
                  </Link>
                ))}
              </div>
            </div>


          </div>

          {/* ── CENTRO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Dica do Dia */}
            {data.dica ? (
              <Link href={`/dicas/${data.dica.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 160, background: '#2C1A0E' }}>
                  {data.dica.image_url && <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover', opacity: 0.45 }} unoptimized />}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(44,26,14,0.85) 0%, rgba(44,26,14,0.6) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 700, width: 'fit-content', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      💡 Dica do dia
                    </span>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 8, maxWidth: 340, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      {data.dica.title}
                    </p>
                    {data.dica.short_description && (
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, maxWidth: 320, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                        {data.dica.short_description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <div style={{ borderRadius: 16, background: '#2C1A0E', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>A carregar dica do dia...</p>
              </div>
            )}

            {/* 🔥 Mais pedidos este mês */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>🔥 Mais pedidos este mês</p>
                <span style={{ fontSize: 13, color: '#9B7A5A' }}>Começa em 1 clique</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PEDIDO_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveTemplate(tpl)}
                    style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                    <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }}>
                      {tpl.iconImg
                        ? <Image src={tpl.iconImg} alt={tpl.label} fill style={{ objectFit: 'contain' }} />
                        : <span style={{ fontSize: 22 }}>{tpl.icon}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3 }}>{tpl.label}</p>
                      <p style={{ fontSize: 12, color: '#C85A1A', fontWeight: 600, marginTop: 2 }}>Pedir agora →</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3 ações rápidas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { icon: Plus, label: 'Novo pedido', sub: 'Publicar uma demanda', href: '/dashboard/novo-pedido', color: '#C85A1A', bg: '#FBF0E8' },
                { icon: HelpCircle, label: 'Nova pergunta', sub: 'Perguntar à comunidade', href: '/comunidade/nova', color: '#9C27B0', bg: '#F3E5F5' },
                { icon: Map, label: 'Ver no mapa', sub: 'Profissionais perto', href: '/mapa', color: '#1A73E8', bg: '#E8F0FE' },
              ].map(a => (
                <Link key={a.label} href={a.href} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 12px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={17} color={a.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>{a.label}</p>
                    <p style={{ fontSize: 12, color: '#9B7A5A', lineHeight: 1.3 }}>{a.sub}</p>
                  </div>
                  <span style={{ fontSize: 13, color: a.color, fontWeight: 600 }}>→</span>
                </Link>
              ))}
            </div>

            {/* Os meus pedidos recentes */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Os meus pedidos recentes</p>
                <Link href="/dashboard/pedidos" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.myRequests?.length > 0 ? data.myRequests.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                const st = STATUS_MAP[pedido.status] ?? STATUS_MAP.open
                return (
                  <div key={pedido.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                    <CatIcon slug={pedido.category} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{pedido.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '1px 7px', fontSize: 12, fontWeight: 500 }}>{st.label}</span>
                        {pedido.city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {pedido.city}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                      <Link href={`/pedidos/${pedido.id}`}
                        style={{ padding: '5px 11px', borderRadius: 7, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                        Ver
                      </Link>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📝</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda não tens pedidos</p>
                  <p style={{ fontSize: 14, color: '#9B7A5A', marginBottom: 14 }}>Publica o teu primeiro pedido gratuitamente.</p>
                  <Link href="/dashboard/novo-pedido" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Publicar pedido</Link>
                </div>
              )}
            </div>

            {/* Pergunta ao Vizinho */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A' }}>Tens dúvidas sobre a tua casa? A comunidade ajuda.</p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.questions?.map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, background: '#FBF0E8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HelpCircle size={13} color="#C85A1A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 1 }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
                <Link href="/comunidade/nova"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', background: '#FBF0E8', border: '0.5px dashed #C85A1A', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>
                  <Plus size={13} /> Fazer uma pergunta
                </Link>
              </div>
            </div>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Pontos */}
            <div style={{ background: '#2C1A0E', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Os meus pontos</p>
                <span style={{ fontSize: 16 }}>🏅</span>
              </div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#C85A1A', marginBottom: 4 }}>{points} pts</p>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${Math.min((points / 100) * 100, 100)}%`, background: '#C85A1A', borderRadius: 99 }} />
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                {points < 100 ? `Faltam ${100 - points} pts para voucher 5€` : 'Pronto para resgatar!'}
              </p>
              <Link href="/recompensas" style={{ display: 'block', padding: '7px', borderRadius: 8, background: 'rgba(200,90,26,0.3)', textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#E8A07A' }}>
                Ver recompensas →
              </Link>
            </div>

            {/* Profissionais perto */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Profissionais perto de si</p>
                <Link href="/mapa" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.nearbyProviders?.length > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 10 }}>
                    {data.nearbyProviders.length} profissionais ativos num raio de 10 km
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.nearbyProviders.slice(0, 3).map((p: any) => (
                      <Link key={p.id} href={`/prestadores/perfil/${p.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        <Avatar name={p.user?.name ?? p.business_name} photo={p.user?.profile_photo} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.business_name ?? p.user?.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p.average_rating > 0 && <><Star size={10} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 12, color: '#5A3E28', fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span></>}
                            {p.distanceKm && <span style={{ fontSize: 12, color: '#9B7A5A' }}>· {p.distanceKm} km</span>}
                          </div>
                        </div>
                        {p.service_categories?.[0] && (() => {
                          const cat = getCatInfo(p.service_categories[0])
                          return <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 7px', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{cat.label}</span>
                        })()}
                      </Link>
                    ))}
                  </div>
                  <Link href="/mapa"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10, padding: '8px', borderRadius: 9, border: '0.5px solid #EDE6DC', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#5A3E28' }}>
                    <MapPin size={12} color="#C85A1A" /> Ver todos no mapa
                  </Link>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: 14, color: '#9B7A5A' }}>Ativa a localização para ver profissionais perto de ti.</p>
                  <Link href="/mapa" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver mapa →</Link>
                </div>
              )}
            </div>

            {/* Pedidos na sua área */}
            {data.recentAreaRequests?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Pedidos na sua área</p>
                  <Link href="/explorar" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 10 }}>{data.recentAreaRequests.length} pedidos publicados hoje</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {data.recentAreaRequests.slice(0, 3).map((r: any) => {
                    const cat = getCatInfo(r.category)
                    const ago = Math.round((Date.now() - new Date(r.created_at).getTime()) / 60000)
                    return (
                      <Link key={r.id} href={`/pedidos/${r.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, textDecoration: 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 15 }}>{cat.icon}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: '#9B7A5A' }}>{r.city} · Há {ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`}
</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
