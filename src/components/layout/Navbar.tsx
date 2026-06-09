'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Bell, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header style={{ background: '#fff', borderBottom: '0.5px solid #EDE6DC' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#FBF0E8"/>
              <path d="M16 5L6 13v13h6v-7h8v7h6V13L16 5z" fill="#C85A1A" stroke="#C85A1A" strokeWidth="0.5" strokeLinejoin="round"/>
              <rect x="13" y="19" width="6" height="7" rx="1" fill="#FAF0E6"/>
            </svg>
            <span style={{ fontFamily: 'Lora, serif', color: '#2C1A0E', fontSize: '14px', fontWeight: 600, lineHeight: '1.2' }}>
              Chama o<br />Vizinho!
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {[
              { href: '/', label: 'Início' },
              { href: '/servicos', label: 'Explorar' },
              { href: '/dicas', label: 'Dicas' },
              { href: '/comunidade', label: 'Comunidade' },
              { href: '/precos', label: 'Preços' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                style={{ color: '#7A6048', fontSize: '13px' }}
                className="hover:text-brand-orange transition-colors font-medium">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard/mensagens">
                  <div style={{ width: 32, height: 32, background: '#FBF0E8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Mail size={15} color="#C85A1A" />
                  </div>
                </Link>
                <Link href="/dashboard">
                  <div style={{ width: 32, height: 32, background: '#C85A1A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 500 }}>
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button onClick={handleSignOut} style={{ fontSize: 13, color: '#7A6048', marginLeft: 4 }} className="hover:text-brand-orange transition-colors">
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" style={{ fontSize: 13, color: '#7A6048' }} className="hover:text-brand-orange transition-colors font-medium">
                  Entrar
                </Link>
                <Link href="/auth?tab=register" className="btn-primary text-sm py-2 px-4">
                  Registar grátis
                </Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2" style={{ color: '#2C1A0E' }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ background: '#fff', borderTop: '0.5px solid #EDE6DC' }} className="lg:hidden px-4 py-4 space-y-2">
          {[
            { href: '/', label: 'Início' },
            { href: '/servicos', label: 'Explorar' },
            { href: '/dicas', label: 'Dicas' },
            { href: '/comunidade', label: 'Comunidade' },
            { href: '/precos', label: 'Preços' },
          ].map(link => (
            <Link key={link.href} href={link.href}
              style={{ color: '#2C1A0E', fontSize: 14 }}
              className="block py-2 hover:text-brand-orange transition-colors"
              onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <div style={{ borderTop: '0.5px solid #EDE6DC', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <button onClick={handleSignOut} className="btn-secondary w-full text-center">Sair</button>
            ) : (
              <>
                <Link href="/auth" className="btn-secondary w-full text-center" onClick={() => setOpen(false)}>Entrar</Link>
                <Link href="/auth?tab=register" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>Registar grátis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
