import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Termos e Condições — Chama o Vizinho',
}

const sections = [
  {
    n: '1', title: 'Identificação do operador',
    content: `David Coimbra
Empresário em nome individual
SIREN : 818 998 155 — SIRET : 818 998 155 00019
TVA intracommunautaire : FR94818998155
28 Rue Lucien Poussin, 91210 Draveil, França
Email : ola@chamaosvizinhos.pt`,
  },
  {
    n: '2', title: 'Objeto',
    content: 'A aplicação Chama o Vizinho é uma plataforma de intermediação que permite a particulares e empresas (os "Clientes") encontrar prestadores de serviços locais (os "Prestadores") e solicitar orçamentos ou contratar serviços.\n\nA plataforma não é parte nos contratos celebrados entre Clientes e Prestadores. David Coimbra atua exclusivamente como intermediário tecnológico.',
  },
  {
    n: '3', title: 'Aceitação dos termos',
    content: 'A criação de uma conta na aplicação implica a aceitação integral e incondicional dos presentes Termos e Condições, bem como da Política de Privacidade. Se não concordar com estes termos, não deve utilizar a aplicação.',
  },
  {
    n: '4', title: 'Criação de conta',
    content: 'Para utilizar a plataforma, o utilizador deve:',
    list: [
      'Ter pelo menos 18 anos de idade',
      'Fornecer informações verdadeiras, completas e atualizadas',
      'Manter a confidencialidade das suas credenciais de acesso',
      'Não criar mais do que uma conta pessoal',
    ],
    after: 'O operador reserva-se o direito de suspender ou encerrar qualquer conta em caso de incumprimento.',
  },
  {
    n: '5', title: 'Perfis de Prestador',
    content: 'Os Prestadores que se registem na plataforma comprometem-se a:',
    list: [
      'Fornecer informações exatas sobre as suas competências e serviços',
      'Deter as habilitações, seguros e registos legalmente exigidos para o exercício da sua atividade em Portugal',
      'Responder aos pedidos de orçamento de forma diligente',
      'Cumprir os acordos celebrados com os Clientes',
      'Não utilizar a plataforma para contactar Clientes fora da mesma, com o objetivo de contornar as comissões devidas',
    ],
  },
  {
    n: '6', title: 'Pedidos de serviço',
    content: 'Os Clientes podem publicar pedidos de serviço, incluindo fotos e descrições. Ao publicar um pedido, o Cliente declara que:',
    list: [
      'O conteúdo publicado é verdadeiro e não induz em erro',
      'Tem direito a publicar as fotografias associadas ao pedido',
      'Não utilizará a plataforma para fins ilícitos ou fraudulentos',
    ],
  },
  {
    n: '7', title: 'Planos e faturação',
    content: 'A plataforma oferece planos gratuitos e premium. As condições específicas de cada plano (preço, funcionalidades, duração) são apresentadas no ecrã de subscrição da aplicação.',
    list: [
      'Os pagamentos são processados por parceiros certificados (Moloni, InvoiceXpress ou equivalente)',
      'As subscrições premium renovam-se automaticamente, salvo cancelamento antes do fim do período em curso',
      'O cancelamento pode ser efetuado a qualquer momento através das definições da conta',
      'Em conformidade com a lei portuguesa, o consumidor dispõe de um prazo de 14 dias para exercer o direito de arrependimento em compras online, salvo se o serviço já tiver sido integralmente prestado com o seu consentimento prévio',
    ],
  },
  {
    n: '8', title: 'Regras de utilização',
    content: 'É expressamente proibido:',
    list: [
      'Publicar conteúdo falso, ofensivo, discriminatório ou ilegal',
      'Utilizar a plataforma para publicitar serviços não relacionados com o objeto da aplicação',
      'Tentar aceder a sistemas ou dados de outros utilizadores',
      'Utilizar meios automatizados para interagir com a plataforma sem autorização prévia',
      'Assediar, ameaçar ou prejudicar outros utilizadores',
    ],
    after: 'A violação destas regras pode resultar na suspensão imediata da conta, sem direito a reembolso.',
  },
  {
    n: '9', title: 'Responsabilidade',
    content: 'O operador não garante a qualidade, conformidade ou licitude dos serviços prestados pelos Prestadores, nem a veracidade das informações publicadas pelos Clientes. A plataforma é fornecida "tal como está", sem garantias implícitas de adequação a um fim específico.\n\nA responsabilidade do operador está limitada ao valor das comissões efetivamente cobradas ao utilizador nos 12 meses anteriores ao evento gerador de dano.',
  },
  {
    n: '10', title: 'Propriedade intelectual',
    content: 'Todos os elementos da aplicação (design, código, marca, logótipo) são propriedade exclusiva de David Coimbra ou dos seus licenciadores. Nenhuma reprodução ou reutilização é autorizada sem consentimento escrito prévio.\n\nOs utilizadores concedem ao operador uma licença não exclusiva, gratuita e mundial para utilizar os conteúdos que publicam (fotos, descrições) com o único objetivo de operar e promover a plataforma.',
  },
  {
    n: '11', title: 'Modificações',
    content: 'O operador pode modificar os presentes Termos a qualquer momento. Os utilizadores serão notificados com antecedência mínima de 15 dias em caso de alterações significativas. A utilização continuada da aplicação após esse prazo constitui aceitação das novas condições.',
  },
  {
    n: '12', title: 'Lei aplicável e foro competente',
    content: 'Os presentes Termos são regidos pela lei portuguesa. Em caso de litígio, as partes procurarão uma solução amigável. Na ausência de acordo, será competente o tribunal da comarca de Lisboa, salvo disposição imperativa em contrário para consumidores.\n\nOs consumidores podem igualmente recorrer à plataforma europeia de resolução de litígios em linha : ec.europa.eu/consumers/odr',
  },
  {
    n: '13', title: 'Contacto',
    content: 'ola@chamaosvizinhos.pt',
  },
]

export default function TermosCondicoesPage() {
  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#2C1A0E', padding: '48px 0 36px' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>← Chama o Vizinho</Link>
          <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Termos e Condições</h1>
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
                <p style={{ fontSize: 16, color: '#5A3E28', lineHeight: 1.75, marginTop: 12 }}>{(s as any).after}</p>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '0.5px solid #EDE6DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Link href="/politica-privacidade" style={{ fontSize: 15, color: '#C85A1A', textDecoration: 'none', fontWeight: 600 }}>← Política de Privacidade</Link>
          <Link href="/" style={{ fontSize: 15, color: '#9B7A5A', textDecoration: 'none' }}>← Voltar ao início</Link>
        </div>
      </div>
    </div>
  )
}
