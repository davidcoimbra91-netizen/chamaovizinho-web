import Link from 'next/link'
import Image from 'next/image'
import { CATEGORIES } from '@/types'

export default function CategoriesSection() {
  return (
    <section style={{ padding: '32px 0', background: '#fff', borderBottom: '0.5px solid #EDE6DC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Serviços populares
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
            O que precisas hoje?
          </h2>
          <p style={{ fontSize: 15, color: '#9B7A5A' }}>
            Encontra ajuda local para os serviços mais procurados perto de ti.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {CATEGORIES.filter(c => c.slug !== 'outros').map(cat => (
            <Link key={cat.slug} href={`/servicos/${cat.slug}`}
              style={{ background: cat.bg, border: `0.5px solid ${cat.color}20`, borderRadius: 12, padding: '14px 10px', textAlign: 'center', transition: 'all 0.15s', display: 'block' }}
              className="group hover:shadow-md hover:-translate-y-0.5">
              <div style={{ width: 44, height: 44, margin: '0 auto 8px', position: 'relative' }}>
                {cat.iconImg ? (
                  <Image src={cat.iconImg} alt={cat.label} fill style={{ objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{cat.icon}</div>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#2C1A0E', lineHeight: 1.3 }}>
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
