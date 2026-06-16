import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Fetch the source devis
  const { data: doc } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('id', params.id)
    .eq('provider_id', user.id)
    .single()

  if (!doc) return new NextResponse('Not found', { status: 404 })
  if (doc.type !== 'devis') return new NextResponse('Not a devis', { status: 400 })
  if (doc.status !== 'accepte') return new NextResponse('Devis must be accepte', { status: 400 })

  // Fetch billing profile for prefix
  const { data: bp } = await supabase
    .from('billing_profiles')
    .select('prefix_factura')
    .eq('user_id', user.id)
    .single()

  const prefix = bp?.prefix_factura ?? 'FAT'
  const year = new Date().getFullYear()

  // Count existing faturas to get next number
  const { count } = await supabase
    .from('billing_documents')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', user.id)
    .eq('type', 'fatura')

  const nextNum = (count ?? 0) + 1
  const number = `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`

  // Create new fatura
  const { data: newDoc, error: insertError } = await supabase
    .from('billing_documents')
    .insert({
      provider_id: user.id,
      type: 'fatura',
      status: 'brouillon',
      number,
      date: new Date().toISOString().split('T')[0],
      due_date: doc.due_date,
      client_id: doc.client_id,
      subtotal: doc.subtotal,
      vat_amount: doc.vat_amount,
      total: doc.total,
      notes: doc.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (insertError || !newDoc) {
    return new NextResponse(insertError?.message ?? 'Insert failed', { status: 500 })
  }

  // Copy lines
  const { data: lines } = await supabase
    .from('billing_lines')
    .select('*')
    .eq('document_id', params.id)
    .order('sort_order')

  if (lines && lines.length > 0) {
    await supabase.from('billing_lines').insert(
      lines.map(({ id: _id, document_id: _did, ...rest }) => ({
        ...rest,
        document_id: newDoc.id,
      }))
    )
  }

  return NextResponse.redirect(new URL(`/dashboard/faturacao/${newDoc.id}`, req.url))
}
