import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileGate from '@/components/MobileGate'

export const metadata: Metadata = {
  title: {
    default: 'Chama o Vizinho — Serviços domésticos em Portugal',
    template: '%s | Chama o Vizinho',
  },
  description: 'Encontra os melhores prestadores de serviços perto de ti. Canalização, eletricidade, limpeza, jardinagem e muito mais em Portugal.',
  keywords: ['serviços domésticos', 'prestadores serviços Portugal', 'canalização Lisboa', 'eletricista Lisboa', 'limpeza doméstica'],
  authors: [{ name: 'Chama o Vizinho' }],
  creator: 'Chama o Vizinho',
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: 'https://www.chamaovizinho.pt',
    siteName: 'Chama o Vizinho',
    title: 'Chama o Vizinho — Serviços domésticos em Portugal',
    description: 'Encontra os melhores prestadores de serviços perto de ti em Portugal.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chama o Vizinho',
    description: 'Serviços domésticos em Portugal',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.chamaovizinho.pt',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body>
        <MobileGate>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </MobileGate>
      </body>
    </html>
  )
}
