'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function FormField({ label, k, type = 'text', placeholder = '', form, setForm }: {
  label: string, k: string, type?: string, placeholder?: string,
  form: any, setForm: (f: any) => void
}) {
  return (
    <div>
      <label style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[k]} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 15, color: '#2C1A0E', background: '#FAF7F2', outline: 'none' }} />
    </div>
  )
}

export default function BillingClientsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', nif: '', address: '', city: '', postal_code: '' })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: pp } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single()
      if (!pp) { router.push('/'); return }
      setUserId(user.id)
      setProviderProfileId(pp.id)
      const { data } = await supabase.from('billing_clients').select('*').eq('provider_id', pp.id).order('name')
      setClients(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!form.name) return
    if (!providerProfileId) { setSaveError('Perfil de prestador não encontrado. Recarrega a página.'); return }
    setSaving(true)
    setSaveError('')
    const { data, error } = await supabase.from('billing_clients').insert({ ...form, provider_id: providerProfileId }).select().single()
    if (error) {
      setSaveError(error.message || 'Erro ao guardar cliente.')
    } else if (data) {
      setClients(c => [...c, data])
      setForm({ name: '', email: '', phone: '', nif: '', address: '', city: '', postal_code: '' })
      setShowForm(false)
      setSaveError('')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('billing_clients').delete().eq('id', id)
    setClients(c => c.filter(x => x.id !== id))
  }


  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      <div style={{ background: '#2C1A0E', padding: '16px 0' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>Clientes</p>
            <button onClick={() => setShowForm(!showForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 99, background: '#C85A1A', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} /> Novo cliente
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {showForm && (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Novo cliente</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="Nome *" k="name" placeholder="Nome do cliente" form={form} setForm={setForm} />
              <FormField label="NIF" k="nif" placeholder="123456789" form={form} setForm={setForm} />
              <FormField label="Email" k="email" placeholder="email@exemplo.com" type="email" form={form} setForm={setForm} />
              <FormField label="Telefone" k="phone" placeholder="912 345 678" form={form} setForm={setForm} />
              <FormField label="Morada" k="address" placeholder="Rua, número..." form={form} setForm={setForm} />
              <FormField label="Cidade" k="city" placeholder="Lisboa" form={form} setForm={setForm} />
              <FormField label="Código postal" k="postal_code" placeholder="1000-001" form={form} setForm={setForm} />
            </div>
            {saveError && (
              <p style={{ fontSize: 14, color: '#C62828', background: '#FFEBEE', borderRadius: 8, padding: '8px 12px' }}>{saveError}</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSave} disabled={saving || !form.name}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#C85A1A', border: 'none', fontSize: 15, color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={13} /> {saving ? 'A guardar...' : 'Guardar'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', border: '0.5px solid #EDE6DC', fontSize: 15, color: '#7A6048', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {clients.length > 0 ? (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
            {clients.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < clients.length - 1 ? '0.5px solid #F0E8DC' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#C85A1A', flexShrink: 0 }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E' }}>{c.name}</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A' }}>
                    {c.nif && `NIF: ${c.nif} · `}{c.email ?? ''}{c.city && ` · ${c.city}`}
                  </p>
                </div>
                <button onClick={() => handleDelete(c.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} color="#9B7A5A" />
                   </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>👥</p>
                        <p style={{ fontSize: 15, color: '#9B7A5A' }}>Ainda não tens clientes. Adiciona o primeiro.</p>
          </div>
        )}
      </div>
   
    </div>
  )
}
