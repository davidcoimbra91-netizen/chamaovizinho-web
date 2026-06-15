import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['brouillon', 'enviado', 'aceite', 'recusado', 'pago']

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const formData = await req.formData()
  const status = formData.get('status') as string

  if (!status || !VALID_STATUSES.includes(status)) {
    return new NextResponse('Invalid status', { status: 400 })
  }

  const { error } = await supabase
    .from('billing_documents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('provider_id', user.id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.redirect(new URL(`/dashboard/faturacao/${params.id}`, req.url))
}
