'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, Calendar, ChevronRight, Plus, HelpCircle, Star, MapPin, Send } from 'lucide-react'
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

function ProviderCard({ p }: { p: any }) {
  const name = p.business_name ?? p.user?.name ?? 'Prestador'
  const photo = p.user?.profile_photo
  const cover = p.cover_photo
  const rating = p.average_rating ?? 0
  const city = p.company_city ?? p.region

  return (
    <div style={{ background: 'var(--bg, #fff)', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
      {/* Cover */}
      <div style={{ height: 72, borderRadius: '14px 14px 0 0', overflow: 'hidden', background: '#2C1A0E', position: 'relative', flexShrink: 0 }}>
        {cover && <Image src={cover} alt="" fill style={{ objectFit: 'cover' }} unoptimized />}
        {p.is_boosted && (
          <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(44,26,14,0.7)', color: '#F9AB00', borderRadius: 99, padding: '2px 7px', fontSize: 9, fontWeight: 600 }}>⭐ Premium</span>
        )}
        {/* Avatar débordant */}
        <div style={{ position: 'absolute', bottom: -18, left: 10 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={name} photo={photo} size={40} />
            {p.provider_type && TYPE_LOGOS[p.provider_type] && (
              <img src={TYPE_LOGOS[p.provider_type]} alt={p.provider_type}
                style={{ position: 'absolute', bottom: -2, right: -3, width: 14, height: 14, objectFit: 'contain' }} />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '22px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>{rating.toFixed(1)}</span><span style={{ fontSize: 10, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
          {city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {city}</span>}
        </div>
        {p.service_description && (
          <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
            {p.service_description}
          </p>
        )}
        {/* Catégories */}
        {p.service_categories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {p.service_categories.slice(0, 2).map((cat: string) => {
              const info = CATEGORIES.find(c => c.slug === cat)
              return <span key={cat} style={{ background: info?.bg ?? '#FAF7F2', color: info?.color ?? '#7A6048', borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 500 }}>{info?.icon} {info?.label ?? cat}</span>
            })}
          </div>
        )}
        {/* Portfolio miniatures */}
        {p.portfolio?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, borderRadius: 6, overflow: 'hidden' }}>
            {p.portfolio.slice(0, 3).map((item: any, i: number) => (
              <div key={i} style={{ aspectRatio: '1', background: '#EDE6DC', position: 'relative', overflow: 'hidden' }}>
                <Image src={item.photo_url ?? item.image ?? ''} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        )}
        <Link href={`/prestadores/perfil/${p.id}`}
          style={{ display: 'block', padding: '7px', borderRadius: 8, background: '#C85A1A', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 'auto' }}>
          Ver perfil
        </Link>
      </div>
    </div>
  )
}

export default function HomeClient({ profile, data }: { profile: any; data: any }) {
  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Mensagens */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mensagens</p>
                <Link href="/dashboard/mensagens" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.conversations.length > 0 ? data.conversations.map((conv: any) => (
                <Link key={conv.id} href="/dashboard/mensagens"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }} className="last:border-0">
                  <Avatar name={conv.other_user?.name} photo={conv.other_user?.profile_photo} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{conv.other_user?.name ?? 'Utilizador'}</p>
                    <p style={{ fontSize: 11, color: '#9B7A5A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{conv.last_message ?? '...'}</p>
                  </div>
                </Link>
              )) : <p style={{ fontSize: 12, color: '#B09070', fontStyle: 'italic' }}>Sem mensagens recentes</p>}
            </div>

            {/* Notificações */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notificações</p>
                <Link href="/dashboard/notificacoes" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.notifications.length > 0 ? data.notifications.slice(0, 3).map((n: any) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: n.is_read ? '#F0E8DC' : '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={12} color={n.is_read ? '#9B7A5A' : '#C85A1A'} />
                  </div>
                  <p style={{ fontSize: 11, color: n.is_read ? '#9B7A5A' : '#2C1A0E', lineHeight: 1.5 }}>{n.title ?? n.body ?? 'Nova notificação'}</p>
                  {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C85A1A', flexShrink: 0, marginTop: 4 }} />}
                </div>
              )) : <p style={{ fontSize: 12, color: '#B09070', fontStyle: 'italic' }}>Sem notificações</p>}
            </div>

            {/* Novo pedido CTA */}
            <Link href="/dashboard/novo-pedido"
              style={{ background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', boxShadow: '0 6px 20px rgba(200,90,26,0.25)' }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={20} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Novo Pedido</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Publica gratuitamente</p>
              </div>
            </Link>
          </div>

          {/* ── MAIN ── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Próximos encontros */}
            {data.appointments?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Próximos encontros</p>
                {data.appointments.map((appt: any) => (
                  <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                    <div style={{ width: 36, height: 36, background: '#FBF0E8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={17} color="#C85A1A" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>
                        {new Date(appt.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {appt.start_time && ` · ${appt.start_time.slice(0, 5)}`}
                      </p>
                      {appt.notes && <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: 1 }}>{appt.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 1. STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: '👥', value: `${data.stats?.providers ?? 0}+`, label: 'Prestadores', color: '#C85A1A' },
                { icon: '⭐', value: '4.9/5', label: 'Avaliação média', color: '#F9AB00' },
                { icon: '⚡', value: 'Minutos', label: 'Para propostas', color: '#1A73E8' },
                { icon: '✅', value: 'Grátis', label: 'Publicar pedido', color: '#3B6D11' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#9B7A5A', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 2. PRESTADORES EM DESTAQUE */}
            {data.featured?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>Prestadores em Destaque</p>
                    <p style={{ fontSize: 11, color: '#9B7A5A' }}>Profissionais Premium verificados</p>
                  </div>
                  <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {data.featured.map((p: any) => <ProviderCard key={p.id} p={p} />)}
                </div>
              </div>
            )}

            {/* 3. DICA DO DIA */}
            {data.dica && (
              <Link href={`/dicas/${data.dica.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', background: '#2C1A0E', display: 'flex', alignItems: 'stretch', minHeight: 120 }}>
                  {/* Photo miniature */}
                  <div style={{ width: 150, flexShrink: 0, position: 'relative', background: '#4A2C1A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {data.dica.image_url
                      ? <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                      : <span style={{ fontSize: 36, position: 'relative', zIndex: 2 }}>{getCatInfo(data.dica.category).icon}</span>
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, #2C1A0E)', zIndex: 1 }} />
                  </div>
                  {/* Contenu */}
                  <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <p style={{ fontSize: 10, color: '#C85A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dica do Dia</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{data.dica.title}</p>
                    {data.dica.short_description && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{data.dica.short_description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {data.dica.category && <span style={{ background: '#4A2C1A', color: '#E8A07A', borderRadius: 99, padding: '2px 8px', fontSize: 10 }}>{getCatInfo(data.dica.category).label}</span>}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>→ Ler artigo</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                    <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
                  </div>
                </div>
              </Link>
            )}

            {/* 4. PERGUNTA AO VIZINHO */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A', lineHeight: 1.5, maxWidth: 380 }}>Tens dúvidas sobre a tua casa? Faz uma pergunta à nossa comunidade de especialistas.</p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {data.questions.map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, background: '#FBF0E8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HelpCircle size={14} color="#C85A1A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <p style={{ fontSize: 10, color: '#9B7A5A', marginTop: 1 }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
                <Link href="/comunidade/nova"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px', background: '#FBF0E8', border: '0.5px dashed #C85A1A', borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#C85A1A' }}>
                  <Plus size={13} /> Fazer uma pergunta
                </Link>
              </div>
            </div>

            {/* 5. OS MEUS PEDIDOS */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Os meus pedidos</p>
                <Link href="/dashboard/pedidos" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.myRequests.length > 0 ? data.myRequests.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                const statusMap: Record<string, { label: string; bg: string; color: string }> = {
                  open: { label: 'em aberto', bg: '#EAF3DE', color: '#3B6D11' },
                  in_progress: { label: 'em processo', bg: '#FFF3E0', color: '#E65100' },
                  completed: { label: 'concluído', bg: '#E8F0FE', color: '#1A4DB0' },
                  cancelled: { label: 'cancelado', bg: '#F0EDE8', color: '#7A6048' },
                }
                const st = statusMap[pedido.status] ?? statusMap.open
                return (
                  <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#FDFAF7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        </div>
                        <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '2px 9px', fontSize: 11 }}>{st.label}</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{pedido.title}</p>
                    {pedido.city && <p style={{ fontSize: 11, color: '#7A6048', marginBottom: 9 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · € ${pedido.budget}` : ''}</p>}
                    <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 9, display: 'flex', justifyContent: 'flex-end' }}>
                      <Link href={`/pedidos/${pedido.id}`}
                        style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📝</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda não tens pedidos</p>
                  <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 14 }}>Publica o teu primeiro pedido gratuitamente.</p>
                  <Link href="/dashboard/novo-pedido" className="btn-primary" style={{ fontSize: 12 }}>Publicar pedido</Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
