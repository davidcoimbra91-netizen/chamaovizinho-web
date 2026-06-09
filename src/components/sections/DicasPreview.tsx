import Link from 'next/link'
import Image from 'next/image'
import { CATEGORIES } from '@/types'

interface Dica {
  id: string
  title: string
  short_description: string | null
  image_url: string | null
  category: string | null
  publish_date: string | null
}

function getCategoryInfo(slug: string | null) {
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
  return found ?? { label: 'Geral', icon: '💡' }
}

export default function DicasPreview({ dicas }: { dicas: Dica[] }) {
  if (!dicas.length) return null
  return (
    <section style={{ padding: '40px 0', background: '#FAF7F2', borderBottom: '0.5px solid #EDE6DC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Aprende mais</p>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E' }}>Dicas do Dia</h2>
          </div>
          <Link href="/dicas" style={{ fontSize: 13, color: '#C85A1A', fontWeight: 500 }} className="hover:underline hidden sm:block">Ver todas →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dicas.map(dica => {
            const cat = getCategoryInfo(dica.category)
            return (
              <Link key={dica.id} href={`/dicas/${dica.id}`}
                style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, overflow: 'hidden', display: 'block', transition: 'border-color 0.15s' }}
                className="group hover:border-brand-orange">
                <div style={{ height: 160, background: '#F5E8D4', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {dica.image_url
                    ? <Image src={dica.image_url} alt={dica.title} fill className="object-cover" />
                    : <span style={{ fontSize: 40, opacity: 0.3 }}>{cat.icon}</span>
                  }
                  <span style={{ position: 'absolute', top: 10, left: 10, background: '#fff', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 500, color: '#854A1A', border: '0.5px solid #E0CCBB' }}>
                    {cat.icon} {cat.label}
                  </span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  {dica.publish_date && <p style={{ fontSize: 11, color: '#B09070', marginBottom: 4 }}>{new Date(dica.publish_date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</p>}
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.4, marginBottom: 6 }} className="group-hover:text-brand-orange transition-colors">{dica.title}</p>
                  {dica.short_description && <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{dica.short_description}</p>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
