export default function AppDownload() {
  return (
    <section style={{ background: '#2C1A0E', padding: '48px 0' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <p style={{ fontSize: 13, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Disponível no teu telemóvel</p>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 600, color: '#FAF7F2', marginBottom: 10 }}>
          Leva o Chama o Vizinho <span style={{ color: '#C85A1A', fontStyle: 'italic' }}>no bolso</span>
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
          Descarrega a app e recebe propostas em minutos. iOS e Android.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { store: 'App Store', sub: 'Disponível na', href: 'https://apps.apple.com' },
            { store: 'Google Play', sub: 'Disponível no', href: 'https://play.google.com' },
          ].map(btn => (
            <a key={btn.store} href={btn.href} target="_blank" rel="noopener noreferrer"
              style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s', textDecoration: 'none' }}
              className="hover:bg-white/15">
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{btn.sub}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#FAF7F2' }}>{btn.store}</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          <span style={{ color: '#C85A1A', fontSize: 16 }}>★★★★★</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>4.9 · Mais de 500 avaliações</span>
        </div>
      </div>
    </section>
  )
}
