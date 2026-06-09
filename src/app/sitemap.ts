import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES, REGIONS } from '@/types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://chamaovizinho.pt'
  const supabase = createClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/servicos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/dicas`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/comunidade`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/precos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map(cat => ({
    url: `${baseUrl}/servicos/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Region pages
  const regionPages: MetadataRoute.Sitemap = REGIONS.map(region => ({
    url: `${baseUrl}/prestadores/${region.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dicas pages
  const { data: dicas } = await supabase
    .from('daily_tips')
    .select('id, publish_date')
    .eq('is_published', true)

  const dicasPages: MetadataRoute.Sitemap = (dicas ?? []).map(d => ({
    url: `${baseUrl}/dicas/${d.id}`,
    lastModified: d.publish_date ? new Date(d.publish_date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Provider profile pages
  const { data: providers } = await supabase
    .from('provider_profiles')
    .select('id, created_at')
    .eq('is_active', true)

  const providerPages: MetadataRoute.Sitemap = (providers ?? []).map(p => ({
    url: `${baseUrl}/prestadores/perfil/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticPages, ...categoryPages, ...regionPages, ...dicasPages, ...providerPages]
}
