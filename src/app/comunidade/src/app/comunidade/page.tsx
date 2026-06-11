'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Edit2, Send, X, ZoomIn, Flame, Lightbulb } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

// ── Couleurs catégories (emojis, pas d'images) ─────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'canalização': '#1E88E5', 'eletricidade': '#FB8C00', 'pintura': '#8E24AA',
  'jardinagem': '#43A047', 'limpeza': '#00ACC1', 'montagem': '#F9A825',
  'mudanças': '#E64A19', 'electrodomésticos': '#3949AB', 'pequenas_obras': '#FF7043',
  'bricolage': '#7CB342', 'informatica': '#5E35B1', 'outros': '#FF7043',
}

function getCatInfo(slug: string | null) {
  const found = CATEGORIES.find(c => c.slug === slug || c.slug.toLowerCase() === (slug ?? '').toLowerCase())
  return {
    icon: found?.icon ?? '🔧',
    label: found?.label ?? (slug ?? 'Geral'),
    color: CAT_COLORS[slug ?? ''] ?? '#C85A1A',
    bg: (CAT_COLORS[slug ?? ''] ?? '#C85A1A') + '18',
  }
}

function timeAgo(d: string): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (diff < 1) return 'agora'
  if (diff < 60) return `${diff}min`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  if (diff < 10080) return `${Math.floor(diff / 1440)}d`
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

function Avatar({ name, photo, size = 32 }: { name?: string; photo?: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, color: '#C85A1A' }}>
      {photo ? <Image src={photo} alt={name ?? ''} fill style={{ objectFit: 'cover' }} unoptimized /> : (name?.charAt(0) ?? '?')}
    </div>
  )
}

