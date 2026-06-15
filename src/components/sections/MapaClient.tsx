'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Star, MapPin, Send, Filter, ChevronRight, Bell, Zap, Clock, Heart, X, Shield, Share2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import RequesterCard from '@/components/ui/RequesterCard'
import PropostaModal from '@/components/ui/PropostaModal'
import TypeBadge from '@/components/ui/TypeBadge'
import { TYPE_COLORS } from '@/lib/profile-utils'
import { CATEGORIES } from '@/types'
import { PORTUGAL_DISTRICTS } from '@/lib/portugal-districts'

// --- Region - Districts mapping -----------------------------------------------
const REGION_MAP: Record<string, string[]> = {
  norte:    ['Braga', 'Porto', 'Vila Real', 'Bragança', 'Viana do Castelo'],
  centro:   ['Aveiro', 'Viseu', 'Guarda', 'Coimbra', 'Castelo Branco', 'Leiria'],
  lisboa:   ['Lisboa', 'Santarém', 'Setúbal'],
  alentejo: ['Portalegre', 'Évora', 'Beja'],
  algarve:  ['Faro'],
}

// District - region
function districtToRegion(id: string): string {
  for (const [region, districts] of Object.entries(REGION_MAP)) {
    if (districts.includes(id)) return region
  }
  return ''
}

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null as string | null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

