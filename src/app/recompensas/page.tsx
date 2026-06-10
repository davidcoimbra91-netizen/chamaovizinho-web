import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import HeroBanner from '@/components/layout/HeroBanner'

const GOAL = 100

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
  const canRedeem = approved >= GOAL
  const approvedPct = Math.min((approved / GOAL) * 100, 100)
  const pendingPct = Math.min(((approved + pending) / GOAL) * 100, 100) - approvedPct

  const availableVouchers = (vouchersRes.data ?? []).filter((v: any) => v.status === 'available')
  const pastVouchers = (vouchersRes.data ?? []).filter((v: any) => v.status !== 'available')

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <HeroBanner title="Recompensas" subtitle="Os teus pontos e vantagens" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Hero card */}
        <div style={{ background: '#2C1A0E', borderRadius: 16, padding: '24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Os teus pontos</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Ganha pontos ao utilizar a plataforma</p>
            </div>
            <div style={{ width: 46, height: 46, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏅</div>
          </div>

          {/* Barre de progression */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${approvedPct}%`, background: '#C85A1A', borderRadius: 99, transition: 'width 0.5s ease' }} />
              {pendingPct > 0 && (
                <div style={{ position: 'absolute', left: `${approvedPct}%`, top: 0, height: '100%', width: `${pendingPct}%`, background: '#F9AB00', opacity: 0.7, borderRadius: 99 }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#fff' }}>
                <span style={{ fontWeight: 700 }}>{approved}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}> / {GOAL} pts</span>
              </span>
              {pending > 0 && <span style={{ fontSize: 11, color: '#F9AB00' }}>+ {pending} pendentes</span>}
            </div>
          </div>

          <button
            disabled={!canRedeem}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: canRedeem ? '#C85A1A' : 'rgba(255,255,255,0.1)',
              color: canRedeem ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 14, fontWeight: 700, cursor: canRedeem ? 'pointer' : 'default',
            }}>
            {canRedeem ? '🎁 Trocar por voucher' : `Faltam ${GOAL - approved} pontos para voucher`}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { n: approved, l: 'Aprovados', color: '#3B6D11' },
            { n: pending, l: 'Pendentes', color: '#F9AB00' },
            { n: lifetime, l: 'Total ganho', color: '#C85A1A' },
            { n: redeemed, l: 'Trocados', color: '#1A73E8' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Lora, serif', marginBottom: 2 }}>{s.n}</div>
              <div style={{ fontSize: 10, color: '#9B7A5A' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Explication pending */}
        {pending > 0 && (
          <div style={{ background: '#FFFBEB', border: '0.5px solid #FDE68A', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 8, fontSize: 12, color: '#92400E' }}>
            <span>⏳</span>
            <span>Os pontos pendentes ficam disponíveis ao fim de <strong>7 dias</strong> após a ação.</span>
          </div>
        )}

        {/* Vouchers disponíveis */}
        {availableVouchers.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Vouchers disponíveis</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {availableVouchers.map((v: any) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#EAF3DE', border: '0.5px solid #C8E6C9', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 22 }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2E7D32' }}>Voucher Chama o Vizinho</p>
                    <p style={{ fontSize: 11, color: '#3B6D11' }}>{v.points_spent} pts · válido até {new Date(v.expires_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  {v.promo_code && <span style={{ background: '#fff', border: '0.5px solid #C8E6C9', borderRadius: 7, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#2E7D32' }}>{v.promo_code}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique transactions */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Lora, serif', fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Histórico</p>
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
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#2C1A0E' }}>{action.label}</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#9B7A5A' }}>{new Date(tx.created_at).toLocaleDateString('pt-PT')}</span>
                        <span style={{ background: st.bg, color: st.color, borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 500 }}>{st.label}</span>
                        {tx.fraud_flag && <span style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 99, padding: '1px 7px', fontSize: 10 }}>🚩 Em análise</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isPositive ? '#10B981' : '#EF4444', flexShrink: 0 }}>
                      {isPositive ? '+' : ''}{tx.points}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#9B7A5A', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>Ainda sem transações.</p>
          )}
        </div>

        {/* Vouchers passés */}
        {pastVouchers.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Vouchers anteriores</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pastVouchers.map((v: any) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F3F4F6', border: '0.5px solid #EDE6DC', borderRadius: 10, padding: '10px 12px' }}>
                  <span style={{ fontSize: 18 }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#6B7280' }}>Voucher · {v.points_spent} pts</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF' }}>{new Date(v.created_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <span style={{ background: '#F3F4F6', color: '#9CA3AF', borderRadius: 99, padding: '2px 8px', fontSize: 11 }}>
                    {v.status === 'used' ? 'Utilizado' : 'Expirado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
