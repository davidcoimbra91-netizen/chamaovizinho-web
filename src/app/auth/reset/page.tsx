'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setError('Link inválido ou expirado. Pede um novo email de recuperação.')
        else setReady(true)
      })
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true)
        else setError('Link inválido ou expirado. Pede um novo email de recuperação.')
      })
    }
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
    window.location.href = '/dashboard'
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
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
