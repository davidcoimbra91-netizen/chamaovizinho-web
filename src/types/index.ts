export type UserProfile = {
  id: string
  name: string | null
  phone: string | null
  city: string | null
  profile_photo: string | null
  is_client: boolean
  is_provider: boolean
  is_pro: boolean
  created_at: string
  average_rating: number | null
  reviews_count: number | null
  bio: string | null
  city_area: string | null
  primary_region: string | null
  profile_completed: boolean
  preferred_language: string | null
  active_role: string | null
  default_role: string | null
  is_admin: boolean
  is_suspended: boolean
  last_seen: string | null
  email: string | null
}

export type ProviderProfile = {
  id: string
  user_id: string
  provider_type: string | null
  business_name: string | null
  legal_form: string | null
  service_description: string | null
  company_city: string | null
  years_experience: number | null
  availability_notes: string | null
  average_rating: number | null
  reviews_count: number | null
  created_at: string
  service_categories: string[]
  business_description: string | null
  company_address: string | null
  company_email: string | null
  company_nif: string | null
  company_phone: string | null
  company_postal_code: string | null
  company_website: string | null
  cover_photo: string | null
  phone_public: boolean
  service_area: string | null
  show_pro_portfolio: boolean
  region: string | null
  is_verified: boolean
  is_boosted: boolean
  is_active: boolean
  latitude: number | null
  longitude: number | null
  email: string | null
  user_profiles?: UserProfile
}

export type DailyTip = {
  id: string
  title: string
  short_description: string | null
  content: string | null
  tips: any | null
  image_url: string | null
  category: string | null
  publish_date: string | null
  is_published: boolean
  created_at: string
  title_en: string | null
  title_fr: string | null
  short_description_en: string | null
  short_description_fr: string | null
  content_en: string | null
  content_fr: string | null
  tips_en: any | null
  tips_fr: any | null
}

export type CommunityQuestion = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  image_urls: string[] | null
  answers_count: number
  is_published: boolean
  created_at: string
  user_profiles?: UserProfile
}

export type Review = {
  id: string
  author_id: string
  reviewed_user_id: string
  service_request_id: string | null
  rating: number
  comment: string | null
  is_public: boolean
  created_at: string
  author?: UserProfile
}

export type ServiceRequest = {
  id: string
  client_id: string
  title: string
  description: string | null
  category: string | null
  city: string | null
  status: string
  budget: number | null
  created_at: string
  is_archived: boolean
  photos: string[] | null
  latitude: number | null
  longitude: number | null
  email: string | null
}

export type PortfolioItem = {
  id: string
  provider_id: string
  photo_url: string
  title: string | null
  description: string | null
  created_at: string
}

// Catégories avec vraies icônes et couleurs
export const CATEGORIES = [
  {
    slug: 'canalização',
    label: 'Canalização',
    icon: '🔧',
    iconImg: '/icons/water.png',
    color: '#1A73E8',
    bg: '#E8F0FE',
    description: 'Fugas, reparações e instalações de canalização',
  },
  {
    slug: 'eletricidade',
    label: 'Eletricidade',
    icon: '⚡',
    iconImg: '/icons/eletricidade.png',
    color: '#F9AB00',
    bg: '#FEF9E7',
    description: 'Instalações elétricas, avarias e certificações',
  },
  {
    slug: 'limpeza',
    label: 'Limpeza Doméstica',
    icon: '🧹',
    iconImg: '/icons/limpeza.png',
    color: '#1A73E8',
    bg: '#E8F0FE',
    description: 'Limpeza de casas, escritórios e espaços comerciais',
  },
  {
    slug: 'jardinagem',
    label: 'Jardinagem',
    icon: '🌿',
    iconImg: '/icons/jardinagem.png',
    color: '#1E8E3E',
    bg: '#E6F4EA',
    description: 'Poda, corte de erva e manutenção de jardins',
  },
  {
    slug: 'pintura',
    label: 'Pintura',
    icon: '🎨',
    iconImg: '/icons/pintura.png',
    color: '#E91E8C',
    bg: '#FCE4EC',
    description: 'Pintura interior e exterior de habitações',
  },
  {
    slug: 'montagem',
    label: 'Montagem de Móveis',
    icon: '🪑',
    iconImg: '/icons/montagem.png',
    color: '#795548',
    bg: '#EFEBE9',
    description: 'Montagem e desmontagem de móveis',
  },
  {
    slug: 'mudanças',
    label: 'Mudanças e Transporte',
    icon: '🚚',
    iconImg: '/icons/Mudancas.png',
    color: '#D32F2F',
    bg: '#FFEBEE',
    description: 'Transporte e mudanças residenciais e comerciais',
  },
  {
    slug: 'bricolage',
    label: 'Bricolage',
    icon: '🔨',
    iconImg: '/icons/pequenas_obras.png',
    color: '#C85A1A',
    bg: '#FBF0E8',
    description: 'Pequenas reparações e trabalhos manuais',
  },
  {
    slug: 'informatica',
    label: 'Informática e Tecnologia',
    icon: '💻',
    iconImg: '/icons/informatica.png',
    color: '#5C35CC',
    bg: '#EDE7F6',
    description: 'Reparação de computadores e suporte técnico',
  },
  {
    slug: 'pequenas_obras',
    label: 'Pequenas Obras',
    icon: '🏗️',
    iconImg: '/icons/pequenas_obras.png',
    color: '#F57C00',
    bg: '#FFF3E0',
    description: 'Remodelações e obras de menor dimensão',
  },
  {
    slug: 'electrodomesticos',
    label: 'Eletrodomésticos',
    icon: '🔌',
    iconImg: '/icons/electrodomesticos.png',
    color: '#546E7A',
    bg: '#ECEFF1',
    description: 'Reparação de eletrodomésticos',
  },
  {
    slug: 'cuidados',
    label: 'Cuidados e Babysitting',
    icon: '👶',
    iconImg: '/icons/cuidados.png',
    color: '#C62828',
    bg: '#FFEBEE',
    description: 'Cuidados a idosos, crianças e animais',
  },
  {
    slug: 'mecanica',
    label: 'Mecânica Automóvel',
    icon: '🚗',
    iconImg: '/icons/mecanica.png',
    color: '#E53935',
    bg: '#FFEBEE',
    description: 'Reparação e manutenção automóvel',
  },
  {
    slug: 'outros',
    label: 'Outros Serviços',
    icon: '🔍',
    iconImg: '/icons/outros.png',
    color: '#5F6368',
    bg: '#F1F3F4',
    description: 'Outros serviços domésticos e pessoais',
  },
]


