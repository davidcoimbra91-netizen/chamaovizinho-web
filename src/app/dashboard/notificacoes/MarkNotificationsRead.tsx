'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MarkNotificationsRead({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .then(() => {})
  }, [userId])

  return null
}
