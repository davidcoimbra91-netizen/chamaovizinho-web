import { createClient } from '@/lib/supabase/server'
import MapaClient from '@/components/sections/MapaClient'

export const revalidate = 0

export default async function MapaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isProvider = false
  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('is_provider').eq('id', user.id).single()
    isProvider = profile?.is_provider ?? false
  }

  return <MapaClient isProvider={isProvider} />
}
