import type { Metadata } from 'next'
import HeroSection from '@/components/sections/HeroSection'
import CategoriesSection from '@/components/sections/CategoriesSection'
import HowItWorks from '@/components/sections/HowItWorks'
import StatsSection from '@/components/sections/StatsSection'
import DicasPreview from '@/components/sections/DicasPreview'
import CommunityPreview from '@/components/sections/CommunityPreview'
import AppDownload from '@/components/sections/AppDownload'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Chama o Vizinho — Serviços domésticos em Portugal',
  description: 'Encontra canalizadores, eletricistas, serviços de limpeza e muito mais perto de ti em Portugal. Rápido, fiável e com avaliações reais.',
}

export const revalidate = 3600

async function getStats() {
  const supabase = createClient()
  const [providers, requests] = await Promise.all([
    supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('service_requests').select('id', { count: 'exact', head: true }),
  ])
  return {
    providers: providers.count ?? 0,
    requests: requests.count ?? 0,
  }
}

async function getRecentDicas() {
  const supabase = createClient()
  const { data } = await supabase
    .from('daily_tips')
    .select('id, title, short_description, image_url, category, publish_date')
    .eq('is_published', true)
    .order('publish_date', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getRecentQuestions() {
  const supabase = createClient()
  const { data } = await supabase
    .from('community_questions')
    .select('id, title, category, answers_count, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(4)
  return data ?? []
}

export default async function HomePage() {
  const [stats, dicas, questions] = await Promise.all([
    getStats(),
    getRecentDicas(),
    getRecentQuestions(),
  ])

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <StatsSection providers={stats.providers} requests={stats.requests} />
      <HowItWorks />
      <DicasPreview dicas={dicas} />
      <CommunityPreview questions={questions} />
      <AppDownload />
    </>
  )
}
