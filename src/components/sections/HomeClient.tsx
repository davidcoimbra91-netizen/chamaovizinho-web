'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Bell, Calendar, ChevronRight, Plus, HelpCircle, Star, MapPin } from 'lucide-react'
import { CATEGORIES } from '@/types'

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

export default function HomeClient({ profile, data }: { profile: any, data: any }) {
  const name = profile?.name?.split(' ')[0] ?? 'Vizinho'

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Mensagens */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mensagens</p>
                <Link href="/dashboard/mensagens" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.conversations.length > 0 ? data.conversations.map((conv: any) => (
                <Link key={conv.id} href="/dashboard/mensagens"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }}
                  className="last:border-0">
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FBF0E8', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    {conv.other_user?.profile_photo
                      ? <Image src={conv.other_user.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#C85A1A' }}>{conv.other_user?.name?.charAt(0) ?? '?'}</div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{conv.other_user?.name ?? 'Utilizador'}</p>
                    <p style={{ fontSize: 11, color: '#9B7A5A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{conv.last_message ?? '...'}</p>
                  </div>
                </Link>
              )) : <p style={{ fontSize: 13, color: '#B09070', fontStyle: 'italic' }}>Sem mensagens recentes</p>}
            </div>

            {/* Notificações */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notificações</p>
                <Link href="/dashboard/notificacoes" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.notifications.length > 0 ? data.notifications.slice(0, 3).map((n: any) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: n.is_read ? '#F0E8DC' : '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={14} color={n.is_read ? '#9B7A5A' : '#C85A1A'} />
                  </div>
                  <p style={{ fontSize: 12, color: n.is_read ? '#9B7A5A' : '#2C1A0E', lineHeight: 1.5 }}>{n.title ?? n.body ?? 'Nova notificação'}</p>
                </div>
              )) : <div style={{ background: '#FBF0E8', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#9B7A5A' }}>Sem notificações de momento</div>}
            </div>

            {/* Novo Pedido CTA */}
            <Link href="/dashboard/novo-pedido"
              style={{ background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', boxShadow: '0 8px 24px rgba(200,90,26,0.28)' }}>
              <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={22} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Novo Pedido</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Publica gratuitamente</p>
              </div>
            </Link>
          </div>

          {/* ── MAIN ── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Próximos encontros */}
            {data.appointments.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Próximos encontros</p>
                {data.appointments.map((appt: any) => (
                  <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                    <div style={{ width: 42, height: 42, background: '#FBF0E8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={20} color="#C85A1A" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>
                        {new Date(appt.date).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {appt.start_time && ` · ${appt.start_time.slice(0, 5)}`}
                      </p>
                      {appt.notes && <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 2 }}>{appt.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 1. DICA DO DIA */}
            {data.dica && (
              <Link href={`/dicas/${data.dica.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#2C1A0E', minHeight: 110 }}>
                  {data.dica.image_url && (
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
                      <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  )}
                  <div style={{ position: 'relative', zIndex: 2, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#C85A1A' }}>
                      {data.dica.image_url
                        ? <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{getCatInfo(data.dica.category).icon}</div>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>Dica do Dia</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 4 }}>{data.dica.title}</p>
                      {data.dica.short_description && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{data.dica.short_description}</p>}
                    </div>
                    <ChevronRight size={20} color="rgba(255,255,255,0.35)" />
                  </div>
                </div>
              </Link>
            )}

            {/* 2. PERGUNTA AO VIZINHO */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A', lineHeight: 1.5, maxWidth: 420 }}>
                    Tens dúvidas sobre a tua casa? Faz uma pergunta à nossa comunidade de especialistas e vizinhos.
                  </p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 12 }}>Ver todas →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {data.questions.map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, textDecoration: 'none', transition: 'border-color 0.15s' }}
                    className="hover:border-brand-orange group">
                    <div style={{ width: 34, height: 34, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HelpCircle size={16} color="#C85A1A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: 2 }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={15} color="#D4C4B0" />
                  </Link>
                ))}
                <Link href="/comunidade/nova"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: '#FBF0E8', border: '0.5px dashed #C85A1A', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 600, color: '#C85A1A' }}>
                  <Plus size={14} /> Fazer uma pergunta
                </Link>
              </div>
            </div>

            {/* 3. OS MEUS PEDIDOS */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E' }}>Os meus pedidos</p>
                <Link href="/dashboard/pedidos" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.myRequests.length > 0 ? data.myRequests.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                return (
                  <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px', marginBottom: 10, background: '#FDFAF7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cat.iconImg
                            ? <Image src={cat.iconImg} alt="" width={22} height={22} style={{ objectFit: 'contain' }} />
                            : <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          }
                        </div>
                        <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, border: `0.5px solid ${cat.color}30` }}>{cat.label}</span>
                        <span style={{
                          background: pedido.status === 'open' ? '#EAF3DE' : pedido.status === 'completed' ? '#E8F0FE' : '#F0EDE8',
                          color: pedido.status === 'open' ? '#3B6D11' : pedido.status === 'completed' ? '#1A4DB0' : '#7A6048',
                          borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500,
                        }}>
                          {pedido.status === 'open' ? 'em aberto' : pedido.status === 'completed' ? 'concluído' : pedido.status}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>{pedido.title}</p>
                    {pedido.city && <p style={{ fontSize: 12, color: '#7A6048', marginBottom: 10 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · € ${pedido.budget}` : ''}</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '0.5px solid #F0E8DC', paddingTop: 10 }}>
                      <Link href={`/pedidos/${pedido.id}`}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 32, marginBottom: 10 }}>📝</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Ainda não tens pedidos</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 16 }}>Publica o teu primeiro pedido gratuitamente.</p>
                  <Link href="/dashboard/novo-pedido" className="btn-primary" style={{ fontSize: 13 }}>Publicar pedido</Link>
                </div>
              )}
            </div>

            {/* 4. STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: '👥', value: `${data.stats.providers}+`, label: 'Prestadores', color: '#C85A1A' },
                { icon: '⭐', value: '4.9/5', label: 'Avaliação média', color: '#F9AB00' },
                { icon: '⚡', value: 'Minutos', label: 'Para propostas', color: '#1A73E8' },
                { icon: '✅', value: 'Grátis', label: 'Publicar pedido', color: '#3B6D11' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'Lora, serif', marginBottom: 3 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#9B7A5A', lineHeight: 1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 5. PRESTADORES EM DESTAQUE */}
            {data.featured.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>Prestadores em Destaque</p>
                    <p style={{ fontSize: 12, color: '#9B7A5A' }}>Profissionais verificados e recomendados</p>
                  </div>
                  <Link href="/explorar" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {data.featured.map((p: any) => {
                    const name = p.business_name ?? p.user?.name ?? 'Prestador'
                    const photo = p.cover_photo ?? p.user?.profile_photo
                    const rating = p.average_rating ?? 0
                    const city = p.company_city ?? p.region
                    return (
                      <Link key={p.id} href={`/prestadores/perfil/${p.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, textDecoration: 'none', transition: 'all 0.15s' }}
                        className="hover:border-brand-orange">
                        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', position: 'relative' }}>
                          {photo
                            ? <Image src={photo} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#C85A1A' }}>{name.charAt(0)}</div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name}</p>
                            <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>⭐ Premium</span>
                          </div>
                          {rating > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{rating.toFixed(1)}</span></div>}
                          {city && <p style={{ fontSize: 11, color: '#9B7A5A' }}>📍 {city}</p>}
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
