import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, Phone, Calendar, ExternalLink } from 'lucide-react'
import { CATEGORIES } from '@/types'
import { TYPE_LOGOS, getHeaderImage } from '@/lib/profile-utils'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: pp } = await supabase
    .from('provider_profiles')
    .select('id, business_name, service_description, service_categories, region, company_city, cover_photo, user_id')
    .eq('id', params.id)
    .single()
  if (!pp) return {}
  const { data: user } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', pp.user_id)
    .single()
  const name = pp.business_name ?? user?.name ?? 'Prestador'
  const city = pp.company_city ?? pp.region ?? 'Portugal'
  const cats = (pp.service_categories ?? []).slice(0, 2).join(', ')
  const description = pp.service_description
    ? pp.service_description.substring(0, 155)
    : `${name} — Prestador de ${cats} em ${city}. Avaliações reais e preços transparentes no Chama o Vizinho.`
  const base = 'https://www.chamaovizinho.pt'
  return {
    title: `${name} — ${cats} em ${city} | Chama o Vizinho`,
    description,
    alternates: { canonical: `${base}/prestadores/perfil/${params.id}` },
    openGraph: {
      title: `${name} — ${cats} em ${city}`,
      description,
      type: 'profile',
      url: `${base}/prestadores/perfil/${params.id}`,
      siteName: 'Chama o Vizinho',
      locale: 'pt_PT',
      ...(pp.cover_photo ? { images: [{ url: pp.cover_photo, alt: name }] } : {}),
    },
  }
}

