'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, MessageCircle, Send, ThumbsUp, ChevronDown, ChevronUp, Star, Trash2, Pencil, CornerDownRight, Eye, X, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import TypeBadge from '@/components/ui/TypeBadge'

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_]/g, '_')
}
function getCatInfo(slug: string | null) {
  const n = norm(slug ?? '')
  return (
    CATEGORIES.find(c => c.slug === slug || norm(c.slug) === n) ??
    { icon: '🔧', iconImg: null as string | null, color: '#C85A1A', bg: '#FBF0E8', label: slug ?? 'Geral' }
  )
}
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 10080) return `${Math.floor(m / 1440)}d`
  return new Date(d).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
}

function Avatar({ name, photo, size = 34 }: { name?: string; photo?: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: '#C85A1A' }}>
      {photo
        ? <img src={photo} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.charAt(0) ?? '?')}
    </div>
  )
}

// ── Reusable photo grid ──────────────────────────────────────────────────────
function PhotoGrid({ urls, onOpen }: { urls: string[]; onOpen: (url: string) => void }) {
  if (!urls?.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {urls.map((url, i) => (
        <div key={i} onClick={() => onOpen(url)}
          style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

// ── Inline photo picker ──────────────────────────────────────────────────────
function PhotoPicker({ photos, onChange }: { photos: File[]; onChange: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', color: '#9B7A5A', fontSize: 12 }}>
        <ImageIcon size={12} /> Foto
      </button>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => onChange([...photos, ...Array.from(e.target.files ?? [])].slice(0, 3))} />
      {photos.map((f, i) => (
        <div key={i} style={{ position: 'relative', width: 40, height: 40, borderRadius: 6, overflow: 'hidden' }}>
          <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))}
            style={{ position: 'absolute', top: 1, right: 1, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 14, height: 14, cursor: 'pointer', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Inline reply form ────────────────────────────────────────────────────────
function InlineForm({ targetName, text, onChange, onSubmit, onCancel, submitting }: {
  targetName: string; text: string; onChange: (t: string) => void
  onSubmit: (e: React.FormEvent, photos: File[]) => void
  onCancel: () => void; submitting: boolean
}) {
  const [photos, setPhotos] = useState<File[]>([])
  const handleSubmit = (e: React.FormEvent) => { onSubmit(e, photos); setPhotos([]) }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, color: '#5A3E28' }}>
        <CornerDownRight size={11} color="#C85A1A" />
        <span>A responder a <b>{targetName}</b></span>
        <button type="button" onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9B7A5A', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <textarea autoFocus value={text} onChange={e => onChange(e.target.value)}
        placeholder={`Responder a ${targetName}...`} rows={3}
        style={{ width: '100%', background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '8px 12px', fontSize: 14, resize: 'none', outline: 'none', color: '#2C1A0E', boxSizing: 'border-box', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" disabled={!text.trim() || submitting}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: text.trim() ? '#C85A1A' : '#EDE6DC', color: text.trim() ? '#fff' : '#9B7A5A', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default' }}>
          <Send size={11} /> {submitting ? 'A enviar...' : 'Responder'}
        </button>
        <button type="button" onClick={onCancel}
          style={{ padding: '6px 14px', borderRadius: 8, background: 'transparent', color: '#9B7A5A', border: '0.5px solid #EDE6DC', cursor: 'pointer', fontSize: 13 }}>
          Cancelar
        </button>
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </div>
    </form>
  )
}

// ── Recursive reply item ─────────────────────────────────────────────────────
function ReplyItem({ reply, depth, currentUserId, supabase, onRefresh, inlineReplyAnchor, inlineText, onSetInlineReply, onSetInlineText, onSubmitInline, inlineSubmitting, onOpenPhoto }: {
  reply: any; depth: number; currentUserId: string | null; supabase: any; onRefresh: () => void
  inlineReplyAnchor: { id: string; name: string } | null
  inlineText: string
  onSetInlineReply: (a: { id: string; name: string } | null) => void
  onSetInlineText: (t: string) => void
  onSubmitInline: (e: React.FormEvent, photos: File[]) => void
  inlineSubmitting: boolean
  onOpenPhoto: (url: string) => void
}) {
  const isReplying = inlineReplyAnchor?.id === reply.id
  const replyAuthor = reply.user_profiles?.name ?? 'Vizinho'
  const indent = Math.min((depth - 1) * 18, 54)

  return (
    <>
      <div style={{ marginLeft: indent, background: depth === 1 ? '#FAF7F2' : '#F5F0EA', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Avatar name={replyAuthor} photo={reply.user_profiles?.profile_photo} size={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{replyAuthor}</span>
          {reply.user_profiles?.is_provider && (
            <span style={{ fontSize: 9, background: '#E8F5E9', color: '#2E7D32', borderRadius: 99, padding: '2px 5px', fontWeight: 700 }}>Prestador</span>
          )}
          <span style={{ fontSize: 11, color: '#C4B09A', marginLeft: 'auto' }}>{timeAgo(reply.created_at)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#2C1A0E', lineHeight: 1.55, marginBottom: 4 }}>{reply.content}</p>
        <PhotoGrid urls={reply.image_urls} onOpen={onOpenPhoto} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          {currentUserId && (
            <button
              onClick={() => isReplying ? onSetInlineReply(null) : onSetInlineReply({ id: reply.id, name: replyAuthor })}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: isReplying ? '#C85A1A' : '#9B7A5A', fontSize: 12, padding: 0, fontWeight: isReplying ? 700 : 400 }}>
              <CornerDownRight size={10} /> Responder
            </button>
          )}
          {currentUserId === reply.user_id && (
            <button onClick={async () => {
              if (!confirm('Eliminar?')) return
              await supabase.from('community_answers').update({ is_published: false }).eq('id', reply.id)
              onRefresh()
            }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <Trash2 size={11} color="#D4C4B0" />
            </button>
          )}
        </div>
      </div>

      {isReplying && (
        <div style={{ marginLeft: indent }}>
          <InlineForm targetName={replyAuthor} text={inlineText} onChange={onSetInlineText}
            onSubmit={onSubmitInline} onCancel={() => onSetInlineReply(null)} submitting={inlineSubmitting} />
        </div>
      )}

      {reply.children?.map((child: any) => (
        <ReplyItem key={child.id} reply={child} depth={depth + 1}
          currentUserId={currentUserId} supabase={supabase} onRefresh={onRefresh}
          inlineReplyAnchor={inlineReplyAnchor} inlineText={inlineText}
          onSetInlineReply={onSetInlineReply} onSetInlineText={onSetInlineText}
          onSubmitInline={onSubmitInline} inlineSubmitting={inlineSubmitting}
          onOpenPhoto={onOpenPhoto} />
      ))}
    </>
  )
}

// ── AnswerCard ───────────────────────────────────────────────────────────────
function AnswerCard({ ans, isBest, currentUserId, supabase, onRefresh, inlineReplyAnchor, inlineText, onSetInlineReply, onSetInlineText, onSubmitInline, inlineSubmitting, onOpenPhoto }: {
  ans: any; isBest: boolean; currentUserId: string | null; supabase: any; onRefresh: () => void
  inlineReplyAnchor: { id: string; name: string } | null
  inlineText: string
  onSetInlineReply: (a: { id: string; name: string } | null) => void
  onSetInlineText: (t: string) => void
  onSubmitInline: (e: React.FormEvent, photos: File[]) => void
  inlineSubmitting: boolean
  onOpenPhoto: (url: string) => void
}) {
  const [voted, setVoted] = useState(ans.user_voted || false)
  const [votes, setVotes] = useState(ans.votes_count ?? 0)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(ans.content ?? '')
  const [saving, setSaving] = useState(false)
  const authorName = ans.user_profiles?.name || 'Vizinho'
  const city = ans.user_profiles?.city || null
  const isOwn = currentUserId === ans.user_id
  const isReplyingToThis = inlineReplyAnchor?.id === ans.id

  const handleVote = async () => {
    if (!currentUserId) return
    if (voted) {
      await supabase.from('community_answer_votes').delete().eq('answer_id', ans.id).eq('user_id', currentUserId)
      setVoted(false); setVotes((v: number) => Math.max(v - 1, 0))
    } else {
      await supabase.from('community_answer_votes').insert({ answer_id: ans.id, user_id: currentUserId })
      setVoted(true); setVotes((v: number) => v + 1)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar esta resposta?')) return
    await supabase.from('community_answers').delete().eq('id', ans.id)
    onRefresh()
  }

  const handleSaveEdit = async () => {
    if (!editText.trim()) return
    setSaving(true)
    await supabase.from('community_answers').update({ content: editText.trim() }).eq('id', ans.id)
    setSaving(false); setEditing(false); onRefresh()
  }

  return (
    <div style={{ background: isBest ? '#FFFBF5' : '#fff', border: isBest ? '1.5px solid #F5DFC8' : '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 16px' }}>
      {isBest && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <Star size={12} color="#C85A1A" fill="#C85A1A" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Melhor resposta</span>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar name={authorName} photo={ans.user_profiles?.profile_photo} size={34} />
          <TypeBadge providerType={ans.user_profiles?.provider_type} size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{authorName}</span>
            {ans.user_profiles?.is_provider && (
              <span style={{ fontSize: 9, background: '#E8F5E9', color: '#2E7D32', borderRadius: 99, padding: '2px 6px', fontWeight: 700 }}>Prestador</span>
            )}
            {city && <span style={{ fontSize: 13, color: '#9B7A5A' }}>{city}</span>}
            <span style={{ fontSize: 13, color: '#C4B09A', marginLeft: 'auto' }}>{timeAgo(ans.created_at)}</span>
          </div>

          {editing ? (
            <div style={{ marginBottom: 10 }}>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '8px 12px', fontSize: 14, resize: 'none', outline: 'none', color: '#2C1A0E', boxSizing: 'border-box', marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveEdit} disabled={saving}
                  style={{ padding: '5px 14px', borderRadius: 8, background: '#C85A1A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(ans.content ?? '') }}
                  style={{ padding: '5px 14px', borderRadius: 8, background: 'transparent', color: '#9B7A5A', border: '0.5px solid #EDE6DC', cursor: 'pointer', fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 15, color: '#2C1A0E', lineHeight: 1.65, marginBottom: 8 }}>{ans.content}</p>
              <PhotoGrid urls={ans.image_urls} onOpen={onOpenPhoto} />
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: editing ? 0 : 10 }}>
            <button onClick={handleVote}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: voted ? '#FBF0E8' : 'transparent', border: `1px solid ${voted ? '#F5DFC8' : '#EDE6DC'}`, borderRadius: 99, padding: '4px 10px', cursor: currentUserId ? 'pointer' : 'default', color: voted ? '#C85A1A' : '#9B7A5A', fontSize: 13, fontWeight: voted ? 700 : 500 }}>
              <ThumbsUp size={11} fill={voted ? '#C85A1A' : 'none'} />
              <span>{votes > 0 ? votes : 'Útil'}</span>
            </button>
            {currentUserId && (
              <button
                onClick={() => isReplyingToThis ? onSetInlineReply(null) : onSetInlineReply({ id: ans.id, name: authorName })}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: isReplyingToThis ? '#C85A1A' : '#9B7A5A', fontSize: 13, padding: '4px 2px', fontWeight: isReplyingToThis ? 700 : 400 }}>
                <CornerDownRight size={11} /> Responder
              </button>
            )}
            {isOwn && !editing && (
              <>
                <button onClick={() => setEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: '#9B7A5A', fontSize: 13 }}>
                  <Pencil size={11} />
                </button>
                <button onClick={handleDelete}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center', gap: 4, color: '#D4C4B0', fontSize: 13 }}>
                  <Trash2 size={11} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isReplyingToThis && (
        <div style={{ marginTop: 10 }}>
          <InlineForm targetName={authorName} text={inlineText} onChange={onSetInlineText}
            onSubmit={onSubmitInline} onCancel={() => onSetInlineReply(null)} submitting={inlineSubmitting} />
        </div>
      )}

      {ans.children?.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ans.children.map((reply: any) => (
            <ReplyItem key={reply.id} reply={reply} depth={1}
              currentUserId={currentUserId} supabase={supabase} onRefresh={onRefresh}
              inlineReplyAnchor={inlineReplyAnchor} inlineText={inlineText}
              onSetInlineReply={onSetInlineReply} onSetInlineText={onSetInlineText}
              onSubmitInline={onSubmitInline} inlineSubmitting={inlineSubmitting}
              onOpenPhoto={onOpenPhoto} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Build recursive tree ─────────────────────────────────────────────────────
function buildTree(items: any[], parentId: string | null): any[] {
  return items
    .filter(i => (parentId === null ? !i.parent_answer_id : i.parent_answer_id === parentId))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(i => ({ ...i, children: buildTree(items, i.id) }))
}

const INITIAL_SHOW = 3

export default function QuestionPage() {
  const params = useParams()
  const router = useRouter()
  const [question, setQuestion] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [answerPhotos, setAnswerPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAllAnswers, setShowAllAnswers] = useState(false)
  const [questionVoted, setQuestionVoted] = useState(false)
  const [questionVotes, setQuestionVotes] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [inlineReplyAnchor, setInlineReplyAnchor] = useState<{ id: string; name: string } | null>(null)
  const [inlineText, setInlineText] = useState('')
  const [inlineSubmitting, setInlineSubmitting] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: q } = await supabase
      .from('community_questions')
      .select('id, title, description, category, answers_count, useful_votes_count, views_count, created_at, user_id, image_urls')
      .eq('id', params.id)
      .single()

    if (!q) { router.push('/comunidade'); return }

    const { data: qUser } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo, city, average_rating, reviews_count, last_seen, is_provider')
      .eq('id', q.user_id)
      .single()

    const { data: as } = await supabase
      .from('community_answers')
      .select('id, content, created_at, user_id, votes_count, parent_answer_id, image_urls')
      .eq('question_id', params.id)
      .eq('is_published', true)
      .order('created_at', { ascending: true })

    const currentUserRes = await supabase.auth.getUser()
    const currentUser = currentUserRes.data.user

    let qProviderType: string | null = null
    if (qUser?.is_provider) {
      const { data: qPP } = await supabase.from('provider_profiles').select('provider_type').eq('user_id', q.user_id).single()
      qProviderType = qPP?.provider_type ?? null
    }
    setQuestion({ ...q, user_profiles: qUser ? { ...qUser, provider_type: qProviderType } : qUser })
    setQuestionVotes(q.useful_votes_count ?? 0)

    if (currentUser) {
      const { data: qVote } = await supabase.from('community_question_votes').select('id').eq('question_id', q.id).eq('user_id', currentUser.id).maybeSingle()
      setQuestionVoted(!!qVote)
    }

    if (as && as.length > 0) {
      const answerUserIds = Array.from(new Set(as.map((a: any) => a.user_id)))
      const { data: answerUsers } = await supabase
        .from('user_profiles')
        .select('id, name, profile_photo, city, is_provider')
        .in('id', answerUserIds)

      let votedSet = new Set<string>()
      if (currentUser) {
        const { data: myVotes } = await supabase.from('community_answer_votes').select('answer_id').eq('user_id', currentUser.id).in('answer_id', as.map((a: any) => a.id))
        votedSet = new Set((myVotes ?? []).map((v: any) => v.answer_id))
      }

      const providerIds = (answerUsers ?? []).filter((u: any) => u.is_provider).map((u: any) => u.id)
      const provTypeMap: Record<string, string> = {}
      if (providerIds.length > 0) {
        const { data: provProfiles } = await supabase.from('provider_profiles').select('user_id, provider_type').in('user_id', providerIds)
        ;(provProfiles ?? []).forEach((pp: any) => { provTypeMap[pp.user_id] = pp.provider_type })
      }

      const enriched = as.map((a: any) => {
        const u = answerUsers?.find((u: any) => u.id === a.user_id)
        return { ...a, user_profiles: u ? { ...u, provider_type: provTypeMap[u.id] ?? null } : u, user_voted: votedSet.has(a.id) }
      })

      // Top-level sorted by votes desc, then date asc
      const topLevel = enriched
        .filter((a: any) => !a.parent_answer_id)
        .sort((a: any, b: any) => (b.votes_count ?? 0) - (a.votes_count ?? 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((a: any) => ({ ...a, children: buildTree(enriched, a.id) }))

      setAnswers(topLevel)
    } else {
      setAnswers([])
    }

    setLoading(false)
  }, [params.id])

  useEffect(() => {
    fetchData()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [fetchData])

  const handleVoteQuestion = async () => {
    if (!user) return
    if (questionVoted) {
      await supabase.from('community_question_votes').delete().eq('question_id', params.id).eq('user_id', user.id)
      setQuestionVoted(false); setQuestionVotes(v => Math.max(v - 1, 0))
      await supabase.from('community_questions').update({ useful_votes_count: Math.max(questionVotes - 1, 0) }).eq('id', params.id)
    } else {
      await supabase.from('community_question_votes').insert({ question_id: params.id, user_id: user.id })
      setQuestionVoted(true); setQuestionVotes(v => v + 1)
      await supabase.from('community_questions').update({ useful_votes_count: questionVotes + 1 }).eq('id', params.id)
    }
  }

  async function uploadPhotos(photos: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const photo of photos) {
      const path = `answers/${Date.now()}_${photo.name.replace(/[^a-z0-9.]/gi, '_')}`
      const { error } = await supabase.storage.from('community').upload(path, photo)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('community').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !answer.trim()) return
    setSubmitting(true)
    const photoUrls = await uploadPhotos(answerPhotos)
    await supabase.from('community_answers').insert({
      question_id: params.id, user_id: user.id, content: answer.trim(),
      is_published: true, parent_answer_id: null,
      image_urls: photoUrls.length > 0 ? photoUrls : null,
    })
    setAnswer(''); setAnswerPhotos([])
    await fetchData()
    setSubmitting(false)
  }

  async function submitInlineReply(e: React.FormEvent, photos: File[]) {
    e.preventDefault()
    if (!user || !inlineText.trim() || !inlineReplyAnchor) return
    setInlineSubmitting(true)
    const photoUrls = await uploadPhotos(photos)
    await supabase.from('community_answers').insert({
      question_id: params.id, user_id: user.id, content: inlineText.trim(),
      is_published: true, parent_answer_id: inlineReplyAnchor.id,
      image_urls: photoUrls.length > 0 ? photoUrls : null,
    })
    setInlineText(''); setInlineReplyAnchor(null)
    await fetchData()
    setInlineSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  )

  if (!question) return null

  const cat = getCatInfo(question.category)
  const qAuthorName = question.user_profiles?.name ?? 'Vizinho'
  const qCity = question.user_profiles?.city || null
  const visibleAnswers = showAllAnswers ? answers : answers.slice(0, INITIAL_SHOW)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingTop: 24, paddingBottom: 60 }}>

      {/* Lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <X size={20} />
          </button>
          <img src={lightboxUrl} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

        <Link href="/comunidade" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9B7A5A', textDecoration: 'none', fontSize: 15, marginBottom: 20, fontWeight: 500 }}>
          <ArrowLeft size={14} /> Voltar à comunidade
        </Link>

        {/* Question block */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar name={qAuthorName} photo={question.user_profiles?.profile_photo} size={40} />
              <TypeBadge providerType={question.user_profiles?.provider_type} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>{qAuthorName}</span>
                {qCity && <span style={{ fontSize: 14, color: '#9B7A5A' }}>{qCity}</span>}
              </div>
              <p style={{ fontSize: 13, color: '#C4B09A', marginTop: 2 }}>{timeAgo(question.created_at)}</p>
            </div>
            <span style={{ background: (cat as any).bg ?? '#FBF0E8', color: (cat as any).color ?? '#C85A1A', borderRadius: 99, padding: '3px 10px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {(cat as any).iconImg
                ? <img src={(cat as any).iconImg} style={{ width: 13, height: 13, objectFit: 'contain' }} alt="" />
                : <span style={{ fontSize: 16 }}>{(cat as any).icon}</span>}
              {(cat as any).label}
            </span>
          </div>

          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 10 }}>{question.title}</h1>
          {question.description && (
            <p style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.7, marginBottom: 14 }}>{question.description}</p>
          )}

          {question.image_urls?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {question.image_urls.map((url: string, i: number) => (
                <div key={i} onClick={() => setLightboxUrl(url)}
                  style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                  <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '0.5px solid #F0E8DC', flexWrap: 'wrap' }}>
            <button onClick={handleVoteQuestion}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: questionVoted ? '#FBF0E8' : 'transparent', border: `1px solid ${questionVoted ? '#F5DFC8' : '#EDE6DC'}`, borderRadius: 99, padding: '5px 12px', cursor: user ? 'pointer' : 'default', color: questionVoted ? '#C85A1A' : '#9B7A5A', fontSize: 14, fontWeight: questionVoted ? 700 : 500 }}>
              <ThumbsUp size={13} fill={questionVoted ? '#C85A1A' : 'none'} />
              <span>{questionVotes > 0 ? questionVotes : 'Útil'}</span>
            </button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9B7A5A' }}>
              <MessageCircle size={13} /> <b style={{ color: '#5A3E28' }}>{question.answers_count ?? 0}</b>
            </span>
            {(question.views_count ?? 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#9B7A5A' }}>
                <Eye size={13} /> <b style={{ color: '#5A3E28' }}>{question.views_count}</b>
              </span>
            )}
          </div>
        </div>

        {/* Answers */}
        {answers.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MessageCircle size={15} color="#C85A1A" />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>
                {answers.length} {answers.length === 1 ? 'Resposta' : 'Respostas'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleAnswers.map((a: any, i: number) => (
                <AnswerCard key={a.id} ans={a} isBest={i === 0 && (a.votes_count ?? 0) > 0}
                  currentUserId={user?.id ?? null} supabase={supabase} onRefresh={fetchData}
                  inlineReplyAnchor={inlineReplyAnchor} inlineText={inlineText}
                  onSetInlineReply={setInlineReplyAnchor} onSetInlineText={setInlineText}
                  onSubmitInline={submitInlineReply} inlineSubmitting={inlineSubmitting}
                  onOpenPhoto={setLightboxUrl} />
              ))}
            </div>
            {answers.length > INITIAL_SHOW && (
              <button onClick={() => setShowAllAnswers(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 16px', cursor: 'pointer', fontSize: 14, color: '#C85A1A', fontWeight: 700, width: '100%', justifyContent: 'center', marginTop: 8 }}>
                {showAllAnswers ? <><ChevronUp size={13} /> Mostrar menos</> : <><ChevronDown size={13} /> Ver mais {answers.length - INITIAL_SHOW} respostas</>}
              </button>
            )}
          </div>
        )}

        {answers.length === 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '24px', textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 15, color: '#B09070', fontStyle: 'italic' }}>Ainda sem respostas. Sê o primeiro a responder!</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ background: '#FBF0E8', border: '1px solid #F5DFC8', borderRadius: 14, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#2C1A0E', marginBottom: 3 }}>Precisa de ajuda profissional?</p>
            <p style={{ fontSize: 13, color: '#7A6048' }}>Receba propostas gratuitas de profissionais qualificados.</p>
          </div>
          <Link href="/dashboard/novo-pedido" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#C85A1A', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 3px 10px rgba(200,90,26,0.25)' }}>
            Criar pedido
          </Link>
        </div>

        {/* New top-level answer */}
        {user ? (
          <form onSubmit={submitAnswer} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 10 }}>Deixa a tua resposta</p>
            <textarea value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Partilha o teu conhecimento com a comunidade..." rows={4}
              style={{ width: '100%', background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 14px', fontSize: 15, resize: 'none', outline: 'none', color: '#2C1A0E', boxSizing: 'border-box', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" disabled={!answer.trim() || submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 7, background: answer.trim() ? '#C85A1A' : '#EDE6DC', color: answer.trim() ? '#fff' : '#9B7A5A', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 15, fontWeight: 700, cursor: answer.trim() ? 'pointer' : 'default' }}>
                <Send size={13} /> {submitting ? 'A enviar...' : 'Enviar resposta'}
              </button>
              <PhotoPicker photos={answerPhotos} onChange={setAnswerPhotos} />
            </div>
          </form>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#7A6048', marginBottom: 12 }}>Entra para poder responder à comunidade</p>
            <Link href={`/auth?redirect=/comunidade/${params.id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C85A1A', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 15, fontWeight: 700 }}>
              Entrar para responder
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
