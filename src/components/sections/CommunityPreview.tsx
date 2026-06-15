import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

interface Question {
  id: string
  title: string
  category: string | null
  answers_count: number
  created_at: string
}

export default function CommunityPreview({ questions }: { questions: Question[] }) {
  if (!questions.length) return null
  return (
    <section style={{ padding: '40px 0', background: '#fff', borderBottom: '0.5px solid #EDE6DC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p style={{ fontSize: 13, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Comunidade</p>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E', marginBottom: 10 }}>Pergunta ao Vizinho</h2>
            <p style={{ fontSize: 15, color: '#7A6048', lineHeight: 1.6, marginBottom: 20 }}>
              Tens uma dúvida sobre a tua casa? A nossa comunidade de especialistas está aqui para ajudar.
            </p>
            <Link href="/comunidade" className="btn-primary">Fazer uma pergunta</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map(q => (
              <Link key={q.id} href={`/comunidade/${q.id}`}
                style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'border-color 0.15s' }}
                className="hover:border-brand-orange group">
                <div style={{ width: 32, height: 32, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageCircle size={15} color="#C85A1A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: '#2C1A0E', marginBottom: 4, lineHeight: 1.3 }} className="group-hover:text-brand-orange transition-colors line-clamp-2">{q.title}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {q.category && <span style={{ fontSize: 13, background: '#F5E8D6', color: '#854A1A', borderRadius: 99, padding: '1px 8px', border: '0.5px solid #E0CCBB' }}>{q.category}</span>}
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>{q.answers_count} resposta{q.answers_count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/comunidade" style={{ fontSize: 15, color: '#C85A1A', fontWeight: 500, textAlign: 'center', marginTop: 4 }} className="hover:underline">
              Ver todas as perguntas →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
