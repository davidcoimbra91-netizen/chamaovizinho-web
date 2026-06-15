import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const LEVELS = [
  { name: 'Vizinho Bronze', emoji: '🥉', min: 0, max: 99, color: '#CD7F32', bg: '#FBF0E8' },
  { name: 'Vizinho Prata', emoji: '🥈', min: 100, max: 499, color: '#9E9E9E', bg: '#F5F5F5' },
  { name: 'Vizinho Ouro', emoji: '🥇', min: 500, max: 999, color: '#F9AB00', bg: '#FEF9E7' },
  { name: 'Vizinho Diamante', emoji: '💎', min: 1000, max: Infinity, color: '#1A73E8', bg: '#E8F0FE' },
]

const REWARDS = [
  { pts: 100, label: 'Voucher 5€', emoji: '🎁', sub: 'Lojas parceiras', color: '#3B6D11', bg: '#EAF3DE' },
  { pts: 250, label: 'Destaque de pedido', emoji: '📢', sub: '7 dias em destaque', color: '#1A73E8', bg: '#E8F0FE' },
  { pts: 500, label: 'Voucher 25€', emoji: '🎁', sub: 'Lojas parceiras', color: '#9C27B0', bg: '#F3E5F5' },
  { pts: 1000, label: 'Plano Premium', emoji: '👑', sub: '30 dias grátis', color: '#C85A1A', bg: '#FBF0E8' },
]

const HOW_TO_EARN = [
  { action: 'Pedido publicado', pts: '+1', emoji: '📋' },
  { action: 'Proposta aceite', pts: '+3', emoji: '🤝' },
  { action: 'Avaliação deixada', pts: '+1', emoji: '⭐' },
  { action: 'Perfil completo', pts: '+5', emoji: '👤' },
  { action: 'Primeiro trabalho concluído', pts: '+10', emoji: '🏆' },
]

const BADGES = [
  { id: 'first_order', name: 'Primeiro Pedido', desc: 'Criaste o teu primeiro pedido', emoji: '🏠', earned: false },
  { id: 'active_neighbor', name: 'Vizinho Ativo', desc: 'Participaste na comunidade', emoji: '👥', earned: false },
  { id: 'loyal_client', name: 'Cliente Fiel', desc: 'Aceita 5 propostas', emoji: '❤️', earned: false, progress: 0, total: 5 },
  { id: 'verified', name: 'Prestador Verificado', desc: 'Perfil verificado pela plataforma', emoji: '✅', earned: false },
  { id: 'community', name: 'Membro da Comunidade', desc: 'Fez 3 perguntas ou respostas', emoji: '💬', earned: false },
  { id: 'top_rated', name: 'Bem Avaliado', desc: 'Recebe 10 avaliações 5 estrelas', emoji: '⭐', earned: false },
]

const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  pedido_created: { label: 'Pedido criado', icon: '📋' },
  offer_accepted: { label: 'Proposta aceite', icon: '🤝' },
  offer_accepted_provider: { label: 'Proposta aceite', icon: '🤝' },
  job_confirmed_client: { label: 'Trabalho confirmado', icon: '✅' },
  job_confirmed_provider: { label: 'Trabalho confirmado', icon: '✅' },
  job_completed_both: { label: 'Trabalho concluído', icon: '🏆' },
  review_left: { label: 'Avaliação deixada', icon: '⭐' },
  review_text_bonus: { label: 'Bónus avaliação texto', icon: '✍️' },
  positive_review_received: { label: 'Avaliação positiva recebida', icon: '💛' },
  redemption: { label: 'Voucher trocado', icon: '🎁' },
  admin_adjustment: { label: 'Ajuste admin', icon: '🔧' },
  fraud_void: { label: 'Anulado por fraude', icon: '🚫' },
  campaign_bonus: { label: 'Bónus de campanha', icon: '🎯' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: 'Aprovado', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: 'Rejeitado', color: '#EF4444', bg: '#FEF2F2' },
  void: { label: 'Anulado', color: '#9CA3AF', bg: '#F3F4F6' },
}

