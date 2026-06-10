import { createClient } from '@/lib/supabase/server'
import HeroBanner from '@/components/layout/HeroBanner'
import HomeLoggedOut from '@/components/sections/HomeLoggedOut'
import HomeClient from '@/components/sections/HomeClient'
import HomeProvider from '@/components/sections/HomeProvider'

export const revalidate = 0

async function getHomeData(userId: string, isProvider: boolean, providerProfileId: string | null) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const [notificationsRes, conversationsRes, dicaRes, questionsRes, appointmentsRes, statsRes, featuredRes] = await Promise.all([
    supabase.from('notifications').select('id, title, body, is_read, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('conversations').select('id, last_message, updated_at, client_id, provider_id').or(`client_id.eq.${userId},provider_id.eq.${userId}`).order('updated_at', { ascending: false }).limit(5),
    supabase.from('daily_tips').select('id, title, short_description, image_url, category').eq('is_published', true).lte('publish_date', today).order('publish_date', { ascending: false }).limit(1),
    supabase.from('community_questions').select('id, title, category, answers_count').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('appointments').select('id, date, start_time, end_time, status, notes').or(`client_id.eq.${userId},provider_id.eq.${userId}`).eq('status', 'confirmed').gte('date', today).order('date', { ascending: true }).limit(3),
    supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('provider_profiles').select('id, user_id, business_name, average_rating, reviews_count, company_city, region, service_categories, cover_photo, is_verified, provider_type, service_description').eq('is_active', true).eq('is_boosted', true).limit(4),
  ])

  // Conversations with users
  const convData = conversationsRes.data ?? []
  const allUserIds = Array.from(new Set([...convData.map((c: any) => c.client_id), ...convData.map((c: any) => c.provider_id)].filter(Boolean)))
  const { data: convUsers } = allUserIds.length > 0
    ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', allUserIds)
    : { data: [] }
  const conversations = convData.map((c: any) => {
    const otherId = c.client_id === userId ? c.provider_id : c.client_id
    return { ...c, other_user: convUsers?.find((u: any) => u.id === otherId) }
  })

  // Featured providers user profiles
  const featuredProviders = featuredRes.data ?? []
  const featuredUserIds = featuredProviders.map((p: any) => p.user_id)
  const { data: featuredUsers } = featuredUserIds.length > 0
    ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', featuredUserIds)
    : { data: [] }
  const featured = featuredProviders.map((p: any) => ({
    ...p,
    user: featuredUsers?.find((u: any) => u.id === p.user_id)
  }))

  // Portfolio pour les featured
  const featuredProfileIds = featuredProviders.map((p: any) => p.id)
  const { data: allPortfolio } = featuredProfileIds.length > 0
    ? await supabase.from('portfolio_items').select('id, provider_profile_id, photo_url, image').in('provider_profile_id', featuredProfileIds).limit(12)
    : { data: [] }

  const featuredWithPortfolio = featured.map((p: any) => ({
    ...p,
    portfolio: (allPortfolio ?? []).filter((item: any) => item.provider_profile_id === p.id)
  }))

  if (isProvider && providerProfileId) {
    const [pedidosRes, propostasRes] = await Promise.all([
      supabase.from('service_requests').select('id, title, category, city, status, budget, created_at, photos').eq('status', 'open').eq('is_archived', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('offers').select('id, status, service_request_id').eq('provider_id', providerProfileId),
    ])
    const pendentes = (propostasRes.data ?? []).filter((o: any) => o.status === 'pending').length
    const aceites = (propostasRes.data ?? []).filter((o: any) => o.status === 'accepted').length
    const recusados = (propostasRes.data ?? []).filter((o: any) => o.status === 'rejected').length
    return {
      pedidos: pedidosRes.data ?? [],
      propostas: { pendentes, aceites, recusados, total: propostasRes.data?.length ?? 0 },
      notifications: notificationsRes.data ?? [],
      conversations,
      dica: dicaRes.data?.[0] ?? null,
      questions: questionsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
      myRequests: [],
      stats: { providers: statsRes.count ?? 0 },
      featured: featuredWithPortfolio,
    }
  } else {
    const { data: myRequests } = await supabase
      .from('service_requests').select('id, title, category, city, status, budget, created_at')
      .eq('client_id', userId).eq('is_archived', false).order('created_at', { ascending: false }).limit(5)
    return {
      pedidos: [],
      propostas: { pendentes: 0, aceites: 0, recusados: 0, total: 0 },
      notifications: notificationsRes.data ?? [],
      conversations,
      dica: dicaRes.data?.[0] ?? null,
      questions: questionsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
      myRequests: myRequests ?? [],
      stats: { providers: statsRes.count ?? 0 },
      featured: featuredWithPortfolio,
    }
  }
}

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <HomeLoggedOut />

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  let providerProfile: any = null
  if (profile?.is_provider) {
    const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', user.id).single()
    providerProfile = data
  }

  const data = await getHomeData(user.id, !!profile?.is_provider, providerProfile?.id ?? null)

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <HeroBanner title={`Olá, ${profile?.name?.split(' ')[0] ?? 'vizinho'}!`} subtitle="O que precisa hoje?" />
      {profile?.is_provider
        ? <HomeProvider profile={profile} providerProfile={providerProfile} data={data} />
        : <HomeClient profile={profile} data={data} />
      }
    </div>
  )
}
