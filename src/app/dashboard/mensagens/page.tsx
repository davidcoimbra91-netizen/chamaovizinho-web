import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MensagensClient from '@/components/sections/MensagensClient'

export default async function MensagensPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth?redirect=/dashboard/mensagens')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, name, profile_photo')
    .eq('id', user.id)
    .single()

  return <MensagensClient currentUser={{ id: user.id, profile }} />
}
