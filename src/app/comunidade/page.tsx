'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Plus, Search, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CommunityQuestion } from '@/types'

const CATEGORIES = ['Todos', 'canalização', 'eletricidade', 'limpeza', 'jardinagem', 'pintura', 'outros']

export default function ComunidadePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const supabase = createClient()

  useEffect(() => {
    fetchQuestions()
  }, [activeCategory])

  async function fetchQuestions() {
    setLoading(true)
    let query = supabase
      .from('community_questions')
      .select('id, title, description, category, answers_count, created_at, user_id, image_urls')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (activeCategory !== 'Todos') {
      query = query.eq('category', activeCategory)
    }

    const { data: qs } = await query
    if (!qs) { setLoading(false); return }

    // Fetch user profiles separately
    const userIds = [...new Set(qs.map(q => q.user_id))]
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .in('id', userIds)

    const merged = qs.map(q => ({
      ...q,
      user_profiles: users?.find(u => u.id === q.user_id),
    }))

    setQuestions(merged)
    setLoading(false)
  }

  const filtered = search
    ? questions.filter(q => q.title.toLowerCase().includes(search.toLowerCase()))
    : questions

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-brand-orange font-medium text-sm mb-2 uppercase tracking-wider">Comunidade</p>
            <h1 className="font-display text-4xl font-semibold text-brand-navy">Pergunta ao Vizinho</h1>
            <p className="text-brand-navy/50 mt-2">Tira as tuas dúvidas sobre a casa com a nossa comunidade.</p>
          </div>
          <Link href="/auth?redirect=/comunidade/nova" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova pergunta</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
          <input
            type="text"
            placeholder="Pesquisar perguntas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-navy/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`badge text-sm transition-colors ${activeCategory === cat ? 'bg-brand-orange text-white' : 'bg-white text-brand-navy/60 hover:bg-brand-orange hover:text-white border border-brand-navy/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="card h-24 animate-pulse bg-brand-navy/5" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(q => (
              <Link key={q.id} href={`/comunidade/${q.id}`}
                className="card flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-md p-5 group">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-brand-cream overflow-hidden relative flex-shrink-0">
                  {q.user_profiles?.profile_photo ? (
                    <Image src={q.user_profiles.profile_photo} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">👤</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-brand-navy group-hover:text-brand-orange transition-colors mb-1 leading-snug">
                    {q.title}
                  </h2>
                  {q.description && (
                    <p className="text-brand-navy/50 text-sm line-clamp-1 mb-2">{q.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-brand-navy/30">{q.user_profiles?.name ?? 'Utilizador'}</span>
                    {q.category && (
                      <span className="badge bg-brand-cream text-brand-navy/50 text-xs px-2 py-0.5">{q.category}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-brand-navy/40">
                      <MessageCircle className="w-3 h-3" />
                      {q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}
                    </span>
                    {q.image_urls?.length > 0 && (
                      <span className="text-xs text-brand-navy/30">📷 {q.image_urls.length} foto{q.image_urls.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-navy/20 group-hover:text-brand-orange transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-brand-navy/5">
            <MessageCircle className="w-10 h-10 text-brand-navy/20 mx-auto mb-4" />
            <h3 className="font-semibold text-brand-navy mb-2">Nenhuma pergunta encontrada</h3>
            <p className="text-brand-navy/50 text-sm mb-6">Sê o primeiro a fazer uma pergunta!</p>
            <Link href="/auth?redirect=/comunidade/nova" className="btn-primary">
              Fazer uma pergunta
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
