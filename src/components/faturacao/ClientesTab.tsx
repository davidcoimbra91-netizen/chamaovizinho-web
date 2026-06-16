'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Mail, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function Field({ label, k, type = 'text', placeholder = '', form, setForm }: {
  label: string; k: string; type?: string; placeholder?: string; form: any; setForm: (f: any) => void
}) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[k]}
        onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
        style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '0.5px solid #EDE6DC', fontSize: 14, color: '#2C1A0E', background: '#FAF7F2', outline: 'none', boxSizing: 'border-box' as const }} />
    </div>
  )
}

const EMPTY = { name: '', email: '', phone: '', nif: '', address: '', city: '', postal_code: '' }

export default function ClientesTab() {
  const supabase = createClient()
  const [ppId, setPpId] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: pp } = await supabase.from('provider_profiles').select('id').eq('user_id', user.id).single()
      if (!pp) return
      setPpId(pp.id)
      const { data } = await supabase.from('billing_clients').select('*').eq('provider_id', pp.id).order('name')
      setClients(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!form.name || !ppId) return
    setSaving(true); setSaveError('')
    const { data, error } = await supabase.from('billing_clients').insert({ ...form, provider_id: ppId }).select().single()
    if (error) { setSaveError(error.message) }
    else if (data) { setClients(c => [...c, data].sort((a, b) => a.name.localeCompare(b.name))); setForm(EMPTY); setShowForm(false) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este cliente?')) return
    await supabase.from('billing_clients').delete().eq('id', id)
    setClients(c => c.filter(x => x.id !== id))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9B7A5A' }}>A carregar...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#2C1A0E', marginBottom: 4 }}>Clientes</h1>
          <p style={{ fontSize: 14, color: '#7A6048' }}>{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#C85A1A', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={13} /> Novo cliente
        </button>
      </div>

      {/* Formulaire nouveau client */}
      {showForm && (
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontFamily: 'Lora, serif', fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>Novo cliente</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Nome *" k="name" placeholder="Nome do cliente" form={form} setForm={setForm} />
            <Field label="NIF" k="nif" placeholder="123456789" form={form} setForm={setForm} />
            <Field label="Email" k="email" type="email" placeholder="email@exemplo.com" form={form} setForm={setForm} />
            <Field label="Telefone" k="phone" placeholder="912 345 678" form={form} setForm={setForm} />
            <Field label="Morada" k="address" placeholder="Rua, número..." form={form} setForm={setForm} />
            <Field label="Cidade" k="city" placeholder="Lisboa" form={form} setForm={setForm} />
            <Field label="Código postal" k="postal_code" placeholder="1000-001" form={form} setForm={setForm} />
          </div>
          {saveError && <p style={{ fontSize: 13, color: '#C62828', background: '#FFEBEE', borderRadius: 8, padding: '8px 12px' }}>{saveError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving || !form.name}
              style={{ padding: '9px 18px', borderRadius: 10, background: '#C85A1A', border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={13} /> {saving ? 'A guardar...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 16px', borderRadius: 10, background: '#fff', border: '0.5px solid #EDE6DC', fontSize: 14, color: '#7A6048', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Liste clients */}
      {clients.length > 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
          {clients.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < clients.length - 1 ? '0.5px solid #F0E8DC' : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FBF0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#C85A1A', flexShrink: 0 }}>
                {c.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 2 }}>{c.name}</p>
                <p style={{ fontSize: 13, color: '#9B7A5A', display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                  {c.nif && <span>NIF: {c.nif}</span>}
                  {c.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Mail size={11} />{c.email}</span>}
                  {c.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={11} />{c.phone}</span>}
                  {c.city && <span>{c.city}</span>}
                </p>
              </div>
              <button onClick={() => handleDelete(c.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6 }}>
                <Trash2 size={14} color="#9B7A5A" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>👥</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>Ainda sem clientes</p>
          <p style={{ fontSize: 14, color: '#9B7A5A' }}>Adiciona o teu primeiro cliente para começar a faturar.</p>
        </div>
      )}
    </div>
  )
}
