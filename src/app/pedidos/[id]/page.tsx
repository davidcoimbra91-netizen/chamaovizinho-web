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

  // Offers avec message et preço
  const { data: offers } = await supabase
    .from('offers')
    .select('id, provider_id, status, created_at, message, price, availability')
    .eq('service_request_id', params.id)
    .order('created_at', { ascending: false })

  // Provider profiles pour les offers
  let offersWithProviders: any[] = []
  if (offers && offers.length > 0) {
    const providerIds = offers.map((o: any) => o.provider_id)
    const { data: providerProfiles } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo, is_verified, provider_type')
      .in('id', providerIds)

    // FIX bug 8 : fetch user_profiles pour avoir les avatars et noms
    const userIds = (providerProfiles ?? []).map((p: any) => p.user_id).filter(Boolean)
    const { data: providerUsers } = userIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city').in('id', userIds)
      : { data: [] }

    offersWithProviders = offers.map((o: any) => {
      const pp = providerProfiles?.find((p: any) => p.id === o.provider_id)
      const u = providerUsers?.find((u: any) => u.id === pp?.user_id)
      return { ...o, provider_profile: pp, user: u }
    })
  }

  const cat = getCatInfo(pedido.category)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* FIX bug 8 : logo catégorie correct — iconImg en priorité, emoji en fallback */}
            <div style={{ width: 56, height: 56, borderRadius: 14, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cat.iconImg
                ? <img src={cat.iconImg} alt={cat.label} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                : <span style={{ fontSize: 28 }}>{cat.icon}</span>
              }
            </div>
            <div>
              <span style={{ background: cat.bg, color: cat.color, borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 6 }}>
                {cat.icon} {cat.label}
              </span>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{pedido.title}</h1>
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
              <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Descrição do pedido</p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                {pedido.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048', background: '#FAF7F2', borderRadius: 99, padding: '5px 12px' }}>
                    <MapPin size={13} color="#C85A1A" /> {pedido.city}
                  </div>
                )}
                {pedido.budget > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048', background: '#FAF7F2', borderRadius: 99, padding: '5px 12px' }}>
                    <Euro size={13} color="#C85A1A" /> Orçamento: €{pedido.budget}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048', background: '#FAF7F2', borderRadius: 99, padding: '5px 12px' }}>
                  <Calendar size={13} color="#C85A1A" />
                  {new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <span style={{
                  background: pedido.status === 'open' ? '#EAF3DE' : '#F0EDE8',
                  color: pedido.status === 'open' ? '#3B6D11' : '#7A6048',
                  borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 600
                }}>
                  {pedido.status === 'open' ? '🟢 Em aberto' : pedido.status === 'completed' ? '✅ Concluído' : pedido.status}
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

            {/* Propostas recebidas */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>
                  Prestadores que responderam
                </p>
                <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                  {offersWithProviders.length}
                </span>
              </div>

              {offersWithProviders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {offersWithProviders.map((offer: any) => {
                    const pp = offer.provider_profile
                    // FIX bug 8 : priorité business_name, fallback user.name, fallback 'Prestador'
                    const displayName = pp?.business_name ?? offer.user?.name ?? 'Prestador'
                    // FIX bug 8 : avatar depuis user_profiles
                    const photo = offer.user?.profile_photo
                    const rating = pp?.average_rating ?? 0
                    const city = pp?.company_city ?? pp?.region ?? offer.user?.city

                    return (
                      <div key={offer.id} style={{ background: '#FAF7F2', border: offer.status === 'accepted' ? '1px solid #3B6D11' : '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {/* FIX : Avatar avec photo réelle */}
                          <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#FBF0E8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#C85A1A' }}>
                            {photo
                              ? <Image src={photo} alt={displayName} fill style={{ objectFit: 'cover' }} unoptimized />
                              : displayName.charAt(0)
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{displayName}</p>
                              {pp?.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>✓ Verificado</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {rating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Star size={11} color="#F9AB00" fill="#F9AB00" />
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E' }}>{rating.toFixed(1)}</span>
                                  <span style={{ fontSize: 10, color: '#9B7A5A' }}>({pp?.reviews_count ?? 0})</span>
                                </div>
                              )}
                              {city && <span style={{ fontSize: 11, color: '#9B7A5A' }}>📍 {city}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <span style={{
                              background: offer.status === 'accepted' ? '#EAF3DE' : offer.status === 'rejected' ? '#FCE4EC' : '#FBF0E8',
                              color: offer.status === 'accepted' ? '#3B6D11' : offer.status === 'rejected' ? '#C62828' : '#C85A1A',
                              borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700
                            }}>
                              {offer.status === 'accepted' ? '✓ Aceite' : offer.status === 'rejected' ? 'Recusado' : 'Pendente'}
                            </span>
                            {offer.price && <span style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>€{Number(offer.price).toFixed(0)}</span>}
                          </div>
                        </div>

                        {/* Mensagem da proposta */}
                        {offer.message && (
                          <div style={{ background: '#fff', borderRadius: 9, padding: '10px 12px', border: '0.5px solid #EDE6DC' }}>
                            <p style={{ fontSize: 12, color: '#5A3E28', lineHeight: 1.6 }}>{offer.message}</p>
                          </div>
                        )}

                        {offer.availability && (
                          <p style={{ fontSize: 11, color: '#9B7A5A' }}>🕐 Disponibilidade: {offer.availability}</p>
                        )}

                        {/* Botões para o owner */}
                        {isOwner && offer.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {pp && <Link href={`/prestadores/perfil/${pp.id}`}
                              style={{ flex: 1, padding: '8px', borderRadius: 9, border: '0.5px solid #D4C4B0', fontSize: 12, color: '#5A3E28', textDecoration: 'none', fontWeight: 600, textAlign: 'center' }}>
                              Ver perfil
                            </Link>}
                          </div>
                        )}
                        {!isOwner && pp && (
                          <Link href={`/prestadores/perfil/${pp.id}`}
                            style={{ fontSize: 12, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>
                            Ver perfil →
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 0' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Ainda sem propostas</p>
                  <p style={{ fontSize: 12, color: '#9B7A5A' }}>Os prestadores ainda não responderam a este pedido.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Quem publicou */}
            {client && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#9B7A5A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Publicado por</p>
                <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', background: '#FBF0E8', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: '#C85A1A' }}>
                  {client.profile_photo
                    ? <Image src={client.profile_photo} alt={client.name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />
                    : client.name?.charAt(0)
                  }
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>{client.name}</p>
                {client.city && <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 8 }}>📍 {client.city}</p>}
                {(client.average_rating ?? 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                    <Star size={13} color="#F9AB00" fill="#F9AB00" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{client.average_rating?.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA Enviar proposta */}
            {!isOwner && pedido.status === 'open' && (
              <div style={{ background: myOffer ? '#EAF3DE' : '#fff', border: `0.5px solid ${myOffer ? '#3B6D11' : '#EDE6DC'}`, borderRadius: 14, padding: '16px' }}>
                {myOffer ? (
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircle size={28} color="#3B6D11" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#3B6D11' }}>Proposta enviada</p>
                    <p style={{ fontSize: 12, color: '#5A8A40', marginTop: 4 }}>
                      Estado: {myOffer.status === 'accepted' ? '✓ Aceite' : myOffer.status === 'rejected' ? 'Recusada' : 'Pendente'}
                    </p>
                    {myOffer.status === 'pending' && (
                      <p style={{ fontSize: 11, color: '#9B7A5A', marginTop: 6 }}>Aguarda a resposta do cliente.</p>
                    )}
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: '#7A6048', marginBottom: 12, lineHeight: 1.5 }}>
                      Interessado neste pedido? Envia a tua proposta ao cliente.
                    </p>
                    <Link href={`/pedidos/${pedido.id}/proposta`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 10, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      <Send size={14} /> Enviar Proposta
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Informações do pedido */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Detalhes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>Categoria</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cat.color }}>{cat.icon} {cat.label}</span>
                </div>
                {pedido.city && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#9B7A5A' }}>Localização</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>📍 {pedido.city}</span>
                  </div>
                )}
                {pedido.budget > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#9B7A5A' }}>Orçamento</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#3B6D11' }}>€{pedido.budget}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>Propostas</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#C85A1A' }}>{offersWithProviders.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#9B7A5A' }}>Publicado</span>
                  <span style={{ fontSize: 12, color: '#5A3E28' }}>{new Date(pedido.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
