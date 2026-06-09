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

    const { data: qUser } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .eq('id', q.user_id)
      .single()

    setQuestion({ ...q, user_profiles: qUser })

    const { data: as } = await supabase
      .from('community_answers')
      .select('id, content, created_at, user_id')
      .eq('question_id', params.id)
      .order('created_at', { ascending: true })

    if (as && as.length > 0) {
      const answerUserIds = Array.from(new Set(as.map((a: any) => a.user_id)))
      const { data: answerUsers } = await supabase
        .from('user_profiles')
        .select('id, name, profile_photo, is_provider')
        .in('id', answerUserIds)

      setAnswers(as.map((a: any) => ({
        ...a,
        user_profiles: answerUsers?.find((u: any) => u.id === a.user_id),
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!question) return null

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingTop: 24, paddingBottom: 80 }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/comunidade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7A6048', textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft size={15} /> Voltar à comunidade
        </Link>

        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {question.user_profiles?.profile_photo
                ? <Image src={question.user_profiles.profile_photo} alt="" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                : '👤'}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#2C1A0E' }}>{question.user_profiles?.name ?? 'Utilizador'}</p>
              <p style={{ fontSize: 11, color: '#B09070' }}>{new Date(question.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</p>
            </div>
            {question.category && (
              <span style={{ marginLeft: 'auto', background: '#F5E8D6', color: '#854A1A', border: '0.5px solid #E0CCBB', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>{question.category}</span>
            )}
          </div>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 600, color: '#2C1A0E', marginBottom: 10 }}>{question.title}</h1>
          {question.description && <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.6 }}>{question.description}</p>}
          {question.image_urls?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              {question.image_urls.map((url: string, i: number) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <Image src={url} alt="" fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MessageCircle size={15} color="#C85A1A" />
            {answers.length} Resposta{answers.length !== 1 ? 's' : ''}
          </h2>
          {answers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {answers.map((a: any) => (
                <div key={a.id} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>👤</div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#2C1A0E' }}>
                        {a.user_profiles?.name ?? 'Utilizador'}
                        {a.user_profiles?.is_provider && <span style={{ marginLeft: 6, background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 6px', fontSize: 10 }}>Prestador</span>}
                      </p>
                      <p style={{ fontSize: 11, color: '#B09070' }}>{new Date(a.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#5A3E28', lineHeight: 1.6 }}>{a.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9B7A5A' }}>Ainda sem respostas. Sê o primeiro a responder!</p>
            </div>
          )}
        </div>

        {user ? (
          <form onSubmit={submitAnswer} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 10 }}>Responder</p>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Escreve a tua resposta..."
              rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none', marginBottom: 10 }}
            />
            <button type="submit" disabled={!answer.trim() || submitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: (!answer.trim() || submitting) ? 0.5 : 1 }}>
              <Send size={14} />
              {submitting ? 'A enviar...' : 'Enviar resposta'}
            </button>
          </form>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 12 }}>Entra para poder responder</p>
            <Link href={`/auth?redirect=/comunidade/${params.id}`} className="btn-primary">Entrar para responder</Link>
          </div>
        )}
      </div>
    </div>
  )
}
