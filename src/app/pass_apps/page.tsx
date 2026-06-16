'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'USER_UPDATED') {
        setSuccess(true)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    const timeout = setTimeout(() => {
      setError('Tempo esgotado. O link pode ter expirado — pede um novo email de recuperação.')
    }, 10000)

    async function verify() {
      try {
        if (token_hash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
          clearTimeout(timeout)
          if (error) setError('Link inválido ou expirado. Pede um novo email de recuperação.')
          else setReady(true)
        } else {
          const code = searchParams.get('code')
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            clearTimeout(timeout)
            if (error) setError('Link inválido ou expirado. Pede um novo email de recuperação.')
            else setReady(true)
          } else {
            const { data } = await supabase.auth.getSession()
            clearTimeout(timeout)
            if (data.session) setReady(true)
            else setError('Link inválido ou expirado. Pede um novo email de recuperação.')
          }
        }
      } catch (e: any) {
        clearTimeout(timeout)
        setError(e?.message || 'Erro ao verificar o link. Tenta novamente.')
      }
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As passwords não coincidem.'); return }
    if (password.length < 6) { setError('A password deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    // setSuccess est déclenché par onAuthStateChange('USER_UPDATED')
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center pt-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/icons/logo-preview.png"
            alt="Chama o Vizinho"
            style={{ width: 180, height: 180, objectFit: 'contain', margin: '0 auto 12px' }}
          />
          <h1 className="font-display text-2xl font-semibold text-brand-navy">Nova password</h1>
          <p className="text-brand-navy/50 text-sm mt-1">Escolhe uma nova password para a tua conta</p>
        </div>

        {success && (
          <div className="card text-center space-y-5">
            <div className="text-4xl">✅</div>
            <p className="text-brand-navy font-semibold">Password alterada com sucesso!</p>
            {isMobile ? (
              <>
                <p className="text-brand-navy/50 text-sm">Podes agora entrar na app com a tua nova password.</p>
                <div className="flex flex-col gap-3">
                  <a
                    href="https://apps.apple.com/app/chama-o-vizinho/id6772727446"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center"
                  >
                    Abrir na App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=pt.chamaovizinho.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center"
                  >
                    Abrir no Google Play
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="text-brand-navy/50 text-sm">Podes agora entrar com a tua nova password.</p>
                <a href="/dashboard" className="btn-primary w-full text-center block">
                  Ir para o Dashboard
                </a>
              </>
            )}
          </div>
        )}

        {!success && (
          <div className="card">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100">
                {error}
              </div>
            )}

            {ready && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-navy/70 mb-1.5">Nova password</label>
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
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/60"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-navy/70 mb-1.5">Confirmar password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-brand-cream border border-brand-navy/10 rounded-xl px-4 py-3 pr-11 text-sm text-brand-navy placeholder-brand-navy/30 outline-none focus:border-brand-orange transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/60"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'A guardar...' : 'Guardar nova password'}
                </button>
              </form>
            )}

            {!ready && !error && (
              <p className="text-center text-sm text-brand-navy/50 py-4">A verificar o link...</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PassAppsPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
