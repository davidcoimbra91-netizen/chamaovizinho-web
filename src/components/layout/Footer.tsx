import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#2C1A0E', color: '#FAF7F2' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="rgba(200,90,26,0.2)"/>
                <path d="M16 5L6 13v13h6v-7h8v7h6V13L16 5z" fill="#C85A1A"/>
                <rect x="13" y="19" width="6" height="7" rx="1" fill="rgba(250,240,230,0.3)"/>
              </svg>
              <span style={{ fontFamily: 'Lora, serif', fontSize: 14, fontWeight: 600 }}>Chama o Vizinho!</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              A plataforma portuguesa que liga clientes a prestadores de serviços de confiança.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {['App Store', 'Google Play'].map(s => (
                <span key={s} style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>{s}</span>
              ))}
            </div>
          </div>

          {[
            { title: 'Serviços', links: [{ href: '/servicos/canalização', l: 'Canalização' }, { href: '/servicos/eletricidade', l: 'Eletricidade' }, { href: '/servicos/limpeza', l: 'Limpeza' }, { href: '/servicos/jardinagem', l: 'Jardinagem' }, { href: '/servicos', l: 'Ver todos →' }] },
            { title: 'Regiões', links: [{ href: '/prestadores/lisboa', l: 'Lisboa' }, { href: '/prestadores/porto', l: 'Porto' }, { href: '/prestadores/coimbra', l: 'Coimbra' }, { href: '/prestadores/algarve', l: 'Algarve' }, { href: '/prestadores/norte', l: 'Norte' }] },
            { title: 'Plataforma', links: [{ href: '/dicas', l: 'Dicas do Dia' }, { href: '/comunidade', l: 'Comunidade' }, { href: '/precos', l: 'Preços' }, { href: '/auth', l: 'Entrar' }, { href: '/auth?tab=register', l: 'Registar' }] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }} className="hover:text-white transition-colors">{link.l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', marginTop: 40, paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Chama o Vizinho. Todos os direitos reservados.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ href: '/privacidade', l: 'Privacidade' }, { href: '/termos', l: 'Termos' }].map(link => (
              <Link key={link.href} href={link.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }} className="hover:text-white/50 transition-colors">{link.l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
