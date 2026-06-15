'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Plus, Search, ChevronRight, Flame, Users, Lightbulb, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

const TAGS = [
  { slug: 'urgente', label: '⚡ Urgente', bg: '#FFEBEE', color: '#C62828' },
  { slug: 'opiniao', label: '💬 Preciso de opinião', bg: '#E8F0FE', color: '#1A4DB0' },
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  aberta: { label: 'Aberta', bg: '#EAF3DE', color: '#3B6D11' },
  respondida: { label: 'Respondida', bg: '#E8F0FE', color: '#1A4DB0' },
  resolvida: { label: 'Resolvida', bg: '#F0EDE8', color: '#7A6048' },
  em_discussao: { label: 'Em discussão', bg: '#FBF0E8', color: '#C85A1A' },
}

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
}
function getCatInfo(slug: string | null) {
  const n = norm(slug ?? '')
  return (
    CATEGORIES.find(c => c.slug === slug || norm(c.slug) === n) ??
    { icon: '🔧', iconImg: null as string | null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
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

export default function ComunidadePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [isProvider, setIsProvider] = useState(false)
  const [dica, setDica] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('user_profiles').select('is_provider').eq('id', user.id).single()
        setIsProvider(p?.is_provider ?? false)
      }
      fetchQuestions()
      fetchSidebar()
    }
    init()
  }, [activeCategory])

  async function fetchQuestions() {
    setLoading(true)
    let query = supabase
      .from('community_questions')
      .select('id, title, description, category, answers_count, useful_votes_count, views_count, created_at, user_id, image_urls')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (activeCategory !== 'Todos') {
      query = query.eq('category', activeCategory)
    }

    const { data: qs } = await query
    if (!qs) { setLoading(false); return }

    const userIds = Array.from(new Set(qs.map((q: any) => q.user_id)))
    const { data: users } = await supabase.from('user_profiles').select('id, name, profile_photo, is_provider').in('id', userIds as string[])

    const providerUserIds = (users ?? []).filter((u: any) => u.is_provider).map((u: any) => u.id)
    const { data: provProfiles } = providerUserIds.length > 0
      ? await supabase.from('provider_profiles').select('user_id, is_verified, average_rating, reviews_count').in('user_id', providerUserIds as string[])
      : { data: [] }

    const merged = qs.map((q: any) => ({
      ...q,
      user_profiles: users?.find((u: any) => u.id === q.user_id),
      provider_profile: provProfiles?.find((pp: any) => pp.user_id === q.user_id),
    }))

    setQuestions(merged)
    setLoading(false)
  }

  async function fetchSidebar() {
    const today = new Date().toISOString().split('T')[0]
    const [popRes, tipRes] = await Promise.all([
      supabase.from('community_questions').select('id, title, answers_count').eq('is_published', true).order('answers_count', { ascending: false }).limit(5),
      supabase.from('daily_tips').select('id, title, short_description').eq('is_published', true).lte('publish_date', today).order('publish_date', { ascending: false }).limit(1),
    ])
    setPopular(popRes.data ?? [])
    setDica(tipRes.data?.[0] ?? null)

    const { data: topAnswers } = await supabase
      .from('community_answers')
      .select('user_id')
      .eq('is_published', true)
      .limit(50)

    if (topAnswers) {
      const counts: Record<string, number> = {}
      topAnswers.forEach((a: any) => { counts[a.user_id] = (counts[a.user_id] ?? 0) + 1 })
      const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)

      if (topIds.length > 0) {
        const { data: topUsers } = await supabase.from('user_profiles').select('id, name, profile_photo, is_provider').in('id', topIds)
        const provIds = (topUsers ?? []).filter((u: any) => u.is_provider).map((u: any) => u.id)
        const { data: provPros } = provIds.length > 0
          ? await supabase.from('provider_profiles').select('user_id, id, average_rating, service_categories, is_verified').in('user_id', provIds)
          : { data: [] }
        setActiveUsers((topUsers ?? []).map((u: any) => ({
          ...u,
          provider_profile: provPros?.find((pp: any) => pp.user_id === u.id),
          answerCount: counts[u.id] ?? 0,
        })).filter((u: any) => u.is_provider).slice(0, 3))
      }
    }
  }

  const catFilters = ['Todos', ...CATEGORIES.slice(0, 8).map(c => c.slug)]
  const filtered = search
    ? questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
    : questions

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingTop: 24, paddingBottom: 60 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Comunidade</p>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>Pergunta ao Vizinho</h1>
            <p style={{ fontSize: 14, color: '#7A6048' }}>Tira as tuas duvidas sobre a casa com a nossa comunidade.</p>
          </div>
          <Link href="/comunidade/nova"
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#C85A1A', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(200,90,26,0.3)' }}>
            <Plus size={15} />
            Nova pergunta
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={15} color="#9B7A5A" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Pesquisar perguntas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '11px 14px 11px 40px', fontSize: 13, color: '#2C1A0E', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {catFilters.map(slug => {
                const cat = slug === 'Todos' ? { icon: 'star', label: 'Todos', color: '#C85A1A', bg: '#FBF0E8', iconImg: null as string | null } : getCatInfo(slug)
                const isActive = activeCategory === slug
                return (
                  <button key={slug} onClick={() => setActiveCategory(slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, border: isActive ? 'none' : '0.5px solid #EDE6DC', background: isActive ? '#C85A1A' : '#fff', color: isActive ? '#fff' : '#5A3E28', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {cat.iconImg ? (
                      <img src={cat.iconImg} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 14 }}>{slug === 'Todos' ? '✨' : (cat as any).icon}</span>
                    )}
                    {cat.label}
                  </button>
                )
              })}
              {TAGS.map(tag => (
                <button key={tag.slug} onClick={() => {}}
                  style={{ padding: '6px 12px', borderRadius: 99, border: '0.5px solid #EDE6DC', background: tag.bg, color: tag.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {tag.label}
                </button>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #FBF0E8, #fff)', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#C85A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>A forca do vizinho faz a diferenca!</p>
                <p style={{ fontSize: 11, color: '#7A6048' }}>Partilha a tua experiencia e ajuda outros vizinhos da tua regiao.</p>
              </div>
              <Link href="/comunidade/nova" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Participar</Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height: 80, background: '#fff', borderRadius: 12, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}
              </div>
            ) : filtered.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map((q: any) => {
                  const cat = getCatInfo(q.category)
                  const isProviderPost = q.user_profiles?.is_provider
                  const verified = q.provider_profile?.is_verified
                  const status = STATUS_CONFIG['aberta']
                  const ago = Math.round((Date.now() - new Date(q.created_at).getTime()) / 3600000)

                  return (
                    <div key={q.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
                      <Link href={`/comunidade/${q.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', textDecoration: 'none' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {cat.iconImg
                            ? <img src={cat.iconImg} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                            : <span style={{ fontSize: 22 }}>{(cat as any).icon}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 5, lineHeight: 1.3 }}>{q.title}</h3>
                          {q.description && <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{q.description}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Avatar name={q.user_profiles?.name} photo={q.user_profiles?.profile_photo} size={20} />
                              <span style={{ fontSize: 11, color: '#9B7A5A' }}>{q.user_profiles?.name ?? 'Utilizador'}</span>
                            </div>
                            {isProviderPost ? (
                              <span style={{ background: verified ? '#EAF3DE' : '#FBF0E8', color: verified ? '#3B6D11' : '#C85A1A', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
                                {verified ? 'Prestador Verificado' : 'Prestador'}
                              </span>
                            ) : (
                              <span style={{ background: '#E8F0FE', color: '#1A4DB0', borderRadius: 99, padding: '1px 7px', fontSize: 10 }}>Cliente</span>
                            )}
                            <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '1px 7px', fontSize: 10 }}>{cat.label}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9B7A5A' }}>
                              <MessageCircle size={10} /> {q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}
                            </span>
                            {(q.views_count ?? 0) > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9B7A5A' }}>
                                <Eye size={10} /> {q.views_count}
                              </span>
                            )}
                            {q.image_urls?.length > 0 && <span style={{ fontSize: 10, color: '#9B7A5A' }}>foto {q.image_urls.length}</span>}
                            <span style={{ fontSize: 10, color: '#B09070' }}>Ha {ago < 1 ? 'menos de 1h' : ago < 24 ? `${ago}h` : `${Math.round(ago/24)} dias`}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <span style={{ background: status.bg, color: status.color, borderRadius: 99, padding: '3px 9px', fontSize: 11, fontWeight: 600 }}>{status.label}</span>
                          <ChevronRight size={15} color="#D4C4B0" />
                        </div>
                      </Link>
                      {isProviderPost && verified && q.answers_count > 0 && (
                        <div style={{ borderTop: '0.5px solid #EDE6DC', padding: '10px 16px', background: '#FAF7F2', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12 }}>ok</span>
                          </div>
                          <p style={{ fontSize: 11, color: '#3B6D11', fontWeight: 600, flex: 1 }}>Resposta de prestador verificado</p>
                          <Link href={`/comunidade/${q.id}`} style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver resposta</Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
                <MessageCircle size={32} color="#D4C4B0" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhuma pergunta encontrada</p>
                <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 14 }}>Se o primeiro a fazer uma pergunta!</p>
                <Link href="/comunidade/nova" style={{ display: 'inline-block', padding: '9px 20px', borderRadius: 10, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Fazer uma pergunta</Link>
              </div>
            )}

            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px', marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>amor</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>Faz parte da nossa comunidade!</p>
                <p style={{ fontSize: 11, color: '#7A6048' }}>Partilha, pergunta e ajuda outros vizinhos.</p>
              </div>
              <Link href="/comunidade/nova" style={{ padding: '8px 14px', borderRadius: 9, border: '0.5px solid #C85A1A', color: '#C85A1A', textDecoration: 'none', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Saber mais</Link>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Flame size={15} color="#C85A1A" />
                <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Perguntas populares</p>
                <Link href="/comunidade" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, marginLeft: 'auto' }}>Ver todas</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {popular.map((q: any, i: number) => (
                  <Link key={q.id} href={`/comunidade/${q.id}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', textDecoration: 'none' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#D4C4B0', flexShrink: 0, width: 18 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.4, marginBottom: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{q.title}</p>
                      <p style={{ fontSize: 10, color: '#9B7A5A' }}>{q.answers_count} respostas</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {activeUsers.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Profissionais que ajudam</p>
                  <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeUsers.map((p: any) => {
                    const cat = p.provider_profile?.service_categories?.[0] ? getCatInfo(p.provider_profile.service_categories[0]) : null
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar name={p.name} photo={p.profile_photo} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{p.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {p.provider_profile?.is_verified && <span style={{ fontSize: 9, color: '#3B6D11', fontWeight: 600 }}>Verificado</span>}
                            {cat && <span style={{ fontSize: 9, color: cat.color }}>- {cat.label}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {p.provider_profile?.average_rating > 0 && <p style={{ fontSize: 11, fontWeight: 700, color: '#F9AB00' }}>estrela {p.provider_profile.average_rating.toFixed(1)}</p>}
                          <p style={{ fontSize: 10, color: '#9B7A5A' }}>{p.answerCount} respostas</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link href="/explorar" style={{ display: 'block', marginTop: 12, padding: '8px', borderRadius: 9, border: '0.5px solid #EDE6DC', textAlign: 'center', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#5A3E28' }}>
                  Ver todos os profissionais
                </Link>
              </div>
            )}

            {dica && (
              <div style={{ background: '#2C1A0E', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Lightbulb size={15} color="#C85A1A" />
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dica da comunidade</p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>{dica.title}</p>
                {dica.short_description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 8 }}>{dica.short_description}</p>}
                <Link href="/dicas" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver mais dicas</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
