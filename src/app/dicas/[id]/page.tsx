import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_tips')
    .select('title, short_description')
    .eq('id', params.id)
    .single()
  if (!data) return {}
  return {
    title: data.title,
    description: data.short_description ?? undefined,
  }
}

export const revalidate = 3600

export default async function DicaPage({ params }: Props) {
  const supabase = createClient()
  const { data: dica } = await supabase
    .from('daily_tips')
    .select('*')
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  if (!dica) notFound()

  // Related dicas
  const { data: related } = await supabase
    .from('daily_tips')
    .select('id, title, short_description, image_url, category')
    .eq('is_published', true)
    .eq('category', dica.category ?? '')
    .neq('id', dica.id)
    .limit(3)

  const cat = CATEGORIES.find(c => c.slug === dica.category || c.slug.toLowerCase() === dica.category?.toLowerCase())
  const tips = dica.tips as any[] | null

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-brand-navy/40">
          <Link href="/" className="hover:text-brand-orange">Início</Link>
          <span>/</span>
          <Link href="/dicas" className="hover:text-brand-orange">Dicas</Link>
          <span>/</span>
          <span className="text-brand-navy line-clamp-1">{dica.title}</span>
        </div>

        {/* Category badge */}
        {cat && (
          <Link href={`/dicas?categoria=${cat.slug}`} className="inline-flex items-center gap-1.5 badge bg-brand-orange/10 text-brand-orange mb-5 hover:bg-brand-orange hover:text-white transition-colors">
            {cat.icon} {cat.label}
          </Link>
        )}

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-brand-navy mb-4 leading-tight">
          {dica.title}
        </h1>

        {dica.publish_date && (
          <p className="text-brand-navy/30 text-sm mb-6">
            {new Date(dica.publish_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}

        {/* Image */}
        {dica.image_url && (
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8 bg-brand-cream">
            <Image src={dica.image_url} alt={dica.title} fill className="object-cover" />
          </div>
        )}

        {/* Short description */}
        {dica.short_description && (
          <p className="text-lg text-brand-navy/70 leading-relaxed mb-8 font-medium">
            {dica.short_description}
          </p>
        )}

        {/* Content */}
        {dica.content && (
          <div className="prose prose-sm max-w-none mb-8 text-brand-navy/70 leading-relaxed">
            {dica.content.split('\n').map((paragraph: string, i: number) => (
              paragraph.trim() ? <p key={i} className="mb-4">{paragraph}</p> : null
            ))}
          </div>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="bg-brand-orange/5 rounded-2xl p-6 mb-8 border border-brand-orange/10">
            <h2 className="font-semibold text-brand-navy mb-4 flex items-center gap-2">
              <span>💡</span> Dicas práticas
            </h2>
            <ul className="space-y-3">
              {tips.map((tip: any, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-brand-orange rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">{i + 1}</span>
                  <p className="text-brand-navy/70 text-sm leading-relaxed">
                    {typeof tip === 'string' ? tip : tip.text ?? tip.tip ?? JSON.stringify(tip)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="bg-brand-navy rounded-2xl p-6 text-center mb-12">
          <p className="text-white font-semibold mb-2">Precisas de ajuda profissional?</p>
          <p className="text-white/50 text-sm mb-4">Encontra um prestador verificado perto de ti.</p>
          <Link href={cat ? `/servicos/${cat.slug}` : '/servicos'} className="btn-primary inline-flex">
            Ver prestadores {cat ? `de ${cat.label.toLowerCase()}` : ''}
          </Link>
        </div>

        {/* Related */}
        {related && related.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-navy mb-5">Mais dicas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/dicas/${r.id}`} className="card hover:-translate-y-0.5 hover:shadow-md p-0 overflow-hidden group">
                  <div className="h-28 bg-brand-cream relative overflow-hidden">
                    {r.image_url ? (
                      <Image src={r.image_url} alt={r.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">
                        {CATEGORIES.find(c => c.slug === r.category)?.icon ?? '💡'}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-brand-navy group-hover:text-brand-orange transition-colors leading-snug line-clamp-2">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
