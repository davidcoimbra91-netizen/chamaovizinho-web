'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

function AuthForm() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [tab, setTab] = useState<'login' | 'register'>(defaultTab as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou password incorretos.'); setLoading(false); return }
    router.push(redirect)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } }
    })
    if (error) { setError(error.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        email,
        name,
        is_client: true,
        is_provider: false,
      })
    }
    setSuccess('Conta criada! Verifica o teu email para confirmar.')
    setLoading(false)
  }

  async function handleForgot() {
    if (!email) { setError('Introduz o teu email primeiro.'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
    })
    if (!error) setSuccess('Email de recuperação enviado!')
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white font-display font-bold text-lg mx-auto mb-3">V</div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy">
            {tab === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h1>
          <p className="text-brand-navy/50 text-sm mt-1">
            {tab === 'login' ? 'Entra na tua conta' : 'Junta-te à comunidade'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 border border-brand-navy/5">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-brand-orange text-white shadow-sm' : 'text-brand-navy/50 hover:text-brand-navy'}`}
            >
              {t === 'login' ? 'Entrar' : 'Registar'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-brand-green text-sm px-4 py-3 rounded-xl mb-4 border border-green-100">{success}</div>
          )}

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-brand-navy/70 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="O teu nome"
                  required
                  className="w-full bg-brand-cream border border-brand-navy/10 rounded-xl px-4 py-3 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-navy/70 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="o.teu@email.com"
                required
                className="w-full bg-brand-cream border border-brand-navy/10 rounded-xl px-4 py-3 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-navy/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-brand-cream border border-brand-navy/10 rounded-xl px-4 py-3 pr-11 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'login' && (
              <div className="text-right">
                <button type="button" onClick={handleForgot}
                  className="text-xs text-brand-navy/40 hover:text-brand-orange transition-colors">
                  Esqueceste a password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'A processar...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-brand-navy/30 mt-6">
          Ao registares, aceitas os nossos{' '}
          <Link href="/termos" className="hover:text-brand-orange transition-colors">Termos</Link>
          {' '}e{' '}
          <Link href="/privacidade" className="hover:text-brand-orange transition-colors">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
