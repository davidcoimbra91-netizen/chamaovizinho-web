'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Star, MapPin, Send, Filter, ChevronRight, Bell, Zap, Clock, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { PORTUGAL_DISTRICTS } from '@/lib/portugal-districts'

// ─── Region → Districts mapping ───────────────────────────────────────────────
const REGION_MAP: Record<string, string[]> = {
  norte:    ['Braga', 'Porto', 'Vila Real', 'Bragança', 'Viana do Castelo'],
  centro:   ['Aveiro', 'Viseu', 'Guarda', 'Coimbra', 'Castelo Branco', 'Leiria'],
  lisboa:   ['Lisboa', 'Santarém', 'Setúbal'],
  alentejo: ['Portalegre', 'Évora', 'Beja'],
  algarve:  ['Faro'],
}

// District → region
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

// ─────────────────────────────────────────────────────────────────────────────
// VISTA CLIENTE — SVG Portugal + lista prestataires por região
// ─────────────────────────────────────────────────────────────────────────────
function MapaClientView() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [providers, setProviders] = useState<any[]>([])
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Carregar contagens por distrito
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('provider_profiles').select('region, company_city').eq('is_active', true)
      if (!data) return
      const counts: Record<string, number> = {}
      data.forEach((p: any) => {
        const loc = (p.region ?? p.company_city ?? '').toLowerCase()
        PORTUGAL_DISTRICTS.forEach(d => {
          if (loc.includes(d.id.toLowerCase())) {
            counts[d.id] = (counts[d.id] ?? 0) + 1
          }
        })
      })
      setDistrictCounts(counts)
    }
    load()
  }, [])

  const fetchProviders = useCallback(async (districtId: string) => {
    setLoading(true)
    const region = districtToRegion(districtId)
    const regionDistricts = REGION_MAP[region] ?? [districtId]

    let query = supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, is_verified, is_boosted, is_active')
      .eq('is_active', true)
      .order('is_boosted', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(30)

    if (categoryFilter) query = query.overlaps('service_categories', [categoryFilter])

    const { data } = await query
    if (!data) { setLoading(false); return }

    // Filtrar por distrito/região
    const filtered = data.filter((p: any) => {
      const loc = (p.region ?? p.company_city ?? '').toLowerCase()
      return regionDistricts.some(d => loc.includes(d.toLowerCase()))
    })

    const userIds = filtered.map((p: any) => p.user_id).filter(Boolean)
    const { data: users } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', userIds)
      : { data: [] }

    const provIds = filtered.map((p: any) => p.id)
    const { data: portfolio } = provIds.length > 0
      ? await supabase.from('portfolio_items').select('id, provider_profile_id, photo_url, image').in('provider_profile_id', provIds).limit(60)
      : { data: [] }

    setProviders(filtered.map((p: any) => ({
      ...p,
      user: users?.find((u: any) => u.id === p.user_id),
      portfolio: (portfolio ?? []).filter((item: any) => item.provider_profile_id === p.id).slice(0, 5),
    })))
    setLoading(false)
  }, [categoryFilter])

  useEffect(() => {
    if (selectedDistrict) fetchProviders(selectedDistrict)
    else setProviders([])
  }, [selectedDistrict, categoryFilter])

  const filtered = searchText
    ? providers.filter(p => (p.business_name ?? p.user?.name ?? '').toLowerCase().includes(searchText.toLowerCase()))
    : providers

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
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, minHeight: '80vh' }}>

      {/* ── Coluna esquerda: SVG Portugal ── */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Mapa dos Prestadores</h2>
          <p style={{ fontSize: 12, color: '#9B7A5A' }}>Clique numa região para ver os profissionais disponíveis.</p>
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
          <p style={{ fontSize: 10, fontWeight: 700, color: '#7A6048', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Legenda</p>
          {[
            { color: '#2E7D32', label: '100+ prestadores' },
            { color: '#66BB6A', label: '21–100 prestadores' },
            { color: '#A5D6A7', label: '6–20 prestadores' },
            { color: '#C8E6C9', label: '1–5 prestadores' },
            { color: '#C85A1A', label: 'Selecionado' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#5A3E28' }}>{l.label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FBF0E8', borderRadius: 10, padding: '10px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', marginBottom: 6 }}>Como funciona?</p>
          {['1. Clique numa região', '2. Explore os especialistas', '3. Contacte e contrate'].map((s, i) => (
            <p key={i} style={{ fontSize: 11, color: '#7A6048', marginBottom: 3 }}>{s}</p>
          ))}
        </div>

        <div style={{ padding: '10px 12px', background: '#FAF7F2', borderRadius: 10 }}>
          <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.5 }}>
            Mais de <strong style={{ color: '#C85A1A' }}>5.000 profissionais</strong> em todo o país prontos para ajudar.
          </p>
        </div>
      </div>

      {/* ── Coluna direita: Lista prestadores ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selectedDistrict ? (
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
                    <p style={{ fontSize: 12, color: '#9B7A5A' }}>{filtered.length} prestadores disponíveis</p>
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
                      <p style={{ fontSize: 10, color: '#9B7A5A' }}>{s.l}</p>
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
                    style={{ width: '100%', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 12px 9px 36px', fontSize: 13, color: '#2C1A0E', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }} />
                </div>
                <select onChange={e => setCategoryFilter(e.target.value)} value={categoryFilter}
                  style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', outline: 'none', cursor: 'pointer', minWidth: 160 }}>
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              {/* Chips categorias */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setCategoryFilter('')}
                  style={{ padding: '5px 12px', borderRadius: 99, border: 'none', background: !categoryFilter ? '#C85A1A' : '#FAF7F2', color: !categoryFilter ? '#fff' : '#5A3E28', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Todas
                </button>
                {CATEGORIES.slice(0, 7).map(cat => (
                  <button key={cat.slug} onClick={() => setCategoryFilter(cat.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, border: 'none', background: categoryFilter === cat.slug ? cat.color : '#FAF7F2', color: categoryFilter === cat.slug ? '#fff' : '#5A3E28', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {cat.iconImg ? <img src={cat.iconImg} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> : <span style={{ fontSize: 12 }}>{cat.icon}</span>}
                    {cat.label}
                  </button>
                ))}
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
                          <p style={{ fontSize: 11, color: '#9B7A5A' }}>Profissionais Premium com melhor avaliação e mais procurados na sua região.</p>
                        </div>
                      </div>
                      <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>Ver todos em destaque <ChevronRight size={12} /></Link>
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
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum prestador encontrado</p>
                    <p style={{ fontSize: 12, color: '#9B7A5A' }}>Tenta outra categoria ou região.</p>
                  </div>
                )}
              </>
            )}

            {/* Banner verificação */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
                <p style={{ fontSize: 12, color: '#5A3E28' }}>Profissionais verificados e avaliados pela comunidade.</p>
              </div>
              <Link href="/precos" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Saiba mais →</Link>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff', borderRadius: 16, border: '0.5px solid #EDE6DC', minHeight: 400 }}>
            <div style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🗺️</div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Selecione uma região</p>
              <p style={{ fontSize: 13, color: '#9B7A5A', maxWidth: 280, margin: '0 auto' }}>Clique num distrito do mapa para ver os profissionais disponíveis na sua área.</p>
            </div>
          </div>
        )}
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
        <span style={{ background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>⭐ Premium</span>
        {p.is_verified && <span style={{ background: '#3B6D11', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>✓ Verificado</span>}
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={name} photo={photo} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
            {cat && <p style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 10, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
              {p.company_city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {p.company_city}</span>}
            </div>
          </div>
        </div>
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
          <span style={{ fontSize: 11, color: '#9B7A5A' }}>{p.portfolio?.length ?? 0} trabalhos</span>
          <Link href={`/prestadores/perfil/${p.id}`} style={{ padding: '7px 14px', borderRadius: 9, background: '#C85A1A', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#fff' }}>
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
      <Avatar name={name} photo={photo} size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
          {p.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>✓ Verificado</span>}
        </div>
        {cat && <p style={{ fontSize: 11, color: cat.color, fontWeight: 600, marginBottom: 2 }}>{cat.icon} {cat.label}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600 }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 10, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
          {p.company_city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>📍 {p.company_city}</span>}
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
      <span style={{ fontSize: 11, color: '#9B7A5A', flexShrink: 0 }}>{p.portfolio?.length ?? 0} trabalhos</span>
      <Link href={`/prestadores/perfil/${p.id}`} style={{ padding: '7px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#5A3E28', flexShrink: 0 }}>
        Ver perfil
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VISTA PRESTADOR — Google Maps + lista pedidos
// ─────────────────────────────────────────────────────────────────────────────
function MapaProviderView() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState<25 | 50 | 100>(25)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'distance' | 'price'>('recent')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null)
  const [notifActive, setNotifActive] = useState(false)
  const mapRef = useRef<HTMLIFrameElement>(null)
  const supabase = createClient()

  // Obter localização do utilizador
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('user_profiles').select('latitude, longitude, city').eq('id', user.id).single()
        if (profile?.latitude && profile?.longitude) {
          setUserLocation({ lat: profile.latitude, lng: profile.longitude, city: profile.city ?? 'Lisboa' })
        } else {
          // Default Lisboa
          setUserLocation({ lat: 38.7223, lng: -9.1393, city: 'Lisboa' })
        }
      } else {
        setUserLocation({ lat: 38.7223, lng: -9.1393, city: 'Lisboa' })
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (userLocation) fetchPedidos()
  }, [userLocation, radius, categoryFilter, sortBy])

  async function fetchPedidos() {
    setLoading(true)
    let query = supabase
      .from('service_requests')
      .select('id, title, description, category, city, status, budget, budget_min, budget_max, created_at, client_id, photos, latitude, longitude')
      .eq('status', 'open')
      .eq('is_archived', false)
      .limit(30)

    if (categoryFilter) query = query.ilike('category', `%${categoryFilter}%`)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const clientIds = Array.from(new Set(data.map((p: any) => p.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', clientIds as string[])
      : { data: [] }

    let result = data.map((p: any) => {
      let distanceKm: number | null = null
      if (userLocation && p.latitude && p.longitude) {
        const R = 6371
        const dLat = (p.latitude - userLocation.lat) * Math.PI / 180
        const dLng = (p.longitude - userLocation.lng) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      }
      return { ...p, client: clients?.find((c: any) => c.id === p.client_id), distanceKm }
    })

    // Filtrar por raio
    result = result.filter(p => !p.distanceKm || p.distanceKm <= radius)

    // Filtrar urgentes
    if (urgentOnly) {
      result = result.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 7200000)
    }

    // Ordenar
    if (sortBy === 'distance') result.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    else if (sortBy === 'price') result.sort((a, b) => (b.budget_max ?? b.budget ?? 0) - (a.budget_max ?? a.budget ?? 0))
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setPedidos(result)
    setLoading(false)
  }

  const urgentCount = pedidos.filter(p => (Date.now() - new Date(p.created_at).getTime()) < 7200000).length

  // Google Maps embed URL com marcadores
  const mapPins = pedidos.slice(0, 20).filter(p => p.latitude && p.longitude)
  const center = userLocation ? `${userLocation.lat},${userLocation.lng}` : '38.7223,-9.1393'
  const mapUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=services+near+${center}&zoom=11&center=${center}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header filtros ── */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pedidos perto de si</h1>
            <p style={{ fontSize: 12, color: '#9B7A5A' }}>Encontre pedidos de clientes na sua área e envie a sua proposta.</p>
          </div>
        </div>

        {/* Filtros linha 1: Raio + categoria + urgentes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {/* Raio */}
          <div style={{ display: 'flex', gap: 4, background: '#FAF7F2', borderRadius: 10, padding: 3 }}>
            {([25, 50, 100] as const).map(r => (
              <button key={r} onClick={() => setRadius(r)}
                style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: radius === r ? '#C85A1A' : 'transparent', color: radius === r ? '#fff' : '#5A3E28', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {r} km
              </button>
            ))}
          </div>

          {/* Categoria */}
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
          </select>

          {/* Urgentes toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, background: urgentOnly ? '#FFEBEE' : '#FAF7F2', border: '0.5px solid #EDE6DC' }}>
            <input type="checkbox" checked={urgentOnly} onChange={e => setUrgentOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
            <Zap size={13} color={urgentOnly ? '#C62828' : '#9B7A5A'} />
            <span style={{ fontSize: 12, fontWeight: 600, color: urgentOnly ? '#C62828' : '#7A6048' }}>Ver apenas urgentes</span>
          </label>

          {/* Ordenar */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', outline: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
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
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#9B7A5A' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid: Mapa + Lista ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Google Maps */}
        <div style={{ position: 'sticky', top: 90 }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '0.5px solid #EDE6DC', background: '#E8E8E8', position: 'relative' }}>
            {/* Mapa placeholder realista com pins */}
            <div style={{ height: 580, background: '#E8F0E8', position: 'relative', overflow: 'hidden' }}>
              {/* Background Google Maps style */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E8F0E0 0%, #D4E8D0 30%, #E0ECD8 60%, #C8E0C8 100%)' }} />

              {/* Ruas simuladas */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }} viewBox="0 0 400 580">
                <line x1="200" y1="0" x2="200" y2="580" stroke="#C8D8C0" strokeWidth="3" />
                <line x1="0" y1="290" x2="400" y2="290" stroke="#C8D8C0" strokeWidth="3" />
                <line x1="100" y1="0" x2="150" y2="580" stroke="#D8E8D0" strokeWidth="1.5" />
                <line x1="300" y1="0" x2="250" y2="580" stroke="#D8E8D0" strokeWidth="1.5" />
                <line x1="0" y1="150" x2="400" y2="200" stroke="#D8E8D0" strokeWidth="1.5" />
                <line x1="0" y1="400" x2="400" y2="430" stroke="#D8E8D0" strokeWidth="1.5" />
                {/* Rio */}
                <path d="M 0,380 Q 100,360 180,380 Q 280,400 400,370" fill="none" stroke="#B8D0F0" strokeWidth="8" opacity="0.6" />
              </svg>

              {/* Marcador da localização atual */}
              <div style={{ position: 'absolute', left: '45%', top: '48%', transform: 'translate(-50%, -50%)' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#4285F4', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(66,133,244,0.5)' }} />
                <div style={{ position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(66,133,244,0.2)', animation: 'pulse 2s infinite' }} />
              </div>

              {/* Pins pedidos */}
              {pedidos.slice(0, 8).map((p, i) => {
                const isUrgent = (Date.now() - new Date(p.created_at).getTime()) < 7200000
                // Distribuir pins aleatoriamente mas deterministicamente
                const seed = p.id.charCodeAt(0) + p.id.charCodeAt(1)
                const x = 15 + ((seed * 37) % 70)
                const y = 10 + ((seed * 53) % 75)
                return (
                  <div key={p.id} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)', zIndex: 10 }}>
                    <div style={{
                      background: isUrgent ? '#C62828' : '#C85A1A',
                      color: '#fff',
                      borderRadius: '50% 50% 50% 0',
                      transform: 'rotate(-45deg)',
                      width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                    }}>
                      <span style={{ transform: 'rotate(45deg)', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `8px solid ${isUrgent ? '#C62828' : '#C85A1A'}`, margin: '-1px auto 0' }} />
                  </div>
                )
              })}

              {/* Controlos mapa */}
              <div style={{ position: 'absolute', bottom: 16, right: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button style={{ width: 32, height: 32, background: '#fff', border: '0.5px solid #D4D4D4', borderRadius: '4px 4px 0 0', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>+</button>
                <button style={{ width: 32, height: 32, background: '#fff', border: '0.5px solid #D4D4D4', borderRadius: '0 0 4px 4px', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>−</button>
              </div>

              {/* Botões Mapa/Satélite */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                <button style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, background: '#fff', border: 'none', cursor: 'pointer', color: '#2C1A0E' }}>Mapa</button>
                <button style={{ padding: '6px 12px', fontSize: 11, background: '#FAF7F2', border: 'none', cursor: 'pointer', color: '#7A6048' }}>Satélite</button>
              </div>

              {/* Badge A minha localização */}
              <div style={{ position: 'absolute', top: 12, left: 12, background: '#fff', borderRadius: 20, padding: '6px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4285F4' }} />
                A minha localização
              </div>
            </div>
          </div>

          {/* Dica */}
          <div style={{ background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 12, padding: '12px 16px', marginTop: 10, display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2E7D32', marginBottom: 2 }}>Dica para receber mais pedidos</p>
              <p style={{ fontSize: 11, color: '#3B6D11', lineHeight: 1.5 }}>Mantém o teu perfil atualizado e as tuas categorias ativas para aparecer em mais pesquisas.</p>
            </div>
            <ChevronRight size={16} color="#3B6D11" style={{ flexShrink: 0, marginTop: 6 }} />
          </div>
        </div>

        {/* Lista de pedidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{pedidos.length} pedidos encontrados</p>
          </div>

          {loading ? (
            <>{[1, 2, 3, 4].map(i => <div key={i} style={{ height: 130, background: '#fff', borderRadius: 12, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}</>
          ) : pedidos.length > 0 ? pedidos.map((pedido: any, idx: number) => {
            const cat = getCatInfo(pedido.category)
            const isUrgent = (Date.now() - new Date(pedido.created_at).getTime()) < 7200000
            const hasBudget = pedido.budget_min > 0 || pedido.budget_max > 0 || pedido.budget > 0
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
                    <div style={{ position: 'absolute', top: -6, left: -6, width: 22, height: 22, borderRadius: '50%', background: isUrgent ? '#C62828' : '#C85A1A', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                      {idx + 1}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {isUrgent && (
                            <span style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Zap size={11} color="#C62828" fill="#C62828" /> Urgente
                            </span>
                          )}
                          <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{cat.label}</span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                          {pedido.title}
                        </h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {dist && <span style={{ fontSize: 11, color: '#7A6048' }}>{dist.toFixed(1)} km de si</span>}
                          {pedido.city && <span style={{ fontSize: 11, color: '#7A6048' }}>• {pedido.city}</span>}
                          <span style={{ fontSize: 11, color: '#B09070' }}>{timeAgo(pedido.created_at)}</span>
                        </div>
                      </div>
                      {/* Orçamento + favorito */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginBottom: 4, display: 'block', marginLeft: 'auto' }}>
                          <Heart size={16} color="#D4C4B0" />
                        </button>
                        {hasBudget && (
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', lineHeight: 1.2 }}>
                              {pedido.budget_min && pedido.budget_max
                                ? `€${pedido.budget_min} - €${pedido.budget_max}`
                                : `€${pedido.budget}`}
                            </p>
                            <p style={{ fontSize: 10, color: '#9B7A5A' }}>Orçamento estimado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div style={{ borderTop: '0.5px solid #F0E8DC', padding: '10px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end', background: '#FDFAF7' }}>
                  <Link href={`/pedidos/${pedido.id}`}
                    style={{ padding: '7px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                    Ver detalhes
                  </Link>
                  <Link href={`/pedidos/${pedido.id}/proposta`}
                    style={{ padding: '7px 14px', borderRadius: 9, background: '#C85A1A', fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(200,90,26,0.3)' }}>
                    <Send size={12} /> Enviar proposta
                  </Link>
                </div>
              </div>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
              <p style={{ fontSize: 32, marginBottom: 10 }}>📋</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum pedido encontrado</p>
              <p style={{ fontSize: 12, color: '#9B7A5A' }}>Tenta aumentar o raio ou alterar os filtros.</p>
            </div>
          )}

          {/* Banner notificações */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={16} color="#C85A1A" />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E' }}>Ative as notificações e seja o primeiro a responder</p>
                <p style={{ fontSize: 11, color: '#9B7A5A' }}>Seja notificado quando surgirem novos pedidos na sua área.</p>
              </div>
            </div>
            <button
              onClick={() => setNotifActive(v => !v)}
              style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${notifActive ? '#3B6D11' : '#C85A1A'}`, background: notifActive ? '#EAF3DE' : '#fff', fontSize: 12, fontWeight: 600, color: notifActive ? '#3B6D11' : '#C85A1A', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {notifActive ? '✓ Ativado' : 'Ativar notificações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function MapaClient({ isProvider }: { isProvider: boolean }) {
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Banner header */}
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {isProvider ? 'Pedidos perto de si' : 'Mapa dos Prestadores'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {isProvider ? 'Encontre pedidos de clientes na sua área e envie a sua proposta.' : 'Explore profissionais de confiança por região.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isProvider ? <MapaProviderView /> : <MapaClientView />}
      </div>
    </div>
  )
}
