'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const LOGO = 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/logo-removebg-preview.png'
const STORAGE_KEY = 'cov_browser_confirmed'

export default function MobileGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const confirmed = sessionStorage.getItem(STORAGE_KEY) === 'true'
    if (isMobile && !confirmed) {
      setShowGate(true)
    }
    setChecked(true)
  }, [])

  const handleContinue = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setShowGate(false)
  }

  if (!checked) return null

  if (showGate) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FAF7F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
      }}>
        <Image src={LOGO} alt="Chama o Vizinho" width={100} height={100} style={{ objectFit: 'contain', marginBottom: 24 }} unoptimized />

        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 12 }}>
          Chama o Vizinho!
        </h1>
        <p style={{ fontSize: 15, color: '#7A6048', lineHeight: 1.6, marginBottom: 8, maxWidth: 300 }}>
          A plataforma portuguesa de serviços domésticos.
        </p>
        <p style={{ fontSize: 13, color: '#9B7A5A', lineHeight: 1.6, marginBottom: 36, maxWidth: 300 }}>
          Para a melhor experiência no telemóvel, usa a nossa aplicação gratuita.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280 }}>
          <a
            href="https://apps.apple.com/app/chama-o-vizinho/id6772727446"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#2C1A0E', borderRadius: 14, padding: '14px 20px',
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(44,26,14,0.2)',
            }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 1 }}>Disponível na</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>App Store</div>
            </div>
          </a>

          <a
            href="https://play.google.com/store/apps/details?id=pt.chamaovizinho.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: '#C85A1A', borderRadius: 14, padding: '14px 20px',
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(200,90,26,0.3)',
            }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M3 20.5v-17c0-.83 1.01-1.3 1.66-.78l15 8.5c.6.35.6 1.21 0 1.56l-15 8.5C3.01 21.8 3 21.33 3 20.5z"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 1 }}>Disponível no</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Google Play</div>
            </div>
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0', width: '100%', maxWidth: 280 }}>
          <div style={{ flex: 1, height: '0.5px', background: '#EDE6DC' }} />
          <span style={{ fontSize: 12, color: '#B09070' }}>ou</span>
          <div style={{ flex: 1, height: '0.5px', background: '#EDE6DC' }} />
        </div>

        <button
          onClick={handleContinue}
          style={{ fontSize: 13, color: '#9B7A5A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Continuar no navegador mesmo assim
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 36 }}>
          <span style={{ color: '#C85A1A', fontSize: 16 }}>★★★★★</span>
          <span style={{ fontSize: 12, color: '#9B7A5A' }}>4.9 · +500 avaliações</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