// ── Réponse individuelle (récursive) ─────────────────────────────────────────
function AnswerItem({
  ans, depth = 0, currentUserId, questionId, onRefresh,
}: {
  ans: any; depth?: number; currentUserId: string | null; questionId: string; onRefresh: () => void;
}) {
  const [voted, setVoted] = useState(ans.user_voted || false)
  const [votes, setVotes] = useState(ans.votes_count || 0)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(ans.content)
  const [showMenu, setShowMenu] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const supabase = createClient()

  if (deleted) return null

  const handleVote = async () => {
    if (!currentUserId) return
    try {
      if (voted) {
        await supabase.from('community_answer_votes').delete().eq('answer_id', ans.id).eq('user_id', currentUserId)
        setVoted(false); setVotes((v: number) => Math.max(v - 1, 0))
      } else {
        await supabase.from('community_answer_votes').insert({ answer_id: ans.id, user_id: currentUserId })
        setVoted(true); setVotes((v: number) => v + 1)
      }
    } catch (_) {}
  }

  const handleReply = async () => {
    if (!replyText.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    try {
      await supabase.from('community_answers').insert({
        question_id: questionId,
        user_id: currentUserId,
        content: replyText.trim(),
        is_published: true,
        parent_answer_id: ans.id,
      })
      setReplyText(''); setShowReply(false)
      onRefresh()
    } catch (_) {}
    finally { setSubmitting(false) }
  }

  const handleEdit = async () => {
    if (!editText.trim()) return
    await supabase.from('community_answers').update({ content: editText.trim() }).eq('id', ans.id)
    setEditing(false); onRefresh()
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar esta resposta?')) return
    await supabase.from('community_answers').delete().eq('id', ans.id)
    setDeleted(true); onRefresh()
  }

  const isOwn = currentUserId === ans.user_id
  const authorName = ans.author?.name ?? 'Vizinho'

  return (
    <div style={{
      marginLeft: depth > 0 ? 28 : 0,
      borderLeft: depth > 0 ? '2px solid #EDE6DC' : 'none',
      paddingLeft: depth > 0 ? 12 : 0,
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Avatar name={authorName} photo={ans.author?.profile_photo} size={depth > 0 ? 24 : 30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Bulle réponse */}
          <div style={{ background: '#F7F4EF', borderRadius: 12, padding: '8px 12px', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2C1A0E' }}>{authorName}</span>
              <span style={{ fontSize: 10, color: '#B09070' }}>{timeAgo(ans.created_at)}</span>
            </div>
            {editing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{ width: '100%', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '8px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button onClick={() => setEditing(false)} style={{ fontSize: 11, color: '#9B7A5A', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleEdit} style={{ fontSize: 11, background: '#C85A1A', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>Guardar</button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#2C1A0E', lineHeight: 1.5, margin: 0 }}>{ans.content}</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Upvote */}
            <button onClick={handleVote} style={{ display: 'flex', alignItems: 'center', gap: 4, background: voted ? '#FBF0E8' : 'none', border: voted ? '0.5px solid #C85A1A' : 'none', borderRadius: 99, padding: '2px 7px', cursor: 'pointer', color: voted ? '#C85A1A' : '#9B7A5A', fontSize: 11, fontWeight: voted ? 700 : 400 }}>
              ▲ {votes > 0 ? votes : 'Votar'}
            </button>

            {/* Responder (só depth 0) */}
            {depth === 0 && (
              <button onClick={() => setShowReply(r => !r)} style={{ fontSize: 11, color: '#7A6048', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Responder
              </button>
            )}

            {/* Menu ações */}
            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <button onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#B09070', fontSize: 16 }}>
                ⋯
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: 20, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 130, overflow: 'hidden' }}>
                  {isOwn && (
                    <>
                      <button onClick={() => { setEditing(true); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#2C1A0E', textAlign: 'left' }}>
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onClick={() => { handleDelete(); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C62828', textAlign: 'left' }}>
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </>
                  )}
                  <button onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9B7A5A', textAlign: 'left' }}>
                    ⚑ Denunciar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Champ réponse inline */}
          {showReply && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <textarea
                autoFocus
                placeholder="Escreve a tua resposta..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                style={{ flex: 1, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'none', minHeight: 60 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={handleReply} disabled={!replyText.trim() || submitting} style={{ padding: '7px 12px', borderRadius: 8, background: !replyText.trim() ? '#EDE6DC' : '#C85A1A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {submitting ? '...' : <Send size={13} />}
                </button>
                <button onClick={() => { setShowReply(false); setReplyText('') }} style={{ padding: '6px', borderRadius: 8, background: 'none', border: '0.5px solid #EDE6DC', cursor: 'pointer' }}>
                  <X size={13} color="#9B7A5A" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sous-réponses récursives */}
      {(ans.children ?? []).map((child: any) => (
        <AnswerItem key={child.id} ans={child} depth={depth + 1} currentUserId={currentUserId} questionId={questionId} onRefresh={onRefresh} />
      ))}
    </div>
  )
}

// ── Carte question (style forum) ──────────────────────────────────────────────
function QuestionCard({ item, currentUserId, currentUserProfile, onRefresh }: {
  item: any; currentUserId: string | null; currentUserProfile: any; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false)
  const [answers, setAnswers] = useState<any[]>([])
  const [loadingAns, setLoadingAns] = useState(false)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const supabase = createClient()

  const cat = getCatInfo(item.category)
  const authorName = item.author?.name ?? 'Vizinho'
  const images: string[] = Array.isArray(item.image_urls) ? item.image_urls.filter(Boolean) : []
  const isOwn = currentUserId === item.user_id

  function buildTree(flat: any[]) {
    const map: Record<string, any> = {}
    flat.forEach(a => { map[a.id] = { ...a, children: [] } })
    const roots: any[] = []
    flat.forEach(a => {
      if (a.parent_answer_id && map[a.parent_answer_id]) {
        map[a.parent_answer_id].children.push(map[a.id])
      } else {
        roots.push(map[a.id])
      }
    })
    return roots
  }

  const loadAnswers = async () => {
    if (loadingAns) return
    setLoadingAns(true)
    try {
      const { data: ans } = await supabase
        .from('community_answers')
        .select('*, votes_count, parent_answer_id')
        .eq('question_id', item.id)
        .eq('is_published', true)
        .order('created_at', { ascending: true })

      if (!ans || ans.length === 0) { setAnswers([]); return }

      const userIds = Array.from(new Set(ans.map((a: any) => a.user_id).filter(Boolean))) as string[]
      const { data: profiles } = await supabase.from('user_profiles').select('id, name, profile_photo').in('id', userIds)
      const profileMap: Record<string, any> = {}
      ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })

      let votedSet = new Set<string>()
      if (currentUserId) {
        const { data: myVotes } = await supabase.from('community_answer_votes').select('answer_id').eq('user_id', currentUserId).in('answer_id', ans.map((a: any) => a.id))
        votedSet = new Set((myVotes ?? []).map((v: any) => v.answer_id))
      }

      const enriched = ans.map((a: any) => ({ ...a, author: profileMap[a.user_id] ?? null, user_voted: votedSet.has(a.id) }))
      setAnswers(buildTree(enriched))
    } catch (_) {}
    finally { setLoadingAns(false) }
  }

  const handleToggle = () => {
    if (!expanded) loadAnswers()
    setExpanded(e => !e)
  }

  const handleReply = async () => {
    if (!replyText.trim() || submitting || !currentUserId) return
    setSubmitting(true)
    try {
      await supabase.from('community_answers').insert({
        question_id: item.id,
        user_id: currentUserId,
        content: replyText.trim(),
        is_published: true,
      })
      setReplyText(''); setShowReply(false)
      await loadAnswers()
      if (!expanded) setExpanded(true)
      onRefresh()
    } catch (_) {}
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar esta pergunta?')) return
    await supabase.from('community_questions').delete().eq('id', item.id)
    onRefresh()
  }

  const PREVIEW_COUNT = 2

  return (
    <>
      {/* Modal zoom image */}
      {zoomedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoomedImage(null)}>
          <button onClick={() => setZoomedImage(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 18 }}>✕</button>
          <img src={zoomedImage} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC', padding: '16px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
          <Avatar name={authorName} photo={item.author?.profile_photo} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{authorName}</span>
              <span style={{ fontSize: 11, color: '#B09070' }}>{timeAgo(item.created_at)}</span>
              <span style={{ background: cat.bg, color: cat.color, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                {cat.icon} {cat.label}
              </span>
              {item.is_provider_author && item.is_verified && (
                <span style={{ background: '#EAF3DE', color: '#3B6D11', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>✓ Verificado</span>
              )}
            </div>

            {/* Titre */}
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#2C1A0E', lineHeight: 1.4, margin: '0 0 8px' }}>{item.title}</h3>

            {/* Description si présente */}
            {item.description && (
              <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.5, margin: '0 0 8px' }}>{item.description}</p>
            )}

            {/* Miniatures photos */}
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {images.map((uri, i) => (
                  <div key={i} onClick={() => setZoomedImage(uri)} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in', flexShrink: 0 }}>
                    <Image src={uri} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover:bg-black/20 transition-colors">
                      <ZoomIn size={16} color="#fff" style={{ opacity: 0 }} className="group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu ⋯ */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#B09070', fontSize: 18 }}>⋯</button>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: 24, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 140, overflow: 'hidden' }}>
                {isOwn && (
                  <>
                    <Link href={`/comunidade/${item.id}/editar`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', textDecoration: 'none', fontSize: 12, color: '#2C1A0E' }} onClick={() => setShowMenu(false)}>
                      <Edit2 size={13} /> Editar
                    </Link>
                    <button onClick={() => { handleDelete(); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#C62828', textAlign: 'left' }}>
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </>
                )}
                <button onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9B7A5A', textAlign: 'left' }}>
                  ⚑ Denunciar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer: respostas + responder */}
        <div style={{ display: 'flex', gap: 16, paddingTop: 4, paddingBottom: 6 }}>
          <button onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#7A6048', fontSize: 12, fontWeight: 500 }}>
            <span>💬</span>
            <span>{item.answers_count > 0 ? `${item.answers_count} resposta${item.answers_count > 1 ? 's' : ''}` : 'Ser o primeiro a responder'}</span>
            <span style={{ fontSize: 10, color: '#B09070' }}>{expanded ? ' ▲' : ' ▼'}</span>
          </button>
          <button onClick={() => {
            if (!expanded && !showReply) { loadAnswers(); setExpanded(true) }
            setShowReply(r => !r)
          }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#C85A1A', fontSize: 12, fontWeight: 600 }}>
            <span>✏️</span>
            <span>Responder</span>
          </button>
        </div>

        {/* Champ réponse à la question */}
        {showReply && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingTop: 10, borderTop: '0.5px solid #F0E8DC' }}>
            <Avatar name={currentUserProfile?.name} photo={currentUserProfile?.profile_photo} size={30} />
            <div style={{ flex: 1 }}>
              <textarea
                autoFocus
                placeholder="Escreve a tua resposta..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button onClick={() => { setShowReply(false); setReplyText('') }} style={{ fontSize: 12, color: '#9B7A5A', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleReply} disabled={!replyText.trim() || submitting}
                  style={{ padding: '7px 16px', borderRadius: 9, background: !replyText.trim() ? '#EDE6DC' : '#C85A1A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {submitting ? '...' : <><Send size={12} /> Enviar</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zone réponses expandable */}
        {expanded && (
          <div style={{ borderTop: '0.5px solid #F0E8DC', paddingTop: 12, marginTop: 8 }}>
            {loadingAns ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                <div style={{ width: 20, height: 20, border: '2px solid #EDE6DC', borderTopColor: '#C85A1A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : answers.length === 0 ? (
              <p style={{ fontSize: 12, color: '#B09070', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Ainda sem respostas. Sê o primeiro!</p>
            ) : (
              <>
                {/* 2 primeiras respostas sempre visíveis */}
                {answers.slice(0, PREVIEW_COUNT).map(ans => (
                  <AnswerItem key={ans.id} ans={ans} depth={0} currentUserId={currentUserId} questionId={item.id} onRefresh={() => { loadAnswers(); onRefresh() }} />
                ))}

                {/* Restantes sob "ver mais" */}
                {answers.length > PREVIEW_COUNT && (
                  <ExpandableAnswers answers={answers.slice(PREVIEW_COUNT)} currentUserId={currentUserId} questionId={item.id} onRefresh={() => { loadAnswers(); onRefresh() }} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// Respostas adicionais colapsáveis
function ExpandableAnswers({ answers, currentUserId, questionId, onRefresh }: any) {
  const [shown, setShown] = useState(false)
  return (
    <>
      {shown && answers.map((ans: any) => (
        <AnswerItem key={ans.id} ans={ans} depth={0} currentUserId={currentUserId} questionId={questionId} onRefresh={onRefresh} />
      ))}
      <button onClick={() => setShown(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#C85A1A', fontSize: 12, fontWeight: 600, padding: '6px 0' }}>
        {shown ? <><ChevronUp size={14} /> Mostrar menos</> : <><ChevronDown size={14} /> Ver mais {answers.length} resposta{answers.length > 1 ? 's' : ''}</>}
      </button>
    </>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ComunidadePage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [communityTip, setCommunityTip] = useState<any>(null)
  const [activeProviders, setActiveProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: p } = await supabase.from('user_profiles').select('name, profile_photo').eq('id', user.id).single()
        setCurrentUserProfile(p)
      }
      fetchQuestions()
      fetchSidebar()
    }
    init()
  }, [activeCategory])

  async function fetchQuestions() {
    setLoading(true)
    let query = supabase
      .from('community_questions')
      .select('id, title, description, category, answers_count, created_at, user_id, image_urls, is_published')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(25)

    if (activeCategory !== 'Todos') query = query.eq('category', activeCategory)

    const { data: qs } = await query
    if (!qs) { setLoading(false); return }

    const userIds = Array.from(new Set(qs.map((q: any) => q.user_id))) as string[]
    const { data: users } = await supabase.from('user_profiles').select('id, name, profile_photo, is_provider').in('id', userIds)
    const profileMap: Record<string, any> = {}
    ;(users ?? []).forEach((u: any) => { profileMap[u.id] = u })

    setQuestions(qs.map((q: any) => ({ ...q, author: profileMap[q.user_id] ?? null })))
    setLoading(false)
  }

  async function fetchSidebar() {
    const today = new Date().toISOString().split('T')[0]

    // Dica da comunidade (tabela community_tips)
    const { data: tipData } = await supabase
      .from('community_tips')
      .select('id, title, short_description, image_url, category')
      .eq('is_published', true)
      .lte('publish_date', today)
      .order('publish_date', { ascending: false })
      .limit(1)
    if (tipData?.[0]) setCommunityTip(tipData[0])

    // Perguntas populares
    const { data: popData } = await supabase
      .from('community_questions')
      .select('id, title, answers_count')
      .eq('is_published', true)
      .order('answers_count', { ascending: false })
      .limit(5)
    setPopular(popData ?? [])

    // Prestadores mais ativos nas respostas
    const { data: topAnswers } = await supabase
      .from('community_answers')
      .select('user_id')
      .eq('is_published', true)
      .limit(100)

    if (topAnswers) {
      const counts: Record<string, number> = {}
      topAnswers.forEach((a: any) => { counts[a.user_id] = (counts[a.user_id] ?? 0) + 1 })
      const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
      if (topIds.length > 0) {
        const { data: topUsers } = await supabase.from('user_profiles').select('id, name, profile_photo, is_provider').in('id', topIds)
        const provIds = (topUsers ?? []).filter((u: any) => u.is_provider).map((u: any) => u.id)
        const { data: provData } = provIds.length > 0
          ? await supabase.from('provider_profiles').select('user_id, id, average_rating, service_categories, is_verified').in('user_id', provIds)
          : { data: [] }
        setActiveProviders((topUsers ?? []).map((u: any) => ({
          ...u,
          provider_profile: (provData ?? []).find((pp: any) => pp.user_id === u.id),
          answerCount: counts[u.id] ?? 0,
        })).filter((u: any) => u.is_provider).slice(0, 3))
      }
    }
  }

  const catFilters = ['Todos', ...CATEGORIES.slice(0, 9).map(c => c.slug)]

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Comunidade</p>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 30, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Pergunta ao Vizinho</h1>
            <p style={{ fontSize: 14, color: '#7A6048' }}>Tira dúvidas, partilha experiências e ajuda os teus vizinhos.</p>
          </div>
          {currentUserId && (
            <Link href="/comunidade/nova" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#C85A1A', color: '#fff', textDecoration: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(200,90,26,0.3)' }}>
              <Plus size={15} /> Nova pergunta
            </Link>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

          {/* ── LISTA PRINCIPAL ── */}
          <div>
            {/* Filtros categorias (emojis) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {catFilters.map(slug => {
                const cat = slug === 'Todos'
                  ? { icon: '✨', label: 'Todos', color: '#C85A1A' }
                  : { icon: getCatInfo(slug).icon, label: getCatInfo(slug).label, color: getCatInfo(slug).color }
                const isActive = activeCategory === slug
                return (
                  <button key={slug} onClick={() => setActiveCategory(slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99, border: isActive ? 'none' : '0.5px solid #EDE6DC', background: isActive ? cat.color : '#fff', color: isActive ? '#fff' : '#5A3E28', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* CTA si pas connecté */}
            {!currentUserId && (
              <div style={{ background: '#FBF0E8', border: '0.5px solid #E0CCBB', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 13, color: '#5A3E28' }}>Liga-te para participar na comunidade e responder.</p>
                <Link href="/auth" style={{ padding: '7px 16px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Entrar</Link>
              </div>
            )}

            {/* Lista questions */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ height: 100, background: '#fff', borderBottom: '0.5px solid #EDE6DC', opacity: 0.4 }} />)}
              </div>
            ) : questions.length > 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC', overflow: 'hidden', padding: '0 16px' }}>
                {questions.map(q => (
                  <QuestionCard key={q.id} item={q} currentUserId={currentUserId} currentUserProfile={currentUserProfile} onRefresh={fetchQuestions} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 14, border: '0.5px solid #EDE6DC' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>💬</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>Nenhuma pergunta encontrada</p>
                {currentUserId && (
                  <Link href="/comunidade/nova" style={{ display: 'inline-block', marginTop: 10, padding: '8px 20px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                    Fazer uma pergunta
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1. Dica da Comunidade — EN HAUT */}
            {communityTip ? (
              <Link href="/comunidade/dicas" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#2C1A0E', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <Lightbulb size={15} color="#C85A1A" />
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dica da Comunidade</p>
                  </div>
                  {communityTip.image_url && (
                    <div style={{ borderRadius: 8, overflow: 'hidden', height: 80, position: 'relative', marginBottom: 8 }}>
                      <Image src={communityTip.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>{communityTip.title}</p>
                  {communityTip.short_description && (
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 8 }}>{communityTip.short_description}</p>
                  )}
                  <span style={{ fontSize: 11, color: '#C85A1A', fontWeight: 600 }}>Ver todas as dicas →</span>
                </div>
              </Link>
            ) : (
              <div style={{ background: '#2C1A0E', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Lightbulb size={15} color="#C85A1A" />
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dica da Comunidade</p>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Cria a primeira dica no painel de administração.</p>
                <Link href="/comunidade/dicas" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600, display: 'block', marginTop: 8 }}>Ver dicas →</Link>
              </div>
            )}

            {/* 2. Perguntas populares */}
            <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Flame size={15} color="#C85A1A" />
                <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Perguntas populares</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {popular.map((q: any, i: number) => (
                  <button key={q.id} onClick={() => {
                    // Scroll to question
                    const el = document.getElementById(`q-${q.id}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#D4C4B0', flexShrink: 0, width: 18 }}>{i + 1}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.4, marginBottom: 2 }}>{q.title}</p>
                      <p style={{ fontSize: 10, color: '#9B7A5A' }}>{q.answers_count} respostas</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Profissionais ativos */}
            {activeProviders.length > 0 && (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>Profissionais que ajudam</p>
                  <Link href="/explorar" style={{ fontSize: 11, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeProviders.map(p => {
                    const cat = p.provider_profile?.service_categories?.[0] ? getCatInfo(p.provider_profile.service_categories[0]) : null
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar name={p.name} photo={p.profile_photo} size={34} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{p.name}</p>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {p.provider_profile?.is_verified && <span style={{ fontSize: 9, color: '#3B6D11', fontWeight: 700 }}>✓</span>}
                            {cat && <span style={{ fontSize: 10, color: cat.color }}>{cat.icon} {cat.label}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {p.provider_profile?.average_rating > 0 && <p style={{ fontSize: 11, fontWeight: 700, color: '#F9AB00' }}>⭐ {p.provider_profile.average_rating.toFixed(1)}</p>}
                          <p style={{ fontSize: 10, color: '#9B7A5A' }}>{p.answerCount} resp.</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA nova pergunta */}
            {currentUserId && (
              <div style={{ background: '#FAF7F2', border: '0.5px dashed #C85A1A', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#5A3E28', marginBottom: 10, lineHeight: 1.5 }}>Tens uma dúvida sobre a tua casa?</p>
                <Link href="/comunidade/nova" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 9, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                  <Plus size={13} /> Fazer uma pergunta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
