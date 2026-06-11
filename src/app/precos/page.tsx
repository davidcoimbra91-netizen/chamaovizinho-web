import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preços — Chama o Vizinho',
  description: 'Planos simples e transparentes. Para clientes é sempre gratuito. Prestadores têm 90 dias Premium grátis.',
}

const HERO_STATS = [
  { value: '+1200', label: 'pedidos publicados' },
  { value: '+350',  label: 'prestadores ativos' },
  { value: '+5000', label: 'avaliações' },
  { value: '+25',   label: 'cidades' },
]

const BASIC_FEATURES = [
  'Acesso à aplicação',
  'Ver pedidos',
  'Enviar propostas',
  'Até 5 fotos no portfólio',
  'Identificação no perfil',
]

const BASIC_NO = [
  'Contacto direto com clientes',
  'Número de telefone visível',
  'Destaque no mapa de Portugal',
  'Orçamentos e faturação',
  'Até 25 fotos no portfólio',
  'Propostas ilimitadas',
  'Perfil Premium com destaque',
]

const PREMIUM_FEATURES = [
  'Tudo do plano básico',
  'Contacto direto com clientes',
  'Número de telefone visível no perfil',
  'Destaque no mapa interativo de Portugal',
  'Até 25 fotos no portfólio',
  'Criação de orçamentos e faturas na app',
  'Propostas ilimitadas',
  'Aparece nos prestadores em destaque',
  'Perfil Premium com destaque',
]

const COMPARISON = [
  { feature: 'Acesso à aplicação',           basic: true,    premium: true },
  { feature: 'Ver pedidos',                  basic: true,    premium: true },
  { feature: 'Enviar propostas',             basic: true,    premium: true },
  { feature: 'Fotos no portfólio',           basic: 'Até 5', premium: 'Até 25' },
  { feature: 'Identificação no perfil',      basic: true,    premium: true },
  { feature: 'Contacto direto com clientes', basic: false,   premium: true },
  { feature: 'Número de telefone visível',   basic: false,   premium: true },
  { feature: 'Destaque no mapa de Portugal', basic: false,   premium: true },
  { feature: 'Orçamentos e faturação',       basic: false,   premium: true, note: '(aba Faturação)' },
  { feature: 'Propostas ilimitadas',         basic: false,   premium: true },
  { feature: 'Perfil Premium com destaque',  basic: false,   premium: true },
]

const BENEFITS = [
  { icon: '👁️', title: 'Mais visibilidade',    desc: 'Prestadores Premium aparecem em destaque nas pesquisas e no mapa.' },
  { icon: '👥', title: 'Mais contactos',       desc: 'Receba contactos diretos de clientes e aumente as suas oportunidades.' },
  { icon: '🧾', title: 'Fature com facilidade', desc: 'Crie orçamentos e faturas profissionais diretamente na app (aba Faturação).' },
  { icon: '🏆', title: 'Cresça o seu negócio', desc: 'Mais confiança, mais avaliações e mais trabalhos para o seu negócio.' },
]

const FAQ = [
  {
    q: 'Posso contactar clientes diretamente sem esperar um pedido?',
    a: 'Sim! Com o plano Premium pode contactar clientes publicamente e apresentar os seus serviços.',
  },
  {
    q: 'O que muda no mapa de Portugal?',
    a: 'O seu perfil aparece em destaque no mapa e nas buscas, antes dos prestadores do plano gratuito.',
  },
  {
    q: 'Para que serve a faturação integrada?',
    a: 'Pode criar orçamentos e faturas profissionais diretamente na aplicação, de forma rápida e simples.',
  },
  {
    q: 'O que acontece se tiver 3 propostas pendentes no gratuito?',
    a: 'Poderá responder a outras propostas apenas depois de uma das pendentes ser fechada ou expirar.',
  },
]

