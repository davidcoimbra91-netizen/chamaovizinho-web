'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Bell, Calendar, ChevronRight, Send } from 'lucide-react'
import { CATEGORIES } from '@/types'

function getCatIcon(slug: string | null) {
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
  return found?.icon ?? '🔧'
}

export default function HomeProvider({ profile, providerProfile, data }: { profile: any, providerProfile: any, data: any }) {
  const name = profile?.name ?? 'Vizinho'
  const photo = providerProfile?.cover_photo ?? profile?.profile_photo

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Perfil */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', margin: '0 auto 10px', position: 'relative' }}>
              {photo
                ? <Image src={photo} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: '#C85A1A', color: '#fff', fontWeight: 500 }}>{name.charAt(0)}</div>
              }
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{name}</p>
            <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 12 }}>{profile?.city ?? 'Portugal'}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/dashboard/perfil" style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, fontWeight: 500, color: '#7A6048', textAlign: 'center', textDecoration: 'none' }}>Editar Perfil</Link>
              {providerProfile && (
                <Link href={`/prestadores/perfil/${providerProfile.id}`} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: '#C85A1A', fontSize: 12, fontWeight: 500, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Ver Público</Link>
              )}
            </div>
          </div>

          {/* Stats propostas */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>As minhas propostas</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 }}>
              {[
                { n: data.propostas.pendentes, l: 'Pendentes', color: '#C85A1A' },
                { n: data.propostas.aceites,   l: 'Aceites',   color: '#3B6D11' },
                { n: data.propostas.recusados,  l: 'Recusados', color: '#9B7A5A' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: s.color, fontFamily: 'Lora, serif' }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: '#9B7A5A' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <Link href="/dashboard/propostas" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none' }}>Ver todas as propostas →</Link>
          </div>

          {/* Mensagens */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensagens</p>
              <Link href="/dashboard/mensagens" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none' }}>Ver todas</Link>
            </div>
            {data.conversations.length > 0 ? data.conversations.map((conv: any) => (
              <Link key={conv.id} href={`/dashboard/mensagens/${conv.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }} className="last:border-0">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#C85A1A', flexShrink: 0, fontWeight: 500 }}>
                  {conv.other_user?.name?.charAt(0) ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E' }}>{conv.other_user?.name ?? 'Utilizador'}</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.last_message ?? '...'}</p>
                </div>
              </Link>
            )) : (
              <p style={{ fontSize: 12, color: '#9B7A5A' }}>Sem mensagens recentes</p>
            )}
          </div>

          {/* Notificações */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notificações</p>
              <Link href="/dashboard/notificacoes" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none' }}>Ver todas</Link>
            </div>
            {data.notifications.length > 0 ? data.notifications.slice(0, 3).map((n: any) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: n.is_read ? '#F0E8DC' : '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={13} color={n.is_read ? '#9B7A5A' : '#C85A1A'} />
                </div>
                <p style={{ fontSize: 11, color: n.is_read ? '#9B7A5A' : '#2C1A0E', lineHeight: 1.4 }}>{n.title ?? n.body ?? 'Nova notificação'}</p>
              </div>
            )) : (
              <div style={{ background: '#FBF0E8', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#9B7A5A' }}>Sem notificações</div>
            )}
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Próximos encontros */}
          {data.appointments.length > 0 && (
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Próximos encontros</p>
              {data.appointments.map((appt: any) => (
                <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #F0E8DC' }} className="last:border-0">
                  <div style={{ width: 36, height: 36, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={16} color="#C85A1A" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#2C1A0E' }}>
                      {new Date(appt.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
                      {appt.start_time && ` • ${appt.start_time.slice(0, 5)}`}
                    </p>
                    {appt.notes && <p style={{ fontSize: 11, color: '#9B7A5A' }}>{appt.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pedidos recentes */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', fontFamily: 'Lora, serif' }}>Pedidos na Vizinhança</p>
              <Link href="/servicos" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            {data.pedidos.length > 0 ? data.pedidos.map((pedido: any) => (
              <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: '#F5E8D6', color: '#854A1A', border: '0.5px solid #E0CCBB', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
                      {getCatIcon(pedido.category)} {pedido.category ?? 'Geral'}
                    </span>
                    <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>em aberto</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#B09070' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>{pedido.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  {pedido.city && <span style={{ fontSize: 11, color: '#7A6048' }}>📍 {pedido.city}</span>}
                  {pedido.budget > 0 && <span style={{ fontSize: 11, color: '#7A6048' }}>€ {pedido.budget}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '0.5px solid #F0E8DC', paddingTop: 8 }}>
                  <Link href={`/pedidos/${pedido.id}`} style={{ padding: '5px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Ver Detalhes
                  </Link>
                  <Link href={`/pedidos/${pedido.id}/proposta`} style={{ padding: '5px 12px', borderRadius: 8, background: '#C85A1A', fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={12} /> Enviar Proposta
                  </Link>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 13, color: '#9B7A5A', textAlign: 'center', padding: '20px 0' }}>Sem pedidos recentes na tua zona</p>
            )}
          </div>

          {/* Dica do Dia */}
          {data.dica && (
            <Link href={`/dicas/${data.dica.id}`} style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {getCatIcon(data.dica.category)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dica do Dia</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.4 }}>{data.dica.title}</p>
                {data.dica.short_description && <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.4, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>{data.dica.short_description}</p>}
              </div>
              <ChevronRight size={16} color="#C85A1A" />
            </Link>
          )}

          {/* Pergunta ao Vizinho */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', fontFamily: 'Lora, serif' }}>Pergunta ao Vizinho</p>
              <Link href="/comunidade" style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none' }}>Ver todas →</Link>
            </div>
            {data.questions.map((q: any) => (
              <Link key={q.id} href={`/comunidade/${q.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid #F0E8DC', textDecoration: 'none' }} className="last:border-0">
                <div style={{ width: 28, height: 28, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageCircle size={13} color="#C85A1A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A' }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={14} color="#D4C4B0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
