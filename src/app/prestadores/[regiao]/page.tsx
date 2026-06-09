import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, CheckCircle, Star } from 'lucide-react'
import { REGIONS, CATEGORIES, type ProviderProfile } from '@/types'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { regiao: string }
  searchParams: { categoria?: string }
}

export async function generateStaticParams() {
  return REGIONS.map(r => ({ regiao: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = REGIONS.find(r => r.slug === params.regiao)
  if (!region) return {}
  return {
    title: `Prestadores de serviços em ${region.label} — Chama o Vizinho`,
    description: `Encontra os melhores prestadores de serviços domésticos em ${region.label}. Canalização, eletricidade, limpeza e muito mais. Avaliações reais.`,
    keywords: [`serviços domésticos ${region.label}`, `canalizador ${region.label}`, `eletricista ${region.label}`, `limpeza ${region.label}`],
  }
}

async function getProviders(regiao: string, categoria?: string): Promise<ProviderProfile[]> {
  const supabase = createClient()
  const region = REGIONS.find(r => r.slug === regiao)
  if (!region) return []

  let query = supabase
    .from('provider_profiles')
    .select(`
      id, user_id, business_name, service_description, business_description,
      service_categories, region, company_city, average_rating, reviews_count,
      cover_photo, is_verified, is_boosted, years_experience, provider_type
    `)
    .eq('is_active', true)
    .ilike('region', `%${region.label}%`)
    .order('is_boosted', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(24)

  const { data } = await query
  if (!data) return []

  const userIds = data.map(p => p.user_id)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, average_rating, reviews_count')
    .in('id', userIds)

  let providers = data.map(p => ({
    ...p,
    user_profiles: users?.find(u => u.id === p.user_id) ?? undefined,
  })) as ProviderProfile[]

  // Filter by category if specified
  if (categoria) {
    providers = providers.filter(p =>
      p.service_categories?.some(c =>
        c.toLowerCase().includes(categoria.toLowerCase()) ||
        categoria.toLowerCase().includes(c.toLowerCase())
      )
    )
  }

  return providers
}

export const revalidate = 3600

export default async function PrestadoresRegiao({ params, searchParams }: Props) {
  const region = REGIONS.find(r => r.slug === params.regiao)
  if (!region) notFound()

  const providers = await getProviders(params.regiao, searchParams.categoria)
  const activeCat = searchParams.categoria ? CATEGORIES.find(c => c.slug === searchParams.categoria) : null

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-brand-navy/40">
          <Link href="/" className="hover:text-brand-orange">Início</Link>
          <span>/</span>
          <span className="text-brand-navy">{region.label}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-brand-orange" />
            <p className="text-brand-orange font-medium text-sm uppercase tracking-wider">{region.label}</p>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-brand-navy mb-3">
            Prestadores em {region.label}
          </h1>
          <p className="text-brand-navy/50">
            {providers.length > 0 ? `${providers.length} prestadores` : 'Prestadores'} verificados em {region.cities.join(', ')} e arredores.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/prestadores/${params.regiao}`}
            className={`badge text-sm transition-colors ${!activeCat ? 'bg-brand-orange text-white' : 'bg-white text-brand-navy/60 hover:bg-brand-orange hover:text-white border border-brand-navy/10'}`}
          >
            Todos
          </Link>
          {CATEGORIES.slice(0, 8).map(cat => (
            <Link
              key={cat.slug}
              href={`/prestadores/${params.regiao}?categoria=${cat.slug}`}
              className={`badge text-sm transition-colors ${activeCat?.slug === cat.slug ? 'bg-brand-orange text-white' : 'bg-white text-brand-navy/60 hover:bg-brand-orange hover:text-white border border-brand-navy/10'}`}
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>

        {/* Providers */}
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(provider => {
              const name = provider.business_name ?? provider.user_profiles?.name ?? 'Prestador'
              const rating = provider.average_rating ?? provider.user_profiles?.average_rating ?? 0
              const reviewsCount = provider.reviews_count ?? provider.user_profiles?.reviews_count ?? 0
              const photo = provider.cover_photo ?? provider.user_profiles?.profile_photo

              return (
                <Link key={provider.id} href={`/prestadores/perfil/${provider.id}`}
                  className="card hover:-translate-y-1 hover:shadow-lg p-0 overflow-hidden group">
                  <div className="h-36 bg-gradient-to-br from-brand-cream to-brand-orange/10 relative overflow-hidden">
                    {photo ? (
                      <Image src={photo} alt={name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-20">👤</span>
                      </div>
                    )}
                    {provider.is_boosted && (
                      <div className="absolute top-3 right-3 badge bg-brand-orange text-white text-xs">⚡ Destaque</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors">{name}</h3>
                      {provider.is_verified && <CheckCircle className="w-4 h-4 text-brand-green flex-shrink-0" />}
                    </div>
                    {rating > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-brand-navy">{rating.toFixed(1)}</span>
                        <span className="text-brand-navy/40 text-xs">({reviewsCount})</span>
                      </div>
                    )}
                    {provider.service_categories?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.service_categories.slice(0, 3).map(cat => (
                          <span key={cat} className="badge bg-brand-cream text-brand-navy/50 text-xs px-2 py-0.5">{cat}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-brand-navy/5">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="font-semibold text-brand-navy mb-2">Sem prestadores nesta zona</h3>
            <p className="text-brand-navy/50 text-sm mb-6">Sê o primeiro prestador em {region.label}!</p>
            <Link href="/auth?tab=register&role=provider" className="btn-primary">
              Registar como prestador
            </Link>
          </div>
        )}

        {/* SEO text */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-brand-navy/5">
          <h2 className="font-semibold text-brand-navy mb-3">Serviços domésticos em {region.label}</h2>
          <p className="text-brand-navy/50 text-sm leading-relaxed">
            O Chama o Vizinho é a plataforma portuguesa que liga clientes a prestadores de serviços de confiança em {region.label}.
            Encontra canalizadores, eletricistas, serviços de limpeza, jardineiros, pintores e muito mais em {region.cities.slice(0, 3).join(', ')} e outras cidades da região.
            Todos os prestadores são verificados e têm avaliações reais de outros utilizadores.
          </p>
        </div>
      </div>
    </div>
  )
}
