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

export type CommunityAnswer = {
  id: string
  question_id: string
  user_id: string
  content: string
  created_at: string
  votes_count?: number
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

// Catégories normalisées
export const CATEGORIES = [
  { slug: 'canalização', label: 'Canalização', icon: '🔧', description: 'Fugas, reparações e instalações de canalização' },
  { slug: 'eletricidade', label: 'Eletricidade', icon: '⚡', description: 'Instalações elétricas, avarias e certificações' },
  { slug: 'limpeza', label: 'Limpeza Doméstica', icon: '🧹', description: 'Limpeza de casas, escritórios e espaços comerciais' },
  { slug: 'jardinagem', label: 'Jardinagem', icon: '🌿', description: 'Poda, corte de erva e manutenção de jardins' },
  { slug: 'pintura', label: 'Pintura', icon: '🎨', description: 'Pintura interior e exterior de habitações' },
  { slug: 'montagem', label: 'Montagem de Móveis', icon: '🪑', description: 'Montagem e desmontagem de móveis' },
  { slug: 'mudanças', label: 'Mudanças e Transporte', icon: '🚚', description: 'Transporte e mudanças residenciais e comerciais' },
  { slug: 'bricolage', label: 'Bricolage', icon: '🔨', description: 'Pequenas reparações e trabalhos manuais' },
  { slug: 'informatica', label: 'Informática e Tecnologia', icon: '💻', description: 'Reparação de computadores e suporte técnico' },
  { slug: 'pequenas_obras', label: 'Pequenas Obras', icon: '🏗️', description: 'Remodelações e obras de menor dimensão' },
  { slug: 'electrodomesticos', label: 'Eletrodomésticos', icon: '🔌', description: 'Reparação de eletrodomésticos' },
  { slug: 'cuidados', label: 'Cuidados e Babysitting', icon: '👶', description: 'Cuidados a idosos, crianças e animais' },
  { slug: 'mecanica', label: 'Mecânica Automóvel', icon: '🚗', description: 'Reparação e manutenção automóvel' },
  { slug: 'outros', label: 'Outros Serviços', icon: '✨', description: 'Outros serviços domésticos e pessoais' },
] as const

export const REGIONS = [
  { slug: 'lisboa', label: 'Lisboa', cities: ['Lisboa', 'Sintra', 'Cascais', 'Almada', 'Setúbal', 'Amadora', 'Loures'] },
  { slug: 'porto', label: 'Porto', cities: ['Porto', 'Gaia', 'Braga', 'Matosinhos', 'Gondomar', 'Maia'] },
  { slug: 'coimbra', label: 'Coimbra', cities: ['Coimbra', 'Leiria', 'Viseu', 'Aveiro', 'Figueira da Foz'] },
  { slug: 'algarve', label: 'Algarve', cities: ['Faro', 'Portimão', 'Lagos', 'Albufeira', 'Tavira'] },
  { slug: 'alentejo', label: 'Alentejo', cities: ['Évora', 'Beja', 'Portalegre', 'Santarém'] },
  { slug: 'norte', label: 'Norte', cities: ['Viana do Castelo', 'Chaves', 'Bragança', 'Vila Real'] },
] as const

export type CategorySlug = typeof CATEGORIES[number]['slug']
export type RegionSlug = typeof REGIONS[number]['slug']
