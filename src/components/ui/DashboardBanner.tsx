'use client'

import { useState, useEffect } from 'react'

const HEADER_IMGS = [
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%201.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%202.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%203.png',
  'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/icons/header%204.png',
]

export default function DashboardBanner({
  firstName,
  coverPhoto,
}: {
  firstName: string
  coverPhoto?: string | null
}) {
  const [headerImg, setHeaderImg] = useState(coverPhoto ?? HEADER_IMGS[0])

  useEffect(() => {
    if (!coverPhoto) setHeaderImg(HEADER_IMGS[Math.floor(Math.random() * 4)])
  }, [coverPhoto])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 140,
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      <img
        src={headerImg}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(44,26,14,0.65) 0%, rgba(44,26,14,0.15) 100%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px' }}>
        <div>
          <p style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            Olá, {firstName}!
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Bem-vindo à sua área de faturação
          </p>
        </div>
      </div>
    </div>
  )
}
