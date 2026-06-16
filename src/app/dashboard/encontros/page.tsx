import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ArrowLeft, Calendar, Clock, MapPin, MessageSquare } from 'lucide-react'

async function confirmAppointment(formData: FormData) {
  'use server'
  const supabase = createClient()
  const id = formData.get('id') as string
  if (!id) return
  await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id)
  revalidatePath('/dashboard/encontros')
}

export default async function EncontrosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, date, start_time, end_time, notes, address, status, provider_id, client_id, conversation_id, service_request_id, created_by')
    .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  // Load other party names
  const enriched = await Promise.all((appointments ?? []).map(async (appt) => {
    const otherId = appt.provider_id === user.id ? appt.client_id : appt.provider_id
    const isProvider = appt.provider_id === user.id

    // Try provider_profiles first for the other party
    const { data: pp } = await supabase.from('provider_profiles')
      .select('business_name, profile_photo').eq('user_id', otherId).single()
    const { data: up } = await supabase.from('user_profiles')
      .select('name, profile_photo').eq('id', otherId).single()

    const otherName = pp?.business_name || up?.name || 'Utilizador'
    const otherPhoto = pp?.profile_photo || up?.profile_photo

    let serviceTitle: string | null = null
    if (appt.service_request_id) {
      const { data: sr } = await supabase.from('service_requests')
        .select('title').eq('id', appt.service_request_id).single()
      serviceTitle = sr?.title ?? null
    }

    return { ...appt, otherName, otherPhoto, isProvider, serviceTitle }
  }))

  const pending = enriched.filter(a => a.status === 'pending')
  const confirmed = enriched.filter(a => a.status === 'confirmed')

  const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'A aguardar confirmação', bg: '#FFF3E0', color: '#E65100' },
    confirmed: { label: 'Confirmado ✓', bg: '#E8F5E9', color: '#2E7D32' },
  }

  function ApptCard({ appt, userId }: { appt: typeof enriched[0]; userId: string }) {
    const st = statusLabels[appt.status] ?? { label: appt.status, bg: '#F0EDE8', color: '#7A6048' }
    const dateStr = appt.date
      ? new Date(appt.date + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '16px 18px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FBF0E8', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {appt.otherPhoto
                ? <img src={appt.otherPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: '#C85A1A' }}>
                    {appt.otherName.charAt(0)}
                  </div>
              }
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{appt.otherName}</p>
              <p style={{ fontSize: 12, color: '#9B7A5A' }}>{appt.isProvider ? 'Cliente' : 'Prestador'}</p>
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, background: st.bg, color: st.color, borderRadius: 99, padding: '3px 10px', flexShrink: 0 }}>{st.label}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} color="#C85A1A" />
              <span style={{ fontSize: 14, color: '#2C1A0E', textTransform: 'capitalize' }}>{dateStr}</span>
            </div>
          )}
          {appt.start_time && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color="#C85A1A" />
              <span style={{ fontSize: 14, color: '#2C1A0E' }}>
                {appt.start_time.slice(0, 5)}{appt.end_time ? ` → ${appt.end_time.slice(0, 5)}` : ''}
              </span>
            </div>
          )}
          {appt.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <MapPin size={14} color="#C85A1A" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#2C1A0E' }}>{appt.address}</span>
            </div>
          )}
          {appt.notes && (
            <div style={{ fontSize: 13, color: '#7A6048', background: '#FAF7F2', borderRadius: 8, padding: '6px 10px' }}>
              📌 {appt.notes}
            </div>
          )}
          {appt.serviceTitle && (
            <div style={{ fontSize: 13, color: '#9B7A5A' }}>
              📋 {appt.serviceTitle}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {appt.status === 'pending' && appt.created_by !== userId && (
            <form action={confirmAppointment}>
              <input type="hidden" name="id" value={appt.id} />
              <button type="submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#fff', background: '#2E7D32', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>
                ✅ Aceitar encontro
              </button>
            </form>
          )}
          {appt.conversation_id && (
            <Link href="/dashboard/mensagens"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#C85A1A', textDecoration: 'none', background: '#FBF0E8', padding: '7px 14px', borderRadius: 8 }}>
              <MessageSquare size={13} /> Ver conversa
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Os meus encontros</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Encontros agendados com prestadores e clientes</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {enriched.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Nenhum encontro agendado</p>
            <p style={{ fontSize: 14, color: '#9B7A5A' }}>Quando propores ou aceitares uma data de encontro nas mensagens, ela aparecerá aqui.</p>
            <Link href="/dashboard/mensagens"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, background: '#C85A1A', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
              <MessageSquare size={14} /> Ir para mensagens
            </Link>
          </div>
        ) : (
          <>
            {confirmed.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>✅ Confirmados ({confirmed.length})</h2>
                {confirmed.map(a => <ApptCard key={a.id} appt={a} userId={user.id} />)}
              </section>
            )}
            {pending.length > 0 && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>⏳ A aguardar confirmação ({pending.length})</h2>
                {pending.map(a => <ApptCard key={a.id} appt={a} userId={user.id} />)}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
