'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const LOGO = 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo-removebg-preview.png'
const TYPE_LOGOS = {
  'Particular': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20particular.png',
  'Recibo Verde': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro%20verde.png',
  'Empresa': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro.png',
}

type Toast = {
  id: string
  title: string
  body: string
  link: string
  type: string
}

function getNotifLink(type: string, data: any): string {
  switch (type) {
    case 'new_message':
      return data?.conversation_id ? `/dashboard/mensagens?conv=${data.conversation_id}` : '/dashboard/mensagens'
    case 'offer_accepted':
      return data?.conversation_id ? `/dashboard/mensagens?conv=${data.conversation_id}` : '/dashboard/propostas'
    case 'new_offer':
      return data?.request_id ? `/pedidos/${data.request_id}` : '/dashboard/pedidos'
    case 'job_completed':
      return '/dashboard/encontros'
    case 'job_cancelled':
      return data?.request_id ? `/pedidos/${data.request_id}` : '/dashboard/pedidos'
    default:
      return '/dashboard/notificacoes'
  }
}

function NotifToast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const ICONS: Record<string, string> = {
    new_message: '💬',
    offer_accepted: '✅',
    new_offer: '📬',
    job_completed: '🎉',
    job_cancelled: '❌',
  }
  const icon = ICONS[toast.type] ?? '🔔'

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      background: '#fff',
      border: '1px solid #EDE6DC',
      borderRadius: 14,
      boxShadow: '0 8px 32px rgba(44,26,14,0.14)',
      padding: '14px 16px',
      maxWidth: 320,
      minWidth: 260,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      animation: 'slideInToast 0.3s ease',
    }}>
      <style>{`
        @keyframes slideInToast {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 2, lineHeight: 1.3 }}>{toast.title}</p>
          {toast.body && <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.4 }}>{toast.body}</p>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B09070', padding: 0, flexShrink: 0, fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>
      <Link
        href={toast.link}
        onClick={onClose}
        style={{
          display: 'block',
          background: '#C85A1A',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
        }}>
        Ver →
      </Link>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [points, setPoints] = useState(0)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const userIdRef = useRef<string | null>(null)

  const showToast = (t: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(t)
    toastTimer.current = setTimeout(() => setToast(null), 6000)
  }

  const dismissToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(null)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        userIdRef.current = data.user.id
        loadUserData(data.user.id)
        subscribeToNotifications(data.user.id)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        userIdRef.current = session.user.id
        loadUserData(session.user.id)
        subscribeToNotifications(session.user.id)
      } else {
        userIdRef.current = null
        setProfile(null)
        setProviderProfile(null)
        setUnreadCount(0)
        setPoints(0)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const subscribeToNotifications = (userId: string) => {
    const channel = supabase
      .channel(`notif-toast-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as any
          setUnreadCount(prev => prev + 1)
          showToast({
            id: notif.id,
            title: notif.title ?? 'Nova notificação',
            body: notif.body ?? '',
            link: getNotifLink(notif.type, notif.data),
            type: notif.type ?? '',
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const loadUserData = async (userId: string) => {
    const [profileRes, rewardRes, notifsRes, msgsRes] = await Promise.all([
      supabase.from('user_profiles').select('id, name, profile_photo, is_provider, is_pro').eq('id', userId).single(),
      supabase.from('reward_profiles').select('approved_points_balance').eq('user_id', userId).single(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false),
    ])
    if (profileRes.data) {
      setProfile(profileRes.data)
      if (profileRes.data.is_provider) {
        const { data: pp } = await supabase.from('provider_profiles').select('id, provider_type').eq('user_id', userId).single()
        setProviderProfile(pp)
      }
    }
    if (rewardRes.data) setPoints(rewardRes.data.approved_points_balance ?? 0)
    setUnreadCount((notifsRes as any).count ?? 0)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleInicio = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      router.refresh()
    }
  }

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/dashboard/mensagens', label: 'Mensagens' },
    { href: '/explorar', label: 'Oportunidades' },
    { href: '/mapa', label: 'Mapa' },
    { href: '/dicas', label: 'Dicas' },
    { href: '/comunidade', label: 'Comunidade' },
    { href: '/precos', label: 'Preços' },
    ...(providerProfile && (providerProfile.provider_type === 'Recibo Verde' || providerProfile.provider_type === 'Empresa')
      ? [{ href: '/dashboard/faturacao', label: 'Faturação' }]
      : []),
  ]

  return (
    <>
      {toast && <NotifToast toast={toast} onClose={dismissToast} />}

      <header style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC' }} className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image src={LOGO} alt="Chama o Vizinho" width={120} height={60} style={{ objectFit: 'contain' }} unoptimized />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={link.label === 'Início' ? handleInicio : undefined}
                  style={{ color: '#7A6048', fontSize: '13px' }}
                  className="hover:text-brand-orange transition-colors font-medium">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  {/* Points */}
                  <Link href="/recompensas">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FBF0E8', borderRadius: 99, padding: '5px 10px', cursor: 'pointer' }}>
                      <span style={{ fontSize: 15 }}>🏅</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>{points} pts</span>
                    </div>
                  </Link>

                  {/* Notifications */}
                  <Link href="/dashboard/notificacoes">
                    <div style={{ position: 'relative', width: 34, height: 34, background: '#FBF0E8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Bell size={16} color="#C85A1A" />
                      {unreadCount > 0 && (
                        <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#C85A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700, border: '1.5px solid #fff' }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Avatar + type logo */}
                  <Link href="/dashboard/perfil">
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#C85A1A', position: 'relative' }}>
                        {profile?.profile_photo
                          ? <Image src={profile.profile_photo} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                          : (profile?.name?.charAt(0) ?? user.email?.charAt(0).toUpperCase())
                        }
                      </div>
                      {providerProfile?.provider_type && (TYPE_LOGOS as any)[providerProfile.provider_type] && (
                        <img
                          src={(TYPE_LOGOS as any)[providerProfile.provider_type]}
                          alt={providerProfile.provider_type}
                          style={{ position: 'absolute', bottom: -2, right: -3, width: 14, height: 14, objectFit: 'contain' }}
                        />
                      )}
                    </div>
                  </Link>

                  <button onClick={handleSignOut} style={{ fontSize: 15, color: '#7A6048', marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-brand-orange transition-colors">
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth" style={{ fontSize: 15, color: '#7A6048' }} className="hover:text-brand-orange transition-colors font-medium">
                    Entrar
                  </Link>
                  <Link href="/auth?tab=register" className="btn-primary text-sm py-2 px-4">
                    Registar grátis
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2" style={{ color: '#2C1A0E' }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div style={{ background: '#fff', borderTop: '0.5px solid #EDE6DC' }} className="lg:hidden px-4 py-4 space-y-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                style={{ color: '#2C1A0E', fontSize: 16, display: 'block', padding: '8px 0' }}
                className="hover:text-brand-orange transition-colors"
                onClick={(e) => { if (link.label === 'Início') handleInicio(e); setOpen(false) }}>
                {link.label}
              </Link>
            ))}
            {user && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
                <Link href="/dashboard/pedidos" onClick={() => setOpen(false)} style={{ color: '#2C1A0E', fontSize: 15, padding: '6px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>📋</span> Os meus pedidos
                </Link>
                <Link href="/dashboard/encontros" onClick={() => setOpen(false)} style={{ color: '#2C1A0E', fontSize: 15, padding: '6px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15 }}>📅</span> Os meus encontros
                </Link>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 6 }}>
                  <Link href="/recompensas" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FBF0E8', borderRadius: 99, padding: '5px 10px', textDecoration: 'none' }}>
                    <span style={{ fontSize: 15 }}>🏅</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#C85A1A' }}>{points} pts</span>
                  </Link>
                  <Link href="/dashboard/notificacoes" onClick={() => setOpen(false)} style={{ position: 'relative', width: 34, height: 34, background: '#FBF0E8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={16} color="#C85A1A" />
                    {unreadCount > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#C85A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>{unreadCount > 9 ? '9+' : unreadCount}</div>}
                  </Link>
                </div>
              </div>
            )}
            <div style={{ borderTop: '0.5px solid #EDE6DC', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user ? (
                <button onClick={handleSignOut} className="btn-secondary w-full text-center">Sair</button>
              ) : (
                <>
                  <Link href="/auth" className="btn-secondary w-full text-center" onClick={() => setOpen(false)}>Entrar</Link>
                  <Link href="/auth?tab=register" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>Registar gratis</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
