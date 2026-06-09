'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, SlidersHorizontal, Send, X, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, REGIONS } from '@/types'

interface Props {
  currentUser: {
    id: string
    profile: any
    providerProfile: any
  } | null
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'budget_desc', label: 'Maior orçamento' },
  { value: 'budget_asc', label: 'Menor orçamento' },
]

export default function ExplorarClient({ currentUser }: Props) {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)
  const [filters, setFilters] = useState({
    categoria: '',
    regiao: '',
    cidade: '',
    search: '',
    sort: 'recent',
    budgetMax: '',
  })
  const supabase = createClient()

  const fetchPedidos = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('service_requests')
      .select('id, title, description, category, city, status, budget, created_at, client_id, photos')
      .eq('status', 'open')
      .eq('is_archived', false)

    if (filters.categoria) {
      query = query.ilike('category', `%${filters.categoria}%`)
    }
    if (filters.cidade) {
      query = query.ilike('city', `%${filters.cidade}%`)
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters.budgetMax) {
      query = query.lte('budget', parseFloat(filters.budgetMax))
    }

    if (filters.sort === 'recent') {
      query = query.order('created_at', { ascending: false })
    } else if (filters.sort === 'budget_desc') {
      query = query.order('budget', { ascending: false })
    } else {
      query = query.order('budget', { ascending: true })
    }

    query = query.limit(20)
    const { data: requests } = await query
    if (!requests) { setLoading(false); return }

    // Fetch clients
    const clientIds = Array.from(new Set(requests.map((r: any) => r.client_id).filter(Boolean)))
    const { data: clients } = clientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', clientIds)
      : { data: [] }

    // Fetch offers per pedido
    const pedidoIds = requests.map((r: any) => r.id)
    const { data: offers } = pedidoIds.length > 0
      ? await supabase
          .from('offers')
          .select('id, service_request_id, provider_id, status')
          .in('service_request_id', pedidoIds)
      : { data: [] }

    // Fetch provider profiles for offers
    const providerIds = Array.from(new Set((offers ?? []).map((o: any) => o.provider_id).filter(Boolean)))
    const { data: providerUsers } = providerIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', providerIds)
      : { data: [] }

    // Fetch provider_profiles to get user_id mapping
    const { data: providerProfiles } = providerIds.length > 0
      ? await supabase.from('provider_profiles').select('id, user_id').in('id', providerIds)
      : { data: [] }

    const merged = requests.map((r: any) => {
      const client = clients?.find((c: any) => c.id === r.client_id)
      const pedidoOffers = (offers ?? []).filter((o: any) => o.service_request_id === r.id)
      const offerProviders = pedidoOffers.map((o: any) => {
        const pp = providerProfiles?.find((p: any) => p.id === o.provider_id)
        const user = providerUsers?.find((u: any) => u.id === pp?.user_id)
        return { ...o, user }
      })
      const myOffer = currentUser?.providerProfile
        ? pedidoOffers.find((o: any) => o.provider_id === currentUser.providerProfile?.id)
        : null

      return { ...r, client, offers: offerProviders, myOffer }
    })

    setPedidos(merged)
    setLoading(false)
  }, [filters, currentUser])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  const handlePropostaClick = (pedidoId: string) => {
    if (!currentUser) {
      window.location.href = `/auth?redirect=/explorar`
      return
    }
    if (!currentUser.providerProfile) {
      setShowProviderModal(true)
      return
    }
    window.location.href = `/pedidos/${pedidoId}/proposta`
  }

  const resetFilters = () => setFilters({ categoria: '', regiao: '', cidade: '', search: '', sort: 'recent', budgetMax: '' })
  const activeFiltersCount = [filters.categoria, filters.regiao, filters.cidade, filters.budgetMax].filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      {/* Hero banner */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          src="https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/pedido%20desktop.png"
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized
        />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
            Encontre Pedidos na Sua Vizinhança
          </h1>
          <p style={{ fontSize: 13, color: '#8B6848' }}>Encontra pedidos perto de ti e envia propostas.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search bar + filtros toggle */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '8px 14px' }}>
            <Search size={15} color="#9B7A5A" />
            <input
              type="text"
              placeholder="Pesquisar pedidos..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#2C1A0E', background: 'transparent' }}
            />
            {filters.search && <button onClick={() => setFilters(f => ({ ...f, search: '' }))}><X size={13} color="#9B7A5A" /></button>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: activeFiltersCount > 0 ? '#C85A1A' : '#fff', color: activeFiltersCount > 0 ? '#fff' : '#7A6048', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <SlidersHorizontal size={15} />
            Filtros
            {activeFiltersCount > 0 && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 99, padding: '0 6px', fontSize: 11 }}>{activeFiltersCount}</span>}
          </button>
          <select
            value={filters.sort}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
            style={{ padding: '8px 12px', borderRadius: 10, border: '0.5px solid #EDE6DC', background: '#fff', fontSize: 13, color: '#7A6048', outline: 'none', cursor: 'pointer' }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* ── FILTROS SIDEBAR ── */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>Filtros</p>
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters} style={{ fontSize: 11, color: '#C85A1A', cursor: 'pointer', background: 'none', border: 'none' }}>Limpar</button>
                )}
              </div>

              {/* Região */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#7A6048', display: 'block', marginBottom: 6 }}>Região</label>
                <select
                  value={filters.regiao}
                  onChange={e => setFilters(f => ({ ...f, regiao: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}>
                  <option value="">Todas as regiões</option>
                  {REGIONS.map(r => <option key={r.slug} value={r.label}>{r.label}</option>)}
                </select>
              </div>

              {/* Cidade */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#7A6048', display: 'block', marginBottom: 6 }}>Cidade / Área</label>
                <input
                  type="text"
                  placeholder="Ex: Lisboa, Porto..."
                  value={filters.cidade}
                  onChange={e => setFilters(f => ({ ...f, cidade: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}
                />
              </div>

              {/* Categoria */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#7A6048', display: 'block', marginBottom: 6 }}>Categoria</label>
                <select
                  value={filters.categoria}
                  onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}>
                  <option value="">Todas as categorias</option>
                  {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              {/* Orçamento */}
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#7A6048', display: 'block', marginBottom: 6 }}>Orçamento máx. (€)</label>
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.budgetMax}
                  onChange={e => setFilters(f => ({ ...f, budgetMax: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid #EDE6DC', fontSize: 12, color: '#2C1A0E', outline: 'none', background: '#FAF7F2' }}
                />
              </div>
            </div>

            {/* Novo pedido CTA */}
            <Link href={currentUser ? '/dashboard/novo-pedido' : '/auth?tab=register'}
              style={{ display: 'block', marginTop: 10, background: '#C85A1A', borderRadius: 12, padding: '12px 16px', textAlign: 'center', textDecoration: 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>+ Novo Pedido</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Publica gratuitamente</p>
            </Link>
          </div>

          {/* ── LISTA PEDIDOS ── */}
          <div className="lg:col-span-3">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, height: 140, animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : pedidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pedidos.map(pedido => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    currentUser={currentUser}
                    onPropostaClick={handlePropostaClick}
                  />
                ))}
              </div>
            ) : (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '48px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🔍</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Sem pedidos encontrados</p>
                <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 16 }}>Tenta outros filtros ou publica o teu pedido.</p>
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters} className="btn-secondary" style={{ fontSize: 12 }}>Limpar filtros</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal "Torna-te prestador" */}
      {showProviderModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowProviderModal(false)}>
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🔧</div>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 600, color: '#2C1A0E', marginBottom: 8 }}>Torna-te Prestador</h2>
              <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.6 }}>
                Para enviar propostas precisas de criar um perfil de prestador. É gratuito e rápido!
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                href="/dashboard/perfil?tab=prestador"
                className="btn-primary"
                style={{ textAlign: 'center' }}
                onClick={() => setShowProviderModal(false)}>
                Criar perfil de prestador
              </Link>
              <button
                onClick={() => setShowProviderModal(false)}
                className="btn-secondary"
                style={{ textAlign: 'center' }}>
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PedidoCard({ pedido, currentUser, onPropostaClick }: { pedido: any, currentUser: any, onPropostaClick: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORIES.find(c => c.slug === pedido.category || c.slug.toLowerCase() === (pedido.category ?? '').toLowerCase())
  const alreadySent = !!pedido.myOffer
  const offerCount = pedido.offers?.length ?? 0

  return (
    <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {alreadySent && (
              <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
                {pedido.offers?.length} proposta{offerCount !== 1 ? 's' : ''} enviada{offerCount !== 1 ? 's' : ''}
              </span>
            )}
            {!alreadySent && offerCount > 0 && (
              <span style={{ background: '#F5E8D6', color: '#854A1A', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>
                {offerCount} proposta{offerCount !== 1 ? 's' : ''}
              </span>
            )}
            {offerCount === 0 && (
              <span style={{ background: '#F0EDE8', color: '#9B7A5A', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>
                Nenhuma proposta enviada ainda
              </span>
            )}
            <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>em aberto</span>
          </div>
          <span style={{ fontSize: 11, color: '#B09070', flexShrink: 0 }}>
            {new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Category badge */}
        {cat && (
          <span style={{ background: '#F5E8D6', color: '#854A1A', border: '0.5px solid #E0CCBB', borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 500, display: 'inline-block', marginBottom: 6 }}>
            {cat.icon} {cat.label}
          </span>
        )}

        {/* Title */}
        <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 6, lineHeight: 1.3 }}>{pedido.title}</p>

        {/* Description */}
        {pedido.description && (
          <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
            {pedido.description}
          </p>
        )}

        {/* Meta */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {pedido.client && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C85A1A', fontWeight: 500, flexShrink: 0 }}>
                {pedido.client.name?.charAt(0) ?? '?'}
              </div>
              <span style={{ fontSize: 11, color: '#7A6048' }}>{pedido.client.name}</span>
              <Link href={`/prestadores/perfil/${pedido.client_id}`} style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none' }}>Ver Perfil</Link>
            </div>
          )}
          {pedido.city && <span style={{ fontSize: 11, color: '#7A6048' }}>📍 {pedido.city}</span>}
          {pedido.budget > 0 && <span style={{ fontSize: 11, color: '#7A6048' }}>€ {pedido.budget}</span>}
        </div>

        {/* Ofertas respondidas */}
        {pedido.offers?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C85A1A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ChevronDown size={13} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              {expanded ? 'Ocultar' : 'Ver'} prestadores que responderam
            </button>
            {expanded && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pedido.offers.map((offer: any) => (
                  <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '4px 8px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C85A1A', fontWeight: 500 }}>
                      {offer.user?.name?.charAt(0) ?? '?'}
                    </div>
                    <span style={{ fontSize: 11, color: '#2C1A0E', fontWeight: 500 }}>{offer.user?.name ?? 'Prestador'}</span>
                    <span style={{
                      fontSize: 10,
                      background: offer.status === 'accepted' ? '#EAF3DE' : offer.status === 'rejected' ? '#F5E8D6' : '#F0EDE8',
                      color: offer.status === 'accepted' ? '#3B6D11' : offer.status === 'rejected' ? '#C85A1A' : '#9B7A5A',
                      borderRadius: 99, padding: '1px 6px'
                    }}>
                      {offer.status === 'accepted' ? 'aceite' : offer.status === 'rejected' ? 'recusado' : 'pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid #F0E8DC', paddingTop: 10 }}>
          <span style={{ fontSize: 11, color: alreadySent ? '#C85A1A' : '#9B7A5A' }}>
            {alreadySent
              ? `Proposta ${pedido.myOffer?.status === 'accepted' ? 'aceite ✓' : pedido.myOffer?.status === 'rejected' ? 'recusada' : 'enviada'}`
              : 'Nenhuma proposta enviada ainda'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/pedidos/${pedido.id}`}
              style={{ padding: '6px 12px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              👁 Ver Detalhes
            </Link>
            {!alreadySent && (
              <button
                onClick={() => onPropostaClick(pedido.id)}
                style={{ padding: '6px 12px', borderRadius: 8, background: '#C85A1A', border: 'none', fontSize: 12, color: '#fff', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Send size={12} /> Enviar Proposta
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
