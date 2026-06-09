import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Euro, ArrowLeft, Star, CheckCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'

interface Props { params: { id: string } }

function getCatInfo(slug: string | null) {
  return CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
    ?? { icon: '🔧', iconImg: null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
}

export default async function PedidoDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pedido } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pedido) notFound()

  // Client profile
  const { data: client } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, city, average_rating, reviews_count')
    .eq('id', pedido.client_id)
    .single()

  // Offers
  const { data: offers } = await supabase
    .from('offers')
    .select('id, provider_id, status, created_at')
    .eq('service_request_id', params.id)

  // Provider profiles for offers
  let offersWithProviders: any[] = []
  if (offers && offers.length > 0) {
    const providerIds = offers.map((o: any) => o.provider_id)
    const { data: providerProfiles } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo')
      .in('id', providerIds)

    const userIds = (providerProfiles ?? []).map((p: any) => p.user_id)
    const { data: providerUsers } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city').in('id', userIds)
      : { data: [] }

    offersWithProviders = offers.map((o: any) => {
      const pp = providerProfiles?.find((p: any) => p.id === o.provider_id)
      const user = providerUsers?.find((u: any) => u.id === pp?.user_id)
      return { ...o, provider_profile: pp, user }
    })
  }

  const cat = getCatInfo(pedido.category)

  // Check if current user is provider
  let myProviderProfile: any = null
  if (user) {
    const { data: pp } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    myProviderProfile = pp
  }

  const myOffer = myProviderProfile
    ? offersWithProviders.find(o => o.provider_id === myProviderProfile.id)
    : null

  const isOwner = user?.id === pedido.client_id

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      {/* Banner */}
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cat.iconImg
                ? <Image src={cat.iconImg} alt="" width={32} height={32} style={{ objectFit: 'contain' }} />
                : <span style={{ fontSize: 26 }}>{cat.icon}</span>
              }
            </div>
            <div>
              <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 6 }}>
                {cat.label}
              </span>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{pedido.title}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Main */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Descrição */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 14 }}>Descrição</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                {pedido.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048' }}>
                    <MapPin size={15} color="#C85A1A" /> {pedido.city}
                  </div>
                )}
                {pedido.budget > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048' }}>
                    <Euro size={15} color="#C85A1A" /> {pedido.budget}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048' }}>
                  <Calendar size={15} color="#C85A1A" />
                  {new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <span style={{
                  background: pedido.status === 'open' ? '#EAF3DE' : '#F0EDE8',
                  color: pedido.status === 'open' ? '#3B6D11' : '#7A6048',
                  borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 500
                }}>
                  {pedido.status === 'open' ? 'em aberto' : pedido.status === 'completed' ? 'concluído' : pedido.status}
                </span>
              </div>
              {pedido.description && (
                <p style={{ fontSize: 14, color: '#5A3E28', lineHeight: 1.7 }}>{pedido.description}</p>
              )}

              {/* Fotos */}
              {pedido.photos?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 16 }}>
                  {pedido.photos.map((url: string, i: number) => (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                      <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Propostas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 14 }}>
                Prestadores que responderam ({offersWithProviders.length})
              </p>
              {offersWithProviders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {offersWithProviders.map(offer => {
                    const pp = offer.provider_profile
                    const u = offer.user
                    const displayName = pp?.business_name ?? u?.name ?? 'Prestador'
                    const rating = pp?.average_rating ?? 0
                    const reviewsCount = pp?.reviews_count ?? 0
                    const photo = u?.profile_photo
                    const city = pp?.company_city ?? pp?.region ?? u?.city

                    return (
                      <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12 }}>
                        {/* Avatar */}
                        <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', position: 'relative' }}>
                          {photo
                            ? <Image src={photo} alt={displayName} fill style={{ objectFit: 'cover' }} unoptimized />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#C85A1A' }}>{displayName.charAt(0)}</div>
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{displayName}</p>
                          {rating > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                              <Star size={12} color="#F9AB00" fill="#F9AB00" />
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E' }}>{rating.toFixed(1)}</span>
                              <span style={{ fontSize: 11, color: '#9B7A5A' }}>({reviewsCount})</span>
                            </div>
                          )}
                          {city && <p style={{ fontSize: 12, color: '#9B7A5A' }}>📍 {city}</p>}
                        </div>
                        {/* Status + Ver perfil */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{
                            background: offer.status === 'accepted' ? '#EAF3DE' : offer.status === 'rejected' ? '#FCE4EC' : '#FBF0E8',
                            color: offer.status === 'accepted' ? '#3B6D11' : offer.status === 'rejected' ? '#C62828' : '#C85A1A',
                            borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 500
                          }}>
                            {offer.status === 'accepted' ? '✓ Aceite' : offer.status === 'rejected' ? 'Recusado' : 'Pendente'}
                          </span>
                          {pp && (
                            <Link href={`/prestadores/perfil/${pp.id}`}
                              style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 500 }}>
                              Ver perfil →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#9B7A5A', fontStyle: 'italic' }}>Ainda sem propostas recebidas.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Quem publicou */}
            {client && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Publicado por</p>
                <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: '#FBF0E8', position: 'relative' }}>
                  {client.profile_photo
                    ? <Image src={client.profile_photo} alt={client.name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: '#C85A1A' }}>{client.name?.charAt(0)}</div>
                  }
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{client.name}</p>
                {client.city && <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 8 }}>📍 {client.city}</p>}
                {(client.average_rating ?? 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Star size={13} color="#F9AB00" fill="#F9AB00" />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{client.average_rating?.toFixed(1)}</span>
                  </div>
                )}
                <Link href={`/prestadores/perfil/${client.id}`}
                  style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 500 }}>
                  Ver perfil →
                </Link>
              </div>
            )}

            {/* CTA Enviar proposta */}
            {!isOwner && pedido.status === 'open' && (
              <div style={{ background: myOffer ? '#EAF3DE' : '#fff', border: `0.5px solid ${myOffer ? '#3B6D11' : '#EDE6DC'}`, borderRadius: 14, padding: '16px' }}>
                {myOffer ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={28} color="#3B6D11" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11' }}>Proposta enviada</p>
                    <p style={{ fontSize: 12, color: '#5A8A40', marginTop: 4 }}>
                      Estado: {myOffer.status === 'accepted' ? 'Aceite ✓' : myOffer.status === 'rejected' ? 'Recusada' : 'Pendente'}
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#7A6048', marginBottom: 12, lineHeight: 1.5 }}>
                      Interessado neste pedido? Envia a tua proposta ao cliente.
                    </p>
                    <Link href={`/pedidos/${pedido.id}/proposta`} className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
                      <Send size={14} /> Enviar Proposta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
