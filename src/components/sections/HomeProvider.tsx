'use client'

import RequesterCard from '@/components/ui/RequesterCard'
import TypeBadge from '@/components/ui/TypeBadge'
import PropostaModal from '@/components/ui/PropostaModal'
import ReviewModal from '@/components/ui/ReviewModal'
import { createClient } from '@/lib/supabase/client'
import { RewardService } from '@/lib/rewardService'
import { notifyJobCompleted, notifyJobCancelled } from '@/lib/notificationService'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Plus, HelpCircle, Star, MapPin, Send, FileText, Receipt, TrendingUp, Users, Zap, Clock, Target } from 'lucide-react'
import { CATEGORIES } from '@/types'

const TIP_ICONS = ['💡', '📸', '⚡', '✅', '⭐', '🎯', '💬', '🔔', '📋', '🏆']

const FALLBACK_TIPS = [
  { icon: '📸', title: 'Adiciona fotos ao perfil', text: 'Prestadores com mais de 5 fotos recebem 37% mais contactos.' },
  { icon: '⚡', title: 'Responde rapidamente', text: 'Respostas em menos de 1 hora aumentam as propostas aceites em 2×.' },
  { icon: '✅', title: 'Completa o teu perfil', text: 'Um perfil completo gera 3× mais confiança nos clientes.' },
  { icon: '⭐', title: 'Pede avaliações', text: 'Pedir avaliações após cada trabalho melhora o teu ranking.' },
]


