'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Send, X, MapPin, Star, Zap, Clock, Camera, Flame, ClipboardList, Lightbulb, Shield, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import PropostaModal from '@/components/ui/PropostaModal'

function norm(s: string) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_') }

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 2) return 'Agora mesmo'
  if (mins < 60) return `Há ${mins} min`
  if (hours < 24) return `Há ${hours}h`
  if (days === 1) return 'Há 1 dia'
  return `Há ${days} dias`
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const DISTANCE_OPTS = [10, 25, 50, 100]
const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'budget_desc', label: 'Maior orçamento' },
  { value: 'budget_asc', label: 'Menor orçamento' },
]

interface Props {
  currentUser: { id: string; profile: any; providerProfile: any } | null
}

export default function ExplorarClient({ currentUser }: Props) {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    distancia: 0,
    urgente: false,
    sort: 'recent',
  })
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null)
  const [detailPedido, setDetailPedido] = useState<any>(null)
  const [clientPopup, setClientPopup] = useState<any>(null)
  const [premiumModal, setPremiumModal] = useState(false)
  const [providerModal, setProviderModal] = useState(false)
  const [propostaPedido, setPropostaPedido] = useState<any>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const supabase = createClient()

  const getPosition = useCallback(() => {
    if (!userPos && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      })
    }
  }, [userPos])

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos, latitude, longitude')
      .eq('status', 'open').eq('is_archived', false)

    if (filters.categoria) query = query.ilike('category', `%${filters.categoria}%`)
    if (filters.sort === 'recent') query = query.order('created_at', { ascending: false })
    else if (filters.sort === 'budget_desc') query = query.order('budget', { ascending: false })
    else query = query.order('budget', { ascending: true })
    query = query.limit(100)

    const { data: requests } = await query
    if (!requests) { setLoading(false); return }

    let filtered = requests as any[]

    if (filters.search) {
      const s = filters.search.toLowerCase()
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(s) ||
        r.category?.toLowerCase().includes(s) ||
        r.city?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s)
      )
    }

    if (filters.urgente) {
      filtered = filtered.filter(r => (Date.now() - new Date(r.created_at).getTime()) < 7200000)
    }

    if (filters.distancia > 0 && userPos) {
      filtered = filtered.filter(r => {
        if (!r.latitude || !r.longitude) return true
        return haversineKm(userPos.lat, userPos.lon, r.latitude, r.longitude) <= filters.distancia
      })
    }

    const clientIds = Array.from(new Set(filtered.map((r: any) => r.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city, average_rating, reviews_count').in('id', clientIds)
      : { data: [] }

    const pedidoIds = filtered.map((r: any) => r.id)
    const { data: offers } = pedidoIds.length > 0
      ? await supabase.from('offers').select('id, service_request_id, provider_id, status').in('service_request_id', pedidoIds)
      : { data: [] }

    // offers.provider_id = auth.uid() = user_profiles.id (direct lookup)
    const offerUserIds = Array.from(new Set((offers ?? []).map((o: any) => o.provider_id).filter(Boolean)))
    const { data: offerUsers } = offerUserIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', offerUserIds)
      : { data: [] }

    const merged = filtered.map((r: any) => {
      const client = clients?.find((c: any) => c.id === r.client_id)
      const pedidoOffers = (offers ?? []).filter((o: any) => o.service_request_id === r.id)
      // offers.provider_id = auth.uid() = currentUser.id
      const myOffer = currentUser
        ? pedidoOffers.find((o: any) => o.provider_id === currentUser.id)
        : null
      const offerProviders = pedidoOffers.map((o: any) => {
        const user = offerUsers?.find((u: any) => u.id === o.provider_id) ?? null
        return { ...o, user }
      })
      return { ...r, client, myOffer, offerCount: pedidoOffers.length, offerProviders }
    })

    setPedidos(merged)
    setLoading(false)
  }, [filters, currentUser, userPos])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  useEffect(() => {
    if (filters.distancia > 0) getPosition()
  }, [filters.distancia, getPosition])

  const handlePropostaClick = (pedido: any) => {
    if (!currentUser) { window.location.href = `/auth?redirect=/explorar`; return }
    if (!currentUser.providerProfile) { setProviderModal(true); return }
    if (!currentUser.profile?.is_pro && pedido.offerCount >= 3) { setPremiumModal(true); return }
    setPropostaPedido(pedido)
  }

  const openClientPopup = async (clientId: string) => {
    const { data } = await supabase.from('user_profiles').select('id, name, profile_photo, city, bio, average_rating, reviews_count, created_at').eq('id', clientId).single()
    setClientPopup(data)
  }

  const handleShare = (pedido: any) => {
    const url = `${window.location.origin}/pedidos/${pedido.id}`
    const text = `${pedido.title}${pedido.city ? ` – ${pedido.city}` : ''}`
    if (navigator.share) {
      navigator.share({ title: pedido.title, text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copiado!')).catch(() => {})
    }
  }

  const resetFilters = () => setFilters({ search: '', categoria: '', distancia: 0, urgente: false, sort: 'recent' })
  const hasActiveFilters = !!(filters.search || filters.categoria || filters.distancia > 0 || filters.urgente)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>

      {/* Lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightboxUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* ── HEADER OPORTUNIDADES ── */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC', padding: '20px 0 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Linha 1: título + ilustração */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <MapPin size={18} color="#C85A1A" />
                <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>Trabalhos perto de si</h1>
              </div>
              <p style={{ fontSize: 14, color: '#7A6048', margin: 0 }}>Encontre oportunidades na sua área e envie a sua proposta.</p>
            </div>
            <img src="/icons/presta.png" alt="" style={{ height: 130, objectFit: 'contain', flexShrink: 0 }} />
          </div>

          {/* Linha 2: stat chips + dica */}
          {!loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '8px 14px' }}>
                <ClipboardList size={16} color="#C85A1A" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#2C1A0E', lineHeight: 1, margin: 0 }}>{pedidos.length}</p>
                  <p style={{ fontSize: 11, color: '#9B7A5A', margin: 0 }}>Pedidos ativos</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '8px 14px' }}>
                <Flame size={16} color="#C85A1A" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#2C1A0E', lineHeight: 1, margin: 0 }}>
                    {pedidos.filter((p: any) => (Date.now() - new Date(p.created_at).getTime()) < 86400000).length}
                  </p>
                  <p style={{ fontSize: 11, color: '#9B7A5A', margin: 0 }}>Novos hoje</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '8px 14px' }}>
                <Zap size={16} color="#C85A1A" />
                <div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#2C1A0E', lineHeight: 1, margin: 0 }}>
                    {pedidos.filter((p: any) => (Date.now() - new Date(p.created_at).getTime()) < 7200000).length}
                  </p>
                  <p style={{ fontSize: 11, color: '#9B7A5A', margin: 0 }}>Urgentes</p>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFBF5', border: '0.5px solid #F5DFC8', borderRadius: 10, padding: '8px 14px' }}>
                <Lightbulb size={15} color="#C85A1A" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dica</p>
                  <p style={{ fontSize: 12, color: '#5A3E28', lineHeight: 1.4, margin: 0 }}>Responda rápido e com uma proposta detalhada para aumentar as suas hipóteses de sucesso.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY: SIDEBAR + GRID ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── SIDEBAR FILTROS ── */}
          <div style={{ width: 296, flexShrink: 0 }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px', position: 'sticky', top: 80 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>Filtros</p>
                {hasActiveFilters && (
                  <button onClick={resetFilters} style={{ fontSize: 13, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Limpar
                  </button>
                )}
              </div>

              {/* Pesquisa */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Pesquisa</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 12px' }}>
                  <Search size={14} color="#9B7A5A" />
                  <input
                    type="text"
                    placeholder="Pesquisar trabalhos..."
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#2C1A0E', background: 'transparent' }}
                  />
                  {filters.search && (
                    <button onClick={() => setFilters(f => ({ ...f, search: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}>
                      <X size={13} color="#9B7A5A" />
                    </button>
                  )}
                </div>
              </div>

              {/* Distância */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Distância</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DISTANCE_OPTS.map(d => (
                    <button
                      key={d}
                      onClick={() => setFilters(f => ({ ...f, distancia: f.distancia === d ? 0 : d }))}
                      style={{
                        flex: 1, padding: '7px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '0.5px solid',
                        background: filters.distancia === d ? '#C85A1A' : '#FAF7F2',
                        color: filters.distancia === d ? '#fff' : '#7A6048',
                        borderColor: filters.distancia === d ? '#C85A1A' : '#EDE6DC',
                      }}
                    >
                      {d} km
                    </button>
                  ))}
                </div>
                {filters.distancia > 0 && !userPos && (
                  <p style={{ fontSize: 12, color: '#9B7A5A', marginTop: 6, margin: '6px 0 0' }}>A aguardar localização…</p>
                )}
              </div>

              {/* Categoria */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Categoria</label>
                <select
                  value={filters.categoria}
                  onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '0.5px solid #EDE6DC', fontSize: 14, color: filters.categoria ? '#2C1A0E' : '#9B7A5A', outline: 'none', background: '#FAF7F2', cursor: 'pointer' }}
                >
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>

              {/* Tipo de Pedido */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Tipo de Pedido</label>
                <select
                  disabled
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '0.5px solid #EDE6DC', fontSize: 14, color: '#C4B5A5', outline: 'none', background: '#F8F5F2', cursor: 'not-allowed' }}
                >
                  <option>Todos os tipos</option>
                </select>
              </div>

              {/* Urgente */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '10px 12px', borderRadius: 10,
                    background: filters.urgente ? '#FFF4EC' : '#FAF7F2',
                    border: `0.5px solid ${filters.urgente ? '#F5C09A' : '#EDE6DC'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.urgente}
                    onChange={e => setFilters(f => ({ ...f, urgente: e.target.checked }))}
                    style={{ cursor: 'pointer', accentColor: '#C85A1A', width: 15, height: 15 }}
                  />
                  <Zap size={14} color={filters.urgente ? '#C85A1A' : '#9B7A5A'} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: filters.urgente ? '#C85A1A' : '#7A6048' }}>Ver apenas urgentes</span>
                </label>
              </div>

              {/* Ordenar */}
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Ordenar por</label>
                <select
                  value={filters.sort}
                  onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 10, border: '0.5px solid #EDE6DC', fontSize: 14, color: '#2C1A0E', outline: 'none', background: '#FAF7F2', cursor: 'pointer' }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Limpar filtros */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 14, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* CTA novo pedido */}
            <Link href={currentUser ? '/dashboard/novo-pedido' : '/auth?tab=register'}
              style={{ display: 'block', marginTop: 12, background: 'linear-gradient(135deg,#df6a36,#cb5226)', borderRadius: 14, padding: '14px 16px', textAlign: 'center', textDecoration: 'none', boxShadow: '0 6px 20px rgba(200,90,26,0.25)' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>+ Novo Pedido</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Publica gratuitamente</p>
            </Link>
          </div>

          {/* ── GRID PEDIDOS ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, height: 260 }} />
                ))}
              </div>
            ) : pedidos.length === 0 ? (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 10 }}>🔍</p>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Sem trabalhos encontrados</p>
                <p style={{ fontSize: 14, color: '#9B7A5A' }}>Tenta ajustar os filtros para ver mais resultados.</p>
                {hasActiveFilters && (
                  <button onClick={resetFilters} style={{ marginTop: 12, fontSize: 14, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {pedidos.map(pedido => {
                  const cat = CATEGORIES.find(c => c.slug === pedido.category || norm(c.slug) === norm(pedido.category ?? ''))
                  const isNovo = (Date.now() - new Date(pedido.created_at).getTime()) < 86400000
                  const isUrgente = (Date.now() - new Date(pedido.created_at).getTime()) < 7200000
                  const blocked = pedido.offerCount >= 3 && !currentUser?.profile?.is_pro
                  const alreadySent = !!pedido.myOffer

                  return (
                    <div
                      key={pedido.id}
                      style={{
                        background: '#fff',
                        border: `0.5px solid ${isUrgente ? '#F5C09A' : '#EDE6DC'}`,
                        borderRadius: 16,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>

                        {/* LIGNE 1 – Badges gauche + Bloc client droite */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            {isUrgente && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#FFF0EB', color: '#C85A1A', borderRadius: 99, padding: '3px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                <Zap size={9} /> URGENTE
                              </span>
                            )}
                            {isNovo && !isUrgente && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#E8F5E9', color: '#2E7D32', borderRadius: 99, padding: '3px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                🔥 NOVO
                              </span>
                            )}
                            {cat && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {cat.iconImg ? <img src={cat.iconImg} style={{ width: 10, height: 10, objectFit: 'contain' }} alt="" /> : null}
                                {cat.label}
                              </span>
                            )}
                          </div>

                          {/* Bloc client encadré */}
                          {pedido.client && (
                            <div
                              onClick={e => { e.stopPropagation(); openClientPopup(pedido.client_id) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 7, border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '5px 8px', cursor: 'pointer', flexShrink: 0, background: '#FAF7F2' }}
                            >
                              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: '#FBF0E8', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#C85A1A' }}>
                                {pedido.client.profile_photo
                                  ? <Image src={pedido.client.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                  : (pedido.client.name?.charAt(0) ?? '?')
                                }
                              </div>
                              <div style={{ lineHeight: 1.2 }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', margin: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pedido.client.name}</p>
                                {(pedido.client.average_rating ?? 0) > 0 ? (
                                  <p style={{ fontSize: 11, color: '#7A6048', margin: 0 }}>
                                    ⭐ {pedido.client.average_rating!.toFixed(1)} <span style={{ color: '#B09070' }}>({pedido.client.reviews_count})</span>
                                  </p>
                                ) : (
                                  <p style={{ fontSize: 11, color: '#B09070', margin: 0 }}>Novo cliente</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* LIGNE 2 – Titre */}
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.3, margin: 0 }}>
                          {pedido.title}
                        </p>

                        {/* LIGNE 3 – Localização · tempo · fotos */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {pedido.city && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#7A6048' }}>
                              <MapPin size={11} color="#C85A1A" /> {pedido.city}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9B7A5A' }}>
                            <Clock size={11} color="#9B7A5A" /> {timeAgo(pedido.created_at)}
                          </span>
                          {pedido.photos?.length > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9B7A5A' }}>
                              <Camera size={11} color="#9B7A5A" /> {pedido.photos.length} foto{pedido.photos.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* LIGNE 4 – Budget + 1 photo ou placeholder */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {pedido.budget > 0 && (
                            <span style={{ background: '#F0FAF0', color: '#2E7D32', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 700 }}>
                              € {pedido.budget}
                            </span>
                          )}
                          {/* Photo ou placeholder */}
                          {pedido.photos?.length > 0 ? (
                            <img
                              src={pedido.photos[0]}
                              alt=""
                              onClick={e => { e.stopPropagation(); setLightboxUrl(pedido.photos[0]) }}
                              style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', cursor: 'zoom-in', border: '0.5px solid #EDE6DC', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: 52, height: 52, borderRadius: 8, background: cat?.bg ?? '#FAF7F2', border: '0.5px solid #EDE6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {cat?.iconImg
                                ? <img src={cat.iconImg} style={{ width: 26, height: 26, objectFit: 'contain', opacity: 0.6 }} alt="" />
                                : <Camera size={20} color={cat?.color ?? '#9B7A5A'} style={{ opacity: 0.5 }} />
                              }
                            </div>
                          )}
                        </div>

                        {/* Separador */}
                        <div style={{ borderTop: '0.5px solid #F0E8DC', margin: '2px 0' }} />

                        {/* PRESTADORES que responderam / À espera */}
                        {pedido.offerCount > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ display: 'flex', flexShrink: 0 }}>
                              {(pedido.offerProviders as any[]).slice(0, 3).map((offer: any, i: number) => (
                                <div key={i} style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #fff', marginLeft: i > 0 ? -16 : 0, background: '#FBF0E8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#C85A1A', zIndex: 3 - i }}>
                                  {offer.user?.profile_photo
                                    ? <Image src={offer.user.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                    : (offer.user?.name?.charAt(0) ?? '?')
                                  }
                                </div>
                              ))}
                            </div>
                            <p style={{ fontSize: 12, color: '#7A6048', margin: 0, lineHeight: 1.3 }}>
                              Prestadores que responderam… e tu?
                            </p>
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: '#B09070', margin: 0, fontStyle: 'italic' }}>
                            À espera da tua resposta…
                          </p>
                        )}
                      </div>

                      {/* LIGNE 6 – Actions */}
                      <div style={{ padding: '10px 14px', borderTop: '0.5px solid #F0E8DC', display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setDetailPedido(pedido)}
                          style={{ flex: 1, padding: '9px 10px', borderRadius: 10, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Ver detalhes
                        </button>
                        {!alreadySent ? (
                          <button
                            onClick={() => handlePropostaClick(pedido)}
                            style={{ flex: 1, padding: '9px 10px', borderRadius: 10, background: blocked ? '#EDE6DC' : '#C85A1A', border: 'none', fontSize: 13, color: blocked ? '#9B7A5A' : '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                          >
                            {!blocked && <Send size={12} />}
                            {blocked ? 'Fechado' : 'Enviar proposta'}
                          </button>
                        ) : (
                          <div style={{ flex: 1, padding: '9px 10px', borderRadius: 10, background: '#FBF0E8', fontSize: 13, color: '#C85A1A', fontWeight: 600, textAlign: 'center' }}>
                            {pedido.myOffer?.status === 'accepted' ? '✓ Aceite' : 'Proposta enviada'}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── POPUP DETALHES PEDIDO ── */}
      {detailPedido && (() => {
        const dcat = CATEGORIES.find(c => c.slug === detailPedido.category || norm(c.slug) === norm(detailPedido.category ?? ''))
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setDetailPedido(null)}>
            <div style={{ background: '#fff', borderRadius: 22, maxWidth: 590, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>

              {/* ── HEADER sticky ── */}
              <div style={{ padding: '18px 20px 14px', borderBottom: '0.5px solid #F0E8DC', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }}>

                  {/* Gauche: badge + titre */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {dcat && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: dcat.bg, color: dcat.color, borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                        {dcat.iconImg ? <img src={dcat.iconImg} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" /> : null}
                        {dcat.label}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'Lora, serif', fontSize: 21, fontWeight: 700, color: '#2C1A0E', margin: 0, lineHeight: 1.25 }}>{detailPedido.title}</h2>
                  </div>

                  {/* Droite: client mini-block + X */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => setDetailPedido(null)} style={{ background: '#FAF7F2', border: 'none', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={16} color="#9B7A5A" />
                    </button>
                    {detailPedido.client && (
                      <div
                        onClick={() => { setDetailPedido(null); openClientPopup(detailPedido.client_id) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', background: '#FAF7F2' }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: '#FBF0E8', position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#C85A1A' }}>
                          {detailPedido.client.profile_photo
                            ? <Image src={detailPedido.client.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                            : (detailPedido.client.name?.charAt(0) ?? '?')
                          }
                        </div>
                        <div style={{ lineHeight: 1.25 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>{detailPedido.client.name}</p>
                          {(detailPedido.client.average_rating ?? 0) > 0
                            ? <p style={{ fontSize: 11, color: '#7A6048', margin: 0 }}>⭐ {detailPedido.client.average_rating!.toFixed(1)} <span style={{ color: '#B09070' }}>({detailPedido.client.reviews_count})</span></p>
                            : <p style={{ fontSize: 11, color: '#B09070', margin: 0 }}>Novo cliente</p>
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Infos rapides */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  {detailPedido.city && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#7A6048' }}>
                      <MapPin size={12} color="#C85A1A" /> {detailPedido.city}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}>
                    📅 {new Date(detailPedido.created_at).toLocaleDateString('pt-PT')}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}>
                    <Clock size={12} color="#9B7A5A" /> {timeAgo(detailPedido.created_at)}
                  </span>
                  {detailPedido.photos?.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#9B7A5A' }}>
                      <Camera size={12} color="#9B7A5A" /> {detailPedido.photos.length} foto{detailPedido.photos.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {detailPedido.budget > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#2E7D32', background: '#F0FAF0', borderRadius: 6, padding: '2px 8px' }}>
                      € {detailPedido.budget}
                    </span>
                  )}
                </div>
              </div>

              {/* ── BODY ── */}
              <div style={{ padding: '18px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* PHOTO principale ou placeholder */}
                {detailPedido.photos?.length > 0 ? (
                  <div>
                    <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9', position: 'relative', cursor: 'zoom-in' }}
                      onClick={() => setLightboxUrl(detailPedido.photos[0])}>
                      <Image src={detailPedido.photos[0]} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    {detailPedido.photos.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        {(detailPedido.photos as string[]).slice(1).map((url: string, i: number) => (
                          <div key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', cursor: 'zoom-in', flexShrink: 0 }}
                            onClick={() => setLightboxUrl(url)}>
                            <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ borderRadius: 14, background: dcat?.bg ?? '#FAF7F2', border: '0.5px solid #EDE6DC', height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {dcat?.iconImg
                      ? <img src={dcat.iconImg} style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.5 }} alt="" />
                      : <Camera size={32} color={dcat?.color ?? '#9B7A5A'} style={{ opacity: 0.4 }} />
                    }
                    <p style={{ fontSize: 13, color: '#9B7A5A', margin: 0 }}>Sem fotografias adicionadas</p>
                  </div>
                )}

                {/* DESCRIÇÃO */}
                {detailPedido.description && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Descrição do pedido</p>
                    <p style={{ fontSize: 15, color: '#5A3E28', lineHeight: 1.7, margin: 0 }}>{detailPedido.description}</p>
                  </div>
                )}

                {/* RESPONDENTES */}
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

                {/* SEGURANÇA */}
                <div style={{ background: '#F0FFF4', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', border: '0.5px solid #BBF7D0' }}>
                  <Shield size={16} color="#166534" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: '0 0 3px' }}>🤝 Comunidade de confiança</p>
                    <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5, margin: 0 }}>Consulte sempre o perfil, as avaliações e a experiência antes de aceitar um trabalho.</p>
                  </div>
                </div>

                {/* AÇÕES */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleShare(detailPedido)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '0.5px solid #D4C4B0', background: '#fff', fontSize: 14, color: '#5A3E28', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Share2 size={14} /> Partilhar
                  </button>
                  {detailPedido.myOffer ? (
                    <div style={{ flex: 2, padding: '12px', borderRadius: 12, background: '#FBF0E8', fontSize: 14, color: '#C85A1A', fontWeight: 600, textAlign: 'center' }}>
                      {detailPedido.myOffer?.status === 'accepted' ? '✓ Proposta aceite' : 'Proposta enviada'}
                    </div>
                  ) : (
                    <button
                      onClick={() => { setDetailPedido(null); handlePropostaClick(detailPedido) }}
                      style={{ flex: 2, padding: '12px', borderRadius: 12, background: '#C85A1A', border: 'none', fontSize: 14, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Send size={14} /> Enviar proposta
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── POPUP PERFIL CLIENT ── */}
      {clientPopup && (() => {
        const memberSince = new Date(clientPopup.created_at)
        const memberLabel = memberSince.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
        const monthsOld = (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)
        const isRecent = monthsOld < 3
        const hasRating = (clientPopup.average_rating ?? 0) > 0
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={() => setClientPopup(null)}>
            <div style={{ background: '#fff', borderRadius: 22, maxWidth: 420, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', position: 'relative' }}
              onClick={e => e.stopPropagation()}>

              {/* Illustration fond gauche */}
              <img src="/icons/casa.png" alt="" style={{ position: 'absolute', top: 0, left: 0, width: 160, height: 160, objectFit: 'contain', opacity: 0.07, pointerEvents: 'none', userSelect: 'none' }} />

              {/* Bouton fermer */}
              <button onClick={() => setClientPopup(null)}
                style={{ position: 'absolute', top: 14, right: 14, background: '#FAF7F2', border: 'none', cursor: 'pointer', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <X size={15} color="#9B7A5A" />
              </button>

              {/* ── PARTIE HAUTE ── */}
              <div style={{ padding: '32px 24px 20px', textAlign: 'center', position: 'relative' }}>
                {/* Photo */}
                <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 14px', background: '#FBF0E8', position: 'relative', border: '3px solid #fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                  {clientPopup.profile_photo
                    ? <Image src={clientPopup.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 700, color: '#C85A1A' }}>{clientPopup.name?.charAt(0)}</div>
                  }
                </div>

                {/* Nom */}
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', margin: '0 0 6px' }}>{clientPopup.name}</h3>

                {/* Ville */}
                {clientPopup.city && (
                  <p style={{ fontSize: 14, color: '#7A6048', margin: '0 0 6px' }}>📍 {clientPopup.city}</p>
                )}

                {/* Note */}
                {hasRating ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: '0 0 6px' }}>
                    <Star size={14} color="#F9AB00" fill="#F9AB00" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{clientPopup.average_rating.toFixed(1)}</span>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>({clientPopup.reviews_count} avaliações)</span>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#9B7A5A', margin: '0 0 6px' }}>Sem avaliações ainda</p>
                )}

                {/* Membro desde */}
                <p style={{ fontSize: 13, color: '#B09070', margin: '0 0 12px' }}>🌱 Membro desde {memberLabel}</p>

                {/* Badge communauté récent */}
                {isRecent && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FFF4', color: '#166534', border: '0.5px solid #BBF7D0', borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                    🌱 Membro recente da comunidade
                  </span>
                )}
              </div>

              {/* ── 3 CARTES ── */}
              <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {/* Carte 1 — Perfil */}
                <div style={{ background: '#F0FFF4', border: '0.5px solid #BBF7D0', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>🏠</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#166534', margin: '0 0 4px' }}>Perfil público</p>
                  <p style={{ fontSize: 11, color: '#4B7A5A', lineHeight: 1.4, margin: 0 }}>Utiliza o Chama o Vizinho para encontrar profissionais locais.</p>
                </div>

                {/* Carte 2 — Avaliações */}
                <div style={{ background: '#FFFBF5', border: '0.5px solid #F5DFC8', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>⭐</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E', margin: '0 0 4px' }}>Avaliações</p>
                  <p style={{ fontSize: 11, color: '#7A6048', lineHeight: 1.4, margin: 0 }}>
                    {hasRating ? `${clientPopup.reviews_count} avaliações recebidas` : 'Ainda sem avaliações'}
                  </p>
                </div>

                {/* Carte 3 — Comunidade */}
                <div style={{ background: '#FFF4EC', border: '0.5px solid #F5C09A', borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2CC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>🤝</div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A', margin: '0 0 4px' }}>Comunidade</p>
                  <p style={{ fontSize: 11, color: '#7A4010', lineHeight: 1.4, margin: 0 }}>A confiança e as avaliações constroem uma comunidade melhor.</p>
                </div>
              </div>

              {/* ── BLOC BAS — família ── */}
              <div style={{ margin: '0 16px 16px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', minHeight: 90 }}>
                <img src="/icons/familia.png" alt="" style={{ width: 90, height: 90, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', margin: '0 0 4px', lineHeight: 1.3 }}>Juntos construímos uma comunidade melhor</p>
                  <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, margin: 0 }}>Cada avaliação e cada interação ajudam a tornar o Chama o Vizinho mais seguro e confiável para todos.</p>
                </div>
              </div>

              {/* ── BOUTON FECHAR ── */}
              <div style={{ padding: '0 16px 20px' }}>
                <button onClick={() => setClientPopup(null)}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 15, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── POPUP PREMIUM ── */}
      {premiumModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setPremiumModal(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>Plano Premium</h2>
            <p style={{ fontSize: 15, color: '#7A6048', lineHeight: 1.6, marginBottom: 20 }}>
              Este pedido já tem 3 propostas. Com o plano Premium podes responder sem limites e ter destaque nos resultados.
            </p>
            <div style={{ background: '#FBF0E8', borderRadius: 14, padding: '16px', marginBottom: 20 }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#C85A1A', fontFamily: 'Lora, serif' }}>7,99€<span style={{ fontSize: 16, fontWeight: 500 }}>/mês</span></p>
              <p style={{ fontSize: 14, color: '#9B7A5A', marginTop: 2 }}>90 dias de teste grátis</p>
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

      {/* — POPUP TORNA-TE PRESTADOR — */}
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

      {/* ── PROPOSTA MODAL ── */}
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

      {/* ── LIGHTBOX ── */}
      {lightboxUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', borderRadius: 8, padding: 8 }}>
            <X size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  )
}
