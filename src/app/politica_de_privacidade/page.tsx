import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Chama o Vizinho',
}

const sections = [
  {
    n: '1', title: 'Responsável pelo tratamento',
    content: `O responsável pelo tratamento dos seus dados pessoais é:

David Coimbra
Empresário em nome individual
SIREN : 818 998 155 — SIRET : 818 998 155 00019
28 Rue Lucien Poussin, 91210 Draveil, França
Email : ola@chamaosvizinhos.pt`,
  },
  {
    n: '2', title: 'Dados recolhidos',
    content: null,
    list: [
      'Dados de identificação: nome, apelido, endereço de e-mail, número de telefone',
      'Fotografia de perfil e fotos associadas a pedidos de serviço',
      'Localização geográfica (cidade, código postal) para apresentar prestadores próximos',
      'Conteúdo de mensagens trocadas entre utilizadores',
      'Dados de pagamento (tratados pelos nossos parceiros de pagamento, sem armazenamento por nós)',
      'Token de notificações push (para envio de alertas)',
      'Dados de utilização da aplicação (logs, preferências)',
    ],
  },
  {
    n: '3', title: 'Finalidades e bases legais',
    content: null,
    list: [
      'Prestação do serviço (execução contratual) : criação e gestão de conta, intermediação entre clientes e prestadores',
      'Comunicações transacionais (execução contratual) : notificações de propostas, mensagens e confirmações',
      'Segurança e prevenção de fraude (interesse legítimo) : deteção de comportamentos abusivos',
      'Obrigações legais (conformidade legal) : faturação, conservação de documentos exigida por lei',
      'Melhoria do serviço (interesse legítimo) : análise de utilização anónima',
    ],
  },
  {
    n: '4', title: 'Destinatários dos dados',
    content: 'Os seus dados podem ser partilhados com:',
    list: [
      'Supabase (infraestrutura de base de dados, servidores na UE)',
      'Expo / EAS (entrega de notificações push)',
      'Parceiros de pagamento certificados (Moloni, InvoiceXpress ou equivalente)',
      'Outros utilizadores da plataforma, na medida necessária à prestação do serviço (perfil público do prestador, mensagens)',
    ],
    after: 'Nenhum dado é vendido a terceiros.',
  },
  {
    n: '5', title: 'Transferências internacionais',
    content: 'A aplicação destina-se ao mercado português. Os dados são armazenados em servidores situados na União Europeia. Em caso de transferência para países terceiros, asseguramos a existência de garantias adequadas (cláusulas contratuais-tipo da Comissão Europeia).',
  },
  {
    n: '6', title: 'Conservação dos dados',
    content: null,
    list: [
      'Dados de conta : enquanto a conta estiver ativa, e até 3 anos após o encerramento',
      'Dados de faturação : 10 anos (obrigação legal)',
      'Mensagens : 12 meses após a conclusão do serviço',
      'Tokens de notificação : eliminados após desativação ou desinstalação',
    ],
  },
  {
    n: '7', title: 'Os seus direitos',
    content: 'Em conformidade com o RGPD, tem o direito de:',
    list: [
      'Acesso : obter uma cópia dos seus dados pessoais',
      'Retificação : corrigir dados inexatos ou incompletos',
      'Apagamento : solicitar a eliminação dos seus dados ("direito a ser esquecido")',
      'Limitação : restringir o tratamento em determinadas circunstâncias',
      'Portabilidade : receber os seus dados num formato estruturado',
      'Oposição : opor-se ao tratamento baseado em interesse legítimo',
    ],
    after: 'Para exercer estes direitos, contacte-nos em ola@chamaosvizinhos.pt. Responderemos no prazo de 30 dias.\n\nTem igualmente o direito de apresentar reclamação à CNPD (Comissão Nacional de Proteção de Dados, Portugal) ou à CNIL (França).',
  },
  {
    n: '8', title: 'Segurança',
    content: 'Implementamos medidas técnicas e organizativas adequadas para proteger os seus dados contra acesso não autorizado, perda ou destruição, incluindo encriptação em trânsito (HTTPS/TLS) e controlo de acesso à base de dados.',
  },
  {
    n: '9', title: 'Cookies e rastreamento',
    content: 'A aplicação móvel não utiliza cookies. Podemos utilizar identificadores de sessão anónimos para fins de segurança e desempenho.',
  },
  {
    n: '10', title: 'Alterações a esta política',
    content: 'Podemos atualizar esta política periodicamente. Em caso de alterações significativas, notificaremos os utilizadores através da aplicação. A versão em vigor é sempre a disponível nesta página.',
  },
  {
    n: '11', title: 'Contacto',
    content: 'Para qualquer questão relativa ao tratamento dos seus dados pessoais:',
    after: 'ola@chamaosvizinhos.pt',
  },
]

export default function PoliticaPrivacidadePage() {
  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '48px 0 36px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Chama o Vizinho</Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Política de Privacidade</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Última atualização: maio de 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sections.map(s => (
            <div key={s.n}>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, fontWeight: 700, color: '#2C1A0E', marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ color: '#C85A1A', fontSize: 16, fontWeight: 700 }}>{s.n}.</span>
                {s.title}
              </h2>
              {s.content && (
                <p style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.75, whiteSpace: 'pre-line', marginBottom: (s as any).list ? 12 : 0 }}>{s.content}</p>
              )}
              {(s as any).list && (
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(s as any).list.map((item: string, i: number) => (
                    <li key={i} style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.7 }}>
                      <span style={{ color: '#C85A1A', marginRight: 6 }}>·</span>{item}
                    </li>
                  ))}
                </ul>
              )}
              {(s as any).after && (
                <p style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.75, marginTop: 12, whiteSpace: 'pre-line' }}>{(s as any).after}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '0.5px solid #EDE6DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/termos-condicoes" style={{ fontSize: 15, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>Termos e Condições →</Link>
          <Link href="/" style={{ fontSize: 15, color: '#9B7A5A', textDecoration: 'none' }}>← Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
