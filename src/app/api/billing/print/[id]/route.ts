import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateHtml(doc: any, bp: any, client: any, lines: any[]) {
  const title = doc.type === 'fatura' ? 'FATURA' : 'ORÇAMENTO'
  const accent = '#E8622A'
  const date = new Date(doc.date).toLocaleDateString('pt-PT')
  const dueDate = doc.due_date ? new Date(doc.due_date).toLocaleDateString('pt-PT') : null

  const linesHtml = lines.map(l => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${l.description ?? ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${l.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${Number(l.unit_price).toFixed(2)} €</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${l.vat_rate === 0 ? 'Isento' : l.vat_rate + '%'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${Number(l.line_total).toFixed(2)} €</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title} ${doc.number ?? ''}</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 0; }
    .header { border-bottom: 2px solid ${accent}; padding-bottom: 20px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 28px; font-weight: 900; color: ${accent}; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #fafafa; color: #555; padding: 9px 12px; text-align: left; font-size: 12px; border-bottom: 1px solid #eee; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #888; }
    .disclaimer { margin-top: 20px; padding: 10px 14px; background: #fff8f0; border: 1px solid #ffd8b0; border-radius: 6px; font-size: 11px; color: #a0522d; }
  </style></head><body>
  <div class="header">
    <div>
      <div class="title">${title}</div>
      <div style="margin-top:4px;color:#555;">${bp?.business_name ?? ''}</div>
      <div style="color:#888;font-size:12px;">${doc.number ?? ''}</div>
    </div>
    <div style="text-align:right;color:#555;font-size:12px;">${date}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
    <div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">De</div>
      <strong>${bp?.business_name ?? ''}</strong><br/>
      ${bp?.nif ? `NIF: ${bp.nif}<br/>` : ''}
      ${bp?.address ? `${bp.address}<br/>` : ''}
      ${bp?.city ?? ''}
      ${bp?.iban ? `<br/>IBAN: ${bp.iban}` : ''}
    </div>
    <div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;">Para</div>
      ${client ? `<strong>${client.name}</strong><br/>
      ${client.nif ? `NIF: ${client.nif}<br/>` : ''}
      ${client.email ? `${client.email}<br/>` : ''}
      ${client.address ? `${client.address}${client.city ? ', ' + client.city : ''}` : ''}` : '—'}
    </div>
  </div>

  ${dueDate ? `<p style="margin-bottom:20px;color:#555;font-size:12px;">Data de vencimento: <strong>${dueDate}</strong></p>` : ''}

  <table>
    <thead><tr>
      <th>Descrição</th>
      <th style="text-align:center">Qtd.</th>
      <th style="text-align:right">Preço unit.</th>
      <th style="text-align:center">IVA</th>
      <th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="min-width:220px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#555;font-size:12px;"><span>Sub-total</span><span>${Number(doc.subtotal).toFixed(2)} €</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;color:#555;font-size:12px;border-bottom:1px solid #eee;"><span>IVA</span><span>${Number(doc.vat_amount).toFixed(2)} €</span></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;font-size:16px;color:${accent};"><span>Total</span><span>${Number(doc.total).toFixed(2)} €</span></div>
    </div>
  </div>

  ${doc.notes ? `<div style="margin-top:20px;padding:12px;background:#f9f9f9;border-radius:6px;font-size:12px;color:#555;">${doc.notes}</div>` : ''}
  ${bp?.default_footer ? `<div class="footer">${bp.default_footer}</div>` : ''}
  <div class="disclaimer">Gerado via Chama o Vizinho — Este documento não tem valor fiscal. Deve ser validado por um contabilista.</div>

  <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: doc } = await supabase
    .from('billing_documents')
    .select('*')
    .eq('id', params.id)
    .eq('provider_id', user.id)
    .single()

  if (!doc) return new NextResponse('Not found', { status: 404 })

  const [linesRes, clientRes, bpRes] = await Promise.all([
    supabase.from('billing_lines').select('*').eq('document_id', params.id).order('sort_order'),
    doc.client_id ? supabase.from('billing_clients').select('*').eq('id', doc.client_id).single() : Promise.resolve({ data: null }),
    supabase.from('billing_profiles').select('*').eq('user_id', user.id).single(),
  ])

  const html = generateHtml(doc, bpRes.data, clientRes.data, linesRes.data ?? [])
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
