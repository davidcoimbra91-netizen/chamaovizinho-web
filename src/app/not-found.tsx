import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div className="font-display text-8xl font-bold text-brand-orange/20 mb-4">404</div>
        <h1 className="font-display text-2xl font-semibold text-brand-navy mb-3">Página não encontrada</h1>
        <p className="text-brand-navy/50 mb-8">O vizinho foi ao café e não deixou recado.</p>
        <Link href="/" className="btn-primary">Voltar ao início</Link>
      </div>
    </div>
  )
}
