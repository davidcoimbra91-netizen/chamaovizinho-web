import Link from 'next/link'
import { CATEGORIES } from '@/types'

export default function CategoriesSection() {
  return (
    <section style={{ padding: '32px 0', background: '#fff', borderBottom: '0.5px solid #EDE6DC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Serviços populares
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
            O que precisas hoje?
          </h2>
          <p style={{ fontSize: 13, color: '#9B7A5A' }}>
            Encontra ajuda local para os serviços mais procurados perto de ti.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/servicos/${cat.slug}`}
              style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px 12px', textAlign: 'center', transition: 'all 0.15s', display: 'block' }}
              className="hover:border-brand-orange group">
              <div style={{ fontSize: 26, marginBottom: 8 }}>{cat.icon}</div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 4 }}
                className="group-hover:text-brand-orange transition-colors">
                {cat.label}
              </p>
              <p style={{ fontSize: 11, color: '#9B7A5A', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
