'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const UNITS = ['m²', 'm³', 'mL', 'H', 'un']

const SERVICE_CATEGORIES = [
  { id: 'canalização',       label: 'Canalização',        icon: '🔧' },
  { id: 'eletricidade',      label: 'Eletricidade',       icon: '⚡' },
  { id: 'pintura',           label: 'Pintura',            icon: '🎨' },
  { id: 'jardinagem',        label: 'Jardinagem',         icon: '🌿' },
  { id: 'limpeza',           label: 'Limpeza',            icon: '🧹' },
  { id: 'montagem',          label: 'Montagem',           icon: '🪚' },
  { id: 'mudanças',          label: 'Mudanças',           icon: '📦' },
  { id: 'electrodomésticos', label: 'Electrodomésticos',  icon: '🔌' },
  { id: 'pequenas_obras',    label: 'Pequenas obras',     icon: '🏗️' },
  { id: 'mecanica',          label: 'Mecânica',           icon: '🚗' },
  { id: 'bricolage',         label: 'Bricolage',          icon: '🔨' },
  { id: 'informatica',       label: 'Informática',        icon: '💻' },
  { id: 'cuidados',          label: 'Cuidados',           icon: '👶' },
  { id: 'outros',            label: 'Outros',             icon: '🔍' },
]

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v || 0)

type MyPrices = Record<string, { price: string; unit: string; psc_id: string | null; is_active: boolean }>

