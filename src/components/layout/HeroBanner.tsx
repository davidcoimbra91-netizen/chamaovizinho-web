import Image from 'next/image'
import { BANNERS } from '@/types'

interface Props {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  banner?: keyof typeof BANNERS | string
  height?: number
}

export default function HeroBanner({ title, subtitle, children, banner = 'home', height = 160 }: Props) {
  const src = banner in BANNERS ? BANNERS[banner as keyof typeof BANNERS] : banner

  return (
    <div className="relative overflow-hidden flex items-center justify-center" style={{ height }}>
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        priority
        aria-hidden="true"
        unoptimized
      />
      {(title || children) && (
        <div className="relative z-10 text-center px-4">
          {title && (
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 600, color: '#2C1A0E', marginBottom: 4 }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ fontSize: 13, color: '#8B6848' }}>{subtitle}</p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
