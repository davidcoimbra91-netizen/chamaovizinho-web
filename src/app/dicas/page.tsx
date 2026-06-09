import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'

export const metadata: Metadata = {
  title: 'Dicas do Dia — Manutenção da sua casa',
  description: 'Dicas práticas sobre manutenção doméstica, canalização, eletricidade, limpeza e muito mais. Aprende a cuidar melhor da tua casa.',
}

export const revalidate = 3600

async function getDicas(categoria?: string) {
  const supabase = createClient()
  let query = supabase
    .from('daily_tips')
    .select('id, title, short_description, image_url, category, publish_date, is_published')
    .eq('is_published', true)
    .order('publish_date', { ascending: false })

  if (categoria && categoria !== 'all') {
    query = query.eq('category', categoria)
  }

  const { data } = await query.limit(24)
  return data ?? []
}

function getCategoryLabel(slug: string | null) {
  if (!slug) return 'Geral'
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === slug?.toLowerCase())
  return found ? found.label : slug
}

function getCategoryIcon(slug: string | null) {
  if (!slug) return '💡'
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === slug?.toLowerCase())
  return found ? found.icon : '💡'
}

export default async function DicasPage({ searchParams }: { searchParams: { categoria?: string } }) {
  const dicas = await getDicas(searchParams.categoria)

  const allCategories = [
    { slug: 'all', label: 'Todas', icon: '✨' },
    ...CATEGORIES.filter(c => ['canalização', 'eletricidade', 'limpeza', 'jardinagem', 'pintura', 'pequenas_obras', 'outros'].includes(c.slug)),
  ]

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-brand-orange font-medium text-sm mb-2 uppercase tracking-wider">Aprende mais</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-brand-navy mb-4">Dicas do Dia</h1>
          <p className="text-brand-navy/50 max-w-xl mx-auto">
            Conselhos práticos para manter a tua casa em perfeito estado.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {allCategories.map(cat => (
            <Link
              key={cat.slug}
              href={cat.slug === 'all' ? '/dicas' : `/dicas?categoria=${cat.slug}`}
              className={`badge text-sm transition-colors ${
                (cat.slug === 'all' && !searchParams.categoria) || searchParams.categoria === cat.slug
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-navy/60 hover:bg-brand-orange hover:text-white border border-brand-navy/10'
              }`}
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>

        {/* Dicas grid */}
        {dicas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dicas.map(dica => (
              <Link key={dica.id} href={`/dicas/${dica.id}`} className="group card hover:-translate-y-1 hover:shadow-lg p-0 overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-brand-cream to-brand-orange/10 flex items-center justify-center relative overflow-hidden">
                  {dica.image_url ? (
                    <Image src={dica.image_url} alt={dica.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-5xl opacity-30 group-hover:scale-110 transition-transform duration-300">
                      {getCategoryIcon(dica.category)}
                    </span>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="badge bg-white/90 backdrop-blur-sm text-brand-navy/70 shadow-sm text-xs">
                      {getCategoryIcon(dica.category)} {getCategoryLabel(dica.category)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {dica.publish_date && (
                    <p className="text-brand-navy/30 text-xs mb-2">
                      {new Date(dica.publish_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                  <h2 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors mb-2 leading-snug">
                    {dica.title}
                  </h2>
                  {dica.short_description && (
                    <p className="text-brand-navy/50 text-sm leading-relaxed line-clamp-2">{dica.short_description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-brand-navy/40">Nenhuma dica encontrada.</p>
          </div>
        )}
      </div>
    </div>
  )
}
