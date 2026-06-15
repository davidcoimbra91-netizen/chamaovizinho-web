export type WizardStep = {
  id: string
  question: string
  options: string[]
}

export type PedidoTemplate = {
  id: string
  label: string
  icon: string
  iconImg: string | null
  category: string
  steps: WizardStep[]
  buildTitle: (answers: Record<string, string>) => string
  buildDescription: (answers: Record<string, string>) => string
}

export const PEDIDO_TEMPLATES: PedidoTemplate[] = [
  {
    id: 'cortar_relva',
    label: 'Cortar Relva',
    icon: '🌿',
    iconImg: '/icons/jardinagem.png',
    category: 'jardinagem',
    steps: [
      {
        id: 'tamanho',
        question: 'Qual é o tamanho do terreno?',
        options: ['Pequeno (< 50m²)', 'Médio (50–200m²)', 'Grande (> 200m²)', 'Personalizado'],
      },
    ],
    buildTitle: () => 'Cortar relva',
    buildDescription: (a) => `Tamanho do terreno: ${a.tamanho ?? ''}`,
  },
  {
    id: 'limpeza_casa',
    label: 'Limpeza da Casa',
    icon: '🧹',
    iconImg: '/icons/limpeza.png',
    category: 'limpeza',
    steps: [
      {
        id: 'tipo',
        question: 'Que tipo de limpeza precisa?',
        options: ['Limpeza geral', 'Limpeza profunda', 'Pós-obra', 'Escritório ou comercial'],
      },
    ],
    buildTitle: () => 'Limpeza da casa',
    buildDescription: (a) => `Tipo de limpeza: ${a.tipo ?? ''}`,
  },
  {
    id: 'pintar_divisao',
    label: 'Pintar Divisão',
    icon: '🎨',
    iconImg: '/icons/pintura.png',
    category: 'pintura',
    steps: [
      {
        id: 'divisao',
        question: 'Que divisão quer pintar?',
        options: ['Sala', 'Quarto', 'Cozinha', 'Casa de banho', 'Toda a casa'],
      },
    ],
    buildTitle: () => 'Pintura de divisão',
    buildDescription: (a) => `Divisão: ${a.divisao ?? ''}`,
  },
  {
    id: 'pequenas_reparacoes',
    label: 'Pequenas Reparações',
    icon: '🔨',
    iconImg: '/icons/pequenas_obras.png',
    category: 'bricolage',
    steps: [
      {
        id: 'tipo',
        question: 'Que tipo de reparação?',
        options: ['Montagem de móveis', 'Fixar prateleiras', 'Reparar porta ou janela', 'Outro'],
      },
    ],
    buildTitle: () => 'Pequenas reparações',
    buildDescription: (a) => `Tipo: ${a.tipo ?? ''}`,
  },
  {
    id: 'mecanica_automovel',
    label: 'Mecânica Automóvel',
    icon: '🚗',
    iconImg: '/icons/mecanica.png',
    category: 'mecanica',
    steps: [
      {
        id: 'tipo',
        question: 'Que tipo de trabalho precisa?',
        options: ['Revisão / manutenção', 'Reparação de avaria', 'Mudança de pneus', 'Diagnóstico'],
      },
    ],
    buildTitle: () => 'Mecânica automóvel',
    buildDescription: (a) => `Tipo de trabalho: ${a.tipo ?? ''}`,
  },
]
