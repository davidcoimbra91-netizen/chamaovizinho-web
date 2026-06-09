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
    iconImg: '/icons/canalização.png',
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
    color: '#1E8E3E',
    bg: '#E6F4EA',
    description: 'Limpeza de casas, escritórios e espaços comerciais',
  },
  {
    slug: 'jardinagem',
    label: 'Jardinagem',
    icon: '🌿',
    iconImg: '/icons/jardinagem.png',
    color: '#34A853',
    bg: '#E6F4EA',
    description: 'Poda, corte de erva e manutenção de jardins',
  },
  {
    slug: 'pintura',
    label: 'Pintura',
    icon: '🎨',
    iconImg: '/icons/pintura.png',
    color: '#E8501A',
    bg: '#FBF0E8',
    description: 'Pintura interior e exterior de habitações',
  },
  {
    slug: 'montagem',
    label: 'Montagem de Móveis',
    icon: '🪑',
    iconImg: '/icons/montagem.png',
    color: '#9334E6',
    bg: '#F3E8FD',
    description: 'Montagem e desmontagem de móveis',
  },
  {
    slug: 'mudanças',
    label: 'Mudanças e Transporte',
    icon: '🚚',
    iconImg: '/icons/mudanças.png',
    color: '#1A73E8',
    bg: '#E8F0FE',
    description: 'Transporte e mudanças residenciais e comerciais',
  },
  {
    slug: 'bricolage',
    label: 'Bricolage',
    icon: '🔨',
    iconImg: '/icons/bricolage.png',
    color: '#C85A1A',
    bg: '#FBF0E8',
    description: 'Pequenas reparações e trabalhos manuais',
  },
  {
    slug: 'informatica',
    label: 'Informática e Tecnologia',
    icon: '💻',
    iconImg: '/icons/informatica.png',
    color: '#1A73E8',
    bg: '#E8F0FE',
    description: 'Reparação de computadores e suporte técnico',
  },
  {
    slug: 'pequenas_obras',
    label: 'Pequenas Obras',
    icon: '🏗️',
    iconImg: '/icons/pequenas_obras.png',
    color: '#B45309',
    bg: '#FEF3C7',
    description: 'Remodelações e obras de menor dimensão',
  },
  {
    slug: 'electrodomesticos',
    label: 'Eletrodomésticos',
    icon: '🔌',
    iconImg: '/icons/electrodomesticos.png',
    color: '#0F9D58',
    bg: '#E6F4EA',
    description: 'Reparação de eletrodomésticos',
  },
  {
    slug: 'cuidados',
    label: 'Cuidados e Babysitting',
    icon: '👶',
    iconImg: '/icons/cuidados.png',
    color: '#E91E8C',
    bg: '#FCE4EC',
    description: 'Cuidados a idosos, crianças e animais',
  },
  {
    slug: 'mecanica',
    label: 'Mecânica Automóvel',
    icon: '🚗',
    iconImg: '/icons/mecanica.png',
    color: '#5F6368',
    bg: '#F1F3F4',
    description: 'Reparação e manutenção automóvel',
  },
  {
    slug: 'outros',
    label: 'Outros Serviços',
    icon: '✨',
    iconImg: null,
    color: '#C85A1A',
    bg: '#FBF0E8',
    description: 'Outros serviços domésticos e pessoais',
  },
]

export const REGIONS = [
  { slug: 'lisboa', label: 'Lisboa', cities: ['Lisboa', 'Sintra', 'Cascais', 'Almada', 'Setúbal', 'Amadora', 'Loures'] },
  { slug: 'porto', label: 'Porto', cities: ['Porto', 'Gaia', 'Braga', 'Matosinhos', 'Gondomar', 'Maia'] },
  { slug: 'coimbra', label: 'Coimbra', cities: ['Coimbra', 'Leiria', 'Viseu', 'Aveiro', 'Figueira da Foz'] },
  { slug: 'algarve', label: 'Algarve', cities: ['Faro', 'Portimão', 'Lagos', 'Albufeira', 'Tavira'] },
  { slug: 'alentejo', label: 'Alentejo', cities: ['Évora', 'Beja', 'Portalegre', 'Santarém'] },
  { slug: 'norte', label: 'Norte', cities: ['Viana do Castelo', 'Chaves', 'Bragança', 'Vila Real'] },
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
