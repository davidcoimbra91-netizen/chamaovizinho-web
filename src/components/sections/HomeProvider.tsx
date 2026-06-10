'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bell, Calendar, ChevronRight, Plus, HelpCircle, Star, Send, MapPin, FileText, Receipt } from 'lucide-react'
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
    <div style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, borderRadius: '14px 14px 0 0', overflow: 'hidden', background: '#2C1A0E', position: 'relative', flexShrink: 0 }}>
        {cover && <Image src={cover} alt="" fill style={{ objectFit: 'cover' }} unoptimized />}
        {p.is_boosted && <span style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(44,26,14,0.7)', color: '#F9AB00', borderRadius: 99, padding: '2px 7px', fontSize: 9, fontWeight: 600 }}>⭐ Premium</span>}
        <div style={{ position: 'absolute', bottom: -18, left: 10 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={name} photo={photo} size={40} />
            {p.provider_type && TYPE_LOGOS[p.provider_type] && (
              <img src={TYPE_LOGOS[p.provider_type]} alt={p.provider_type} style={{ position: 'absolute', bottom: -2, right: -3, width: 14, height: 14, objectFit: 'contain' }} />
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: '22px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600 }}>{rating.toFixed(1)}</span></>}
          {city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {city}</span>}
        </div>
        {p.service_description && <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{p.service_description}</p>}
        {p.portfolio?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, borderRadius: 6, overflow: 'hidden' }}>
            {p.portfolio.slice(0, 3).map((item: any, i: number) => (
              <div key={i} style={{ aspectRatio: '1', background: '#EDE6DC', position: 'relative', overflow: 'hidden' }}>
                <Image src={item.photo_url ?? item.image ?? ''} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        )}
        <Link href={`/prestadores/perfil/${p.id}`} style={{ display: 'block', padding: '7px', borderRadius: 8, background: '#C85A1A', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 'auto' }}>Ver perfil</Link>
      </div>
    </div>
  )
}

export default function HomeProvider({ profile, providerProfile, data }: { profile: any; providerProfile: any; data: any }) {
  const name = profile?.name?.split(' ')[0] ?? 'Vizinho'
  const photo = providerProfile?.cover_photo ?? profile?.profile_photo
  const canInvoice = providerProfile?.provider_type === 'Recibo Verde' || providerProfile?.provider_type === 'Empresa'

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Perfil card */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', margin: '0 auto 10px', position: 'relative' }}>
                {photo
                  ? <Image src={photo} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#C85A1A' }}>{name.charAt(0)}</div>
                }
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>{name}</p>
              {profile?.city && <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 6 }}>📍 {profile.city}</p>}
              {providerProfile?.provider_type && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                  {TYPE_LOGOS[providerProfile.provider_type] && <img src={TYPE_LOGOS[providerProfile.provider_type]} alt={providerProfile.provider_type} style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                  <span style={{ fontSize: 11, color: '#7A6048' }}>{providerProfile.provider_type}</span>
                </div>
              )}
              {profile?.is_pro && <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 10 }}>⭐ Premium</span>}
              <div style={{ display: 'flex', gap: 7 }}>
                <Link href="/dashboard/perfil" style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 11, fontWeight: 600, color: '#7A6048', textAlign: 'center', textDecoration: 'none' }}>Editar Perfil</Link>
                {providerProfile && <Link href={`/prestadores/perfil/${providerProfile.id}`} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: '#C85A1A', fontSize: 11, fontWeight: 600, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Ver Público</Link>}
              </div>
            </div>

            {/* Stats propostas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>As minhas propostas</p>
                <Link href="/dashboard/propostas" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {[
                  { n: data.propostas?.pendentes ?? 0, l: 'Pendentes', color: '#C85A1A' },
                  { n: data.propostas?.aceites ?? 0, l: 'Aceites', color: '#3B6D11' },
                  { n: data.propostas?.recusados ?? 0, l: 'Recusados', color: '#9B7A5A' },
                ].map(s => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif' }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: '#9B7A5A', marginTop: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensagens */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mensagens</p>
                <Link href="/dashboard/mensagens" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.conversations.length > 0 ? data.conversations.map((conv: any) => (
                <Link key={conv.id} href="/dashboard/mensagens"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }} className="last:border-0">
                  <Avatar name={conv.other_user?.name} photo={conv.other_user?.profile_photo} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{conv.other_user?.name ?? 'Utilizador'}</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{conv.last_message ?? '...'}</p>
                  </div>
                </Link>
              )) : <p style={{ fontSize: 11, color: '#B09070', fontStyle: 'italic' }}>Sem mensagens</p>}
            </div>

            {/* Notificações */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notificações</p>
                <Link href="/dashboard/notificacoes" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas</Link>
              </div>
              {data.notifications.slice(0, 3).map((n: any) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: n.is_read ? '#F0E8DC' : '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={11} color={n.is_read ? '#9B7A5A' : '#C85A1A'} />
                  </div>
                  <p style={{ fontSize: 11, color: n.is_read ? '#9B7A5A' : '#2C1A0E', lineHeight: 1.4 }}>{n.title ?? n.body ?? 'Nova notificação'}</p>
                </div>
              ))}
            </div>

            {/* FAB menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Link href="/dashboard/novo-pedido" style={{ background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <Plus size={17} color="#fff" />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Novo Pedido</p>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Publica gratuitamente</p>
                </div>
              </Link>
              {canInvoice && (
                <>
                  <Link href="/dashboard/faturacao/novo?type=devis" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <FileText size={15} color="#1A73E8" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>Novo Devis</span>
                  </Link>
                  <Link href="/dashboard/faturacao/novo?type=invoice" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <Receipt size={15} color="#C85A1A" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>Nova Fatura</span>
                  </Link>
                </>
              )}
            </div>
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
                      {appt.address && <a href={`https://maps.google.com/?q=${encodeURIComponent(appt.address)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#1A73E8', textDecoration: 'none' }}>📍 {appt.address}</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 1. STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { icon: '📋', value: data.propostas?.total ?? 0, label: 'Total propostas', color: '#C85A1A' },
                { icon: '✅', value: data.propostas?.aceites ?? 0, label: 'Aceites', color: '#3B6D11' },
                { icon: '⏳', value: data.propostas?.pendentes ?? 0, label: 'Pendentes', color: '#F9AB00' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.value}</div>
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
                  <div style={{ width: 150, flexShrink: 0, position: 'relative', background: '#4A2C1A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {data.dica.image_url
                      ? <Image src={data.dica.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                      : <span style={{ fontSize: 36, position: 'relative', zIndex: 2 }}>{getCatInfo(data.dica.category).icon}</span>
                    }
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, #2C1A0E)', zIndex: 1 }} />
                  </div>
                  <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                    <p style={{ fontSize: 10, color: '#C85A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dica do Dia</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{data.dica.title}</p>
                    {data.dica.short_description && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{data.dica.short_description}</p>}
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
                  <p style={{ fontSize: 11, color: '#9B7A5A', lineHeight: 1.5 }}>Responde às dúvidas da comunidade e ganha visibilidade.</p>
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
              </div>
            </div>

            {/* 5. PEDIDOS DA VIZINHANÇA */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Pedidos da Vizinhança</p>
                <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.pedidos?.length > 0 ? data.pedidos.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                return (
                  <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#FDFAF7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 15 }}>{cat.icon}</span>
                        </div>
                        <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{cat.label}</span>
                        <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 9px', fontSize: 11 }}>em aberto</span>
                      </div>
                      <span style={{ fontSize: 10, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{pedido.title}</p>
                    {pedido.city && <p style={{ fontSize: 11, color: '#7A6048', marginBottom: 9 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · € ${pedido.budget}` : ''}</p>}
                    <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 9, display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <Link href={`/pedidos/${pedido.id}`}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 11, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                        Ver Detalhes
                      </Link>
                      <Link href={`/pedidos/${pedido.id}/proposta`}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#C85A1A', fontSize: 11, color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
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
        </div>
      </div>
    </div>
  )
}