export default function PrecosPage() {
  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #FAF7F2 0%, #F5EDE0 100%)', padding: '60px 0 0', overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

            {/* Texte */}
            <div style={{ paddingBottom: 60 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Para prestadores</p>
              <h1 style={{ fontFamily: 'Lora, serif', fontSize: 40, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.2, marginBottom: 16 }}>
                Escolha o plano ideal para{' '}
                <span style={{ color: '#C85A1A' }}>fazer crescer</span>
                <br />o seu negócio
              </h1>
              <p style={{ fontSize: 16, color: '#7A6048', lineHeight: 1.6, marginBottom: 36, maxWidth: 420 }}>
                Mais visibilidade, mais contactos, mais oportunidades.
              </p>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {HERO_STATS.map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 2px 12px rgba(44,26,14,0.06)' }}>
                    <p style={{ fontFamily: 'Lora, serif', fontSize: 22, fontWeight: 700, color: '#C85A1A', marginBottom: 2 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#9B7A5A' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image artisan */}
            <div style={{ position: 'relative', height: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              {/* Fond décoratif */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 60% 80%, rgba(200,90,26,0.12) 0%, transparent 70%)' }} />
              {/* Placeholder image artisan */}
              <div style={{ width: '100%', height: 360, borderRadius: '24px 24px 0 0', background: 'linear-gradient(180deg, #E8D5C0 0%, #D4B896 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 80, opacity: 0.4 }}>👷</span>
                <div style={{ position: 'absolute', top: 16, right: 16, background: '#C85A1A', color: '#fff', borderRadius: 12, padding: '8px 14px', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(200,90,26,0.4)' }}>
                  ⭐ Premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PLANOS ── */}
      <div style={{ padding: '64px 0', background: '#fff' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 30, fontWeight: 700, color: '#2C1A0E', textAlign: 'center', marginBottom: 8 }}>Planos para prestadores</h2>
          <p style={{ fontSize: 14, color: '#9B7A5A', textAlign: 'center', marginBottom: 48 }}>Para clientes é sempre 100% gratuito.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Básico */}
            <div style={{ background: '#FAF7F2', border: '1px solid #EDE6DC', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ background: '#EDE6DC', color: '#5A3E28', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 20 }}>Básico</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: 'Lora, serif', fontSize: 44, fontWeight: 700, color: '#2C1A0E' }}>0€</span>
              </div>
              <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 28 }}>para sempre</p>
              <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.5, marginBottom: 28 }}>Comece a receber pedidos sem compromisso.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {BASIC_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#3B6D11" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 13, color: '#5A3E28' }}>{f}</span>
                  </div>
                ))}
                {BASIC_NO.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <X size={10} color="#9B7A5A" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 13, color: '#9B7A5A' }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth?tab=register&role=provider"
                style={{ display: 'block', padding: '13px', borderRadius: 12, border: '1.5px solid #2C1A0E', background: '#fff', color: '#2C1A0E', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Começar grátis
              </Link>
            </div>

            {/* Premium */}
            <div style={{ background: '#fff', border: '2px solid #C85A1A', borderRadius: 20, padding: '32px 28px', position: 'relative', boxShadow: '0 8px 40px rgba(200,90,26,0.15)' }}>
              {/* Badge recommandé */}
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#C85A1A', color: '#fff', borderRadius: 99, padding: '5px 18px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                RECOMENDADO
              </div>

              <div style={{ background: '#FBF0E8', color: '#C85A1A', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, display: 'inline-block', marginBottom: 20 }}>Premium</div>

              <div style={{ marginBottom: 4 }}>
                <span style={{ fontFamily: 'Lora, serif', fontSize: 44, fontWeight: 700, color: '#C85A1A' }}>7,99€</span>
                <span style={{ fontSize: 14, color: '#9B7A5A', marginLeft: 4 }}>/mês</span>
              </div>
              <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 10 }}>depois dos 90 dias gratuitos</p>
              <p style={{ fontSize: 13, color: '#7A6048', lineHeight: 1.5, marginBottom: 28 }}>O plano completo para prestar mais serviços e conquistar mais clientes.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {PREMIUM_FEATURES.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#C85A1A" strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 13, color: '#2C1A0E' }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/auth?tab=register&role=provider&plan=premium"
                style={{ display: 'block', padding: '14px', borderRadius: 12, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center', boxShadow: '0 4px 16px rgba(200,90,26,0.35)', marginBottom: 10 }}>
                Testar Premium grátis por 90 dias
              </Link>
              <p style={{ fontSize: 11, color: '#9B7A5A', textAlign: 'center' }}>🔒 Sem compromisso. Cancele quando quiser.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLEAU COMPARATIF ── */}
      <div style={{ padding: '64px 0', background: '#FAF7F2' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', textAlign: 'center', marginBottom: 40 }}>Comparação de planos</h2>

          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '0.5px solid #EDE6DC' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', background: '#FAF7F2', borderBottom: '0.5px solid #EDE6DC' }}>
              <div style={{ padding: '14px 20px', fontSize: 12, fontWeight: 700, color: '#9B7A5A' }}>Funcionalidades</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5A3E28' }}>Básico</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#C85A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                ⭐ Premium
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', borderBottom: i < COMPARISON.length - 1 ? '0.5px solid #F0E8DC' : 'none', background: i % 2 === 0 ? '#fff' : '#FDFAF7' }}>
                <div style={{ padding: '13px 20px', fontSize: 13, color: '#5A3E28', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.feature}
                  {row.note && <span style={{ fontSize: 11, color: '#C85A1A', fontWeight: 600 }}>{row.note}</span>}
                </div>
                <div style={{ padding: '13px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {row.basic === true && <Check size={16} color="#3B6D11" strokeWidth={2.5} />}
                  {row.basic === false && <X size={15} color="#D4C4B0" strokeWidth={2} />}
                  {typeof row.basic === 'string' && <span style={{ fontSize: 12, color: '#7A6048', fontWeight: 600 }}>{row.basic}</span>}
                </div>
                <div style={{ padding: '13px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {row.premium === true && <Check size={16} color="#C85A1A" strokeWidth={2.5} />}
                  {row.premium === false && <X size={15} color="#D4C4B0" strokeWidth={2} />}
                  {typeof row.premium === 'string' && <span style={{ fontSize: 12, color: '#C85A1A', fontWeight: 700 }}>{row.premium}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BLOCS BÉNÉFICES ── */}
      <div style={{ padding: '64px 0', background: '#fff' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{b.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', marginBottom: 8 }}>{b.title}</h3>
                <p style={{ fontSize: 12, color: '#9B7A5A', lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ padding: '64px 0', background: '#FAF7F2' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', textAlign: 'center', marginBottom: 40 }}>Perguntas frequentes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {FAQ.map(faq => (
              <div key={faq.q} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '20px 20px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', marginBottom: 8, lineHeight: 1.4 }}>{faq.q}</h3>
                <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ padding: '64px 0', background: '#2C1A0E' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ fontSize: 48, flexShrink: 0 }}>🎁</div>
              <div>
                <h2 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  Teste o Premium grátis por 90 dias
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Ganhe mais visibilidade, receba mais contactos e cresça com o Chama o Vizinho!
                </p>
              </div>
            </div>
            <Link href="/auth?tab=register&role=provider&plan=premium"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 14, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 4px 24px rgba(200,90,26,0.4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Começar agora →
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
