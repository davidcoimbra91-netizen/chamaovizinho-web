'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function QuestionPage() {
  const params = useParams()
  const router = useRouter()
  const [question, setQuestion] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [params.id])

  async function fetchData() {
    const { data: q } = await supabase
      .from('community_questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!q) { router.push('/comunidade'); return }

    // Fetch question author
    const { data: qUser } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .eq('id', q.user_id)
      .single()

    setQuestion({ ...q, user_profiles: qUser })

    // Fetch answers
    const { data: as } = await supabase
      .from('community_answers')
      .select('id, content, created_at, user_id')
      .eq('question_id', params.id)
      .order('created_at', { ascending: true })

    if (as && as.length > 0) {
      const answerUserIds = Array.from(new Set(as.map(a => a.user_id)))
      const { data: answerUsers } = await supabase
        .from('user_profiles')
        .select('id, name, profile_photo, is_provider')
        .in('id', answerUserIds)

      setAnswers(as.map(a => ({
        ...a,
        user_profiles: answerUsers?.find(u => u.id === a.user_id),
      })))
    }

    setLoading(false)
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !answer.trim()) return
    setSubmitting(true)

    const { error } = await supabase
      .from('community_answers')
      .insert({ question_id: params.id, user_id: user.id, content: answer.trim() })

    if (!error) {
      setAnswer('')
      fetchData()
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!question) return null

  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/comunidade" className="inline-flex items-center gap-2 text-brand-navy/50 hover:text-brand-orange transition-colors text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar à comunidade
        </Link>

        {/* Question */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-cream overflow-hidden relative flex-shrink-0">
              {question.user_profiles?.profile_photo ? (
                <Image src={question.user_profiles.profile_photo} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">👤</div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-brand-navy">{question.user_profiles?.name ?? 'Utilizador'}</p>
              <p className="text-xs text-brand-navy/30">
                {new Date(question.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            {question.category && (
              <span className="badge bg-brand-orange/10 text-brand-orange text-xs ml-auto">{question.category}</span>
            )}
          </div>

          <h1 className="font-display text-2xl font-semibold text-brand-navy mb-3">{question.title}</h1>
          {question.description && (
            <p className="text-brand-navy/60 leading-relaxed">{question.description}</p>
          )}

          {/* Images */}
          {question.image_urls?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {question.image_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                  <Image src={url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answers */}
        <div className="mb-6">
          <h2 className="font-semibold text-brand-navy mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-orange" />
            {answers.length} Resposta{answers.length !== 1 ? 's' : ''}
          </h2>

          {answers.length > 0 ? (
            <div className="space-y-3">
              {answers.map(a => (
                <div key={a.id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-cream overflow-hidden relative flex-shrink-0">
                      {a.user_profiles?.profile_photo ? (
                        <Image src={a.user_profiles.profile_photo} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-navy flex items-center gap-1.5">
                        {a.user_profiles?.name ?? 'Utilizador'}
                        {a.user_profiles?.is_provider && (
                          <span className="badge bg-brand-green/10 text-brand-green text-xs px-1.5 py-0.5">Prestador</span>
                        )}
                      </p>
                      <p className="text-xs text-brand-navy/30">
                        {new Date(a.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-brand-navy/70 text-sm leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-brand-navy/5">
              <p className="text-brand-navy/40 text-sm">Ainda sem respostas. Sê o primeiro a responder!</p>
            </div>
          )}
        </div>

        {/* Answer form */}
        {user ? (
          <form onSubmit={submitAnswer} className="card">
            <h3 className="font-semibold text-brand-navy mb-3">Responder</h3>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Escreve a tua resposta..."
              rows={4}
              className="w-full bg-brand-cream border border-brand-navy/10 rounded-xl px-4 py-3 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors resize-none mb-3"
            />
            <button type="submit" disabled={!answer.trim() || submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
              {submitting ? 'A enviar...' : 'Enviar resposta'}
            </button>
          </form>
        ) : (
          <div className="card text-center">
            <p className="text-brand-navy/50 mb-4">Entra para poder responder</p>
            <Link href={`/auth?redirect=/comunidade/${params.id}`} className="btn-primary inline-flex">
              Entrar para responder
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
