import Image from 'next/image'

const HEADER_IMAGE = 'https://4a3225a957f59ca32696c7b995c0c9cb.cdn.bubble.io/f1774213525167x362576846202343100/af1597a0-47c0-424a-9033-07e67356b54d.png'

interface Props {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  height?: number
}

export default function HeroBanner({ title, subtitle, children, height = 260 }: Props) {
  return (
    <div className="relative overflow-hidden flex items-center justify-center" style={{ height }}>
      <Image src={HEADER_IMAGE} alt="" fill className="object-cover" priority unoptimized aria-hidden="true" />
      {(title || children) && (
        <div className="relative z-10 text-center px-4">
          {title && <h1 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E', marginBottom: 4, textShadow: '0 1px 8px rgba(255,255,255,0.6)' }}>{title}</h1>}
          {subtitle && <p style={{ fontSize: 14, color: '#5A3E28', textShadow: '0 1px 4px rgba(255,255,255,0.5)' }}>{subtitle}</p>}
          {children}
        </div>
      )}
    </div>
  )
}
