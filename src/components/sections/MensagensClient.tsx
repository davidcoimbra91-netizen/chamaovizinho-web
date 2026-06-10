'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Send, Search, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'


interface Props {
  currentUser: { id: string; profile: any }
}

export default function MensagensClient({ currentUser }: Props) {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [search, setSearch] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const [showList, setShowList] = useState(true) // mobile toggle
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchConversations = useCallback(async () => {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id, last_message, updated_at, client_id, provider_id')
      .or(`client_id.eq.${currentUser.id},provider_id.eq.${currentUser.id}`)
      .order('updated_at', { ascending: false })

    if (!convs) { setLoadingConvs(false); return }

    const allIds = Array.from(new Set([
      ...convs.map((c: any) => c.client_id),
      ...convs.map((c: any) => c.provider_id),
    ].filter(Boolean)))

    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, profile_photo')
      .in('id', allIds)

    const merged = convs.map((c: any) => {
      const otherId = c.client_id === currentUser.id ? c.provider_id : c.client_id
      const other = users?.find((u: any) => u.id === otherId)
      return { ...c, other_user: other }
    })

    setConversations(merged)
    setLoadingConvs(false)
  }, [currentUser.id])

  const fetchMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoadingMsgs(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!activeConv) return
    fetchMessages(activeConv.id)

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConv, fetchMessages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: currentUser.id,
      content: newMessage.trim(),
    })

    if (!error) {
      // Update last_message
      await supabase.from('conversations').update({
        last_message: newMessage.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', activeConv.id)

      setNewMessage('')
      fetchConversations()
    }
    setSending(false)
  }

  const openConv = (conv: any) => {
    setActiveConv(conv)
    setShowList(false)
  }

  const filteredConvs = search
    ? conversations.filter(c => c.other_user?.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', flexDirection: 'column' }}>
      {/* Banner uniforme style sombre */}
      <div style={{ background: '#2C1A0E', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Mensagens</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Converse com vizinhos sobre os seus pedidos de ajuda</p>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '16px', gap: 12 }}>

        {/* Lista conversas */}
        <div style={{
          width: 280, flexShrink: 0,
          background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, overflow: 'hidden', flexDirection: 'column' as any,
          display: (showList ? 'flex' : 'none') as any,
        }} className="lg:flex flex-col">
          {/* Search */}
          <div style={{ padding: '12px', borderBottom: '0.5px solid #EDE6DC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 8, padding: '7px 10px' }}>
              <Search size={13} color="#9B7A5A" />
              <input
                type="text"
                placeholder="Pesquisar conversas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#2C1A0E', background: 'transparent' }}
              />
            </div>
          </div>

          {/* Conversas */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConvs ? (
              [1,2,3].map(i => (
                <div key={i} style={{ padding: '12px', borderBottom: '0.5px solid #F0E8DC', display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0E8DC' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: '#F0E8DC', borderRadius: 4, marginBottom: 6, width: '60%' }} />
                    <div style={{ height: 10, background: '#F0E8DC', borderRadius: 4, width: '80%' }} />
                  </div>
                </div>
              ))
            ) : filteredConvs.length > 0 ? filteredConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => openConv(conv)}
                style={{
                  padding: '12px 14px',
                  borderBottom: '0.5px solid #F0E8DC',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                  background: activeConv?.id === conv.id ? '#FBF0E8' : 'transparent',
                  borderLeft: activeConv?.id === conv.id ? '3px solid #C85A1A' : '3px solid transparent',
                }}
                className="hover:bg-orange-50">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  {conv.other_user?.profile_photo
                    ? <img src={conv.other_user.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>
                        {conv.other_user?.name?.charAt(0) ?? '?'}
                      </div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#2C1A0E', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {conv.other_user?.name ?? 'Utilizador'}
                    </p>
                    <span style={{ fontSize: 10, color: '#B09070', flexShrink: 0, marginLeft: 4 }}>{formatTime(conv.updated_at)}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#9B7A5A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {conv.last_message ?? '...'}
                  </p>
                </div>
              </div>
            )) : (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#9B7A5A' }}>Sem conversas</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1, background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12,
          flexDirection: 'column' as any, overflow: 'hidden',
          display: (!showList ? 'flex' : 'none') as any,
        }} className="lg:flex flex-col">
          {activeConv ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #EDE6DC', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setShowList(true)} className="lg:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <ArrowLeft size={18} color="#7A6048" />
                </button>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', flexShrink: 0 }}>
                  {activeConv.other_user?.profile_photo
                    ? <img src={activeConv.other_user.profile_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>
                        {activeConv.other_user?.name?.charAt(0) ?? '?'}
                      </div>
                  }
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{activeConv.other_user?.name ?? 'Utilizador'}</p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                    <div style={{ width: 24, height: 24, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : messages.length > 0 ? messages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: isMe ? '#C85A1A' : '#FAF7F2',
                        border: isMe ? 'none' : '0.5px solid #EDE6DC',
                      }}>
                        <p style={{ fontSize: 13, color: isMe ? '#fff' : '#2C1A0E', lineHeight: 1.5 }}>{msg.content}</p>
                        <p style={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : '#B09070', marginTop: 3, textAlign: 'right' }}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                }) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 32 }}>💬</p>
                    <p style={{ fontSize: 13, color: '#9B7A5A' }}>Começa a conversa!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '0.5px solid #EDE6DC', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  style={{ flex: 1, background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#2C1A0E', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{ width: 40, height: 40, borderRadius: 10, background: newMessage.trim() ? '#C85A1A' : '#F0E8DC', border: 'none', cursor: newMessage.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={16} color={newMessage.trim() ? '#fff' : '#B09070'} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <p style={{ fontSize: 32 }}>💬</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#2C1A0E' }}>Selecione uma conversa</p>
              <p style={{ fontSize: 12, color: '#9B7A5A' }}>Escolhe uma conversa à esquerda para começar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
