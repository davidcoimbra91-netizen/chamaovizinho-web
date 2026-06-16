'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Mail, Bell, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const LOGO = 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo-removebg-preview.png'
const TYPE_LOGOS = {
  'Particular': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20particular.png',
  'Recibo Verde': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro%20verde.png',
  'Empresa': 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo%20pro.png',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [providerProfile, setProviderProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [points, setPoints] = useState(0)
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) loadUserData(data.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadUserData(session.user.id)
      else { setProfile(null); setProviderProfile(null); setUnreadCount(0); setPoints(0) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    const [profileRes, rewardRes, notifsRes] = await Promise.all([
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

  // Fix: Início force reload quand já na página / para garantir que o dashboard carrega
  const handleInicio = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault()
      router.refresh()
    }
  }

  const navLinks = [
    { href: '/', label: 'Início' },
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

                {/* Messages */}
                <Link href="/dashboard/mensagens">
                  <div style={{ width: 34, height: 34, background: '#FBF0E8', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Mail size={16} color="#C85A1A" />
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
              <Link href="/dashboard/mensagens" onClick={() => setOpen(false)} style={{ color: '#2C1A0E', fontSize: 15, padding: '6px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={15} color="#C85A1A" /> Mensagens
              </Link>
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
  )
}