export default function PrecarioPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedCat, setSelectedCat] = useState<typeof SERVICE_CATEGORIES[0] | null>(null)
  const [catalog, setCatalog] = useState<any[]>([])
  const [myPrices, setMyPrices] = useState<MyPrices>({})
  const [loadingCat, setLoadingCat] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const loadCategory = useCallback(async (catId: string) => {
    if (!userId) return
    setLoadingCat(true)
    setCatalog([])
    setMyPrices({})
    try {
      const [{ data: catalogRows }, { data: myRows }] = await Promise.all([
        supabase.from('service_catalog').select('*').eq('category_id', catId).eq('is_active', true).order('name'),
        supabase.from('provider_service_catalog').select('*').eq('provider_id', userId).eq('category_id', catId),
      ])
      setCatalog(catalogRows || [])
      const map: MyPrices = {}
      for (const row of myRows || []) {
        if (row.service_catalog_id) {
          map[row.service_catalog_id] = {
            price: row.provider_price != null ? String(row.provider_price).replace('.', ',') : '',
            unit: row.unit || '',
            psc_id: row.id,
            is_active: row.is_active,
          }
        }
      }
      setMyPrices(map)
    } finally {
      setLoadingCat(false)
    }
  }, [userId])

  const selectCategory = (cat: typeof SERVICE_CATEGORIES[0]) => {
    setSelectedCat(cat)
    setSaved(false)
    setError('')
    loadCategory(cat.id)
  }

  const updatePrice = (scId: string, value: string) => {
    setMyPrices(prev => ({ ...prev, [scId]: { ...(prev[scId] || { unit: '', psc_id: null, is_active: true }), price: value } }))
  }

  const updateUnit = (scId: string, unit: string) => {
    setMyPrices(prev => ({ ...prev, [scId]: { ...(prev[scId] || { price: '', psc_id: null, is_active: true }), unit } }))
  }

  const toggleActive = (scId: string) => {
    setMyPrices(prev => ({
      ...prev,
      [scId]: { ...(prev[scId] || { price: '', unit: '', psc_id: null, is_active: true }), is_active: !(prev[scId]?.is_active !== false) },
    }))
  }

  const handleSave = async () => {
    if (!userId || !selectedCat) return
    const entries = Object.entries(myPrices).filter(([, v]) => v.price !== '')
    if (entries.length === 0) { setError('Adiciona pelo menos um preço antes de guardar.'); return }
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      for (const [scId, val] of entries) {
        const catalogRow = catalog.find(r => r.id === scId)
        if (!catalogRow) continue
        const providerPrice = parseFloat(val.price.replace(',', '.')) || 0
        const payload = {
          provider_id: userId,
          service_catalog_id: scId,
          category_id: selectedCat.id,
          name: catalogRow.name,
          description: catalogRow.description,
          unit: val.unit || catalogRow.unit || 'un',
          average_price: catalogRow.average_price,
          provider_price: providerPrice,
          is_active: val.is_active !== false,
        }
        if (val.psc_id) {
          await supabase.from('provider_service_catalog').update(payload).eq('id', val.psc_id)
        } else {
          const { data } = await supabase.from('provider_service_catalog').insert(payload).select('id').single()
          if (data) {
            setMyPrices(prev => ({ ...prev, [scId]: { ...prev[scId], psc_id: data.id } }))
          }
        }
      }
      setSaved(true)
    } catch (e: any) {
      setError('Erro ao guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '16px 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/faturacao" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>
            <ArrowLeft size={13} /> Faturação
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={20} color="#C85A1A" />
            <div>
              <p style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>Précário de preços</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Define os teus preços por serviço — usados no preenchimento automático dos devis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>

          {/* Sidebar categorias */}
          <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '10px 0', alignSelf: 'start', position: 'sticky', top: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 14px 8px' }}>Categoria</p>
            {SERVICE_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => selectCategory(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '9px 14px', border: 'none', background: selectedCat?.id === cat.id ? '#FBF0E8' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', borderLeft: selectedCat?.id === cat.id ? '3px solid #C85A1A' : '3px solid transparent',
                }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{ fontSize: 13, fontWeight: selectedCat?.id === cat.id ? 700 : 500, color: selectedCat?.id === cat.id ? '#C85A1A' : '#4B3728' }}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo */}
          <div>
            {!selectedCat ? (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👆</div>
                <p style={{ fontSize: 15, color: '#9B7A5A' }}>Seleciona uma categoria para definir os teus preços</p>
              </div>
            ) : loadingCat ? (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, border: '2px solid #C85A1A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : catalog.length === 0 ? (
              <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
                <p style={{ fontSize: 15, color: '#9B7A5A' }}>Nenhum serviço disponível nesta categoria</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header info */}
                <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '14px 18px' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#2C1A0E' }}>{selectedCat.icon} {selectedCat.label}</p>
                  <p style={{ fontSize: 13, color: '#9B7A5A', marginTop: 3 }}>
                    {catalog.length} serviço{catalog.length !== 1 ? 's' : ''} disponível{catalog.length !== 1 ? 'veis' : ''} — define o teu preço e unidade
                  </p>
                </div>

                {/* Tableau services */}
                <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, overflow: 'hidden' }}>
                  {/* En-tête */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 44px', background: '#FAF7F2', padding: '8px 16px', borderBottom: '0.5px solid #EDE6DC', gap: 8 }}>
                    {['Prestação', 'Preço ref.', 'Meu preço', ''].map(h => (
                      <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9B7A5A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                    ))}
                  </div>

                  {catalog.map((item, idx) => {
                    const mine = myPrices[item.id] || { price: '', unit: item.unit || 'un', psc_id: null, is_active: true }
                    const hasPrice = mine.price !== ''
                    const isActive = mine.is_active !== false
                    const currentUnit = mine.unit || item.unit || 'un'

                    return (
                      <div key={item.id} style={{
                        display: 'grid', gridTemplateColumns: '1fr 90px 90px 44px',
                        padding: '10px 16px', borderBottom: idx < catalog.length - 1 ? '0.5px solid #F0E8DC' : 'none',
                        gap: 8, alignItems: 'center',
                        opacity: hasPrice && !isActive ? 0.45 : 1,
                        background: hasPrice ? '#FFFCFA' : '#fff',
                      }}>
                        {/* Nom */}
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3 }}>{item.name_pt || item.name}</p>
                          {item.average_price > 0 && (
                            <p style={{ fontSize: 12, color: '#B09070', marginTop: 2 }}>Ref: {fmt(item.average_price)}</p>
                          )}
                        </div>

                        {/* Prix de référence */}
                        <span style={{ fontSize: 13, color: '#9B7A5A', textAlign: 'right' }}>
                          {item.average_price > 0 ? fmt(item.average_price) : '—'}
                        </span>

                        {/* Mon prix + unité */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={mine.price}
                            onChange={e => updatePrice(item.id, e.target.value)}
                            style={{
                              width: '100%', padding: '6px 8px', borderRadius: 7,
                              border: `1.5px solid ${hasPrice ? '#C85A1A' : '#EDE6DC'}`,
                              background: hasPrice ? '#FFF8F5' : '#FAF7F2',
                              fontSize: 13, color: '#2C1A0E', outline: 'none', textAlign: 'right',
                            }}
                          />
                        </div>

                        {/* Unité (select compact) */}
                        <select
                          value={currentUnit}
                          onChange={e => updateUnit(item.id, e.target.value)}
                          style={{
                            padding: '6px 4px', borderRadius: 7, border: '1.5px solid #EDE6DC',
                            background: '#FAF7F2', fontSize: 12, color: '#4B3728',
                            outline: 'none', cursor: 'pointer',
                          }}
                        >
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>

                {/* Toggle actif/inactif des items remplis */}
                {Object.values(myPrices).some(v => v.price !== '') && (
                  <div style={{ background: '#fff', border: '0.5px solid #EDE6DC', borderRadius: 14, padding: '12px 16px' }}>
                    <p style={{ fontSize: 12, color: '#9B7A5A', marginBottom: 8, fontWeight: 600 }}>Visibilidade</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {catalog.filter(item => myPrices[item.id]?.price !== '').map(item => {
                        const mine = myPrices[item.id]
                        const isActive = mine?.is_active !== false
                        return (
                          <button key={item.id} onClick={() => toggleActive(item.id)}
                            style={{
                              padding: '4px 10px', borderRadius: 99, border: '0.5px solid',
                              borderColor: isActive ? '#10B981' : '#EDE6DC',
                              background: isActive ? '#EAF3DE' : '#FAF7F2',
                              color: isActive ? '#3B6D11' : '#9B7A5A',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>
                            {isActive ? '✓ ' : '○ '}{item.name_pt || item.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {error && (
                  <div style={{ background: '#FFEBEE', border: '0.5px solid #FFCDD2', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#C62828' }}>{error}</div>
                )}
                {saved && (
                  <div style={{ background: '#EAF3DE', border: '0.5px solid #B7DFA0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#3B6D11' }}>✓ Preços guardados com sucesso</div>
                )}
                <button onClick={handleSave} disabled={saving}
                  style={{
                    padding: '13px', borderRadius: 12, border: 'none',
                    background: saving ? '#EDE6DC' : '#C85A1A',
                    color: saving ? '#9B7A5A' : '#fff',
                    fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <Save size={15} /> {saving ? 'A guardar...' : 'Guardar preços'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
