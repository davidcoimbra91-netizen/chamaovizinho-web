'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PhotoLightbox({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen(i => i !== null ? (i + 1) % photos.length : null)
      if (e.key === 'ArrowLeft') setOpen(i => i !== null ? (i - 1 + photos.length) % photos.length : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, photos.length])

  return (
    <>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => setOpen(i)}
            style={{ aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', position: 'relative', border: 'none', padding: 0, cursor: 'zoom-in', display: 'block' }}
          >
            <Image src={url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button
            onClick={() => setOpen(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <X size={18} />
          </button>

          {/* Counter */}
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>
            {open + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(i => i !== null ? (i - 1 + photos.length) % photos.length : null) }}
              style={{ position: 'absolute', left: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: 'min(90vw, 900px)', maxHeight: '85vh', width: '100%', aspectRatio: 'auto' }}
          >
            <img
              src={photos[open]}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(i => i !== null ? (i + 1) % photos.length : null) }}
              style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}
    </>
  )
}
