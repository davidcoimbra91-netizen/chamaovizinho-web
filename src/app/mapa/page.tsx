import { createClient } from '@/lib/supabase/server'
import MapaClient from '@/components/sections/MapaClient'

export default async function MapaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let providerProfile = null
  if (user) {
    const { data: p } = await supabase.from('user_profiles').select('id, name, is_provider, is_pro, latitude, longitude, city').eq('id', user.id).single()
    profile = p
    if (p?.is_provider) {
      const { data: pp } = await supabase.from('provider_profiles').select('id, latitude, longitude, region').eq('user_id', user.id).single()
      providerProfile = pp
    }
  }

  return <MapaClient currentUser={user ? { id: user.id, profile, providerProfile } : null} />
}
