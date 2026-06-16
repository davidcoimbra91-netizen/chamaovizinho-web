import { createClient } from '@/lib/supabase/server'
import HomeLoggedOut from '@/components/sections/HomeLoggedOut'
import HomeClient from '@/components/sections/HomeClient'
import HomeProvider from '@/components/sections/HomeProvider'

export const revalidate = 0

async function getHomeData(userId: string, isProvider: boolean, providerProfileId: string | null, userLat?: number | null, userLng?: number | null, providerRegion?: string | null, providerCity?: string | null) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [notificationsRes, conversationsRes, dicaRes, questionsRes, appointmentsRes, rewardRes] = await Promise.all([
    supabase.from('notifications').select('id, title, body, is_read, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('conversations').select('id, last_message, updated_at, client_id, provider_id').or(`client_id.eq.${userId},provider_id.eq.${userId}`).order('updated_at', { ascending: false }).limit(5),
    supabase.from('daily_tips').select('id, title, short_description, image_url, category').eq('is_published', true).lte('publish_date', today).order('publish_date', { ascending: false }).limit(1),
    supabase.from('community_questions').select('id, title, category, answers_count, created_at').eq('is_published', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('appointments').select('id, date, start_time, end_time, status, notes, address').or(`client_id.eq.${userId},provider_id.eq.${userId}`).eq('status', 'confirmed').gte('date', today).order('date', { ascending: true }).limit(3),
    supabase.from('reward_profiles').select('approved_points_balance, pending_points_balance').eq('user_id', userId).single(),
  ])

  // Conversations avec users
  const convData = conversationsRes.data ?? []
  const allUserIds = Array.from(new Set([...convData.map((c: any) => c.client_id), ...convData.map((c: any) => c.provider_id)].filter(Boolean)))
  const { data: convUsers } = allUserIds.length > 0
    ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', allUserIds)
    : { data: [] }
  const conversations = convData.map((c: any) => {
    const otherId = c.client_id === userId ? c.provider_id : c.client_id
    return { ...c, other_user: convUsers?.find((u: any) => u.id === otherId) }
  })

  if (isProvider && providerProfileId) {
    const [pedidosRes, propostasRes, reviewsRes, statsRes, weekConvsRes, providerTipsRes, inProgressOffersRes] = await Promise.all([
      (() => {
        let q = supabase.from('service_requests').select('id, title, category, city, status, budget, created_at, photos, client_id').eq('status', 'open').eq('is_archived', false)
        if (providerRegion) q = q.ilike('city', `%${providerRegion}%`)
        else if (providerCity) q = q.ilike('city', `%${providerCity}%`)
        return q.order('created_at', { ascending: false }).limit(8)
      })(),
      supabase.from('offers').select('id, status, service_request_id, created_at').eq('provider_id', userId),
      supabase.from('reviews').select('id, rating, comment, created_at, author_id').eq('reviewed_user_id', userId).eq('is_public', true).order('created_at', { ascending: false }).limit(3),
      supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('conversations').select('id').or(`client_id.eq.${userId},provider_id.eq.${userId}`).gte('created_at', weekAgo),
      supabase.from('provider_tips').select('id, title, content').eq('is_published', true).order('publish_date', { ascending: true }).limit(50),
      supabase.from('offers').select('id, service_request_id').eq('provider_id', userId).eq('status', 'accepted'),
    ])

    // Fetch client profiles for pedidos
    const pedidosRaw = pedidosRes.data ?? []
    const pedidoClientIds = Array.from(new Set(pedidosRaw.map((p: any) => p.client_id).filter(Boolean))) as string[]
    const { data: pedidoClients } = pedidoClientIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo, city, average_rating, reviews_count, last_seen').in('id', pedidoClientIds)
      : { data: [] }
    const pedidoClientMap: Record<string, any> = {}
    ;(pedidoClients ?? []).forEach((c: any) => { pedidoClientMap[c.id] = c })
    const pedidosWithClients = pedidosRaw.map((p: any) => ({ ...p, client: pedidoClientMap[p.client_id] ?? null }))

    const allOffers = propostasRes.data ?? []
    const pendentes = allOffers.filter((o: any) => o.status === 'pending').length
    const aceites = allOffers.filter((o: any) => o.status === 'accepted').length
    const recusados = allOffers.filter((o: any) => o.status === 'rejected').length
    const monthOffers = allOffers.filter((o: any) => new Date(o.created_at) >= new Date(monthStart))

    // Reviews avec auteurs
    const reviewData = reviewsRes.data ?? []
    const authorIds = reviewData.map((r: any) => r.author_id)
    const { data: reviewAuthors } = authorIds.length > 0
      ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', authorIds)
      : { data: [] }
    const recentReviews = reviewData.map((r: any) => ({ ...r, author: reviewAuthors?.find((a: any) => a.id === r.author_id) }))

    const completedCount = allOffers.filter((o: any) => o.status === 'accepted').length

    // Pedidos em curso (offre acceptée, SR in_progress)
    const acceptedSrIds = (inProgressOffersRes.data ?? []).map((o: any) => o.service_request_id).filter(Boolean)
    let inProgressJobs: any[] = []
    if (acceptedSrIds.length > 0) {
      const { data: inProgressSR } = await supabase
        .from('service_requests')
        .select('id, title, category, city, client_id, status')
        .in('id', acceptedSrIds)
        .eq('status', 'in_progress')
      if (inProgressSR && inProgressSR.length > 0) {
        const clientIds = inProgressSR.map((r: any) => r.client_id).filter(Boolean)
        const { data: clientProfiles } = clientIds.length > 0
          ? await supabase.from('user_profiles').select('id, name, profile_photo, average_rating, reviews_count').in('id', clientIds)
          : { data: [] }
        const clientMap: Record<string, any> = {}
        ;(clientProfiles ?? []).forEach((c: any) => { clientMap[c.id] = c })
        const offerMap: Record<string, string> = {}
        ;(inProgressOffersRes.data ?? []).forEach((o: any) => { offerMap[o.service_request_id] = o.id })
        inProgressJobs = inProgressSR.map((r: any) => ({
          ...r,
          client: clientMap[r.client_id] ?? null,
          offer_id: offerMap[r.id] ?? null,
        }))
      }
    }

    return {
      pedidos: pedidosWithClients,
      inProgressJobs,
      propostas: { pendentes, aceites, recusados, total: monthOffers.length },
      notifications: notificationsRes.data ?? [],
      conversations,
      dica: dicaRes.data?.[0] ?? null,
      questions: questionsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
      rewardProfile: rewardRes.data,
      recentReviews,
      completedCount,
      activeClients: aceites,
      providerTips: providerTipsRes.data ?? [],
      weeklyStats: {
        newPedidos: pedidosRes.data?.length ?? 0,
        newMessages: weekConvsRes.data?.length ?? 0,
        acceptedOffers: aceites,
      },
      stats: { providers: statsRes.count ?? 0 },
      myRequests: [],
    }
  } else {
    const [myRequestsRes, recentAreaRes, offersReceivedRes, reviewsRes, statsRes] = await Promise.all([
      supabase.from('service_requests').select('id, title, category, city, status, budget, created_at').eq('client_id', userId).eq('is_archived', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('service_requests').select('id, title, category, city, created_at').eq('status', 'open').eq('is_archived', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('offers').select('id').in('service_request_id',
        (await supabase.from('service_requests').select('id').eq('client_id', userId).eq('is_archived', false)).data?.map((r: any) => r.id) ?? []
      ),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('provider_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    const completedRequests = (myRequestsRes.data ?? []).filter((r: any) => r.status === 'completed')

    // Providers proches (si lat/lng disponibles)
    let nearbyProviders: any[] = []
    if (userLat && userLng) {
      const { data: providers } = await supabase
        .from('provider_profiles')
        .select('id, user_id, business_name, average_rating, reviews_count, service_categories, is_boosted, company_city, region, latitude, longitude')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .limit(20)

      if (providers) {
        const withDist = providers.map((p: any) => {
          if (!p.latitude || !p.longitude) return null
          const R = 6371
          const dLat = (p.latitude - userLat) * Math.PI / 180
          const dLng = (p.longitude - userLng) * Math.PI / 180
          const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) * Math.cos(p.latitude * Math.PI/180) * Math.sin(dLng/2)**2
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          return { ...p, distanceKm: dist.toFixed(1) }
        }).filter(Boolean).sort((a: any, b: any) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm)).slice(0, 3)

        const uids = withDist.map((p: any) => p.user_id)
        const { data: pUsers } = uids.length > 0 ? await supabase.from('user_profiles').select('id, name, profile_photo').in('id', uids) : { data: [] }
        nearbyProviders = withDist.map((p: any) => ({ ...p, user: pUsers?.find((u: any) => u.id === p.user_id) }))
      }
    }

    return {
      pedidos: [],
      propostas: { pendentes: 0, aceites: 0, recusados: 0, total: 0 },
      notifications: notificationsRes.data ?? [],
      conversations,
      dica: dicaRes.data?.[0] ?? null,
      questions: questionsRes.data ?? [],
      appointments: appointmentsRes.data ?? [],
      rewardProfile: rewardRes.data,
      myRequests: myRequestsRes.data ?? [],
      recentAreaRequests: recentAreaRes.data ?? [],
      offersReceived: offersReceivedRes.data?.length ?? 0,
      reviewsCount: (reviewsRes as any).count ?? 0,
      completedCount: completedRequests.length,
      appointmentsCount: (appointmentsRes.data ?? []).length,
      nearbyProviders,
      stats: { providers: statsRes.count ?? 0 },
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

  const data = await getHomeData(user.id, !!profile?.is_provider, providerProfile?.id ?? null, profile?.latitude, profile?.longitude, providerProfile?.region ?? null, providerProfile?.company_city ?? null)
  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      {profile?.is_provider
        ? <HomeProvider profile={profile} providerProfile={providerProfile} data={data} />
        : <HomeClient profile={profile} data={data} />
      }
    </div>
  )
}
