'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Star, MapPin, Filter, ChevronRight, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, REGIONS } from '@/types'

interface Props {
  currentUser: { id: string; profile: any; providerProfile: any } | null
}

// SVG Portugal correct avec toutes les régions en vert
const PORTUGAL_REGIONS: Record<string, { label: string; path: string; cx: number; cy: number; count?: number }> = {
  norte: {
    label: 'Norte',
    cx: 130, cy: 85,
    path: 'M95,30 L105,28 L120,25 L145,28 L168,35 L178,50 L175,68 L165,82 L155,95 L140,105 L125,112 L110,108 L98,98 L88,82 L88,62 L92,45 Z',
  },
  centro: {
    label: 'Centro',
    cx: 128, cy: 168,
    path: 'M88,108 L110,108 L125,112 L140,105 L155,95 L165,82 L175,68 L178,90 L175,120 L168,148 L160,170 L148,188 L130,195 L112,192 L98,182 L88,165 L85,140 Z',
  },
  lisboa: {
    label: 'Lisboa',
    cx: 102, cy: 228,
    path: 'M88,195 L112,192 L130,195 L135,212 L132,232 L118,245 L100,248 L85,240 L82,225 Z',
  },
  alentejo: {
    label: 'Alentejo',
    cx: 132, cy: 288,
    path: 'M100,248 L118,245 L135,245 L158,248 L172,262 L175,285 L172,308 L158,325 L138,335 L115,332 L98,318 L88,295 L85,272 L90,258 Z',
  },
  algarve: {
    label: 'Algarve',
    cx: 128, cy: 358,
    path: 'M100,335 L138,335 L162,335 L168,348 L162,368 L128,375 L95,368 L88,352 L92,340 Z',
  },
  acores: {
    label: 'Açores',
    cx: 40, cy: 330,
    path: 'M18,318 L62,318 L66,332 L62,346 L18,346 L14,332 Z',
  },
  madeira: {
    label: 'Madeira',
    cx: 40, cy: 292,
    path: 'M18,282 L62,282 L66,295 L62,308 L18,308 L14,295 Z',
  },
}

