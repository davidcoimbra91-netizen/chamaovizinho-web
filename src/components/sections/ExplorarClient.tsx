'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, SlidersHorizontal, Send, X, ChevronDown, MapPin, Euro, Calendar, Star, CheckCircle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, REGIONS } from '@/types'

interface Props {
  currentUser: { id: string; profile: any; providerProfile: any } | null
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'budget_desc', label: 'Maior orçamento' },
  { value: 'budget_asc', label: 'Menor orçamento' },
]

export default function ExplorarClient({ currentUser }: Props) {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ categoria: '', regiao: '', cidade: '', search: '', sort: 'recent', budgetMax: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [detailPedido, setDetailPedido] = useState<any>(null)
  const [clientPopup, setClientPopup] = useState<any>(null)
  const [premiumModal, setPremiumModal] = useState(false)
  const [providerModal, setProviderModal] = useState(false)
  const supabase = createClient()

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos')
      .eq('status', 'open').eq('is_archived', false)

    if (filters.categoria) query = query.ilike('category', `%${filters.categoria}%`)
    if (filters.cidade) query = query.ilike('city', `%${filters.cidade}%`)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)
    if (filters.budgetMax) query = query.lte('budget', parseFloat(filters.budgetMax))
    if (filters.sort === 'recent') query = query.order('created_at', { ascending: false })
    else if (filters.sort === 'budget_desc') query = query.order('budget', { ascending: false })
    else query = query.order('budget', { ascending: true })
    query = query.limit(20)

    const { data: requests } = await query
    if (!requests) { setLoading(false); return }

    const clientIds = Array.from(new Set(requests.map((r: any) => r.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city, average_rating').in('id', clientIds)
      : { data: [] }

    const pedidoIds = requests.map((r: any) => r.id)
    const { data: offers } = pedidoIds.length > 0
      ? await supabase.from('offers').select('id, service_request_id, provider_id, status').in('service_request_id', pedidoIds)
      : { data: [] }

    const providerIds = Array.from(new Set((offers ?? []).map((o: any) => o.provider_id).filter(Boolean)))
    const { data: providerProfiles } = providerIds.length > 0
      ? await supabase.from('provider_profiles').select('id, user_id, business_name, average_rating, reviews_count, company_city, region, provider_type, cover_photo').in('id', providerIds)
      : { data: [] }

    const providerUserIds = Array.from(new Set((providerProfiles ?? []).map((p: any) => p.user_id).filter(Boolean)))
    const { data: providerUsers } = providerUserIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city').in('id', providerUserIds)
      : { data: [] }

    const merged = requests.map((r: any) => {
      const client = clients?.find((c: any) => c.id === r.client_id)
      const pedidoOffers = (offers ?? []).filter((o: any) => o.service_request_id === r.id)
      const offerProviders = pedidoOffers.map((o: any) => {
        const pp = providerProfiles?.find((p: any) => p.id === o.provider_id)
        const user = providerUsers?.find((u: any) => u.id === pp?.user_id)
        return { ...o, provider_profile: pp, user }
      })
      const myOffer = currentUser?.providerProfile
        ? pedidoOffers.find((o: any) => o.provider_id === currentUser.providerProfile?.id)
        : null
      return { ...r, client, offers: offerProviders, myOffer, offerCount: pedidoOffers.length }
    })

    setPedidos(merged)
    setLoading(false)
  }, [filters, currentUser])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  const handlePropostaClick = (pedido: any) => {
    if (!currentUser) { window.location.href = `/auth?redirect=/explorar`; return }
    if (!currentUser.providerProfile) { setProviderModal(true); return }
    if (!currentUser.profile?.is_pro && pedido.offerCount >= 3) { setPremiumModal(true); return }
    window.location.href = `/pedidos/${pedido.id}/proposta`
  }

  const openClientPopup = async (clientId: string) => {
    const { data } = await supabase.from('user_profiles').select('id, name, profile_photo, city, bio, average_rating, reviews_count, created_at').eq('id', clientId).single()
    setClientPopup(data)
  }

  const resetFilters = () => setFilters({ categoria: '', regiao: '', cidade: '', search: '', sort: 'recent', budgetMax: '' })
  const activeFiltersCount = [filters.categoria, filters.regiao, filters.cidade, filters.budgetMax].filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC', padding: '14px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 14px' }}>
              <Search size={15} color="#9B7A5A" />
              <input type="text" placeholder="Pesquisar pedidos..." value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#2C1A0E', background: 'transparent' }} />
              {filters.search && <button onClick={() => setFilters(f => ({ ...f, search: '' }))}><X size={13} color="#9B7A5A" /></button>}
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: activeFiltersCount > 0 ? '#C85A1A' : '#fff', color: activeFiltersCount > 0 ? '#fff' : '#7A6048', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <SlidersHorizontal size={15} /> Filtros {activeFiltersCount > 0 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 99, padding: '0 6px', fontSize: 11 }}>{activeFiltersCount}</span>}
            </button>
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              style={{ padding: '9px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 13, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Filtros */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Filtros</p>
                {activeFiltersCount > 0 && <button onClick={resetFilters} style={{ fontSize: 12, color: '#C85A1A', cursor: 'pointer', background: 'none', border: 'none' }}>Limpar</button>}
              </div>
              {[
                { label: 'Região', key: 'regiao', type: 'select', options: REGIONS.map(r => ({ value: r.label, label: r.label })), placeholder: 'Todas as regiões' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#7A6048', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <select value={(filters as any)[f.key]} onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}>
                    <option value="">{f.placeholder}</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A6048', display: 'block', marginBottom: 6 }}>Cidade</label>
                <input type="text" placeholder="Ex: Lisboa..." value={filters.cidade} onChange={e => setFilters(f => ({ ...f, cidade: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A6048', display: 'block', marginBottom: 6 }}>Categoria</label>
                <select value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}>
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A6048', display: 'block', marginBottom: 6 }}>Orçamento máx. (€)</label>
                <input type="number" placeholder="Máx" value={filters.budgetMax} onChange={e => setFilters(f => ({ ...f, budgetMax: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }} />
              </div>
            </div>

            <Link href={currentUser ? '/dashboard/novo-pedido' : '/auth?tab=register'}
              style={{ display: 'block', marginTop: 10, background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 14, padding: '14px 16px', textAlign: 'center', textDecoration: 'none', boxShadow: '0 6px 20px rgba(200,90,26,0.25)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>+ Novo Pedido</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Publica gratuitamente</p>
            </Link>
          </div>

          {/* Grid pedidos */}
          <div className="lg:col-span-3">
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, height: 200 }} />)}
              </div>
            ) : pedidos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {pedidos.map(pedido => {
                  const cat = CATEGORIES.find(c => c.slug === pedido.category || c.slug.toLowerCase() === (pedido.category ?? '').toLowerCase())
                  const blocked = pedido.offerCount >= 3 && !currentUser?.profile?.is_pro
                  const alreadySent = !!pedido.myOffer

                  return (
                    <div key={pedido.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '14px 16px', flex: 1 }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {cat && (
                              <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                                {cat.icon} {cat.label}
                              </span>
                            )}
                            <span style={{ background: blocked ? '#F0EDE8' : '#EAF3DE', color: blocked ? '#9B7A5A' : '#3B6D11', borderRadius: 99, padding: '3px 10px', fontSize: 11 }}>
                              {blocked ? 'fechado' : 'em aberto'}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: '#B09070', flexShrink: 0 }}>
                            {new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 6, lineHeight: 1.3 }}>{pedido.title}</p>

                        {pedido.description && (
                          <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                            {pedido.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                          {pedido.city && <span style={{ fontSize: 11, color: '#7A6048' }}>📍 {pedido.city}</span>}
                          {pedido.budget > 0 && <span style={{ fontSize: 11, color: '#7A6048' }}>€ {pedido.budget}</span>}
                        </div>

                        {/* Client */}
                        {pedido.client && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {pedido.client.profile_photo
                                ? <Image src={pedido.client.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#C85A1A' }}>{pedido.client.name?.charAt(0)}</div>
                              }
                            </div>
                            <span style={{ fontSize: 12, color: '#7A6048' }}>{pedido.client.name}</span>
                            <button onClick={() => openClientPopup(pedido.client_id)}
                              style={{ fontSize: 11, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              Ver Perfil
                            </button>
                          </div>
                        )}

                        {/* Prestadores que responderam */}
                        {pedido.offers.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: '#9B7A5A', marginBottom: 6 }}>
                              {pedido.offerCount} prestador{pedido.offerCount !== 1 ? 'es' : ''} respondeu{pedido.offerCount !== 1 ? 'ram' : ''}
                            </p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {pedido.offers.slice(0, 3).map((offer: any) => {
                                const pp = offer.provider_profile
                                const u = offer.user
                                const oname = pp?.business_name ?? u?.name ?? '?'
                                const ophoto = pp?.cover_photo ?? u?.profile_photo
                                const orating = pp?.average_rating ?? 0
                                const ocity = pp?.company_city ?? pp?.region ?? u?.city
                                const otype = pp?.provider_type

                                return (
                                  <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '5px 8px' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', position: 'relative' }}>
                                      {ophoto
                                        ? <Image src={ophoto} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#C85A1A' }}>{oname.charAt(0)}</div>
                                      }
                                    </div>
                                    <div>
                                      <p style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>{oname}</p>
                                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                        {orating > 0 && <span style={{ fontSize: 10, color: '#F9AB00' }}>★ {orating.toFixed(1)}</span>}
                                        {ocity && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {ocity}</span>}
                                        {otype && <span style={{ fontSize: 10, color: '#9B7A5A' }}>· {otype}</span>}
                                      </div>
                                    </div>
                                    {pp && (
                                      <Link href={`/prestadores/perfil/${pp.id}`} style={{ fontSize: 10, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, marginLeft: 2 }}>→</Link>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: '10px 14px', borderTop: '0.5px solid #F0E8DC', display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: alreadySent ? '#C85A1A' : '#9B7A5A', fontWeight: alreadySent ? 600 : 400 }}>
                          {alreadySent ? `Proposta ${pedido.myOffer?.status === 'accepted' ? 'aceite ✓' : 'enviada'}` : blocked ? 'Pedido fechado' : 'Sem propostas suas'}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setDetailPedido(pedido)}
                            style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', background: '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            👁 Ver Detalhes
                          </button>
                          {!alreadySent && (
                            <button onClick={() => handlePropostaClick(pedido)}
                              style={{ padding: '6px 12px', borderRadius: 8, background: blocked ? '#EDE6DC' : '#C85A1A', border: 'none', fontSize: 12, color: blocked ? '#9B7A5A' : '#fff', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Send size={11} /> {blocked ? 'Fechado' : 'Enviar Proposta'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Sem pedidos encontrados</p>
                {activeFiltersCount > 0 && <button onClick={resetFilters} style={{ fontSize: 13, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: 8 }}>Limpar filtros</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── POPUP DETALHES PEDIDO ── */}
      {detailPedido && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDetailPedido(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                {(() => {
                  const cat = CATEGORIES.find(c => c.slug === detailPedido.category || c.slug.toLowerCase() === (detailPedido.category ?? '').toLowerCase())
                  return cat && <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 8 }}>{cat.icon} {cat.label}</span>
                })()}
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E' }}>{detailPedido.title}</h2>
              </div>
              <button onClick={() => setDetailPedido(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#9B7A5A" /></button>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {detailPedido.city && <span style={{ fontSize: 13, color: '#7A6048' }}>📍 {detailPedido.city}</span>}
              {detailPedido.budget > 0 && <span style={{ fontSize: 13, color: '#7A6048' }}>€ {detailPedido.budget}</span>}
              <span style={{ fontSize: 13, color: '#7A6048' }}>🗓 {new Date(detailPedido.created_at).toLocaleDateString('pt-PT')}</span>
            </div>

            {detailPedido.description && <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.7, marginBottom: 16 }}>{detailPedido.description}</p>}

            {detailPedido.photos?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {detailPedido.photos.map((url: string, i: number) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                    <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                ))}
              </div>
            )}

            {detailPedido.client && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FAF7F2', borderRadius: 12, padding: '12px', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', position: 'relative' }}>
                  {detailPedido.client.profile_photo
                    ? <Image src={detailPedido.client.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#C85A1A' }}>{detailPedido.client.name?.charAt(0)}</div>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{detailPedido.client.name}</p>
                  {detailPedido.client.city && <p style={{ fontSize: 11, color: '#9B7A5A' }}>📍 {detailPedido.client.city}</p>}
                </div>
                <button onClick={() => { setDetailPedido(null); openClientPopup(detailPedido.client_id) }}
                  style={{ marginLeft: 'auto', fontSize: 12, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Ver Perfil →
                </button>
              </div>
            )}

            {!detailPedido.myOffer && (
              <button onClick={() => { setDetailPedido(null); handlePropostaClick(detailPedido) }}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#C85A1A', border: 'none', fontSize: 14, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send size={16} /> Enviar Proposta
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── POPUP PERFIL CLIENT ── */}
      {clientPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setClientPopup(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', background: '#FBF0E8', position: 'relative' }}>
                {clientPopup.profile_photo
                  ? <Image src={clientPopup.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#C85A1A' }}>{clientPopup.name?.charAt(0)}</div>
                }
              </div>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>{clientPopup.name}</h3>
              {clientPopup.city && <p style={{ fontSize: 13, color: '#9B7A5A' }}>📍 {clientPopup.city}</p>}
              {clientPopup.average_rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                  <Star size={14} color="#F9AB00" fill="#F9AB00" />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{clientPopup.average_rating.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>({clientPopup.reviews_count} avaliações)</span>
                </div>
              )}
            </div>
            {clientPopup.bio && <p style={{ fontSize: 13, color: '#5A3E28', lineHeight: 1.6, marginBottom: 16, textAlign: 'center' }}>{clientPopup.bio}</p>}
            <p style={{ fontSize: 12, color: '#B09070', textAlign: 'center', marginBottom: 16 }}>
              Membro desde {new Date(clientPopup.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </p>
            <button onClick={() => setClientPopup(null)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ── POPUP PREMIUM ── */}
      {premiumModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPremiumModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Plano Premium</h2>
            <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.6, marginBottom: 20 }}>
              Este pedido já tem 3 propostas. Com o plano Premium podes responder sem limites e ter destaque nos resultados.
            </p>
            <div style={{ background: '#FBF0E8', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#C85A1A', fontFamily: 'Lora, serif' }}>7,99€<span style={{ fontSize: 14, fontWeight: 500 }}>/mês</span></p>
              <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 2 }}>90 dias de teste grátis</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/precos" onClick={() => setPremiumModal(false)}
                style={{ padding: '13px', borderRadius: 12, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Ver plano Premium
              </Link>
              <button onClick={() => setPremiumModal(false)}
                style={{ padding: '12px', borderRadius: 12, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}>
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP TORNA-TE PRESTADOR ── */}
      {providerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setProviderModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Torna-te Prestador</h2>
            <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.6, marginBottom: 20 }}>
              Para enviar propostas precisas de criar um perfil de prestador. É gratuito e rápido!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/dashboard/perfil?tab=prestador" onClick={() => setProviderModal(false)}
                style={{ padding: '13px', borderRadius: 12, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Criar perfil de prestador
              </Link>
              <button onClick={() => setProviderModal(false)}
                style={{ padding: '12px', borderRadius: 12, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}>
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
