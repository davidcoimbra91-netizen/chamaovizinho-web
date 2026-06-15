import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, CheckCircle, ChevronLeft } from 'lucide-react'
import { CATEGORIES, REGIONS, type ProviderProfile } from '@/types'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: { categoria: string }
}

// Normalize category slug to match DB values
function normalizeCategorySlug(slug: string): string[] {
  const map: Record<string, string[]> = {
    'canalização': ['canalização', 'Canalização'],
    'eletricidade': ['eletricidade', 'Eletricidade'],
    'limpeza': ['limpeza', 'Limpeza Doméstica'],
    'jardinagem': ['jardinagem', 'Jardinagem'],
    'pintura': ['pintura', 'Pintura'],
    'montagem': ['montagem', 'Montagem de Móveis'],
    'mudanças': ['mudanças', 'Mudanças / Transporte'],
    'bricolage': ['bricolage'],
    'informatica': ['informatica', 'Informática / Tecnologia'],
    'pequenas_obras': ['pequenas_obras', 'Pequenas Obras'],
    'electrodomesticos': ['electrodomésticos', 'reparações  eletrodomésticos'],
    'cuidados': ['cuidados', 'Cuidados a Idosos / Babysitting'],
    'mecanica': ['mecanica automovel'],
    'outros': ['outros', 'Outros'],
  }
  return map[slug] ?? [slug]
}

export async function generateStaticParams() {
  return CATEGORIES.map(cat => ({ categoria: cat.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORIES.find(c => c.slug === params.categoria)
  if (!cat) return {}
  return {
    title: `${cat.label} em Portugal — Prestadores verificados`,
    description: `Encontra os melhores ${cat.label.toLowerCase()} em Portugal. ${cat.description}. Avaliações reais, preços transparentes.`,
    keywords: [`${cat.label} Portugal`, `${cat.label} Lisboa`, `${cat.label} Porto`, `prestadores ${cat.label}`],
  }
}

async function getProviders(categoria: string): Promise<ProviderProfile[]> {
  const supabase = createClient()
  const variants = normalizeCategorySlug(categoria)

  // Fetch providers that have any of the category variants
  const { data } = await supabase
    .from('provider_profiles')
    .select(`
      id, user_id, business_name, service_description, business_description,
      service_categories, region, company_city, average_rating, reviews_count,
      cover_photo, is_verified, is_boosted, years_experience, provider_type
    `)
    .eq('is_active', true)
    .overlaps('service_categories', variants)
    .order('is_boosted', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(20)

  if (!data) return []

  // Fetch user profiles separately
  const userIds = data.map(p => p.user_id)
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo, average_rating, reviews_count')
    .in('id', userIds)

  return data.map(p => ({
    ...p,
    user_profiles: users?.find(u => u.id === p.user_id) ?? undefined,
  })) as ProviderProfile[]
}

export const revalidate = 3600

export default async function CategoriaPage({ params }: Props) {
  const cat = CATEGORIES.find(c => c.slug === params.categoria)
  if (!cat) notFound()

  const providers = await getProviders(params.categoria)

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-brand-navy/40">
          <Link href="/" className="hover:text-brand-orange transition-colors">Início</Link>
          <span>/</span>
          <Link href="/servicos" className="hover:text-brand-orange transition-colors">Serviços</Link>
          <span>/</span>
          <span className="text-brand-navy">{cat.label}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-3xl p-8 mb-8 border border-brand-navy/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-3xl">
              {cat.iconImg ? <img src={cat.iconImg} style={{width:40,height:40,objectFit:'contain'}} alt={cat.label} /> : <span className="text-3xl">{cat.icon}</span>}
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-brand-navy">{cat.label}</h1>
              <p className="text-brand-navy/50 mt-1">{cat.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {REGIONS.map(region => (
              <Link key={region.slug} href={`/prestadores/${region.slug}?categoria=${params.categoria}`}
                className="badge bg-brand-cream text-brand-navy/60 hover:bg-brand-orange hover:text-white transition-colors text-xs">
                📍 {region.label}
              </Link>
            ))}
          </div>
        </div>

        {/* SEO text */}
        <div className="mb-8 bg-brand-orange/5 rounded-2xl p-6 border border-brand-orange/10">
          <h2 className="font-semibold text-brand-navy mb-2">Encontra {cat.label.toLowerCase()} em Portugal</h2>
          <p className="text-brand-navy/60 text-sm leading-relaxed">
            O Chama o Vizinho tem {providers.length > 0 ? `${providers.length}+` : 'vários'} prestadores de {cat.label.toLowerCase()} verificados em Portugal.
            Compara perfis, avaliações e preços para encontrar o melhor profissional para o teu trabalho.
            {cat.description}
          </p>
        </div>

        {/* Providers grid */}
        {providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-brand-navy/5">
            <div className="mb-4">{cat.iconImg ? <img src={cat.iconImg} style={{width:56,height:56,objectFit:'contain',margin:'0 auto'}} alt={cat.label} /> : <div className="text-4xl">{cat.icon}</div>}</div>
            <h3 className="font-semibold text-brand-navy mb-2">Sem prestadores disponíveis</h3>
            <p className="text-brand-navy/50 text-sm mb-6">Ainda não há prestadores desta categoria na tua zona.</p>
            <Link href="/auth?tab=register&role=provider" className="btn-primary">
              Registar como prestador
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-brand-navy rounded-3xl p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-white mb-3">Precisas de {cat.label.toLowerCase()}?</h2>
          <p className="text-white/50 mb-6">Publica o teu pedido gratuitamente e recebe propostas em minutos.</p>
          <Link href="/auth?tab=register" className="btn-primary">
            Publicar pedido grátis
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProviderCard({ provider }: { provider: ProviderProfile }) {
  const name = provider.business_name ?? provider.user_profiles?.name ?? 'Prestador'
  const rating = provider.average_rating ?? provider.user_profiles?.average_rating ?? 0
  const reviewsCount = provider.reviews_count ?? provider.user_profiles?.reviews_count ?? 0
  const photo = provider.cover_photo ?? provider.user_profiles?.profile_photo

  return (
    <Link href={`/prestadores/perfil/${provider.id}`} className="card hover:-translate-y-1 hover:shadow-lg p-0 overflow-hidden group">
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-brand-cream to-brand-orange/10 relative overflow-hidden">
        {photo ? (
          <Image src={photo} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">👤</span>
          </div>
        )}
        {provider.is_boosted && (
          <div className="absolute top-3 right-3 badge bg-brand-orange text-white text-xs shadow-md">
            ⚡ Destaque
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors leading-snug">{name}</h3>
          {provider.is_verified && (
            <CheckCircle className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
          )}
        </div>

        {rating > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-amber-400">★</span>
            <span className="text-sm font-medium text-brand-navy">{rating.toFixed(1)}</span>
            <span className="text-brand-navy/40 text-xs">({reviewsCount})</span>
          </div>
        )}

        {provider.region && (
          <div className="flex items-center gap-1 text-brand-navy/40 text-xs mb-3">
            <MapPin className="w-3 h-3" />
            <span>{provider.region}</span>
            {provider.company_city && <span>· {provider.company_city}</span>}
          </div>
        )}

        {(provider.service_description || provider.business_description) && (
          <p className="text-brand-navy/50 text-xs leading-relaxed line-clamp-2">
            {provider.service_description ?? provider.business_description}
          </p>
        )}

        {provider.years_experience && (
          <div className="mt-3 badge bg-brand-cream text-brand-navy/60 text-xs">
            {provider.years_experience} anos de experiência
          </div>
        )}
      </div>
    </Link>
  )
}
