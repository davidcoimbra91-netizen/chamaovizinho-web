import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIES } from '@/types'

export const metadata: Metadata = {
  title: 'Dicas do Dia — Manutenção da sua casa',
  description: 'Dicas práticas sobre manutenção doméstica, canalização, eletricidade, limpeza e muito mais.',
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

  // Fix: on retire le filtre .lte('publish_date', today) pour afficher TOUTES les dicas publiées
  const { data } = await query.limit(48)
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

function getCategoryImg(slug: string | null) {
  if (!slug) return null
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === slug?.toLowerCase())
  return found?.iconImg ?? null
}

export default async function DicasPage({ searchParams }: { searchParams: { categoria?: string } }) {
  const dicas = await getDicas(searchParams.categoria)

  const allCategories = [
    { slug: 'all', label: 'Todas', icon: '✨', iconImg: null },
    ...CATEGORIES.filter(c => ['canalização', 'eletricidade', 'limpeza', 'jardinagem', 'pintura', 'pequenas_obras', 'montagem', 'bricolage', 'outros'].includes(c.slug)),
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Aprende mais</p>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 40, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>Dicas do Dia</h1>
          <p style={{ fontSize: 14, color: '#7A6048', maxWidth: 480, margin: '0 auto' }}>
            Conselhos práticos para manter a tua casa em perfeito estado.
          </p>
        </div>

        {/* Filtros com ícones */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {allCategories.map(cat => {
            const isActive = (cat.slug === 'all' && !searchParams.categoria) || searchParams.categoria === cat.slug
            return (
              <Link
                key={cat.slug}
                href={cat.slug === 'all' ? '/dicas' : `/dicas?categoria=${cat.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 99,
                  background: isActive ? '#C85A1A' : '#fff',
                  color: isActive ? '#fff' : '#5A3E28',
                  border: isActive ? 'none' : '0.5px solid #EDE6DC',
                  fontSize: 12, fontWeight: 600, textDecoration: 'none',
                  boxShadow: isActive ? '0 4px 12px rgba(200,90,26,0.3)' : 'none',
                }}>
                {cat.iconImg
                  ? <img src={cat.iconImg} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 15 }}>{cat.icon}</span>
                }
                {cat.label}
              </Link>
            )
          })}
        </div>

        {/* Grille dicas */}
        {dicas.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {dicas.map((dica: any) => {
              const catIcon = getCategoryIcon(dica.category)
              const catLabel = getCategoryLabel(dica.category)
              const catImg = getCategoryImg(dica.category)
              const catInfo = CATEGORIES.find(c => c.slug === dica.category || c.slug.toLowerCase() === (dica.category ?? '').toLowerCase())

              return (
                <Link key={dica.id} href={`/dicas/${dica.id}`} style={{ textDecoration: 'none', display: 'block', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  className="hover:-translate-y-1 hover:shadow-lg">
                  {/* Image */}
                  <div style={{ height: 180, background: catInfo?.bg ?? '#FBF0E8', position: 'relative', overflow: 'hidden' }}>
                    {dica.image_url ? (
                      <Image src={dica.image_url} alt={dica.title} fill style={{ objectFit: 'cover' }} unoptimized />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {catImg
                          ? <img src={catImg} alt="" style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.4 }} />
                          : <span style={{ fontSize: 48, opacity: 0.3 }}>{catIcon}</span>
                        }
                      </div>
                    )}
                    {/* Badge catégorie */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {catImg
                        ? <img src={catImg} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 13 }}>{catIcon}</span>
                      }
                      <span style={{ fontSize: 11, fontWeight: 600, color: catInfo?.color ?? '#7A6048' }}>{catLabel}</span>
                    </div>
                  </div>
                  {/* Contenu */}
                  <div style={{ padding: '14px 16px' }}>
                    {dica.publish_date && (
                      <p style={{ fontSize: 10, color: '#B09070', marginBottom: 5 }}>
                        {new Date(dica.publish_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.4, marginBottom: 7 }}>{dica.title}</h2>
                    {dica.short_description && (
                      <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                        {dica.short_description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>💡</p>
            <p style={{ fontSize: 14, color: '#9B7A5A' }}>Nenhuma dica encontrada nesta categoria.</p>
            <Link href="/dicas" style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todas as dicas →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
