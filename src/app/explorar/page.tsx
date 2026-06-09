import type { Metadata } from 'next'
import ExplorarClient from '@/components/sections/ExplorarClient'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Explorar Pedidos — Chama o Vizinho',
  description: 'Encontra pedidos de serviços perto de ti e envia propostas.',
}

export const revalidate = 0

export default async function ExplorarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let providerProfile = null

  if (user) {
    const { data: p } = await supabase
      .from('user_profiles')
      .select('id, name, is_provider, is_client, profile_photo')
      .eq('id', user.id)
      .single()
    profile = p

    if (p?.is_provider) {
      const { data: pp } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      providerProfile = pp
    }
  }

  return (
    <ExplorarClient
      currentUser={user ? { id: user.id, profile, providerProfile } : null}
    />
  )
}
