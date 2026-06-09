import HeroSection from './HeroSection'
import CategoriesSection from './CategoriesSection'
import StatsSection from './StatsSection'
import HowItWorks from './HowItWorks'
import DicasPreview from './DicasPreview'
import CommunityPreview from './CommunityPreview'
import AppDownload from './AppDownload'
import { createClient } from '@/lib/supabase/server'

export default async function HomeLoggedOut() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [providers, requests, dicas, questions] = await Promise.all([
    supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('service_requests').select('id', { count: 'exact', head: true }),
    supabase.from('daily_tips').select('id, title, short_description, image_url, category, publish_date').eq('is_published', true).lte('publish_date', today).order('publish_date', { ascending: false }).limit(3),
    supabase.from('community_questions').select('id, title, category, answers_count, created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(4),
  ])

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <StatsSection providers={providers.count ?? 0} requests={requests.count ?? 0} />
      <HowItWorks />
      <DicasPreview dicas={dicas.data ?? []} />
      <CommunityPreview questions={questions.data ?? []} />
      <AppDownload />
    </>
  )
}
