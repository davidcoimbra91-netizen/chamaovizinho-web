import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Bell } from 'lucide-react'

export default async function NotificacoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '20px 0' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 12 }}>
            <ArrowLeft size={14} /> Início
          </Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#fff' }}>Notificações</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {notifications && notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n: any) => (
              <div key={n.id} style={{
                background: n.is_read ? '#fff' : '#FBF0E8',
                border: `0.5px solid ${n.is_read ? '#EDE6DC' : '#E0CCBB'}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: n.is_read ? '#F0E8DC' : '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bell size={16} color={n.is_read ? '#9B7A5A' : '#C85A1A'} />
                </div>
                <div style={{ flex: 1 }}>
                  {n.title && <p style={{ fontSize: 16, fontWeight: n.is_read ? 500 : 700, color: '#2C1A0E', marginBottom: 2 }}>{n.title}</p>}
                  {n.body && <p style={{ fontSize: 15, color: '#7A6048', lineHeight: 1.5 }}>{n.body}</p>}
                  <p style={{ fontSize: 13, color: '#B09070', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C85A1A', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🔔</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Sem notificações</p>
            <p style={{ fontSize: 15, color: '#9B7A5A' }}>As tuas notificações vão aparecer aqui.</p>
          </div>
        )}
      </div>
    </div>
  )
}
