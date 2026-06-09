interface Props {
  providers: number
  requests: number
}

export default function StatsSection({ providers, requests }: Props) {
  return (
    <section style={{ background: '#FAF7F2', borderBottom: '0.5px solid #EDE6DC', padding: '24px 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${providers}+`, label: 'Prestadores ativos', icon: '👥' },
            { value: `${requests}+`, label: 'Pedidos realizados', icon: '🔧' },
            { value: '4.8/5',        label: 'Avaliação média',    icon: '⭐' },
            { value: '100%',         label: 'Prestadores verificados', icon: '✅' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 24, fontWeight: 600, color: '#C85A1A', marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#9B7A5A' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