// Bannières par page
export const BANNERS = {
  home: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/header%20destop.png',
  explorar: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/pedido%20desktop.png',
  mensagens: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/messsage%20desktop.png',
  default: 'https://dvtdjyxhiqucvzadluhv.supabase.co/storage/v1/object/public/Chama%20o%20Vizinho%20Bubble/header%20destop.png',
} as const

export type CategorySlug = string
export type RegionSlug = string

export const REGIONS = [
  { slug: 'viana-do-castelo', label: 'Viana do Castelo', cities: ['Viana do Castelo', 'Arcos de Valdevez', 'Caminha', 'Melgaço', 'Monção', 'Paredes de Coura', 'Ponte da Barca', 'Ponte de Lima', 'Valença', 'Vila Nova de Cerveira'] },
  { slug: 'braga', label: 'Braga', cities: ['Braga', 'Amares', 'Barcelos', 'Esposende', 'Fafe', 'Guimarães', 'Póvoa de Lanhoso', 'Terras de Bouro', 'Vieira do Minho', 'Vila Nova de Famalicão', 'Vila Verde', 'Vizela'] },
  { slug: 'porto', label: 'Porto', cities: ['Porto', 'Amarante', 'Baião', 'Felgueiras', 'Gondomar', 'Lousada', 'Maia', 'Marco de Canaveses', 'Matosinhos', 'Paços de Ferreira', 'Paredes', 'Penafiel', 'Valongo', 'Vila do Conde', 'Vila Nova de Gaia'] },
  { slug: 'vila-real', label: 'Vila Real', cities: ['Vila Real', 'Alijó', 'Boticas', 'Chaves', 'Mesão Frio', 'Mondim de Basto', 'Montalegre', 'Murça', 'Peso da Régua', 'Ribeira de Pena', 'Sabrosa', 'Santa Marta de Penaguião', 'Valpaços', 'Vidago'] },
  { slug: 'braganca', label: 'Bragança', cities: ['Bragança', 'Alfândega da Fé', 'Carrazeda de Ansiães', 'Freixo de Espada à Cinta', 'Macedo de Cavaleiros', 'Miranda do Douro', 'Mirandela', 'Mogadouro', 'Torre de Moncorvo', 'Vila Flor', 'Vimioso', 'Vinhais'] },
  { slug: 'aveiro', label: 'Aveiro', cities: ['Aveiro', 'Águeda', 'Albergaria-a-Velha', 'Anadia', 'Arouca', 'Castelo de Paiva', 'Espinho', 'Estarreja', 'Ílhavo', 'Mealhada', 'Murtosa', 'Oliveira de Azeméis', 'Oliveira do Bairro', 'Ovar', 'Santa Maria da Feira', 'São João da Madeira', 'Sever do Vouga', 'Vagos', 'Vale de Cambra'] },
  { slug: 'viseu', label: 'Viseu', cities: ['Viseu', 'Armamar', 'Carregal do Sal', 'Castro Daire', 'Cinfães', 'Lamego', 'Mangualde', 'Moimenta da Beira', 'Mortágua', 'Nelas', 'Oliveira de Frades', 'Penalva do Castelo', 'Penedono', 'Resende', 'Santa Comba Dão', 'São João da Pesqueira', 'São Pedro do Sul', 'Sátão', 'Sernancelhe', 'Tabuaço', 'Tarouca', 'Tondela', 'Vila Nova de Paiva', 'Vouzela'] },
  { slug: 'guarda', label: 'Guarda', cities: ['Guarda', 'Aguiar da Beira', 'Almeida', 'Celorico da Beira', 'Figueira de Castelo Rodrigo', 'Fornos de Algodres', 'Gouveia', 'Manteigas', 'Mêda', 'Pinhel', 'Sabugal', 'Seia', 'Trancoso', 'Vila Nova de Foz Côa'] },
  { slug: 'coimbra', label: 'Coimbra', cities: ['Coimbra', 'Arganil', 'Cantanhede', 'Condeixa-a-Nova', 'Figueira da Foz', 'Góis', 'Lousã', 'Mira', 'Miranda do Corvo', 'Montemor-o-Velho', 'Oliveira do Hospital', 'Pampilhosa da Serra', 'Penacova', 'Penela', 'Soure', 'Tábua', 'Vila Nova de Poiares'] },
  { slug: 'castelo-branco', label: 'Castelo Branco', cities: ['Castelo Branco', 'Belmonte', 'Covilhã', 'Fundão', 'Idanha-a-Nova', 'Oleiros', 'Penamacor', 'Proença-a-Nova', 'Sertã', 'Vila de Rei', 'Vila Velha de Ródão'] },
  { slug: 'leiria', label: 'Leiria', cities: ['Leiria', 'Alcobaça', 'Alvaiázere', 'Ansião', 'Batalha', 'Bombarral', 'Caldas da Rainha', 'Castanheira de Pêra', 'Figueiró dos Vinhos', 'Marinha Grande', 'Nazaré', 'Óbidos', 'Pedrógão Grande', 'Peniche', 'Pombal', 'Porto de Mós'] },
  { slug: 'santarem', label: 'Santarém', cities: ['Santarém', 'Abrantes', 'Alcanena', 'Almeirim', 'Alpiarça', 'Benavente', 'Cartaxo', 'Chamusca', 'Constância', 'Coruche', 'Entroncamento', 'Ferreira do Zêzere', 'Golegã', 'Mação', 'Rio Maior', 'Salvaterra de Magos', 'Torres Novas', 'Tomar', 'Vila Nova da Barquinha', 'Ourém'] },
  { slug: 'portalegre', label: 'Portalegre', cities: ['Portalegre', 'Alter do Chão', 'Arronches', 'Avis', 'Campo Maior', 'Castelo de Vide', 'Crato', 'Elvas', 'Fronteira', 'Gavião', 'Marvão', 'Monforte', 'Mora', 'Nisa', 'Ponte de Sor', 'Sousel'] },
  { slug: 'lisboa', label: 'Lisboa', cities: ['Lisboa', 'Amadora', 'Cascais', 'Loures', 'Mafra', 'Odivelas', 'Oeiras', 'Sintra', 'Sobral de Monte Agraço', 'Torres Vedras', 'Vila Franca de Xira', 'Alenquer', 'Arruda dos Vinhos', 'Azambuja', 'Caldas da Rainha', 'Lourinhã', 'Peniche'] },
  { slug: 'setubal', label: 'Setúbal', cities: ['Setúbal', 'Alcochete', 'Almada', 'Barreiro', 'Grândola', 'Moita', 'Montijo', 'Palmela', 'Santiago do Cacém', 'Seixal', 'Sesimbra', 'Sines'] },
  { slug: 'evora', label: 'Évora', cities: ['Évora', 'Alandroal', 'Arraiolos', 'Borba', 'Estremoz', 'Montemor-o-Novo', 'Mora', 'Mourão', 'Portel', 'Redondo', 'Reguengos de Monsaraz', 'Vendas Novas', 'Viana do Alentejo', 'Vila Viçosa'] },
  { slug: 'beja', label: 'Beja', cities: ['Beja', 'Aljustrel', 'Almodôvar', 'Alvito', 'Barrancos', 'Castro Verde', 'Cuba', 'Ferreira do Alentejo', 'Mértola', 'Moura', 'Odemira', 'Ourique', 'Serpa', 'Vidigueira'] },
  { slug: 'faro', label: 'Faro', cities: ['Faro', 'Albufeira', 'Alcoutim', 'Aljezur', 'Castro Marim', 'Lagos', 'Loulé', 'Monchique', 'Olhão', 'Portimão', 'São Brás de Alportel', 'Silves', 'Tavira', 'Vila do Bispo', 'Vila Real de Santo António'] },
]
