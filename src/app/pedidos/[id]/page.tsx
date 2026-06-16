import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, ArrowLeft, Star, CheckCircle, Send, MessageCircle, UserCheck, Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CATEGORIES } from '@/types'
import PhotoLightbox from '@/components/ui/PhotoLightbox'
import PropostaModal from '@/components/ui/PropostaModal'
import PedidoCompleteButton from '@/components/ui/PedidoCompleteButton'

interface Props { params: { id: string } }

function norm(s: string) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_') }
function getCatInfo(slug: string | null) {
  const n = norm(slug ?? '')
  return CATEGORIES.find(c => c.slug === slug || norm(c.slug) === n)
    ?? { icon: '🔧', iconImg: null as string | null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: 'Em aberto',    bg: '#EAF3DE', color: '#3B6D11' },
  in_progress: { label: 'Em curso', bg: '#FFF3E0', color: '#E65100' },
  completed:   { label: 'Concluído',    bg: '#E3F2FD', color: '#1565C0' },
  cancelled:   { label: 'Cancelado',    bg: '#F3F4F6', color: '#6B7280' },
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Recibo Verde': { bg: '#E8F5E9', color: '#2E7D32' },
  'Empresa':      { bg: '#E3F2FD', color: '#1565C0' },
  'Particular':   { bg: '#FBF0E8', color: '#7A4F28' },
}

function getElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `há ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `há ${days}d`
}

export default async function PedidoDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Server actions ─────────────────────────────────────────────────────
  async function acceptOffer(formData: FormData) {
    'use server'
    const offerId   = formData.get('offerId') as string
    const requestId = formData.get('requestId') as string
    if (!offerId || !requestId) return
    const supa = createClient()
    await supa.from('offers').update({ status: 'accepted' }).eq('id', offerId)
    await supa.from('offers').update({ status: 'declined' })
      .eq('service_request_id', requestId).neq('id', offerId)
    await supa.from('service_requests').update({ status: 'in_progress' }).eq('id', requestId)
    revalidatePath(`/pedidos/${requestId}`)
  }

  async function declineOffer(formData: FormData) {
    'use server'
    const offerId   = formData.get('offerId') as string
    const requestId = formData.get('requestId') as string
    if (!offerId || !requestId) return
    const supa = createClient()
    await supa.from('offers').update({ status: 'declined' }).eq('id', offerId)
    revalidatePath(`/pedidos/${requestId}`)
  }

  // ── Fetch pedido ───────────────────────────────────────────────────────
  const { data: pedido } = await supabase
    .from('service_requests').select('*').eq('id', params.id).single()
  if (!pedido) notFound()

  const cat    = getCatInfo(pedido.category)
  const status = STATUS_MAP[pedido.status] ?? STATUS_MAP.open
  const isNew  = (Date.now() - new Date(pedido.created_at).getTime()) < 86400000

  // ── Client profile ─────────────────────────────────────────────────────
  const { data: client } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, city, average_rating, reviews_count, last_seen, created_at, email, phone, is_client')
    .eq('id', pedido.client_id).single()

  // ── Offers + provider profiles ─────────────────────────────────────────
  const { data: rawOffers } = await supabase
    .from('offers')
    .select('id, provider_id, status, created_at, message, price, availability')
    .eq('service_request_id', params.id)
    .order('created_at', { ascending: false })

  let offersWithProviders: any[] = []
  if (rawOffers && rawOffers.length > 0) {
    const providerIds = rawOffers.map((o: any) => o.provider_id)
    const { data: providerProfiles } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo, is_verified, provider_type')
      .in('user_id', providerIds)
    const { data: providerUsers } = await supabase
      .from('user_profiles').select('id, name, profile_photo, city').in('id', providerIds)
    offersWithProviders = rawOffers.map((o: any) => {
      const pp = providerProfiles?.find((p: any) => p.user_id === o.provider_id)
      const u  = providerUsers?.find((u: any) => u.id === o.provider_id)
      return { ...o, provider_profile: pp, user: u }
    })
  }

  // ── Current user context ───────────────────────────────────────────────
  let myProviderProfile: any = null
  if (user) {
    const { data: pp } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single()
    myProviderProfile = pp
  }
  const isOwner    = user?.id === pedido.client_id
  const myOffer    = user ? offersWithProviders.find(o => o.provider_id === user.id || o.provider_id === myProviderProfile?.id) : null
  const isProvider = !!myProviderProfile && !isOwner
  const isVisitor  = !isOwner && !isProvider

  // ── Template fields ────────────────────────────────────────────────────
  const templateFields = pedido.fields && typeof pedido.fields === 'object' && !Array.isArray(pedido.fields)
    ? Object.entries(pedido.fields as Record<string, any>).filter(([, v]) => v !== null && v !== '')
    : []

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 80 }}>

      {/* ══ HEADER PRINCIPAL ══════════════════════════════════════════════ */}
      <div style={{ background: '#2C1A0E' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" style={{ paddingTop: 18, paddingBottom: 22 }}>
          <Link href="/explorar" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Ícone categoria */}
            <div style={{ width: 58, height: 58, borderRadius: 14, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cat.iconImg
                ? <img src={cat.iconImg} alt={cat.label} style={{ width: 34, height: 34, objectFit: 'contain' }} />
                : <span style={{ fontSize: 28 }}>{cat.icon}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ background: status.bg, color: status.color, borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>
                  {status.label}
                </span>
                {isNew && (
                  <span style={{ background: '#10B981', color: '#fff', borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em' }}>
                    NOVO
                  </span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '3px 11px', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {cat.iconImg && <img src={cat.iconImg} style={{ width: 10, height: 10, objectFit: 'contain', opacity: 0.75 }} alt="" />}
                  {cat.label}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>
                {pedido.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {pedido.city}{(pedido as any).primary_region ? ` · ${(pedido as any).primary_region}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── INFOS RAPIDES ── */}
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div style={{ display: 'flex', overflowX: 'auto' }}>
              {[
                { icon: <Calendar size={13} color="#F9AB00" />, label: new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { icon: <Users size={13} color="#F9AB00" />, label: `${offersWithProviders.length} proposta${offersWithProviders.length !== 1 ? 's' : ''}` },
                { icon: <Clock size={13} color="#F9AB00" />, label: `Publicado ${getElapsed(pedido.created_at)}` },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, borderRight: i < 2 ? '0.5px solid rgba(255,255,255,0.07)' : 'none', whiteSpace: 'nowrap' }}>
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ CORPS ═════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── COLUNA PRINCIPAL ───────────────────────────────────────── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ZONE PHOTO */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden' }}>
              {pedido.photos?.length > 0 ? (
                <div>
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: '#1a0f08', overflow: 'hidden' }}>
                    <img
                      src={pedido.photos[0]}
                      alt="Foto principal"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    {pedido.photos.length > 1 && (
                      <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                        +{pedido.photos.length - 1} foto{pedido.photos.length - 1 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  {pedido.photos.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, padding: '10px 14px', overflowX: 'auto' }}>
                      {pedido.photos.slice(1, 5).map((photo: string, i: number) => (
                        <div key={i} style={{ width: 72, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '0.5px solid #EDE6DC' }}>
                          <img src={photo} alt={`Foto ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '0 14px 12px' }}>
                    <PhotoLightbox photos={pedido.photos} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 20px', gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.65 }}>
                    {cat.iconImg
                      ? <img src={cat.iconImg} alt={cat.label} style={{ width: 42, height: 42, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 36 }}>{cat.icon}</span>
                    }
                  </div>
                  <p style={{ fontSize: 14, color: '#B09070', fontStyle: 'italic' }}>Sem fotografias adicionadas</p>
                </div>
              )}
            </div>

            {/* DESCRIÇÃO */}
            {(pedido as any).description && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Descrição do pedido</p>
                <p style={{ fontSize: 15, color: '#3A2A1A', lineHeight: 1.8 }}>{(pedido as any).description}</p>
              </div>
            )}

            {/* CHAMPS STRUCTURÉS */}
            {templateFields.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Detalhes do pedido</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {templateFields.map(([key, value], idx) => (
                    <div key={key} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: idx < templateFields.length - 1 ? '0.5px solid #F5EFE7' : 'none' }}>
                      <span style={{ fontSize: 14, color: '#9B7A5A', minWidth: 140, flexShrink: 0, fontWeight: 500 }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                      <span style={{ fontSize: 14, color: '#2C1A0E', fontWeight: 600 }}>
                        {typeof value === 'boolean' ? (value ? '✓ Sim' : '✗ Não') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCALIZAÇÃO */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Localização</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: pedido.latitude ? 14 : 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={17} color="#C85A1A" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{pedido.city}</p>
                  {(pedido as any).primary_region && (
                    <p style={{ fontSize: 13, color: '#9B7A5A', marginTop: 1 }}>{(pedido as any).primary_region}</p>
                  )}
                </div>
              </div>
              {pedido.latitude && pedido.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${pedido.latitude},${pedido.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', textDecoration: 'none', fontWeight: 600, background: '#FAF7F2' }}
                >
                  <MapPin size={12} color="#C85A1A" /> Ver no mapa
                </a>
              )}
            </div>

            {/* ── PROPOSTAS RECEBIDAS (owner) ────────────────────────── */}
            {isOwner && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 700, color: '#2C1A0E' }}>Propostas recebidas</p>
                  <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '3px 11px', fontSize: 13, fontWeight: 700 }}>
                    {offersWithProviders.length}
                  </span>
                </div>
                {offersWithProviders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda sem propostas</p>
                    <p style={{ fontSize: 14, color: '#9B7A5A' }}>Os prestadores ainda não responderam.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {offersWithProviders.map((offer: any) => {
                      const pp          = offer.provider_profile
                      const displayName = pp?.business_name ?? offer.user?.name ?? 'Prestador'
                      const photo       = offer.user?.profile_photo
                      const rating      = pp?.average_rating ?? 0
                      const city        = pp?.company_city ?? offer.user?.city
                      const typeInfo    = TYPE_COLORS[pp?.provider_type] ?? TYPE_COLORS['Particular']
                      const offerStatus = offer.status === 'accepted' ? { label: '✓ Aceite', bg: '#EAF3DE', color: '#3B6D11' }
                                        : offer.status === 'declined' ? { label: 'Recusado', bg: '#F3F4F6', color: '#6B7280' }
                                        : { label: 'Pendente', bg: '#FBF0E8', color: '#C85A1A' }
                      return (
                        <div key={offer.id} style={{ background: '#FAF7F2', border: offer.status === 'accepted' ? '1.5px solid #3B6D11' : '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#C85A1A' }}>
                              {photo ? <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{displayName}</p>
                                {pp?.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>✓ Verificado</span>}
                                {pp?.provider_type && (
                                  <span style={{ background: typeInfo.bg, color: typeInfo.color, borderRadius: 99, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>
                                    {pp.provider_type}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {rating > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Star size={11} color="#F9AB00" fill="#F9AB00" />
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rating.toFixed(1)}</span>
                                    <span style={{ fontSize: 12, color: '#9B7A5A' }}>({pp?.reviews_count ?? 0})</span>
                                  </div>
                                )}
                                {city && <span style={{ fontSize: 12, color: '#9B7A5A', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> {city}</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                              <span style={{ background: offerStatus.bg, color: offerStatus.color, borderRadius: 99, padding: '3px 9px', fontSize: 12, fontWeight: 700 }}>
                                {offerStatus.label}
                              </span>
                              {offer.price && <span style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>€{Number(offer.price).toFixed(0)}</span>}
                            </div>
                          </div>
                          {offer.availability && (
                            <p style={{ fontSize: 13, color: '#9B7A5A', display: 'flex', alignItems: 'center', gap: 4 }}>
                              🕐 {offer.availability}
                            </p>
                          )}
                          {offer.message && (
                            <div style={{ background: '#fff', borderRadius: 9, padding: '10px 12px', border: '0.5px solid #EDE6DC' }}>
                              <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.65 }}>{offer.message}</p>
                            </div>
                          )}
                          {offer.status === 'pending' && pedido.status === 'open' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                              {pp && (
                                <Link href={`/prestadores/perfil/${pp.id}`}
                                  style={{ flex: 1, padding: '8px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 14, color: '#5A3E28', textDecoration: 'none', fontWeight: 600, textAlign: 'center' }}>
                                  Ver perfil
                                </Link>
                              )}
                              <form action={declineOffer} style={{ flex: 1 }}>
                                <input type="hidden" name="offerId" value={offer.id} />
                                <input type="hidden" name="requestId" value={pedido.id} />
                                <button type="submit"
                                  style={{ width: '100%', padding: '8px', borderRadius: 9, background: '#fff', border: '0.5px solid #D4C4B0', fontSize: 14, color: '#7A6048', fontWeight: 600, cursor: 'pointer' }}>
                                  ✕ Recusar
                                </button>
                              </form>
                              <form action={acceptOffer} style={{ flex: 1 }}>
                                <input type="hidden" name="offerId" value={offer.id} />
                                <input type="hidden" name="requestId" value={pedido.id} />
                                <button type="submit"
                                  style={{ width: '100%', padding: '8px', borderRadius: 9, background: '#3B6D11', border: 'none', fontSize: 14, color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                  <UserCheck size={13} /> Aceitar
                                </button>
                              </form>
                            </div>
                          )}
                          {offer.status === 'accepted' && pp && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <Link href={`/prestadores/perfil/${pp.id}`}
                                style={{ padding: '8px', borderRadius: 9, background: '#EAF3DE', border: '0.5px solid #3B6D11', fontSize: 14, color: '#3B6D11', textDecoration: 'none', fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                <MessageCircle size={13} /> Ver prestador aceite
                              </Link>
                              {pedido.status === 'in_progress' && user && (
                                <PedidoCompleteButton
                                  pedidoId={pedido.id}
                                  pedidoTitle={pedido.title}
                                  authorId={user.id}
                                  providerUserId={offer.provider_id}
                                  providerProfile={pp}
                                  providerUser={offer.user}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── CONCORRENTES (provider — anónima) ─────────────────── */}
            {isProvider && offersWithProviders.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>
                  Outros prestadores interessados
                </p>
                <p style={{ fontSize: 14, color: '#9B7A5A', marginBottom: 14 }}>
                  {offersWithProviders.length} prestador{offersWithProviders.length !== 1 ? 'es' : ''} já enviaram proposta
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {offersWithProviders.map((offer: any) => {
                    const pp          = offer.provider_profile
                    const displayName = pp?.business_name ?? offer.user?.name ?? 'Prestador'
                    const photo       = offer.user?.profile_photo
                    const rating      = pp?.average_rating ?? 0
                    const city        = pp?.company_city ?? offer.user?.city
                    const typeInfo    = TYPE_COLORS[pp?.provider_type] ?? TYPE_COLORS['Particular']
                    return (
                      <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#FAF7F2', borderRadius: 10, border: '0.5px solid #EDE6DC' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A' }}>
                          {photo ? <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{displayName}</p>
                            {pp?.provider_type && (
                              <span style={{ background: typeInfo.bg, color: typeInfo.color, borderRadius: 99, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                                {pp.provider_type}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {rating > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Star size={10} color="#F9AB00" fill="#F9AB00" />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{rating.toFixed(1)}</span>
                                <span style={{ fontSize: 11, color: '#9B7A5A' }}>({pp?.reviews_count ?? 0})</span>
                              </div>
                            )}
                            {city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>{city}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── PRESTADORES INTERESSADOS (visitor) ────────────────── */}
            {isVisitor && offersWithProviders.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 17, fontWeight: 700, color: '#2C1A0E' }}>Prestadores interessados</p>
                  <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
                    {offersWithProviders.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {offersWithProviders.map((offer: any) => {
                    const pp          = offer.provider_profile
                    const displayName = pp?.business_name ?? offer.user?.name ?? 'Prestador'
                    const photo       = offer.user?.profile_photo
                    const rating      = pp?.average_rating ?? 0
                    const city        = pp?.company_city ?? offer.user?.city
                    const typeInfo    = TYPE_COLORS[pp?.provider_type] ?? TYPE_COLORS['Particular']
                    return (
                      <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#FAF7F2', borderRadius: 10, border: '0.5px solid #EDE6DC' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A' }}>
                          {photo ? <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{displayName}</p>
                            {pp?.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>✓</span>}
                            {pp?.provider_type && (
                              <span style={{ background: typeInfo.bg, color: typeInfo.color, borderRadius: 99, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
                                {pp.provider_type}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {rating > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Star size={10} color="#F9AB00" fill="#F9AB00" />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{rating.toFixed(1)}</span>
                                <span style={{ fontSize: 11, color: '#9B7A5A' }}>({pp?.reviews_count ?? 0})</span>
                              </div>
                            )}
                            {city && <span style={{ fontSize: 12, color: '#9B7A5A' }}>{city}</span>}
                          </div>
                        </div>
                        {pp && (
                          <Link href={`/prestadores/perfil/${pp.id}`}
                            style={{ padding: '6px 11px', borderRadius: 8, border: '0.5px solid #D4C4B0', fontSize: 13, color: '#5A3E28', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>
                            Ver
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ── SIDEBAR ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* CTA prestador */}
              {!isOwner && pedido.status === 'open' && (
                <div style={{
                  background: myOffer ? '#EAF3DE' : 'linear-gradient(140deg, #2C1A0E 0%, #4A2810 100%)',
                  border: myOffer ? '1px solid #3B6D11' : 'none',
                  borderRadius: 16,
                  padding: '18px',
                }}>
                  {myOffer ? (
                    <div style={{ textAlign: 'center' }}>
                      <CheckCircle size={28} color="#3B6D11" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#3B6D11', marginBottom: 6 }}>Proposta enviada</p>
                      <span style={{ background: myOffer.status === 'accepted' ? '#EAF3DE' : '#FBF0E8', color: myOffer.status === 'accepted' ? '#3B6D11' : '#C85A1A', borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
                        {myOffer.status === 'accepted' ? '✓ Aceite' : myOffer.status === 'declined' ? 'Recusada' : 'Aguarda resposta'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                        Interessado neste pedido?
                      </p>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 1.55 }}>
                        Envia a tua proposta e conecta-te com este cliente.
                      </p>
                      <PropostaModal
                        pedidoId={pedido.id}
                        pedidoTitle={pedido.title}
                        pedidoCity={pedido.city}
                        pedidoBudget={pedido.budget}
                        pedidoDescription={pedido.description}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* DETALHES */}
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 13 }}>Detalhes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>Categoria</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: cat.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {cat.iconImg ? <img src={cat.iconImg} style={{ width: 12, height: 12, objectFit: 'contain' }} alt="" /> : cat.icon} {cat.label}
                    </span>
                  </div>
                  {pedido.city && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#9B7A5A' }}>Localização</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>📍 {pedido.city}</span>
                    </div>
                  )}
                  {pedido.budget > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#9B7A5A' }}>Orçamento</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#3B6D11' }}>Até €{pedido.budget}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>Propostas recebidas</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#C85A1A' }}>{offersWithProviders.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>Publicado em</span>
                    <span style={{ fontSize: 12, color: '#5A3E28' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>ID pedido</span>
                    <span style={{ fontSize: 11, color: '#B09070', fontFamily: 'monospace', letterSpacing: '0.04em' }}>{pedido.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              {/* CLIENTE */}
              {client && (
                <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '16px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Cliente</p>

                  <Link href={`/utilizadores/${client.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 700, color: '#C85A1A', border: '2px solid #F5EFE7' }}>
                      {client.profile_photo
                        ? <img src={client.profile_photo} alt={client.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : client.name?.charAt(0)?.toUpperCase()
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 2 }}>{client.name}</p>
                      {client.city && <p style={{ fontSize: 13, color: '#9B7A5A' }}>📍 {client.city}</p>}
                    </div>
                  </Link>

                  {/* Verifications */}
                  {(client.is_client || client.email || client.phone) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14, padding: '11px 12px', background: '#F8FBF5', borderRadius: 10, border: '0.5px solid #D4E8C8' }}>
                      {client.is_client && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3B6D11', fontWeight: 600 }}>
                          <CheckCircle size={13} color="#3B6D11" /> Cliente verificado
                        </div>
                      )}
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3B6D11', fontWeight: 600 }}>
                          <CheckCircle size={13} color="#3B6D11" /> Email verificado
                        </div>
                      )}
                      {client.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3B6D11', fontWeight: 600 }}>
                          <CheckCircle size={13} color="#3B6D11" /> Telefone verificado
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avaliação */}
                  <div style={{ marginBottom: 10 }}>
                    {(client.average_rating ?? 0) > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Star size={14} color="#F9AB00" fill="#F9AB00" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{client.average_rating?.toFixed(1)}</span>
                        <span style={{ fontSize: 12, color: '#9B7A5A' }}>({client.reviews_count ?? 0} avaliações)</span>
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: '#B09070' }}>Sem avaliações</p>
                    )}
                  </div>

                  {/* Membro desde */}
                  {client.created_at && (
                    <p style={{ fontSize: 12, color: '#B09070', borderTop: '0.5px solid #F5EFE7', paddingTop: 10 }}>
                      Membro desde {new Date(client.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* ══ BAS DE PAGE ═══════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" style={{ marginBottom: 20 }}>
        <div style={{ background: 'linear-gradient(140deg, #2C1A0E 0%, #3D2210 60%, #4A2E1A 100%)', borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 20, overflow: 'hidden' }}>
          <div style={{ flexShrink: 0, width: 76, height: 76 }}>
            <img src="/icons/presta.png" alt="Prestador" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 5, lineHeight: 1.3 }}>
              Queres aumentar as tuas hipóteses?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
              Com o perfil Pro, a tua proposta aparece em destaque e os clientes vêem-te primeiro. Mais visibilidade, mais contratos.
            </p>
            <Link href="/pro"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 12px rgba(200,90,26,0.4)' }}>
              Saber mais
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
