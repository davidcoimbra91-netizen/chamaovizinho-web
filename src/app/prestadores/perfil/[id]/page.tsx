import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CheckCircle, Star, Calendar, Phone, Globe, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { ProviderProfile, Review, PortfolioItem } from '@/types'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('business_name, service_description, region')
    .eq('id', params.id)
    .single()

  if (!provider) return {}
  return {
    title: `${provider.business_name ?? 'Prestador'} — ${provider.region ?? 'Portugal'}`,
    description: provider.service_description ?? `Prestador de serviços em ${provider.region ?? 'Portugal'}`,
  }
}

export const revalidate = 3600

export default async function PerfilPrestador({ params }: Props) {
  const supabase = createClient()

  const { data: provider } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!provider) notFound()

  // Fetch user separately
  const { data: user } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, bio, created_at, average_rating, reviews_count')
    .eq('id', provider.user_id)
    .single()

  // Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, author_id')
    .eq('reviewed_user_id', provider.user_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch review authors separately
  let reviewsWithAuthors: any[] = []
  if (reviews && reviews.length > 0) {
    const authorIds = reviews.map(r => r.author_id)
    const { data: authors } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .in('id', authorIds)

    reviewsWithAuthors = reviews.map(r => ({
      ...r,
      author: authors?.find(a => a.id === r.author_id),
    }))
  }

  // Portfolio
  const { data: portfolio } = await supabase
    .from('portfolio_items')
    .select('id, photo_url, title, description')
    .eq('provider_id', provider.id)
    .limit(9)

  const name = provider.business_name ?? user?.name ?? 'Prestador'
  const rating = provider.average_rating ?? user?.average_rating ?? 0
  const reviewsCount = provider.reviews_count ?? user?.reviews_count ?? 0
  const photo = provider.cover_photo ?? user?.profile_photo

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-brand-navy/40">
          <Link href="/" className="hover:text-brand-orange">Início</Link>
          <span>/</span>
          <Link href="/servicos" className="hover:text-brand-orange">Serviços</Link>
          <span>/</span>
          <span className="text-brand-navy">{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-cream mx-auto mb-4 relative">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                )}
              </div>
              <h1 className="font-display text-xl font-semibold text-brand-navy mb-1">{name}</h1>

              {provider.is_verified && (
                <div className="flex items-center justify-center gap-1.5 text-brand-green text-sm mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Verificado</span>
                </div>
              )}

              {rating > 0 && (
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-brand-navy">{rating.toFixed(1)}</span>
                  <span className="text-brand-navy/40 text-sm">({reviewsCount} avaliações)</span>
                </div>
              )}

              {provider.region && (
                <div className="flex items-center justify-center gap-1 text-brand-navy/40 text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{provider.region}{provider.company_city ? ` · ${provider.company_city}` : ''}</span>
                </div>
              )}

              <Link href={`/auth?contact=${provider.id}`} className="btn-primary w-full text-center block">
                Contactar
              </Link>
            </div>

            {/* Info card */}
            <div className="card space-y-3">
              {provider.years_experience && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  <span className="text-sm text-brand-navy/70">{provider.years_experience} anos de experiência</span>
                </div>
              )}
              {provider.provider_type && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  <span className="text-sm text-brand-navy/70">{provider.provider_type}</span>
                </div>
              )}
              {provider.phone_public && provider.company_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  <a href={`tel:${provider.company_phone}`} className="text-sm text-brand-navy/70 hover:text-brand-orange">{provider.company_phone}</a>
                </div>
              )}
              {provider.company_website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-brand-orange flex-shrink-0" />
                  <a href={provider.company_website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-navy/70 hover:text-brand-orange truncate">
                    {provider.company_website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Categories */}
            {provider.service_categories?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-brand-navy text-sm mb-3">Serviços oferecidos</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.service_categories.map((cat: string) => (
                    <span key={cat} className="badge bg-brand-orange/10 text-brand-orange text-xs">{cat}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(provider.service_description || provider.business_description || user?.bio) && (
              <div className="card">
                <h2 className="font-semibold text-brand-navy mb-3">Sobre</h2>
                <p className="text-brand-navy/60 text-sm leading-relaxed">
                  {provider.service_description ?? provider.business_description ?? user?.bio}
                </p>
              </div>
            )}

            {/* Portfolio */}
            {portfolio && portfolio.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-brand-navy mb-4">Portfólio</h2>
                <div className="grid grid-cols-3 gap-2">
                  {portfolio.map(item => (
                    <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-brand-cream relative">
                      <Image src={item.photo_url} alt={item.title ?? 'Portfolio'} fill className="object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviewsWithAuthors.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-brand-navy mb-4">Avaliações ({reviewsCount})</h2>
                <div className="space-y-4">
                  {reviewsWithAuthors.map(review => (
                    <div key={review.id} className="border-b border-brand-navy/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-brand-cream relative overflow-hidden flex-shrink-0">
                          {review.author?.profile_photo ? (
                            <Image src={review.author.profile_photo} alt="" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-navy">{review.author?.name ?? 'Utilizador'}</p>
                          <div className="flex">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-brand-navy/20'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-brand-navy/60 text-sm leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