export default async function RecompensasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [profileRes, txRes, vouchersRes] = await Promise.all([
    supabase.from('reward_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('reward_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('reward_vouchers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const rp = profileRes.data
  const approved = rp?.approved_points_balance ?? 0
  const pending = rp?.pending_points_balance ?? 0
  const lifetime = rp?.total_earned_lifetime ?? 0
  const redeemed = rp?.total_redeemed ?? 0

  // Niveau actuel
  const currentLevel = LEVELS.find(l => approved >= l.min && approved <= l.max) ?? LEVELS[0]
  const nextLevel = LEVELS.find(l => l.min > approved) ?? null
  const levelPct = nextLevel ? Math.min(((approved - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100, 100) : 100

  // Prochaine récompense
  const nextReward = REWARDS.find(r => r.pts > approved)

  const availableVouchers = (vouchersRes.data ?? []).filter((v: any) => v.status === 'available')

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C85A1A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Programa de fidelidade</p>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, fontWeight: 700, color: '#2C1A0E' }}>Recompensas</h1>
        </div>

        {/* Bloc principal pontos */}
        <div style={{ background: '#2C1A0E', borderRadius: 18, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Os teus pontos</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Ganha pontos ao utilizar a plataforma</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: currentLevel.bg, borderRadius: 10, padding: '6px 12px', display: 'inline-block' }}>
                <span style={{ fontSize: 16 }}>{currentLevel.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: currentLevel.color, marginLeft: 5 }}>{currentLevel.name}</span>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 44, fontWeight: 700, color: '#C85A1A', marginBottom: 4 }}>{approved}</p>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              pontos aprovados {pending > 0 && <span style={{ color: '#F9AB00' }}>· + {pending} pendentes</span>}
            </p>
            {/* Barra nível */}
            {nextLevel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{currentLevel.name}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{nextLevel.name} ({nextLevel.min} pts)</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${levelPct}%`, background: 'linear-gradient(90deg, #C85A1A, #F9AB00)', borderRadius: 99 }} />
                </div>
              </div>
            )}
            {nextReward && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎯</span>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
                  Faltam <span style={{ color: '#F9AB00', fontWeight: 700 }}>{nextReward.pts - approved} pontos</span> para ganhar {nextReward.label}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats 4 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { n: approved, l: 'Aprovados', color: '#3B6D11', emoji: '✅' },
            { n: pending, l: 'Pendentes', color: '#F9AB00', emoji: '⏳' },
            { n: lifetime, l: 'Total ganho', color: '#C85A1A', emoji: '📈' },
            { n: redeemed, l: 'Trocados', color: '#1A73E8', emoji: '🔄' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: '#9B7A5A' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {pending > 0 && (
          <div style={{ background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, fontSize: 14, color: '#92400E' }}>
            <span>⏳</span>
            <span>Os pontos pendentes ficam disponíveis ao fim de <strong>7 dias</strong> após a ação.</span>
          </div>
        )}

        {/* Níveis */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Níveis de fidelidade</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {LEVELS.map(l => {
              const isActive = approved >= l.min && approved <= l.max
              return (
                <div key={l.name} style={{ background: isActive ? l.bg : '#FAF7F2', border: isActive ? `2px solid ${l.color}` : '0.5px solid #EDE6DC', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{l.emoji}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isActive ? l.color : '#7A6048', marginBottom: 2 }}>{l.name}</p>
                  <p style={{ fontSize: 12, color: '#9B7A5A' }}>{l.max === Infinity ? `${l.min}+ pts` : `${l.min}–${l.max} pts`}</p>
                  {isActive && <span style={{ display: 'inline-block', marginTop: 6, background: l.color, color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>Atual</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recompensas disponíveis */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Recompensas disponíveis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {REWARDS.map(r => {
              const canRedeem = approved >= r.pts
              return (
                <div key={r.pts} style={{ background: canRedeem ? r.bg : '#FAF7F2', border: `0.5px solid ${canRedeem ? r.color + '40' : '#EDE6DC'}`, borderRadius: 14, padding: '16px', textAlign: 'center', opacity: canRedeem ? 1 : 0.7 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{r.emoji}</div>
                  <span style={{ background: canRedeem ? r.color : '#9B7A5A', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 13, fontWeight: 700 }}>{r.pts} pts</span>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', margin: '8px 0 4px' }}>{r.label}</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A', marginBottom: 10 }}>{r.sub}</p>
                  {canRedeem
                    ? <button style={{ width: '100%', padding: '7px', borderRadius: 8, background: r.color, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Resgatar</button>
                    : <p style={{ fontSize: 12, color: '#B09070' }}>Faltam {r.pts - approved} pts</p>
                  }
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Como ganhar pontos */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Como ganhar pontos?</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {HOW_TO_EARN.map(a => (
                <div key={a.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#FAF7F2', borderRadius: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 16 }}>{a.emoji}</span>
                    <span style={{ fontSize: 14, color: '#5A3E28' }}>{a.action}</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#3B6D11' }}>{a.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E' }}>Os teus badges</h2>
              <span style={{ fontSize: 13, color: '#9B7A5A' }}>Em breve</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {BADGES.map(b => (
                <div key={b.id} style={{ textAlign: 'center', opacity: b.earned ? 1 : 0.4 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: b.earned ? '#FBF0E8' : '#F0EDE8', border: `2px solid ${b.earned ? '#C85A1A' : '#EDE6DC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: 22 }}>
                    {b.emoji}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3 }}>{b.name}</p>
                  {b.progress !== undefined && (
                    <div style={{ height: 3, background: '#F0E8DC', borderRadius: 99, margin: '4px 4px 0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(b.progress / (b.total ?? 1)) * 100}%`, background: '#C85A1A' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '18px 20px' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Histórico de pontos</h2>
          {(txRes.data ?? []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(txRes.data ?? []).map((tx: any) => {
                const action = ACTION_LABELS[tx.action_type] ?? { label: tx.action_type, icon: '•' }
                const st = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.approved
                const isPositive = tx.points > 0
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#FAF7F2', borderRadius: 10, border: tx.fraud_flag ? '0.5px solid #FFCDD2' : '0.5px solid #EDE6DC' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fff', border: '0.5px solid #EDE6DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: '#2C1A0E' }}>{action.label}</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: '#9B7A5A' }}>{new Date(tx.created_at).toLocaleDateString('pt-PT')}</span>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '1px 7px', fontSize: 12, fontWeight: 500 }}>{st.label}</span>
                        {tx.fraud_flag && <span style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 99, padding: '1px 7px', fontSize: 12 }}>🚩 Em análise</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: isPositive ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                      {isPositive ? '+' : ''}{tx.points}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 15, color: '#9B7A5A', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>Ainda sem transações.</p>
          )}
        </div>

        {/* CTA */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 32 }}>🎁</div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 3 }}>Usa os teus pontos e aproveita as vantagens!</p>
              <p style={{ fontSize: 14, color: '#7A6048' }}>Estamos sempre a adicionar novas recompensas para ti.</p>
            </div>
          </div>
          <Link href="/explorar" style={{ padding: '10px 20px', borderRadius: 12, background: '#C85A1A', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Explorar recompensas
          </Link>
        </div>

        <p style={{ fontSize: 13, color: '#B09070', textAlign: 'center' }}>ℹ️ Os pontos não têm valor monetário e não são convertíveis em dinheiro.</p>

      </div>
    </div>
  )
}
