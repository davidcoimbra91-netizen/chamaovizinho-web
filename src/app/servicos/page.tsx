import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORIES, REGIONS } from '@/types'

export const metadata: Metadata = {
  title: 'Todos os Serviços — Encontra prestadores em Portugal',
  description: 'Canalização, eletricidade, limpeza, jardinagem, pintura e muito mais. Encontra o prestador certo para cada trabalho em Portugal.',
}

export default function ServicosPage() {
  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-brand-orange font-medium text-sm mb-2 uppercase tracking-wider">Plataforma</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-brand-navy mb-4">Todos os serviços</h1>
          <p className="text-brand-navy/50 max-w-xl mx-auto">
            Encontra o prestador certo para cada trabalho. Prestadores verificados com avaliações reais.
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/servicos/${cat.slug}`}
              className="card flex items-center gap-4 hover:-translate-y-1 hover:shadow-md group"
            >
              <div className="w-14 h-14 bg-brand-orange/10 group-hover:bg-brand-orange rounded-2xl flex items-center justify-center text-2xl transition-colors flex-shrink-0">
                {cat.icon}
              </div>
              <div>
                <h2 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors">{cat.label}</h2>
                <p className="text-brand-navy/50 text-sm mt-0.5 leading-snug">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Regions */}
        <div className="bg-white rounded-3xl p-8 border border-brand-navy/5">
          <h2 className="font-display text-2xl font-semibold text-brand-navy mb-6">Por região</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {REGIONS.map(region => (
              <Link
                key={region.slug}
                href={`/prestadores/${region.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-brand-cream hover:bg-brand-orange group transition-colors text-center"
              >
                <span className="text-2xl">📍</span>
                <span className="font-medium text-brand-navy group-hover:text-white transition-colors text-sm">{region.label}</span>
                <span className="text-xs text-brand-navy/40 group-hover:text-white/70 transition-colors">{region.cities.length} cidades</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