function norm(s: string) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_') }
function getCatInfo(slug: string | null) {
  const n = norm(slug ?? '')
  return CATEGORIES.find(c => c.slug === slug || norm(c.slug) === n)
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

const HEADER_IMGS = [
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%201.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%202.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%203.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%204.png',
]

export default function HomeProvider({ profile, providerProfile, data }: { profile: any; providerProfile: any; data: any }) {
  const firstName = profile?.name?.split(' ')[0] ?? 'Vizinho'
  const coverPhoto = providerProfile?.cover_photo
  const canInvoice = providerProfile?.provider_type === 'Recibo Verde' || providerProfile?.provider_type === 'Empresa'
  const [headerImg, setHeaderImg] = useState(coverPhoto ?? HEADER_IMGS[0])
  const [propostaPedido, setPropostaPedido] = useState<any>(null)
  const [completingJob, setCompletingJob] = useState<string | null>(null)
  const [reviewClientTarget, setReviewClientTarget] = useState<any | null>(null) // { job, clientProfile }
  const [cancellingJob, setCancellingJob] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const supabase = createClient()
  useEffect(() => {
    if (!coverPhoto) setHeaderImg(HEADER_IMGS[Math.floor(Math.random() * 4)])
  }, [])

  const handleMarkCompleteProvider = async (job: any) => {
    if (completingJob) return
    setCompletingJob(job.id)
    try {
      await supabase.from('service_requests').update({ status: 'completed' }).eq('id', job.id)
      RewardService.onJobConfirmedByProvider(profile.id, job.client_id, job.id).catch(() => {})
      notifyJobCompleted(job.client_id, job.title, job.id).catch(() => {})
      setReviewClientTarget({ job, client: job.client })
    } finally {
      setCompletingJob(null)
    }
  }

  const handleCancelJob = async (job: any) => {
    if (cancellingJob) return
    setCancellingJob(job.id)
    setCancelConfirmId(null)
    try {
      // Reopen SR + decline this provider's offer
      await supabase.from('service_requests').update({ status: 'open' }).eq('id', job.id)
      await supabase.from('offers').update({ status: 'declined' })
        .eq('service_request_id', job.id)
        .eq('provider_id', profile.id)
      const providerName = providerProfile?.business_name ?? profile?.name ?? 'Prestador'
      notifyJobCancelled(job.client_id, providerName, job.title, job.id).catch(() => {})
      // Open review modal so provider can rate the client
      setReviewClientTarget({ job, client: job.client })
    } finally {
      setCancellingJob(null)
    }
  }

  const completedCount = data.completedCount ?? 0
  const monthGoal = 10
  const goalPct = Math.min((completedCount / monthGoal) * 100, 100)

  const tips = data.providerTips?.length > 0
    ? data.providerTips.map((t: any, i: number) => ({ icon: TIP_ICONS[i % TIP_ICONS.length], title: t.title, text: t.content }))
    : FALLBACK_TIPS

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const todayTip = tips[dayOfYear % tips.length]

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>

      {/* ── BANDEAU HEADER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div style={{ position: 'relative', width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <img src={headerImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(44,26,14,0.6) 0%, rgba(44,26,14,0.1) 60%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              Olá, {firstName}! 👋
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Pronto para ajudar os teus vizinhos hoje?</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20 }} className="lg:grid-cols-[260px_1fr_280px] grid-cols-1">

          {/* ════════════════════════════════
               COLUNA ESQUERDA
          ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Perfil Prestataire */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '20px 18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Avatar name={profile?.name} photo={profile?.profile_photo} size={72} />
                  <TypeBadge providerType={providerProfile?.provider_type} size={26} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{profile?.name ?? 'Prestador'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                    {providerProfile?.is_verified && (
                      <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>✓ Verificado</span>
                    )}
                    {profile?.is_pro && (
                      <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>⭐ Premium</span>
                    )}
                    {providerProfile?.provider_type && (
                      <span style={{ background: '#F3F4F6', color: '#5A3E28', borderRadius: 99, padding: '2px 8px', fontSize: 12 }}>{providerProfile.provider_type}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, alignItems: 'center' }}>
                    {profile?.phone && <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 500 }}>✔ Telefone verificado</span>}
                    {profile?.email && <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 500 }}>✔ Email verificado</span>}
                    {(profile?.profile_completed || providerProfile?.is_verified) && <span style={{ fontSize: 12, color: '#3B6D11', fontWeight: 500 }}>✔ Perfil completo</span>}
                  </div>
                </div>
                {profile?.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9B7A5A' }}>
                    <MapPin size={11} color="#9B7A5A" />
                    {profile.city}
                  </div>
                )}
                {providerProfile?.average_rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={13} color="#F9AB00" fill="#F9AB00" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{providerProfile.average_rating.toFixed(1)}</span>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>({providerProfile.reviews_count ?? 0} avaliações)</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <Link href="/dashboard/perfil" style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 13, fontWeight: 600, color: '#7A6048', textAlign: 'center', textDecoration: 'none' }}>Editar</Link>
                  {providerProfile && <Link href={`/prestadores/perfil/${providerProfile.id}`} style={{ flex: 1, padding: '6px 0', borderRadius: 8, background: '#C85A1A', fontSize: 13, fontWeight: 600, color: '#fff', textAlign: 'center', textDecoration: 'none' }}>Ver público</Link>}
                </div>
              </div>
            </div>

            {/* Criar Orçamento + Criar Fatura */}
            {canInvoice && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <Link href="/dashboard/faturacao/novo?type=devis" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <FileText size={15} color="#1A73E8" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>Criar Orçamento</span>
                </Link>
                <Link href="/dashboard/faturacao/novo?type=fatura" style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <Receipt size={15} color="#C85A1A" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>Criar Fatura</span>
                </Link>
              </div>
            )}

            {/* A Minha Atividade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>A minha atividade</p>
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
                    <span style={{ fontSize: 13, color: '#5A3E28' }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Atividade da Semana */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Atividade da semana</p>
              {[
                { emoji: '📋', label: 'novos pedidos', value: data.weeklyStats?.newPedidos ?? 0 },
                { emoji: '💬', label: 'novas mensagens', value: data.weeklyStats?.newMessages ?? 0 },
                { emoji: '✅', label: 'propostas aceites', value: data.weeklyStats?.acceptedOffers ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0' }}>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={{ fontSize: 14, color: '#2C1A0E', fontWeight: 600 }}>{s.value}</span>
                  <span style={{ fontSize: 13, color: '#9B7A5A' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Notificações */}
            {data.notifications?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Notificações</p>
                  <Link href="/dashboard/notificacoes" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {data.notifications.slice(0, 4).map((n: any) => (
                    <div key={n.id} style={{ display: 'flex', gap: 9, padding: '8px 10px', background: n.is_read ? '#FAF7F2' : '#FFF3EC', borderRadius: 10, borderLeft: n.is_read ? 'none' : '3px solid #C85A1A' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 700, color: '#2C1A0E', lineHeight: 1.4 }}>{n.title}</p>
                        {n.body && <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 2, lineHeight: 1.3 }}>{n.body}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ════════════════════════════════
               COLUNA CENTRAL
          ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Dica para Ganhar Mais Clientes */}
            <div style={{ borderRadius: 16, background: 'linear-gradient(135deg,#2C1A0E,#3D2410)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, minHeight: 90 }}>
              <div style={{ fontSize: 32, flexShrink: 0, lineHeight: 1 }}>{todayTip.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: '#C85A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Dica para ganhar mais clientes</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, lineHeight: 1.3 }}>{todayTip.title}</p>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{todayTip.text}</p>
              </div>
            </div>

            {/* KPIs */}
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
                  <div style={{ fontSize: 12, color: '#2C1A0E', fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: '#9B7A5A', marginTop: 1 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Pergunta ao Vizinho */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pergunta ao Vizinho</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A' }}>Responde às dúvidas da comunidade e ganha visibilidade.</p>
                </div>
                <Link href="/comunidade" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas →</Link>
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
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <p style={{ fontSize: 12, color: '#9B7A5A' }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                        {q.category && <span style={{ fontSize: 12, color: getCatInfo(q.category).color }}>· {getCatInfo(q.category).label}</span>}
                      </div>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Trabalhos em Curso */}
            {(data.inProgressJobs ?? []).length > 0 && (
              <div style={{ background: '#fff', border: '2px solid #E65100', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>🔨 Trabalhos em curso</p>
                    <p style={{ fontSize: 12, color: '#E65100', marginTop: 2 }}>A aguardar a tua confirmação de conclusão</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(data.inProgressJobs ?? []).map((job: any) => {
                    const clientName = job.client?.name ?? 'Cliente'
                    const clientPhoto = job.client?.profile_photo
                    const avgRating = job.client?.average_rating ?? 0
                    return (
                      <div key={job.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', background: '#FFFAF7' }}>
                        {/* Client card */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                            {clientPhoto
                              ? <img src={clientPhoto} alt={clientName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A' }}>{clientName.charAt(0)}</div>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{clientName}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              {[1,2,3,4,5].map(n => (
                                <svg key={n} width="10" height="10" viewBox="0 0 24 24" fill={avgRating >= n ? '#F59E0B' : 'none'} stroke={avgRating >= n ? '#F59E0B' : '#D4C4B0'} strokeWidth="2">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                              <span style={{ fontSize: 11, color: '#9B7A5A', marginLeft: 2 }}>{avgRating > 0 ? avgRating.toFixed(1) : '–'}</span>
                            </div>
                          </div>
                          <span style={{ background: '#FFF3E0', color: '#E65100', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Em curso</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{job.title}</p>
                        {job.city && <p style={{ fontSize: 13, color: '#7A6048', marginBottom: 10 }}>📍 {job.city}</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            onClick={() => handleMarkCompleteProvider(job)}
                            disabled={!!completingJob || !!cancellingJob}
                            style={{ width: '100%', padding: '10px', borderRadius: 10, background: completingJob === job.id ? '#EDE6DC' : '#1A4DB0', color: completingJob === job.id ? '#9B7A5A' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: completingJob ? 'default' : 'pointer' }}>
                            {completingJob === job.id ? 'A processar…' : '✓ Marcar como concluído'}
                          </button>
                          {cancelConfirmId === job.id ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setCancelConfirmId(null)}
                                style={{ flex: 1, padding: '8px', borderRadius: 9, background: '#EDE6DC', border: 'none', fontSize: 13, fontWeight: 600, color: '#7A6048', cursor: 'pointer' }}>
                                Manter
                              </button>
                              <button onClick={() => handleCancelJob(job)} disabled={!!cancellingJob}
                                style={{ flex: 1, padding: '8px', borderRadius: 9, background: cancellingJob === job.id ? '#EDE6DC' : '#C62828', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: cancellingJob ? 'default' : 'pointer' }}>
                                {cancellingJob === job.id ? 'A anular…' : 'Confirmar anulação'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setCancelConfirmId(job.id)}
                              style={{ width: '100%', padding: '8px', borderRadius: 9, background: 'none', border: '0.5px solid #D4C4B0', fontSize: 13, fontWeight: 600, color: '#9B7A5A', cursor: 'pointer' }}>
                              Anular trabalho
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Trabalhos Perto de Si */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>🔥 Trabalhos perto de si</p>
                  {data.pedidos?.length > 0 && <p style={{ fontSize: 13, color: '#9B7A5A', marginTop: 2 }}>📍 {data.pedidos.length} trabalhos disponíveis</p>}
                </div>
                <Link href="/explorar" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
              </div>
              {data.pedidos?.length > 0 ? data.pedidos.map((pedido: any) => {
                const cat = getCatInfo(pedido.category)
                const isNew = (Date.now() - new Date(pedido.created_at).getTime()) < 3600000
                return (
                  <div key={pedido.id} style={{ border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#FDFAF7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: cat.bg, flexShrink: 0, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
                          {cat.iconImg
                            ? <Image src={cat.iconImg} alt="" fill style={{ objectFit: 'contain', padding: 4 }} unoptimized />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{cat.icon}</div>
                          }
                        </div>
                        <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 9px', fontSize: 13, fontWeight: 700 }}>{cat.label}</span>
                        {isNew && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 9px', fontSize: 13, fontWeight: 700 }}>Novo</span>}
                      </div>
                      {pedido.client && <RequesterCard client={pedido.client} size="sm" />}
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{pedido.title}</p>
                    {pedido.city && <p style={{ fontSize: 13, color: '#7A6048', marginBottom: 9 }}>📍 {pedido.city}{pedido.budget > 0 ? ` · €${pedido.budget}` : ''}</p>}
                    <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 9, display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                      <Link href={`/pedidos/${pedido.id}`} style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>Ver Detalhes</Link>
                      <button onClick={() => setPropostaPedido(pedido)} style={{ padding: '6px 12px', borderRadius: 8, background: '#C85A1A', fontSize: 13, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Send size={11} /> Enviar Proposta
                      </button>
                    </div>
                  </div>
                )
              }) : (
                <p style={{ fontSize: 14, color: '#9B7A5A', textAlign: 'center', padding: '18px 0', fontStyle: 'italic' }}>Sem pedidos recentes na tua zona.</p>
              )}
            </div>

          </div>

          {/* ════════════════════════════════
               COLUNA DIREITA
          ════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Plano Atual */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Plano atual</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: profile?.is_pro ? '#C85A1A' : '#2C1A0E', marginBottom: 8 }}>{profile?.is_pro ? '⭐ Premium' : 'Básico'}</p>
              {[
                profile?.is_pro ? 'Propostas ilimitadas' : 'Até 3 propostas/mês',
                'Mais visibilidade',
                profile?.is_pro ? 'Contacto direto com cliente' : 'Perfil básico',
              ].map(f => <p key={f} style={{ fontSize: 13, color: '#7A6048', marginBottom: 4 }}>✓ {f}</p>)}
              {!profile?.is_pro && (
                <Link href="/precos" style={{ display: 'block', marginTop: 10, padding: '8px', borderRadius: 9, background: 'linear-gradient(135deg,#df6a36,#cb5226)', textAlign: 'center', textDecoration: 'none', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  🚀 Fazer Upgrade
                </Link>
              )}
            </div>

            {/* Os Meus Pontos */}
            <div style={{ background: 'linear-gradient(135deg,#C85A1A,#9B3D10)', borderRadius: 14, padding: '16px 18px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Os teus pontos</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'Lora, serif', marginBottom: 4 }}>
                {data.rewardProfile?.approved_points_balance ?? 0} pts
              </p>
              {(data.rewardProfile?.pending_points_balance ?? 0) > 0 && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>+{data.rewardProfile.pending_points_balance} pontos pendentes</p>
              )}
              <Link href="/recompensas" style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Ver recompensas →
              </Link>
            </div>

            {/* Objetivo do Mês */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <Target size={15} color="#C85A1A" />
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Objetivo do mês</p>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#C85A1A', fontFamily: 'Lora, serif', marginBottom: 2 }}>{completedCount} / {monthGoal}</p>
              <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 8 }}>trabalhos realizados</p>
              <div style={{ height: 8, background: '#F0E8DC', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${goalPct}%`, background: '#C85A1A', borderRadius: 99, transition: 'width 0.5s ease' }} />
              </div>
              <p style={{ fontSize: 13, color: '#7A6048' }}>
                {completedCount >= monthGoal ? '🏆 Objetivo atingido!' : `Faltam ${monthGoal - completedCount} trabalhos para ganhar + visibilidade!`}
              </p>
            </div>

            {/* Clientes Satisfeitos */}
            {data.recentReviews?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Clientes satisfeitos</p>
                  <Link href="/dashboard/perfil" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.recentReviews.slice(0, 2).map((r: any) => (
                    <div key={r.id} style={{ background: '#FAF7F2', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 1, marginBottom: 4 }}>
                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={11} color="#F9AB00" fill="#F9AB00" />)}
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: '#5A3E28', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 4 }}>&ldquo;{r.comment}&rdquo;</p>}
                      <p style={{ fontSize: 12, color: '#9B7A5A', fontWeight: 600 }}>{r.author?.name ?? 'Cliente'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* A Tua Comunidade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>A tua comunidade</p>
                <Link href="/comunidade" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver comunidade →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {data.questions?.slice(0, 3).map((q: any) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, textDecoration: 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{q.title}</p>
                      <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 2 }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight size={13} color="#D4C4B0" />
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Review Modal (prestataire → avalie o cliente) */}
      {reviewClientTarget && (
        <ReviewModal
          pedidoId={reviewClientTarget.job.id}
          pedidoTitle={reviewClientTarget.job.title}
          authorId={profile.id}
          reviewedUserId={reviewClientTarget.job.client_id}
          providerProfile={null}
          providerUser={reviewClientTarget.client ? { name: reviewClientTarget.client.name, profile_photo: reviewClientTarget.client.profile_photo } : null}
          onClose={() => setReviewClientTarget(null)}
          onDone={() => setReviewClientTarget(null)}
        />
      )}

      {/* Proposta Modal */}
      {propostaPedido && (
        <PropostaModal
          externalOpen={true}
          onExternalClose={() => setPropostaPedido(null)}
          pedidoId={propostaPedido.id}
          pedidoTitle={propostaPedido.title}
          pedidoCity={propostaPedido.city}
          pedidoBudget={propostaPedido.budget}
          pedidoDescription={propostaPedido.description}
        />
      )}
    </div>
  )
}