const GREEN_SHADES = ['#2E7D32', '#388E3C', '#43A047', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7']

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

function Avatar({ name, photo, size = 36 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      {photo
        ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>{name?.charAt(0) ?? '?'}</div>
      }
    </div>
  )
}

// ─────────────────────────────────────────────────
// MAPA CLIENTE - Portugal SVG vert + prestataires
// ─────────────────────────────────────────────────
function MapaClientView({ currentUser }: Props) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [providers, setProviders] = useState<any[]>([])
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Charger les comptages par région
  useEffect(() => {
    const loadCounts = async () => {
      const { data } = await supabase.from('provider_profiles').select('region').eq('is_active', true)
      if (!data) return
      const counts: Record<string, number> = {}
      data.forEach((p: any) => {
        const r = p.region?.toLowerCase()
        if (r) {
          // Map region names to keys
          if (r.includes('norte') || r.includes('braga') || r.includes('porto') || r.includes('viana') || r.includes('vila real') || r.includes('bragança')) counts.norte = (counts.norte ?? 0) + 1
          else if (r.includes('centro') || r.includes('coimbra') || r.includes('aveiro') || r.includes('viseu') || r.includes('guarda') || r.includes('castelo branco') || r.includes('leiria')) counts.centro = (counts.centro ?? 0) + 1
          else if (r.includes('lisboa') || r.includes('setúbal') || r.includes('setubal') || r.includes('santarém') || r.includes('santarem')) counts.lisboa = (counts.lisboa ?? 0) + 1
          else if (r.includes('alentejo') || r.includes('évora') || r.includes('evora') || r.includes('beja') || r.includes('portalegre')) counts.alentejo = (counts.alentejo ?? 0) + 1
          else if (r.includes('algarve') || r.includes('faro')) counts.algarve = (counts.algarve ?? 0) + 1
          else if (r.includes('açores') || r.includes('acores') || r.includes('azores')) counts.acores = (counts.acores ?? 0) + 1
          else if (r.includes('madeira')) counts.madeira = (counts.madeira ?? 0) + 1
        }
      })
      setRegionCounts(counts)
    }
    loadCounts()
  }, [])

  const fetchProviders = useCallback(async (regionKey: string) => {
    setLoading(true)
    const regionLabels: Record<string, string[]> = {
      norte: ['Norte', 'Braga', 'Porto', 'Viana do Castelo', 'Vila Real', 'Bragança'],
      centro: ['Centro', 'Coimbra', 'Aveiro', 'Viseu', 'Guarda', 'Castelo Branco', 'Leiria'],
      lisboa: ['Lisboa', 'Setúbal', 'Santarém'],
      alentejo: ['Alentejo', 'Évora', 'Beja', 'Portalegre'],
      algarve: ['Algarve', 'Faro'],
      acores: ['Açores', 'Azores'],
      madeira: ['Madeira'],
    }

    const regionNames = regionLabels[regionKey] ?? []
    const orFilter = regionNames.map(r => `region.ilike.%${r}%`).join(',')

    let query = supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo, provider_type, is_verified, is_boosted, is_active')
      .eq('is_active', true)
      .or(orFilter)

    if (categoryFilter) query = query.overlaps('service_categories', [categoryFilter])
    query = query.order('is_boosted', { ascending: false }).order('average_rating', { ascending: false }).limit(30)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const userIds = data.map((p: any) => p.user_id)
    const { data: users } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', userIds)
      : { data: [] }

    // Portfolio
    const profileIds = data.map((p: any) => p.id)
    const { data: portfolio } = profileIds.length > 0
      ? await supabase.from('portfolio_items').select('id, provider_profile_id, photo_url, image').in('provider_profile_id', profileIds).limit(30)
      : { data: [] }

    setProviders(data.map((p: any) => ({
      ...p,
      user: users?.find((u: any) => u.id === p.user_id),
      portfolio: (portfolio ?? []).filter((item: any) => item.provider_profile_id === p.id).slice(0, 3),
    })))
    setLoading(false)
  }, [categoryFilter])

  useEffect(() => {
    if (selectedRegion) fetchProviders(selectedRegion)
    else setProviders([])
  }, [selectedRegion, categoryFilter])

  const filteredProviders = searchText
    ? providers.filter(p => (p.business_name ?? p.user?.name ?? '').toLowerCase().includes(searchText.toLowerCase()))
    : providers

  const premium = filteredProviders.filter(p => p.is_boosted)
  const regular = filteredProviders.filter(p => !p.is_boosted)

  const selectedLabel = selectedRegion ? PORTUGAL_REGIONS[selectedRegion]?.label : null
  const count = selectedRegion ? regionCounts[selectedRegion] ?? 0 : 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, minHeight: '80vh' }}>

      {/* SVG Portugal */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Mapa dos Prestadores</h2>
          <p style={{ fontSize: 12, color: '#9B7A5A' }}>Encontre profissionais de confiança na sua região.</p>
        </div>

        <svg viewBox="0 0 220 400" style={{ width: '100%', height: 'auto' }}>
          {Object.entries(PORTUGAL_REGIONS).map(([key, region], i) => {
            const isSelected = selectedRegion === key
            const isHovered = hoveredRegion === key
            const cnt = regionCounts[key] ?? 0
            return (
              <g key={key} onClick={() => setSelectedRegion(key === selectedRegion ? null : key)}
                onMouseEnter={() => setHoveredRegion(key)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ cursor: 'pointer' }}>
                <path
                  d={region.path}
                  fill={isSelected ? '#C85A1A' : isHovered ? '#A5D6A7' : GREEN_SHADES[i % GREEN_SHADES.length]}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ transition: 'fill 0.15s' }}
                />
                <text x={region.cx} y={region.cy - 6} textAnchor="middle"
                  style={{ fontSize: 10, fontWeight: 700, fill: isSelected ? '#fff' : '#fff', pointerEvents: 'none' }}>
                  {region.label}
                </text>
                {cnt > 0 && (
                  <text x={region.cx} y={region.cy + 7} textAnchor="middle"
                    style={{ fontSize: 9, fill: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
                    {cnt} prest.
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <div style={{ marginTop: 14, padding: '10px 12px', background: '#FAF7F2', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#4CAF50' }} />
            <span style={{ fontSize: 11, color: '#5A3E28' }}>Prestadores ativos</span>
          </div>
          <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.4 }}>
            Mais de <strong style={{ color: '#C85A1A' }}>5.000 profissionais</strong> em todo o país prontos para ajudar.
          </p>
        </div>

        <div style={{ marginTop: 12, padding: '10px 12px', background: '#FBF0E8', borderRadius: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#5A3E28', marginBottom: 6 }}>Como funciona?</p>
          {[
            ['1.', 'Escolha uma região'],
            ['2.', 'Encontre o especialista certo'],
            ['3.', 'Contacte e contrate'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', flexShrink: 0 }}>{n}</span>
              <span style={{ fontSize: 11, color: '#7A6048' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lista prestataires */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selectedRegion ? (
          <>
            {/* Header região */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={17} color="#C85A1A" />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E' }}>{selectedLabel}</h2>
                    <p style={{ fontSize: 12, color: '#9B7A5A' }}>{count} prestadores disponíveis</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ textAlign: 'center', background: '#FAF7F2', borderRadius: 10, padding: '8px 14px' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#C85A1A' }}>{count}</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A' }}>Prestadores</p>
                  </div>
                  <div style={{ textAlign: 'center', background: '#FAF7F2', borderRadius: 10, padding: '8px 14px' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#1A73E8' }}>{CATEGORIES.length}</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A' }}>Categorias</p>
                  </div>
                </div>
              </div>

              {/* Search + Filtros */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} color="#9B7A5A" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Pesquisar prestadores, serviços..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: '100%', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 12px 9px 36px', fontSize: 13, color: '#2C1A0E', outline: 'none', background: '#FAF7F2', boxSizing: 'border-box' }}
                  />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', outline: 'none', cursor: 'pointer', minWidth: 180 }}>
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              {/* Chips catégories */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setCategoryFilter('')}
                  style={{ padding: '5px 12px', borderRadius: 99, border: 'none', background: !categoryFilter ? '#C85A1A' : '#FAF7F2', color: !categoryFilter ? '#fff' : '#5A3E28', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Todas
                </button>
                {CATEGORIES.slice(0, 7).map(cat => (
                  <button key={cat.slug} onClick={() => setCategoryFilter(cat.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, border: 'none', background: categoryFilter === cat.slug ? cat.color : '#FAF7F2', color: categoryFilter === cat.slug ? '#fff' : '#5A3E28', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    {cat.iconImg ? <img src={cat.iconImg} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> : <span style={{ fontSize: 13 }}>{cat.icon}</span>}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 120, background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}
              </div>
            ) : (
              <>
                {/* Premium em destaque */}
                {premium.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 16 }}>⭐</span>
                        <h3 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Prestadores em Destaque</h3>
                      </div>
                      <span style={{ fontSize: 11, color: '#9B7A5A' }}>Profissionais Premium com melhor avaliação e mais procurados na sua região.</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      {premium.slice(0, 3).map((p: any) => (
                        <ProviderCardPremium key={p.id} p={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Todos os prestadores */}
                {regular.length > 0 && (
                  <div>
                    <h3 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>
                      {premium.length > 0 ? 'Todos os Prestadores' : `${filteredProviders.length} Prestadores encontrados`}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {regular.map((p: any) => (
                        <ProviderCardRegular key={p.id} p={p} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredProviders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
                    <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum prestador encontrado</p>
                    <p style={{ fontSize: 12, color: '#9B7A5A' }}>Tenta outra categoria ou região.</p>
                  </div>
                )}
              </>
            )}

            {/* Banner verificado */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛡️</div>
                <p style={{ fontSize: 12, color: '#5A3E28' }}>Profissionais verificados e avaliados pela comunidade para garantir mais confiança e qualidade nos serviços.</p>
              </div>
              <Link href="/precos" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>Saiba mais sobre verificações →</Link>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff', borderRadius: 16, border: '0.5px solid #EDE6DC' }}>
            <div style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Seleciona uma região</p>
              <p style={{ fontSize: 13, color: '#9B7A5A', maxWidth: 280, margin: '0 auto' }}>Clica num distrito do mapa para ver os profissionais disponíveis na tua área.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Card Premium (horizontal, grande)
function ProviderCardPremium({ p }: { p: any }) {
  const name = p.business_name ?? p.user?.name ?? 'Prestador'
  const photo = p.user?.profile_photo
  const cat = p.service_categories?.[0] ? getCatInfo(p.service_categories[0]) : null

  return (
    <div style={{ background: '#fff', border: '2px solid #C85A1A', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Badges */}
      <div style={{ background: 'linear-gradient(135deg, #2C1A0E, #4A2C1A)', padding: '10px 12px', display: 'flex', gap: 6 }}>
        <span style={{ background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>⭐ Premium</span>
        {p.is_verified && <span style={{ background: '#3B6D11', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>✓ Verificado</span>}
      </div>
      {/* Conteúdo */}
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={name} photo={photo} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
            {cat && <p style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 10, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
              {p.company_city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {p.company_city}</span>}
            </div>
          </div>
        </div>
        {/* Portfolio miniatures */}
        {p.portfolio?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, borderRadius: 8, overflow: 'hidden' }}>
            {p.portfolio.map((item: any, i: number) => (
              <div key={i} style={{ aspectRatio: '1', background: '#EDE6DC', position: 'relative', overflow: 'hidden' }}>
                <Image src={item.photo_url ?? item.image ?? ''} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <span style={{ fontSize: 11, color: '#9B7A5A' }}>{p.portfolio?.length ?? 0} trabalhos realizados</span>
          <Link href={`/prestadores/perfil/${p.id}`}
            style={{ padding: '7px 14px', borderRadius: 9, background: '#C85A1A', textDecoration: 'none', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            Ver perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

// Card Regular (ligne horizontale)
function ProviderCardRegular({ p }: { p: any }) {
  const name = p.business_name ?? p.user?.name ?? 'Prestador'
  const photo = p.user?.profile_photo
  const cat = p.service_categories?.[0] ? getCatInfo(p.service_categories[0]) : null

  return (
    <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name={name} photo={photo} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
          {p.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 9, fontWeight: 700 }}>✓ Verificado</span>}
        </div>
        {cat && <p style={{ fontSize: 11, color: cat.color, fontWeight: 600, marginBottom: 2 }}>{cat.icon} {cat.label}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {p.average_rating > 0 && <><Star size={11} color="#F9AB00" fill="#F9AB00" /><span style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>{p.average_rating.toFixed(1)}</span><span style={{ fontSize: 10, color: '#9B7A5A' }}>({p.reviews_count ?? 0})</span></>}
          {p.company_city && <span style={{ fontSize: 10, color: '#9B7A5A' }}>📍 {p.company_city}</span>}
        </div>
      </div>
      {/* Miniatures portfolio */}
      {p.portfolio?.length > 0 && (
        <div style={{ display: 'flex', gap: 4 }}>
          {p.portfolio.slice(0, 3).map((item: any, i: number) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', position: 'relative', background: '#EDE6DC', flexShrink: 0 }}>
              <Image src={item.photo_url ?? item.image ?? ''} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
            </div>
          ))}
          {p.portfolio.length > 0 && <span style={{ fontSize: 10, color: '#9B7A5A', alignSelf: 'center', marginLeft: 2 }}>{p.portfolio.length} trabalhos</span>}
        </div>
      )}
      <Link href={`/prestadores/perfil/${p.id}`}
        style={{ padding: '7px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#5A3E28', flexShrink: 0 }}>
        Ver perfil
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────
// MAPA PRESTATAIRE - Liste pedidos + layout split
// ─────────────────────────────────────────────────
function MapaProviderView({ currentUser }: Props) {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPedidos()
  }, [categoryFilter])

  async function fetchPedidos() {
    setLoading(true)
    let query = supabase
      .from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos, latitude, longitude')
      .eq('status', 'open')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (categoryFilter) query = query.ilike('category', `%${categoryFilter}%`)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const clientIds = Array.from(new Set(data.map((p: any) => p.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', clientIds as string[])
      : { data: [] }

    setPedidos(data.map((p: any) => ({ ...p, client: clients?.find((c: any) => c.id === p.client_id) })))
    setLoading(false)
  }

  const filtered = urgentOnly ? pedidos.filter(p => {
    const ago = (Date.now() - new Date(p.created_at).getTime()) / 3600000
    return ago < 2
  }) : pedidos

  const urgentCount = pedidos.filter(p => (Date.now() - new Date(p.created_at).getTime()) / 3600000 < 2).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

      {/* Header filtros */}
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Pedidos perto de si</h1>
            <p style={{ fontSize: 12, color: '#9B7A5A' }}>Encontre pedidos de clientes na sua área e envie a sua proposta.</p>
          </div>
        </div>

        {/* Filtros + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#FAF7F2', fontSize: 12, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, background: urgentOnly ? '#FFEBEE' : '#FAF7F2', border: '0.5px solid #EDE6DC' }}>
            <input type="checkbox" checked={urgentOnly} onChange={e => setUrgentOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: urgentOnly ? '#C62828' : '#7A6048' }}>⚡ Ver apenas urgentes</span>
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {[
              { value: filtered.length, label: 'Pedidos encontrados', color: '#C85A1A' },
              { value: urgentCount, label: 'Urgentes', color: '#C62828' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: '#FAF7F2', borderRadius: 10, padding: '6px 12px' }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif' }}>{s.value}</p>
                <p style={{ fontSize: 10, color: '#9B7A5A' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lista pedidos */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 100, background: '#fff', borderRadius: 12, border: '0.5px solid #EDE6DC', opacity: 0.5 }} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((pedido: any) => {
            const cat = getCatInfo(pedido.category)
            const ago = Math.round((Date.now() - new Date(pedido.created_at).getTime()) / 60000)
            const isUrgent = ago < 120

            return (
              <div key={pedido.id} style={{ background: '#fff', border: `0.5px solid ${selectedPedido?.id === pedido.id ? '#C85A1A' : '#EDE6DC'}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                onClick={() => setSelectedPedido(selectedPedido?.id === pedido.id ? null : pedido)}>

                {/* Ícone catégorie */}
                <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: cat.bg, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pedido.photos?.[0]
                    ? <Image src={pedido.photos[0]} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    : <span style={{ fontSize: 24 }}>{cat.icon}</span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    {isUrgent && <span style={{ background: '#FFEBEE', color: '#C62828', borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 700 }}>⚡ Urgente</span>}
                    <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 3, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{pedido.title}</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A' }}>
                    📍 {pedido.city} · Publicado há {ago < 60 ? `${ago} min` : `${Math.round(ago / 60)} h`}
                  </p>
                </div>

                {pedido.budget > 0 && (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A' }}>€{pedido.budget}</p>
                    <p style={{ fontSize: 10, color: '#9B7A5A' }}>Orçamento</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  <Link href={`/pedidos/${pedido.id}`} onClick={e => e.stopPropagation()}
                    style={{ padding: '7px 12px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 11, color: '#5A3E28', textDecoration: 'none', fontWeight: 600 }}>
                    Detalhes
                  </Link>
                  <Link href={`/pedidos/${pedido.id}/proposta`} onClick={e => e.stopPropagation()}
                    style={{ padding: '7px 12px', borderRadius: 9, background: '#C85A1A', fontSize: 11, color: '#fff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={11} /> Proposta
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>📋</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhum pedido encontrado</p>
          <p style={{ fontSize: 12, color: '#9B7A5A' }}>Tenta alterar os filtros.</p>
        </div>
      )}

      {/* Dica */}
      <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A', marginBottom: 3 }}>Dica para receber mais pedidos</p>
          <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.5 }}>Mantém o teu perfil atualizado e as tuas categorias ativas para aparecer em mais pesquisas.</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────
export default function MapaClient({ currentUser }: Props) {
  const isProvider = currentUser?.profile?.is_provider ?? false

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '24px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {isProvider ? 'Pedidos perto de si' : 'Mapa dos Prestadores'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {isProvider ? 'Encontre pedidos de clientes na sua área e envie a sua proposta.' : 'Escolha uma região para descobrir prestadores locais.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isProvider
          ? <MapaProviderView currentUser={currentUser} />
          : <MapaClientView currentUser={currentUser} />
        }
      </div>
    </div>
  )
}
