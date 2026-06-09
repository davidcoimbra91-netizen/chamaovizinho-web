'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Star, Filter, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, REGIONS } from '@/types'

interface Props {
  currentUser: { id: string; profile: any; providerProfile: any } | null
}

// SVG regions mapping
const REGIONS_SVG: Record<string, { label: string; path: string; cx: number; cy: number }> = {
  norte: {
    label: 'Norte',
    cx: 120, cy: 80,
    path: 'M100,30 L160,30 L170,60 L165,90 L140,100 L120,110 L100,100 L85,80 L90,55 Z',
  },
  centro: {
    label: 'Centro',
    cx: 120, cy: 160,
    path: 'M90,110 L140,100 L165,90 L170,130 L165,170 L155,200 L130,210 L105,200 L90,175 L85,140 Z',
  },
  lisboa: {
    label: 'Lisboa',
    cx: 100, cy: 235,
    path: 'M85,210 L130,210 L135,230 L130,255 L110,265 L90,260 L80,245 Z',
  },
  alentejo: {
    label: 'Alentejo',
    cx: 130, cy: 290,
    path: 'M90,265 L135,255 L160,265 L165,295 L160,325 L135,340 L110,335 L85,310 L85,285 Z',
  },
  algarve: {
    label: 'Algarve',
    cx: 125, cy: 355,
    path: 'M95,340 L155,340 L160,355 L155,368 L125,372 L95,368 L90,355 Z',
  },
  acores: {
    label: 'Açores',
    cx: 40, cy: 330,
    path: 'M20,320 L60,320 L65,335 L60,348 L20,348 L15,335 Z',
  },
  madeira: {
    label: 'Madeira',
    cx: 40, cy: 290,
    path: 'M20,280 L60,280 L65,295 L60,305 L20,305 L15,295 Z',
  },
}

const REGION_COLORS = ['#F5E8D6', '#EDE0CF', '#E5D8C8', '#DDD0C1', '#D5C8BA', '#CEC0B3', '#C6B8AC']

