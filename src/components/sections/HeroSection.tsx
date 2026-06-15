'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import HeroBanner from '@/components/layout/HeroBanner'
import { CATEGORIES } from '@/types'

const POPULAR = ['Canalizador', 'Eletricista', 'Limpeza', 'Pintura', 'Jardinagem']

export default function HeroSection() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (city) params.set('cidade', city)
    router.push(`/servicos?${params.toString()}`)
  }

  return (
    <>
      <HeroBanner>
        <div style={{ marginTop: 8 }}>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
            Precisa de ajuda <span style={{ color: '#C85A1A', fontStyle: 'italic' }}>em casa?</span>
          </h1>
          <p style={{ fontSize: 15, color: '#8B6848' }}>
            Encontra profissionais de confiança perto de si em Portugal.
          </p>
        </div>
      </HeroBanner>

      {/* Search bar below banner */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC', padding: '14px 0' }}>
        <div className="max-w-3xl mx-auto px-4">
          <form onSubmit={handleSearch}
            style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, display: 'flex', gap: 0, overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
              <Search size={15} color="#B07848" />
              <input
                type="text"
                placeholder="Que serviço precisas?"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#2C1A0E' }}
              />
            </div>
            <div style={{ width: '0.5px', background: '#EDE6DC', margin: '8px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
              <MapPin size={14} color="#B07848" />
              <input
                type="text"
                placeholder="Cidade..."
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ width: 100, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#2C1A0E' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ borderRadius: 0, margin: 0 }}>
              Pesquisar
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#9B7A5A' }}>Popular:</span>
            {POPULAR.map(term => (
              <button key={term} onClick={() => setQuery(term)}
                style={{ fontSize: 14, color: '#7A6048', background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 99, padding: '3px 10px', cursor: 'pointer' }}
                className="hover:border-brand-orange hover:text-brand-orange transition-colors">
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