export default async function ProviderPublicProfilePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: pp } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pp) notFound()

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, city, bio, average_rating, reviews_count, created_at, last_seen, is_pro')
    .eq('id', pp.user_id)
    .single()

  // Portfolio
  const { data: portfolio } = await supabase
    .from('portfolio_items')
    .select('id, photo_url, image, title, description')
    .eq('provider_id', pp.user_id)
    .limit(25)

  // Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, author_id')
    .eq('reviewed_user_id', pp.user_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10)

  const reviewAuthorIds = Array.from(new Set((reviews ?? []).map((r: any) => r.author_id).filter(Boolean)))
  const { data: reviewAuthors } = reviewAuthorIds.length > 0
    ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', reviewAuthorIds)
    : { data: [] }

  const isOnline = userProfile?.last_seen && (new Date().getTime() - new Date(userProfile.last_seen).getTime()) < 5 * 60 * 1000
  const isPro = userProfile?.is_pro ?? false
  const name = pp.business_name ?? userProfile?.name ?? 'Prestador'
  const rating = pp.average_rating ?? 0
  const city = pp.company_city ?? pp.region ?? userProfile?.city

  // Check if current user can contact directly (only if provider is Premium)
  const canContactDirect = isPro

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 80 }}>

      {/* Cover */}
      <div style={{ height: 220, position: 'relative', overflow: 'hidden', background: '#2C1A0E' }}>
        <Image src={pp.cover_photo ?? getHeaderImage(pp.user_id)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.5))' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-4" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link href="javascript:history.back()" style={{ width: 34, height: 34, background: 'rgba(0,0,0,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <ArrowLeft size={16} color="#fff" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Avatar débordant */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -36, marginBottom: 16, position: 'relative', zIndex: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #FAF7F2', overflow: 'hidden', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#C85A1A', position: 'relative' }}>
              {userProfile?.profile_photo
                ? <Image src={userProfile.profile_photo} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
                : name.charAt(0)
              }
            </div>
            {pp.provider_type && TYPE_LOGOS[pp.provider_type] && (
              <img src={TYPE_LOGOS[pp.provider_type]} alt={pp.provider_type}
                style={{ position: 'absolute', bottom: 0, right: -2, width: 24, height: 24, objectFit: 'contain' }} />
            )}
          </div>
          {/* Rating card */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '10px 16px', textAlign: 'center', boxShadow: '0 4px 16px rgba(44,26,14,0.08)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#C85A1A', fontFamily: 'Lora, serif' }}>{rating > 0 ? rating.toFixed(1) : '—'}</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', margin: '2px 0' }}>
              {[1,2,3,4,5].map(s => <Star key={s} size={12} color="#F9AB00" fill={s <= Math.round(rating) ? '#F9AB00' : 'none'} />)}
            </div>
            <div style={{ fontSize: 14, color: '#9B7A5A' }}>({pp.reviews_count ?? 0} avaliações)</div>
          </div>
        </div>

        {/* Nom + badges */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 700, color: '#2C1A0E' }}>{name}</h1>
            {pp.is_verified && <span style={{ background: '#EAF3DE', color: '#2E7D32', borderRadius: 99, padding: '2px 10px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={11} /> Verificado</span>}
            {isPro && <span style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '2px 10px', fontSize: 15, fontWeight: 600 }}>⭐ Premium</span>}
          </div>
          {pp.provider_type && (
            <span style={{ background: pp.provider_type === 'Empresa' ? '#E8F0FE' : pp.provider_type === 'Recibo Verde' ? '#E6F4EA' : '#FBF0E8', color: pp.provider_type === 'Empresa' ? '#1A73E8' : pp.provider_type === 'Recibo Verde' ? '#2E7D32' : '#C85A1A', borderRadius: 99, padding: '3px 10px', fontSize: 16, fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>
              {pp.provider_type}
            </span>
          )}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {city && <span style={{ fontSize: 16, color: '#9B7A5A', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} color="#C85A1A" /> {city}</span>}
            {pp.service_area && <span style={{ fontSize: 16, color: '#9B7A5A' }}>🗺️ {pp.service_area}</span>}
            {isOnline ? <span style={{ fontSize: 16, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />Online agora</span>
              : userProfile?.last_seen && <span style={{ fontSize: 16, color: '#9B7A5A' }}>Visto {new Date(userProfile.last_seen).toLocaleDateString('pt-PT')}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Stats */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
                {[
                  { icon: '/icons/years.png', n: pp.years_experience ?? '—', l: 'anos exp.' },
                  { icon: '/icons/review.png', n: pp.reviews_count ?? 0, l: 'avaliações' },
                  { icon: '/icons/rating.png', n: rating > 0 ? rating.toFixed(1) : '—', l: 'nota média' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <img src={s.icon} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#C85A1A', fontFamily: 'Lora, serif' }}>{s.n}</div>
                    <div style={{ fontSize: 15, color: '#9B7A5A' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Serviços */}
            {pp.service_categories?.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <img src="/icons/servicos.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Serviços</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {pp.service_categories.map((cat: string) => {
                    const info = CATEGORIES.find(c => c.slug === cat || c.label.toLowerCase() === cat.toLowerCase())
                    return (
                      <div key={cat} style={{ background: info?.bg ?? '#FAF7F2', borderRadius: 12, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                        {info?.iconImg
                          ? <img src={info.iconImg} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                          : <span style={{ fontSize: 22 }}>{info?.icon}</span>
                        }
                        <span style={{ fontSize: 15, fontWeight: 600, color: info?.color ?? '#7A6048', lineHeight: 1.3 }}>{info?.label ?? cat}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sobre */}
            {(pp.service_description || pp.business_description || userProfile?.bio) && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <img src="/icons/sobre.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Sobre</p>
                </div>
                {pp.service_description && <p style={{ fontSize: 15, color: '#5A3E28', lineHeight: 1.7, marginBottom: 8 }}>{pp.service_description}</p>}
                {pp.business_description && pp.business_description !== pp.service_description && <p style={{ fontSize: 15, color: '#7A6048', lineHeight: 1.6 }}>{pp.business_description}</p>}
              </div>
            )}

            {/* Disponibilidade */}
            {pp.availability_notes && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src="/icons/disponibilidade.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Disponibilidade</p>
                  </div>
                  <span style={{ background: '#EAF3DE', color: '#2E7D32', borderRadius: 99, padding: '2px 9px', fontSize: 14, fontWeight: 600 }}>● Disponível</span>
                </div>
                <p style={{ fontSize: 15, color: '#5A3E28', lineHeight: 1.6 }}>{pp.availability_notes}</p>
              </div>
            )}

            {/* Info professionnelle */}
            {(pp.company_nif || pp.company_website || pp.legal_form) && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <img src="/icons/sobre.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Informação profissional</p>
                </div>
                <div style={{ background: '#FAF7F2', borderRadius: 10, overflow: 'hidden' }}>
                  {pp.legal_form && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '0.5px solid #EDE6DC' }}><span style={{ fontSize: 16, color: '#9B7A5A' }}>Forma jurídica</span><span style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E' }}>{pp.legal_form}</span></div>}
                  {pp.company_nif && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '0.5px solid #EDE6DC' }}><span style={{ fontSize: 16, color: '#9B7A5A' }}>NIF</span><span style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E' }}>{pp.company_nif}</span></div>}
                  {pp.company_website && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px' }}><span style={{ fontSize: 16, color: '#9B7A5A' }}>Website</span><a href={pp.company_website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, color: '#1A73E8', display: 'flex', alignItems: 'center', gap: 4 }}>{pp.company_website} <ExternalLink size={11} /></a></div>}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {portfolio && portfolio.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <img src="/icons/portfolio.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Portfólio <span style={{ fontSize: 15, color: '#9B7A5A', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>({portfolio.length} {isPro ? 'de 25' : 'de 5'})</span>
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {portfolio.map((item: any) => (
                    <div key={item.id} style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#EDE6DC', cursor: 'pointer' }}>
                      {(item.photo_url || item.image) && <Image src={item.photo_url ?? item.image} alt={item.title ?? ''} fill style={{ objectFit: 'cover' }} unoptimized />}
                      {item.title && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '4px 6px' }}>
                          <p style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>{item.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avaliações */}
            {reviews && reviews.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <img src="/icons/review.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Avaliações</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reviews.map((review: any) => {
                    const author = reviewAuthors?.find((a: any) => a.id === review.author_id)
                    return (
                      <div key={review.id} style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              {author?.profile_photo
                                ? <Image src={author.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#C85A1A' }}>{author?.name?.charAt(0) ?? '?'}</div>
                              }
                            </div>
                            <div>
                              <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E' }}>{author?.name ?? 'Cliente'}</p>
                              <div style={{ display: 'flex', gap: 1 }}>
                                {[1,2,3,4,5].map(s => <Star key={s} size={10} color="#F9AB00" fill={s <= (review.rating ?? 0) ? '#F9AB00' : 'none'} />)}
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: 14, color: '#B09070' }}>{new Date(review.created_at).toLocaleDateString('pt-PT')}</span>
                        </div>
                        {review.comment && <p style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.6 }}>{review.comment}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite sticky */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

              {/* Contact direct (Premium seulement) */}
              {canContactDirect ? (
                <Link href={user ? `/dashboard/mensagens` : '/auth'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 10, background: '#C85A1A', textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#fff' }}>
                  <MessageCircle size={15} /> Enviar mensagem
                </Link>
              ) : (
                <div style={{ padding: '12px', borderRadius: 10, background: '#F3F4F6', fontSize: 16, color: '#9B7A5A', textAlign: 'center', lineHeight: 1.5 }}>
                  💬 Responde a um pedido para entrar em contacto
                </div>
              )}

              {/* Téléphone (Premium + phone_public) */}
              {isPro && pp.phone_public && (pp.company_phone || userProfile) && (
                <a href={`tel:${pp.company_phone}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 10, background: '#FAF7F2', border: '0.5px solid #C85A1A', textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#C85A1A' }}>
                  <Phone size={15} /> {pp.company_phone}
                </a>
              )}
            </div>

            {/* Actividade */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Atividade</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{isOnline ? '🟢' : '⚫'}</span>
                  <span style={{ fontSize: 16, color: isOnline ? '#10B981' : '#9B7A5A' }}>{isOnline ? 'Online agora' : 'Offline'}</span>
                </div>
                {userProfile?.created_at && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} color="#C85A1A" />
                    <span style={{ fontSize: 16, color: '#9B7A5A' }}>Membro desde {new Date(userProfile.created_at).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                {city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={14} color="#C85A1A" />
                    <span style={{ fontSize: 16, color: '#9B7A5A' }}>{pp.service_area ?? city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Denunciar */}
            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <span style={{ fontSize: 15, color: '#B09070', cursor: 'pointer' }}>🚩 Denunciar perfil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