export default function MapaClient({ currentUser }: Props) {
  const [mode, setMode] = useState<'prestadores' | 'pedidos'>(currentUser?.profile?.is_provider ? 'pedidos' : 'prestadores')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [distanceFilter, setDistanceFilter] = useState('100')
  const [providers, setProviders] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [detailItem, setDetailItem] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const fetchProviders = useCallback(async (region: string) => {
    setLoading(true)
    const regionData = REGIONS.find(r => r.slug === region)
    if (!regionData) { setLoading(false); return }

    let query = supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo, provider_type, is_verified, is_boosted')
      .eq('is_active', true)
      .ilike('region', `%${regionData.label}%`)

    if (categoryFilter) query = query.overlaps('service_categories', [categoryFilter])
    query = query.order('is_boosted', { ascending: false }).order('average_rating', { ascending: false }).limit(20)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const userIds = data.map((p: any) => p.user_id)
    const { data: users } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city').in('id', userIds)
      : { data: [] }

    setProviders(data.map((p: any) => ({ ...p, user: users?.find((u: any) => u.id === p.user_id) })))
    setLoading(false)
  }, [categoryFilter])

  const fetchPedidos = useCallback(async (region: string) => {
    setLoading(true)
    const regionData = REGIONS.find(r => r.slug === region)
    if (!regionData) { setLoading(false); return }

    // Filter by cities in region
    const cityFilters = regionData.cities.map(c => `city.ilike.%${c}%`).join(',')

    let query = supabase
      .from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos, latitude, longitude')
      .eq('status', 'open').eq('is_archived', false)
      .or(cityFilters)

    if (categoryFilter) query = query.ilike('category', `%${categoryFilter}%`)
    query = query.order('created_at', { ascending: false }).limit(20)

    const { data } = await query
    if (!data) { setLoading(false); return }

    const clientIds = Array.from(new Set(data.map((p: any) => p.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city').in('id', clientIds)
      : { data: [] }

    setPedidos(data.map((p: any) => ({ ...p, client: clients?.find((c: any) => c.id === p.client_id) })))
    setLoading(false)
  }, [categoryFilter])

  useEffect(() => {
    if (!selectedRegion) return
    if (mode === 'prestadores') fetchProviders(selectedRegion)
    else fetchPedidos(selectedRegion)
  }, [selectedRegion, mode, categoryFilter])

  const handleRegionClick = (regionKey: string) => {
    setSelectedRegion(regionKey === selectedRegion ? null : regionKey)
    setDetailItem(null)
  }

  const items = mode === 'prestadores' ? providers : pedidos

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {mode === 'prestadores' ? 'Prestadores em Portugal' : 'Pedidos perto de si'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {mode === 'prestadores' ? 'Clica numa região para ver os prestadores disponíveis' : 'Clica numa região para ver os pedidos próximos'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mode toggle + filtros */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {currentUser?.profile?.is_provider ? (
            <div style={{ display: 'flex', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: 3, gap: 3 }}>
              {[{ key: 'pedidos', label: '📋 Pedidos perto de si' }, { key: 'prestadores', label: '👥 Prestadores' }].map(m => (
                <button key={m.key} onClick={() => { setMode(m.key as any); setSelectedRegion(null) }}
                  style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: mode === m.key ? '#C85A1A' : 'transparent', color: mode === m.key ? '#fff' : '#7A6048', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {m.label}
                </button>
              ))}
            </div>
          ) : null}

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 13, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
          </select>

          {mode === 'pedidos' && currentUser?.profile?.is_provider && (
            <select value={distanceFilter} onChange={e => setDistanceFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 13, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
              {[10, 25, 50, 100].map(d => <option key={d} value={d}>{d}km de raio</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Mapa SVG */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 14, textAlign: 'center' }}>Seleciona uma região</p>
            <svg viewBox="0 0 200 400" style={{ width: '100%', height: 'auto' }}>
              {Object.entries(REGIONS_SVG).map(([key, region], i) => (
                <g key={key} onClick={() => handleRegionClick(key)}
                  onMouseEnter={() => setHoveredRegion(key)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  style={{ cursor: 'pointer' }}>
                  <path
                    d={region.path}
                    fill={selectedRegion === key ? '#C85A1A' : hoveredRegion === key ? '#E8C4A8' : REGION_COLORS[i % REGION_COLORS.length]}
                    stroke="#fff"
                    strokeWidth="2"
                    style={{ transition: 'fill 0.15s' }}
                  />
                  <text x={region.cx} y={region.cy} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 11, fontWeight: selectedRegion === key ? 700 : 500, fill: selectedRegion === key ? '#fff' : '#2C1A0E', pointerEvents: 'none' }}>
                    {region.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Légende */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(REGIONS_SVG).map(([key, region]) => (
                <button key={key} onClick={() => handleRegionClick(key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: 'none', background: selectedRegion === key ? '#FBF0E8' : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: selectedRegion === key ? '#C85A1A' : '#D4C4B0', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: selectedRegion === key ? '#C85A1A' : '#7A6048', fontWeight: selectedRegion === key ? 600 : 400 }}>{region.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista résultats */}
          <div>
            {!selectedRegion ? (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🗺️</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Seleciona uma região no mapa</p>
                <p style={{ fontSize: 13, color: '#9B7A5A' }}>
                  {mode === 'prestadores' ? 'Clica numa região para ver os prestadores disponíveis' : 'Clica numa região para ver os pedidos próximos'}
                </p>
              </div>
            ) : loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, height: 160 }} />)}
              </div>
            ) : items.length > 0 ? (
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 12 }}>
                  {items.length} {mode === 'prestadores' ? 'prestador' : 'pedido'}{items.length !== 1 ? 'es' : ''} em {REGIONS_SVG[selectedRegion]?.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {mode === 'prestadores' ? items.map((p: any) => {
                    const name = p.business_name ?? p.user?.name ?? 'Prestador'
                    const photo = p.cover_photo ?? p.user?.profile_photo
                    const rating = p.average_rating ?? 0
                    const city = p.company_city ?? p.region

                    return (
                      <div key={p.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
                        <div style={{ height: 80, background: '#FAF7F2', position: 'relative', overflow: 'hidden' }}>
                          {photo && <Image src={photo} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />}
                          {p.is_boosted && (
                            <span style={{ position: 'absolute', top: 8, right: 8, background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>⭐ Premium</span>
                          )}
                        </div>
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{name}</p>
                            {p.is_verified && <CheckCircle size={14} color="#3B6D11" />}
                          </div>
                          {rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                              <Star size={12} color="#F9AB00" fill="#F9AB00" />
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{rating.toFixed(1)}</span>
                              <span style={{ fontSize: 11, color: '#9B7A5A' }}>({p.reviews_count})</span>
                            </div>
                          )}
                          {city && <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 6 }}>📍 {city}</p>}
                          {p.provider_type && <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 8 }}>{p.provider_type}</p>}
                          {p.service_categories?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                              {p.service_categories.slice(0, 2).map((cat: string) => {
                                const catInfo = CATEGORIES.find(c => c.slug === cat || c.label.toLowerCase() === cat.toLowerCase())
                                return <span key={cat} style={{ background: catInfo?.bg ?? '#FAF7F2', color: catInfo?.color ?? '#7A6048', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{catInfo?.icon} {catInfo?.label ?? cat}</span>
                              })}
                            </div>
                          )}
                          <Link href={`/prestadores/perfil/${p.id}`}
                            style={{ display: 'block', textAlign: 'center', padding: '7px', borderRadius: 8, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                            Ver perfil
                          </Link>
                        </div>
                      </div>
                    )
                  }) : items.map((pedido: any) => {
                    const cat = CATEGORIES.find(c => c.slug === pedido.category || c.slug.toLowerCase() === (pedido.category ?? '').toLowerCase())
                    return (
                      <div key={pedido.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {cat && <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{cat.icon} {cat.label}</span>}
                          <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 10px', fontSize: 11 }}>em aberto</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 6 }}>{pedido.title}</p>
                        {pedido.description && <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{pedido.description}</p>}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          {pedido.city && <span style={{ fontSize: 11, color: '#7A6048' }}>📍 {pedido.city}</span>}
                          {pedido.budget > 0 && <span style={{ fontSize: 11, color: '#7A6048' }}>€ {pedido.budget}</span>}
                        </div>
                        {pedido.client && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                              {pedido.client.profile_photo
                                ? <Image src={pedido.client.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#C85A1A' }}>{pedido.client.name?.charAt(0)}</div>
                              }
                            </div>
                            <span style={{ fontSize: 12, color: '#7A6048' }}>{pedido.client.name}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/pedidos/${pedido.id}`}
                            style={{ flex: 1, textAlign: 'center', padding: '7px', borderRadius: 8, border: '0.5px solid #D4C4B0', color: '#5A3E28', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                            Ver detalhes
                          </Link>
                          <Link href={`/pedidos/${pedido.id}/proposta`}
                            style={{ flex: 1, textAlign: 'center', padding: '7px', borderRadius: 8, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <Send size={11} /> Proposta
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>📍</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>
                  Nenhum {mode === 'prestadores' ? 'prestador' : 'pedido'} encontrado
                </p>
                <p style={{ fontSize: 13, color: '#9B7A5A' }}>Tenta outra região ou muda os filtros.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckCircle({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Send({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m22 2-7 20-4-9-9-4 20-7z" /><path d="M22 2 11 13" />
    </svg>
  )
}
