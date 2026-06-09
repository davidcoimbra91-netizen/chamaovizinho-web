import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preços — Chama o Vizinho',
  description: 'Planos simples e transparentes para clientes e prestadores. Começa gratuitamente.',
}

const clientPlans = [
  {
    name: 'Gratuito',
    price: '0€',
    period: 'para sempre',
    description: 'Para clientes que querem publicar pedidos ocasionalmente.',
    features: [
      'Publicar pedidos de serviço',
      'Receber propostas de prestadores',
      'Chat com prestadores',
      'Avaliações e reviews',
      'Acesso à comunidade',
    ],
    cta: 'Começar grátis',
    href: '/auth?tab=register',
    highlight: false,
  },
]

const providerPlans = [
  {
    name: 'Básico',
    price: '0€',
    period: '/mês',
    description: 'Começa a receber pedidos sem compromisso.',
    features: [
      'Perfil público',
      'Receber notificações de pedidos',
      'Enviar 5 propostas/mês',
      'Chat com clientes',
      'Avaliações no perfil',
    ],
    cta: 'Começar grátis',
    href: '/auth?tab=register&role=provider',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '9,99€',
    period: '/mês',
    description: 'Para prestadores que querem crescer o seu negócio.',
    features: [
      'Tudo do Básico',
      'Propostas ilimitadas',
      'Perfil em destaque',
      'Portfólio de fotos',
      'Orçamentos em PDF',
      'Prioridade nas notificações',
      'Badge verificado',
      'Estatísticas do perfil',
    ],
    cta: 'Começar Pro',
    href: '/auth?tab=register&role=provider&plan=pro',
    highlight: true,
  },
]

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-brand-cream pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-orange font-medium text-sm mb-2 uppercase tracking-wider">Preços</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-brand-navy mb-4">
            Simples e transparente
          </h1>
          <p className="text-brand-navy/50 max-w-lg mx-auto">
            Sem surpresas. Para clientes é sempre gratuito. Prestadores têm um plano Pro para quem quer crescer.
          </p>
        </div>

        {/* Clients */}
        <div className="mb-12">
          <h2 className="font-display text-2xl font-semibold text-brand-navy mb-6 text-center">Para clientes</h2>
          <div className="max-w-sm mx-auto">
            {clientPlans.map(plan => (
              <div key={plan.name} className="card border-2 border-brand-green/20">
                <div className="text-center mb-6">
                  <span className="badge bg-brand-green/10 text-brand-green text-sm mb-3">100% gratuito</span>
                  <div className="font-display text-4xl font-bold text-brand-navy">{plan.price}</div>
                  <div className="text-brand-navy/40 text-sm">{plan.period}</div>
                  <p className="text-brand-navy/60 text-sm mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-brand-navy/70">
                      <Check className="w-4 h-4 text-brand-green flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className="btn-secondary w-full text-center block">
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Providers */}
        <div>
          <h2 className="font-display text-2xl font-semibold text-brand-navy mb-6 text-center">Para prestadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {providerPlans.map(plan => (
              <div key={plan.name} className={`card border-2 ${plan.highlight ? 'border-brand-orange relative' : 'border-brand-navy/5'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-brand-orange text-white text-xs px-3 shadow-md">Recomendado</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-semibold text-brand-navy mb-1">{plan.name}</h3>
                  <div className="font-display text-4xl font-bold text-brand-navy">{plan.price}</div>
                  <div className="text-brand-navy/40 text-sm">{plan.period}</div>
                  <p className="text-brand-navy/60 text-sm mt-2">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-brand-navy/70">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-brand-orange' : 'text-brand-green'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`w-full text-center block ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-brand-navy mb-8 text-center">Perguntas frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem compromisso. Cancelas quando quiseres e não são cobradas taxas adicionais.' },
              { q: 'Como funciona o plano Pro?', a: 'O plano Pro dá-te acesso a propostas ilimitadas, destaque no perfil e outras funcionalidades premium por 9,99€/mês.' },
              { q: 'É necessário cartão de crédito para o plano gratuito?', a: 'Não. O plano gratuito não requer nenhum método de pagamento.' },
              { q: 'Os clientes pagam alguma comissão?', a: 'Não. Para clientes é sempre completamente gratuito publicar pedidos e receber propostas.' },
            ].map(faq => (
              <div key={faq.q} className="card">
                <h3 className="font-semibold text-brand-navy text-sm mb-2">{faq.q}</h3>
                <p className="text-brand-navy/50 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
