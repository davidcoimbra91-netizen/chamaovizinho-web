export default function HowItWorks() {
  const steps = [
    { step: '01', icon: '📝', title: 'Publica o teu pedido', description: 'Descreve o que precisas, adiciona fotos e indica a tua localização. Grátis e rápido.' },
    { step: '02', icon: '📬', title: 'Recebe propostas', description: 'Os prestadores da tua zona recebem notificação e enviam propostas com preços.' },
    { step: '03', icon: '✅', title: 'Escolhe o melhor', description: 'Compara perfis, avaliações e preços. Agenda o trabalho diretamente.' },
    { step: '04', icon: '⭐', title: 'Avalia o serviço', description: 'Deixa a tua avaliação e ajuda outros utilizadores a escolher melhor.' },
  ]

  return (
    <section style={{ padding: '40px 0', background: '#fff', borderBottom: '0.5px solid #EDE6DC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: '#C85A1A', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Como funciona</p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E' }}>Simples e rápido</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {steps.map(s => (
            <div key={s.step} style={{ background: '#FAF7F2', border: '0.5px solid #EDE6DC', borderRadius: 12, padding: '20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <span style={{ fontFamily: 'Lora, serif', fontSize: 28, fontWeight: 600, color: '#EDE6DC' }}>{s.step}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontSize: 12, color: '#7A6048', lineHeight: 1.5 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