function Avatar({ name, photo, size = 36 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>
      {photo ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized /> : name?.charAt(0) ?? '?'}
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const mins = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `Há ${mins} min`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `Há ${hrs} hora${hrs > 1 ? 's' : ''}`
  return `Há ${Math.round(hrs / 24)} dias`
}

// -----------------------------------------------------------------------------
// Helpers de localiza--o
// -----------------------------------------------------------------------------
function normLoc(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
function locMatchesDistrict(loc: string, districtId: string): boolean {
  const d = normLoc(districtId)
  const words = loc.split(/[\s,\/\-]+/).filter(Boolean)
  for (let i = 0; i < words.length; i++) {
    if (words[i] === d) return true
    if (i + 1 < words.length && words[i] + ' ' + words[i+1] === d) return true
    if (i + 2 < words.length && words[i] + ' ' + words[i+1] + ' ' + words[i+2] === d) return true
  }
  return false
}

// -----------------------------------------------------------------------------
// VISTA CLIENTE - SVG Portugal + lista prestataires por regi-o
// -----------------------------------------------------------------------------
function MapaClientView() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [allProviders, setAllProviders] = useState<any[]>([])
  const [regionProviders, setRegionProviders] = useState<any[]>([])
  const [otherProviders, setOtherProviders] = useState<any[]>([])
  const [showAllOthers, setShowAllOthers] = useState(false)
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({})
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Carregar contagens por distrito (apenas coluna region, word-boundary match)
  useEffect(() => {
    const load = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase.from('provider_profiles').select('region').eq('is_active', true),
        supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])
      if (count !== null) setTotalCount(count)
      if (!data) return
      const counts: Record<string, number> = {}
      data.forEach((p: any) => {
        if (!p.region) return
        const loc = normLoc(p.region)
        PORTUGAL_DISTRICTS.forEach(d => {
          if (locMatchesDistrict(loc, d.id)) counts[d.id] = (counts[d.id] ?? 0) + 1
        })
      })
      setDistrictCounts(counts)
    }
    load()
  }, [])

  const enrichProviders = useCallback(async (data: any[]) => {
    const userIds = data.map((p: any) => p.user_id).filter(Boolean)
    const { data: users } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', userIds)
      : { data: [] }
    const provIds = data.map((p: any) => p.id)
    const { data: portfolio } = provIds.length > 0
      ? await supabase.from('portfolio_items').select('id, provider_profile_id, photo_url, image').in('provider_profile_id', provIds).limit(200)
      : { data: [] }
    return data.map((p: any) => ({
      ...p,
      user: (users ?? []).find((u: any) => u.id === p.user_id),
      portfolio: (portfolio ?? []).filter((item: any) => item.provider_profile_id === p.id).slice(0, 5),
    }))
  }, [])

  const fetchAllProviders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, service_description, is_verified, is_boosted, is_active')
      .eq('is_active', true)
      .order('is_boosted', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(200)
    if (categoryFilter) {
      const catInfo = CATEGORIES.find(c => c.slug === categoryFilter)
      const catValues = catInfo ? [categoryFilter, catInfo.label] : [categoryFilter]
      query = query.overlaps('service_categories', catValues)
    }
    const { data } = await query
    if (!data) { setLoading(false); return }
    setAllProviders(await enrichProviders(data))
    setLoading(false)
  }, [categoryFilter, enrichProviders])

  const fetchProviders = useCallback(async (districtId: string) => {
    setLoading(true)
    let query = supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, service_description, is_verified, is_boosted, is_active')
      .eq('is_active', true)
      .order('is_boosted', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(200)
    if (categoryFilter) {
      const catInfo = CATEGORIES.find(c => c.slug === categoryFilter)
      const catValues = catInfo ? [categoryFilter, catInfo.label] : [categoryFilter]
      query = query.overlaps('service_categories', catValues)
    }
    const { data } = await query
    if (!data) { setLoading(false); return }
    // Filtrar por distrito - apenas coluna region, word-boundary match
    const inRegion = data.filter((p: any) => p.region && locMatchesDistrict(normLoc(p.region), districtId))
    const outside = data.filter((p: any) => !inRegion.includes(p))
    setRegionProviders(await enrichProviders(inRegion))
    setOtherProviders(await enrichProviders(outside))
    setLoading(false)
  }, [categoryFilter, enrichProviders])

  useEffect(() => {
    if (selectedDistrict) {
      fetchProviders(selectedDistrict)
      setShowAllOthers(false)
    } else {
      setRegionProviders([])
      setOtherProviders([])
      fetchAllProviders()
    }
  }, [selectedDistrict, categoryFilter])

  const activeList = selectedDistrict ? regionProviders : allProviders
  const filtered = searchText
    ? activeList.filter(p => (p.business_name ?? p.user?.name ?? '').toLowerCase().includes(searchText.toLowerCase()))
    : activeList

  const premium = filtered.filter(p => p.is_boosted)
  const regular = filtered.filter(p => !p.is_boosted)

  // Cor do distrito
  function getFill(id: string) {
    if (id === selectedDistrict) return '#C85A1A'
    if (id === hoveredDistrict) return '#A5D6A7'
    const count = districtCounts[id] ?? 0
    if (count > 100) return '#2E7D32'
    if (count > 50) return '#43A047'
    if (count > 20) return '#66BB6A'
    if (count > 5) return '#A5D6A7'
    return '#C8E6C9'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 240px', gap: 20, minHeight: '80vh', alignItems: 'start' }}>

      {/* ── Coluna esquerda: SVG Portugal ── */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Mapa dos Prestadores</h2>
          <p style={{ fontSize: 14, color: '#9B7A5A' }}>Clique numa região para ver os profissionais disponíveis.</p>
        </div>

        {/* SVG */}
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 260 400" style={{ width: '100%', height: 'auto' }}>
            {PORTUGAL_DISTRICTS.map(district => {
              const count = districtCounts[district.id] ?? 0
              const isSelected = selectedDistrict === district.id
              return (
                <g key={district.id}
                  onClick={() => setSelectedDistrict(prev => prev === district.id ? null : district.id)}
                  onMouseEnter={() => setHoveredDistrict(district.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  style={{ cursor: 'pointer' }}>
                  <path
                    d={district.d}
                    fill={getFill(district.id)}
                    stroke="#fff"
                    strokeWidth="1.5"
                    style={{ transition: 'fill 0.15s ease' }}
                  />
                  {/* Label */}
                  <text
                    x={district.labelX}
                    y={district.labelY - 4}
                    textAnchor="middle"
                    style={{ fontSize: 8, fontWeight: 700, fill: isSelected ? '#fff' : '#1B5E20', pointerEvents: 'none', userSelect: 'none' }}>
                    {district.id}
                  </text>
                  {count > 0 && (
                    <text
                      x={district.labelX}
                      y={district.labelY + 6}
                      textAnchor="middle"
                      style={{ fontSize: 7, fill: isSelected ? 'rgba(255,255,255,0.85)' : 'rgba(27,94,32,0.8)', pointerEvents: 'none', userSelect: 'none' }}>
                      {count} prest.
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legenda */}
        <div style={{ background: '#FAF7F2', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#7A6048', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Legenda</p>
          {[
            { color: '#2E7D32', label: '100+ prestadores' },
            { color: '#66BB6A', label: '21–100 prestadores' },
            { color: '#A5D6A7', label: '6–20 prestadores' },
            { color: '#C8E6C9', label: '1–5 prestadores' },
            { color: '#C85A1A', label: 'Selecionado' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#5A3E28' }}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FBF0E8', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', marginBottom: 6 }}>Como funciona?</p>
          {['1. Clique numa região', '2. Explore os especialistas', '3. Contacte e contrate'].map((s, i) => (
            <p key={i} style={{ fontSize: 13, color: '#7A6048', marginBottom: 3 }}>{s}</p>
          ))}
        </div>

      </div>

      {/* ── Coluna direita: Lista prestadores ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {(
          <>
            {/* Header região */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} color="#C85A1A" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E' }}>{selectedDistrict}</h2>
                    <p style={{ fontSize: 14, color: '#9B7A5A' }}>{filtered.length} prestadores disponíveis</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { n: filtered.length, l: 'Prestadores', c: '#C85A1A' },
                    { n: CATEGORIES.length, l: 'Categorias', c: '#1A73E8' },
                    { n: filtered.filter(p => p.average_rating >= 4.5).length, l: 'Top avaliados', c: '#F9AB00' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center', background: '#FAF7F2', borderRadius: 10, padding: '8px 14px' }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: s.c, fontFamily: 'Lora, serif' }}>{s.n}</p>
                      <p style={{ fontSize: 12, color: '#9B7A5A' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search + ordenar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="#9B7A5A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Pesquisar prestadores, serviços..."
                    value={searchText} onChange={e => setSearchText(e.target.value)}
                    style={{ width: '100%', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 12px 9px 36px', fontSize: 15, color: '#2C1A0E', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>



        {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 120, background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}
              </div>
            ) : (
              <>
                {/* Prestadores em destaque */}
                {premium.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 18 }}>⭐</span>
                        <div>
                          <h3 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Prestadores em Destaque</h3>
                          <p style={{ fontSize: 13, color: '#9B7A5A' }}>Profissionais Premium com melhor avaliação e mais procurados na sua região.</p>
                        </div>
                      </div>
                      <Link href="/explorar" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>Ver todos em destaque <ChevronRight size={12} /></Link>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {premium.slice(0, 3).map(p => <ProviderCardPremium key={p.id} p={p} />)}
                    </div>
                  </div>
                )}

                {/* Todos os prestadores */}
                {regular.length > 0 && (
                  <div>
                    <h3 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>
                      {premium.length > 0 ? 'Todos os Prestadores' : `${filtered.length} Prestadores encontrados`}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {regular.map(p => <ProviderCardRegular key={p.id} p={p} />)}
                    </div>
                  </div>
                )}

                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
                    <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum prestador encontrado</p>
                    <p style={{ fontSize: 14, color: '#9B7A5A' }}>Tenta outra categoria ou região.</p>
                  </div>
                )}
              </>
            )}

            {/* Ver mais — prestadores noutras regiões */}
            {selectedDistrict && otherProviders.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
                  <div style={{ flex: 1, height: '0.5px', background: '#EDE6DC' }} />
                  <button onClick={() => setShowAllOthers(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 99, border: '0.5px solid #D4C4B0', background: '#fff', fontSize: 14, fontWeight: 600, color: '#7A6048', cursor: 'pointer' }}>
                    {showAllOthers ? '▲ Ocultar' : `▼ Ver prestadores noutras regiões (${otherProviders.length})`}
                  </button>
                  <div style={{ flex: 1, height: '0.5px', background: '#EDE6DC' }} />
                </div>
                {showAllOthers && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {otherProviders.map(p => <ProviderCardRegular key={p.id} p={p} />)}
                  </div>
                )}
              </div>
            )}

            {/* Banner verificação */}
            {/* Banner verificação */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
                <p style={{ fontSize: 14, color: '#5A3E28' }}>Profissionais verificados e avaliados pela comunidade.</p>
              </div>
              <Link href="/precos" style={{ fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Saiba mais →</Link>
            </div>
          </>
        )}
      </div>

      {/* ── Coluna direita: Categorias ── */}
      <div style={{ position: 'sticky', top: 80 }}>
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 12px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#7A6048', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Filtrar por categoria</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            <button onClick={() => setCategoryFilter('')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${!categoryFilter ? '#C85A1A' : '#EDE6DC'}`, background: !categoryFilter ? '#FBF0E8' : '#fff', cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>🔧</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: !categoryFilter ? '#C85A1A' : '#7A6048', textAlign: 'center', lineHeight: 1.2 }}>Todos</span>
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat.slug} onClick={() => setCategoryFilter(prev => prev === cat.slug ? '' : cat.slug)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${categoryFilter === cat.slug ? cat.color : '#EDE6DC'}`, background: categoryFilter === cat.slug ? cat.bg : '#fff', cursor: 'pointer' }}>
                {cat.iconImg
                  ? <img src={cat.iconImg} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 22 }}>{cat.icon}</span>
                }
                <span style={{ fontSize: 9, fontWeight: 600, color: categoryFilter === cat.slug ? cat.color : '#7A6048', textAlign: 'center', lineHeight: 1.2 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Card Premium
function ProviderCardPremium({ p }: { p: any }) {
  const name = p.business_name ?? p.user?.name ?? 'Prestador'
  const photo = p.user?.profile_photo
  const cat = p.service_categories?.[0] ? getCatInfo(p.service_categories[0]) : null

  return (
    <div style={{ background: '#fff', border: '2px solid #C85A1A', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(135deg,#2C1A0E,#4A2C1A)', padding: '8px 12px', display: 'flex', gap: 5 }}>
        <span style={{ background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>⭐ Premium</span>
        {p.is_verified && <span style={{ background: '#3B6D11', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>✓ Verificado</span>}
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={name} photo={photo} size={44} />
            <TypeBadge providerType={p.provider_type} size={17} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
            {cat && <p style={{ fontSize: 13, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 13, fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 12, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
              {p.company_city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>· {p.company_city}</span>}
            </div>
          </div>
        </div>
        {p.service_description && (
          <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.service_description}</p>
        )}
        {p.portfolio?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, borderRadius: 6, overflow: 'hidden' }}>
            {p.portfolio.slice(0, 5).map((item: any, i: number) => (
              <div key={i} style={{ aspectRatio: '1', background: '#EDE6DC', position: 'relative', overflow: 'hidden' }}>
                {(item.photo_url || item.image) && <Image src={item.photo_url ?? item.image} alt="" fill style={{ objectFit: 'cover' }} unoptimized />}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: 13, color: '#9B7A5A' }}>{p.portfolio?.length ?? 0} trabalhos</span>
          <Link href={`/prestadores/perfil/${p.id}`} style={{ padding: '7px 14px', borderRadius: 9, background: '#C85A1A', textDecoration: 'none', fontSize: 14, fontWeight: 700, color: '#fff' }}>
            Ver perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

// Card Regular
function ProviderCardRegular({ p }: { p: any }) {
  const name = p.business_name ?? p.user?.name ?? 'Prestador'
  const photo = p.user?.profile_photo
  const cat = p.service_categories?.[0] ? getCatInfo(p.service_categories[0]) : null

  return (
    <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={name} photo={photo} size={46} />
        <TypeBadge providerType={p.provider_type} size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
          {p.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>✓ Verificado</span>}
        </div>
        {cat && <p style={{ fontSize: 13, color: cat.color, fontWeight: 600, marginBottom: 2 }}>{cat.icon} {cat.label}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 13, fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 12, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
          {p.company_city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {p.company_city}</span>}
        </div>
      </div>
      {p.portfolio?.length > 0 && (
        <div style={{ display: 'flex', gap: 3 }}>
          {p.portfolio.slice(0, 3).map((item: any, i: number) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 6, overflow: 'hidden', background: '#EDE6DC', flexShrink: 0, position: 'relative' }}>
              {(item.photo_url || item.image) && <Image src={item.photo_url ?? item.image} alt="" fill style={{ objectFit: 'cover' }} unoptimized />}
            </div>
          ))}
        </div>
      )}
      <span style={{ fontSize: 13, color: '#9B7A5A', flexShrink: 0 }}>{p.portfolio?.length ?? 0} trabalhos</span>
      <Link href={`/prestadores/perfil/${p.id}`} style={{ padding: '7px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#5A3E28', flexShrink: 0 }}>
        Ver perfil
      </Link>
    </div>
  )
}

// -----------------------------------------------------------------------------
// -- Leaflet Map - carregado via CDN no cliente ------------------------------
function LeafletProviderMap({
  pedidos,
  userLocation,
}: {
  pedidos: any[]
  userLocation: { lat: number; lng: number; city: string } | null
}) {
  const mapId = 'leaflet-provider-map'

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = () => {
      // Inject Leaflet CSS if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link')
        link.id = 'leaflet-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      const initMap = () => {
        const L = (window as any).L
        if (!L) return

        const container = document.getElementById(mapId)
        if (!container) return

        // Destroy previous map instance if any
        if ((container as any)._leaflet_id) {
          L.DomUtil.get(mapId)._leaflet_id = null
        }
        const existingMap = (window as any).__providerMap
        if (existingMap) {
          try { existingMap.remove() } catch {}
        }

        const center: [number, number] = userLocation
          ? [userLocation.lat, userLocation.lng]
          : [38.7223, -9.1393]

        const map = L.map(mapId, { zoomControl: true, scrollWheelZoom: true })
        ;(window as any).__providerMap = map

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map)

        map.setView(center, 12)

        // Marker de localiza--o do utilizador
        const userIcon = L.divIcon({
          html: '<div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.6)"></div>',
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        L.marker(center, { icon: userIcon }).addTo(map)
          .bindPopup('<b>A minha localização</b>')

        // Markers para cada pedido
        pedidos.forEach((p: any, i: number) => {
          if (!p.latitude || !p.longitude) return
          const isUrgent = (Date.now() - new Date(p.created_at).getTime()) < 7200000
          const color = isUrgent ? '#C62828' : '#C85A1A'
          const pinIcon = L.divIcon({
            html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35);border:2px solid #fff"><span style="transform:rotate(45deg);font-size:13px;font-weight:700">${i + 1}</span></div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          })
          const budget = p.budget > 0 ? `€${p.budget}` : ''
          L.marker([p.latitude, p.longitude], { icon: pinIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:Inter,sans-serif;min-width:160px">
                <p style="font-weight:700;font-size:13px;margin:0 0 4px">${p.title}</p>
                ${p.city ? `<p style="font-size:11px;color:#7A6048;margin:0">📍 ${p.city}</p>` : ''}
                ${budget ? `<p style="font-size:12px;color:#C85A1A;font-weight:700;margin:4px 0 0">${budget}</p>` : ''}
              </div>
            `)
        })
      }

      if ((window as any).L) {
        initMap()
      } else {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = initMap
        document.head.appendChild(script)
      }
    }

    loadLeaflet()

    return () => {
      const existingMap = (window as any).__providerMap
      if (existingMap) {
        try { existingMap.remove() } catch {}
        delete (window as any).__providerMap
      }
    }
  }, [pedidos, userLocation])

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '0.5px solid #EDE6DC' }}>
      <div id={mapId} style={{ height: 520, width: '100%', background: '#E8F0E8' }} />
    </div>
  )
}

// VISTA PRESTADOR - Google Maps + lista pedidos
// -----------------------------------------------------------------------------
function MapaProviderView() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState<25 | 50 | 100>(25)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'distance' | 'price'>('recent')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [notifActive, setNotifActive] = useState(false)
  const [detailPedido, setDetailPedido] = useState<any>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const supabase = createClient()

  // Obter localiza--o do utilizador - sem fallback Lisboa para n-o filtrar injustamente
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('latitude, longitude, city').eq('id', user.id).single()
        if (profile?.latitude && profile?.longitude) {
          setUserLocation({ lat: profile.latitude, lng: profile.longitude, city: profile.city ?? '' })
          setLocationConfirmed(true)
        }
      }
      // Se n-o houver localiza--o confirmada, buscar pedidos sem filtro geogr-fico
      fetchPedidos(null, false)
    }
    init()
  }, [])

  // Re-fetches only when the user manually changes filters (not on location detection)
  useEffect(() => {
    if (locationConfirmed && userLocation) fetchPedidos(userLocation, true)
  }, [radius, categoryFilter, sortBy])

  async function fetchPedidos(loc?: { lat: number; lng: number; city: string } | null, confirmed?: boolean) {
    setLoading(true)
    let query = supabase
      .from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos, latitude, longitude')
      .eq('status', 'open')
      .eq('is_archived', false)
      .limit(30)

    if (categoryFilter) query = query.ilike('category', `%${categoryFilter}%`)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const clientIds = Array.from(new Set(data.map((p: any) => p.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city, average_rating, reviews_count, last_seen').in('id', clientIds as string[])
      : { data: [] }

    // Fetch offers + responders
    const pedidoIds = data.map((p: any) => p.id)
    const { data: offers } = pedidoIds.length > 0
      ? await supabase.from('offers').select('id, service_request_id, provider_id').in('service_request_id', pedidoIds)
      : { data: [] }

    // offers.provider_id = auth.uid() = user_profiles.id (direct lookup)
    const offerUserIds = Array.from(new Set((offers ?? []).map((o: any) => o.provider_id).filter(Boolean)))
    const { data: responderUsers } = offerUserIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', offerUserIds)
      : { data: [] }

    let result = data.map((p: any) => {
      let distanceKm: number | null = null
      // Use the loc param passed in (not the state closure) to avoid stale value bugs
      if (loc && p.latitude && p.longitude) {
        const R = 6371
        const dLat = (p.latitude - loc.lat) * Math.PI / 180
        const dLng = (p.longitude - loc.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(loc.lat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }
      const pedidoOffers = (offers ?? []).filter((o: any) => o.service_request_id === p.id)
      const offerProviders = pedidoOffers.map((o: any) => {
        const user = responderUsers?.find((u: any) => u.id === o.provider_id) ?? null
        return { ...o, user }
      })
      return { ...p, client: clients?.find((c: any) => c.id === p.client_id), distanceKm, offerProviders }
    })

    // Filtrar por raio - apenas quando a localiza--o est- confirmada e foi passada explicitamente
    if (confirmed && loc) {
      result = result.filter(p => !p.distanceKm || p.distanceKm <= radius)
    }

    // Filtrar urgentes
    if (urgentOnly) {
      result = result.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 7200000)
    }

    // Ordenar
    if (sortBy === 'distance') result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    else if (sortBy === 'price') result.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setPedidos(result)
    setLoading(false)
  }

  const urgentCount = pedidos.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 7200000).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header filtros ── */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pedidos perto de si</h1>
            <p style={{ fontSize: 14, color: '#9B7A5A' }}>Encontre pedidos de clientes na sua área e envie a sua proposta.</p>
          </div>
        </div>

        {/* Filtros linha 1: Raio + categoria + urgentes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {/* Raio */}
          <div style={{ display: 'flex', gap: 4, background: '#FAF7F2', borderRadius: 10, padding: 3 }}>
            {([25, 50, 100] as const).map(r => (
              <button key={r} onClick={() => setRadius(r)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: radius === r ? '#C85A1A' : 'transparent', color: radius === r ? '#fff' : '#5A3E28', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {r} km
              </button>
            ))}
          </div>

          {/* Categoria */}
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 14, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
          </select>

          {/* Urgentes toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, background: urgentOnly ? '#FFEBEE' : '#FAF7F2', border: '0.5px solid #EDE6DC' }}>
            <input type="checkbox" checked={urgentOnly} onChange={e => setUrgentOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
            <Zap size={13} color={urgentOnly ? '#C62828' : '#9B7A5A'} />
            <span style={{ fontSize: 14, fontWeight: 600, color: urgentOnly ? '#C62828' : '#7A6048' }}>Ver apenas urgentes</span>
          </label>

          {/* Ordenar */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 14, color: '#7A6048', outline: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
            <option value="recent">Mais recentes</option>
            <option value="distance">Mais próximos</option>
            <option value="price">Maior orçamento</option>
          </select>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { icon: '📋', value: pedidos.length, label: 'Pedidos encontrados' },
            { icon: '⚡', value: urgentCount, label: 'Urgentes' },
            { icon: '📍', value: userLocation?.city ?? 'Lisboa', label: 'A sua localização' },
            { icon: '📏', value: `${radius} km`, label: 'Raio definido' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#FAF7F2', borderRadius: 10 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: '#9B7A5A' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid: Mapa + Lista ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Real Leaflet/OSM Map */}
        <div style={{ position: 'sticky', top: 90 }}>
          <LeafletProviderMap pedidos={pedidos} userLocation={userLocation} />

          {/* Dica */}
          <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 12, padding: '12px 16px', marginTop: 10, display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2E7D32', marginBottom: 2 }}>Dica para receber mais pedidos</p>
              <p style={{ fontSize: 15, color: '#3B6D11', lineHeight: 1.5 }}>Mantém o teu perfil atualizado e as tuas categorias ativas para aparecer em mais pesquisas.</p>
            </div>
            <ChevronRight size={16} color="#3B6D11" style={{ flexShrink: 0, marginTop: 6 }} />
          </div>
        </div>

          {/* Right column - list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {loading ? (
            <>{[1, 2, 3, 4].map(i => <div key={i} style={{ height: 130, background: '#fff', borderRadius: 12, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}</>
          ) : pedidos.length > 0 ? pedidos.map((pedido: any, idx: number) => {
            const cat = getCatInfo(pedido.category)
            const isUrgent = (Date.now() - new Date(pedido.created_at).getTime()) < 7200000
            const hasBudget = pedido.budget > 0
            const dist = pedido.distanceKm

            return (
              <div key={pedido.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 12, padding: '14px 16px' }}>
                  {/* Número + Foto */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 70, height: 70, borderRadius: 10, overflow: 'hidden', background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {pedido.photos?.[0]
                        ? <Image src={pedido.photos[0]} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                        : <span style={{ fontSize: 28 }}>{cat.icon}</span>
                      }
                    </div>
                    {/* Número do pin */}
                    <div style={{ position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: '50%', background: isUrgent ? '#C62828' : '#C85A1A', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {isUrgent && (
                            <span style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 99, padding: '2px 8px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Zap size={11} color="#C62828" fill="#C62828" /> Urgente
                            </span>
                          )}
                          <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{cat.label}</span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                          {pedido.title}
                        </h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {dist && <span style={{ fontSize: 13, color: '#7A6048' }}>{dist.toFixed(1)} km de si</span>}
                          {pedido.city && <span style={{ fontSize: 13, color: '#7A6048' }}>• {pedido.city}</span>}
                          <span style={{ fontSize: 13, color: '#B09070' }}>{timeAgo(pedido.created_at)}</span>
                        </div>
                      </div>
                      {/* Orçamento + favorito */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginBottom: 4, display: 'block', marginLeft: 'auto' }}>
                          <Heart size={16} color="#D4C4B0" />
                        </button>
                        {hasBudget && (
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: '#C85A1A', lineHeight: 1.2 }}>
                              {`€${pedido.budget}`}
                            </p>
                            <p style={{ fontSize: 12, color: '#9B7A5A' }}>Orçamento estimado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                {pedido.client && (
                  <div style={{ padding: '0 16px 12px' }}>
                    <RequesterCard client={pedido.client} size="sm" />
                  </div>
                )}

                {/* Botões */}
                <div style={{ borderTop: '0.5px solid #F0E8DC', padding: '10px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FDFAF7' }}>
                  <button
                    onClick={() => setDetailPedido(pedido)}
                    style={{ padding: '7px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 14, color: '#5A3E28', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                    Ver detalhes
                  </button>
                  <Link href={`/pedidos/${pedido.id}/proposta`}
                    style={{ padding: '7px 14px', borderRadius: 9, background: '#C85A1A', fontSize: 14, color: '#fff', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(200,90,26,0.3)' }}>
                    <Send size={12} /> Enviar proposta
                  </Link>
                </div>
              </div>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📋</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum pedido encontrado</p>
              <p style={{ fontSize: 14, color: '#9B7A5A' }}>Tenta aumentar o raio ou alterar os filtros.</p>
            </div>
          )}

          {/* Banner notificações */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="#C85A1A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Ative as notificações e seja o primeiro a responder</p>
                <p style={{ fontSize: 13, color: '#9B7A5A' }}>Seja notificado quando surgirem novos pedidos na sua área.</p>
              </div>
            </div>
            <button
              onClick={() => setNotifActive(v => !v)}
              style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${notifActive ? '#3B6D11' : '#C85A1A'}`, background: notifActive ? '#EAF3DE' : '#fff', fontSize: 14, fontWeight: 600, color: notifActive ? '#3B6D11' : '#C85A1A', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {notifActive ? '✓ Ativado' : 'Ativar notificações'}
            </button>
          </div>

          </div>
        </div>
      {/* Lightbox */}
      {lightboxUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 8 }}>
            <X size={20} color="#fff" />
          </button>
        </div>
      )}
      {detailPedido && (() => {
        const dcat = getCatInfo(detailPedido.category)
        const handleShare = () => {
          const url = `${window.location.origin}/pedidos/${detailPedido.id}`
          if (navigator.share) navigator.share({ title: detailPedido.title, url }).catch(() => {})
          else navigator.clipboard.writeText(url).then(() => alert('Link copiado!')).catch(() => {})
        }
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setDetailPedido(null)}>
            <div style={{ background: '#fff', borderRadius: 22, maxWidth: 590, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '0.5px solid #F0E8DC', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {dcat && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: dcat.bg, color: dcat.color, borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        {dcat.iconImg ? <img src={dcat.iconImg} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" /> : null}
                        {dcat.label}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 21, fontWeight: 700, color: '#2C1A0E', margin: 0, lineHeight: 1.25 }}>{detailPedido.title}</h2>
                  </div>
                  <button onClick={() => setDetailPedido(null)} style={{ background: '#FAF7F2', border: 'none', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <X size={16} color="#9B7A5A" />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  {detailPedido.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#7A6048' }}><MapPin size={12} color="#C85A1A" /> {detailPedido.city}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}><Clock size={12} color="#9B7A5A" /> {timeAgo(detailPedido.created_at)}</span>
                  {detailPedido.photos?.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}><Camera size={12} color="#9B7A5A" /> {detailPedido.photos.length} foto{detailPedido.photos.length > 1 ? 's' : ''}</span>}
                  {detailPedido.budget > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#2E7D32', background: '#F0FAF0', borderRadius: 6, padding: '2px 8px' }}>€ {detailPedido.budget}</span>}
                </div>
              </div>
              <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {detailPedido.photos?.length > 0 ? (
                  <div>
                    <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', position: 'relative', cursor: 'zoom-in' }} onClick={() => setLightboxUrl(detailPedido.photos[0])}>
                      <Image src={detailPedido.photos[0]} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    {detailPedido.photos.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        {(detailPedido.photos as string[]).slice(1).map((url: string, i: number) => (
                          <div key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'zoom-in', flexShrink: 0 }} onClick={() => setLightboxUrl(url)}>
                            <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, background: dcat?.bg ?? '#FAF7F2', border: '0.5px solid #EDE6DC', height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {dcat?.iconImg ? <img src={dcat.iconImg} style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.5 }} alt="" /> : <Camera size={32} color={dcat?.color ?? '#9B7A5A'} style={{ opacity: 0.4 }} />}
                    <p style={{ fontSize: 13, color: '#9B7A5A', margin: 0 }}>Sem fotografias adicionadas</p>
                  </div>
                )}
                {detailPedido.description && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Descricao do pedido</p>
                    <p style={{ fontSize: 15, color: '#5A3E28', lineHeight: 1.7, margin: 0 }}>{detailPedido.description}</p>
                  </div>
                )}
                {detailPedido.offerProviders?.some((op: any) => op.user) && (
                  <div style={{ background: '#FAF7F2', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex' }}>
                      {detailPedido.offerProviders.filter((op: any) => op.user).slice(0, 3).map((op: any, idx: number) => (
                        <div key={op.id} style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: '#FBF0E8', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#C85A1A', border: '2.5px solid #FAF7F2', marginLeft: idx === 0 ? 0 : -10, zIndex: 3 - idx }}>
                          {op.user.profile_photo
                            ? <Image src={op.user.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                            : (op.user.name?.charAt(0) ?? '?')
                          }
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#5A3E28', margin: 0 }}>Prestadores que ja responderam, e voce?</p>
                  </div>
                )}
                <div style={{ background: '#F0FFF4', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', border: '0.5px solid #BBF7D0' }}>
                  <Shield size={16} color="#166534" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: '0 0 3px' }}>Comunidade de confianca</p>
                    <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5, margin: 0 }}>Consulte sempre o perfil, as avaliacoes e a experiencia antes de aceitar um trabalho.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleShare} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '0.5px solid #D4C4B0', background: '#fff', fontSize: 14, color: '#5A3E28', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Share2 size={14} /> Partilhar
                  </button>
                  <div style={{ flex: 2 }} onClick={() => setDetailPedido(null)}>
                    <PropostaModal
                      pedidoId={detailPedido.id}
                      pedidoTitle={detailPedido.title}
                      pedidoCity={detailPedido.city}
                      pedidoBudget={detailPedido.budget}
                      pedidoDescription={detailPedido.description}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// -----------------------------------------------------------------------------
// COMPONENTE PRINCIPAL

export default function MapaClient({ isProvider: isProviderProp }: { isProvider?: boolean }) {
  const [isProvider, setIsProvider] = useState<boolean | null>(isProviderProp ?? null)
  const supabase = createClient()

  useEffect(() => {
    if (isProviderProp !== undefined) { setIsProvider(isProviderProp); return }
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsProvider(false); return }
      const { data: p } = await supabase.from('user_profiles').select('is_provider').eq('id', user.id).single()
      setIsProvider(p?.is_provider ?? false)
    })
  }, [isProviderProp])

  if (isProvider === null) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 20 }}>
        {isProvider ? <MapaProviderView /> : <MapaClientView />}
      </div>
    </div>
  )
}
