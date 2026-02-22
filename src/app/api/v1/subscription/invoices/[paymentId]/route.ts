import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { payments } from '@/db/schema-mobile'
import { and, eq } from 'drizzle-orm'
import { verifySession } from '@/lib/auth-helpers'
import { withApiTelemetry } from '@/lib/api-telemetry'

function asciiSafe(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '?')
}

function pdfEscape(value: string) {
  return asciiSafe(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSimplePdf(lines: string[]): Buffer {
  const fontSizeTitle = 16
  const fontSizeBody = 10
  const left = 72
  let y = 740
  const leading = 14

  const content: string[] = []
  content.push('BT')
  content.push(`/F1 ${fontSizeTitle} Tf`)
  content.push(`${left} ${y} Td`)
  content.push(`(${pdfEscape(lines[0] || 'Invoice')}) Tj`)

  content.push(`/F1 ${fontSizeBody} Tf`)
  for (let i = 1; i < lines.length; i += 1) {
    y -= leading
    content.push(`0 -${leading} Td`)
    content.push(`(${pdfEscape(lines[i] || '')}) Tj`)
  }
  content.push('ET')

  const stream = content.join('\n') + '\n'

  const objects: string[] = []
  objects.push('%PDF-1.4')
  objects.push('%\u00e2\u00e3\u00cf\u00d3')

  const xref: number[] = []
  const chunks: Buffer[] = []
  const pushObj = (objNum: number, body: string) => {
    xref[objNum] = Buffer.concat(chunks).length
    chunks.push(Buffer.from(`${objNum} 0 obj\n${body}\nendobj\n`, 'utf8'))
  }

  chunks.push(Buffer.from(objects.join('\n') + '\n', 'utf8'))

  pushObj(1, '<< /Type /Catalog /Pages 2 0 R >>')
  pushObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  pushObj(
    3,
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'
  )
  pushObj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
  pushObj(5, `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream`)

  const xrefStart = Buffer.concat(chunks).length
  const maxObj = 5
  const xrefLines: string[] = []
  xrefLines.push('xref')
  xrefLines.push(`0 ${maxObj + 1}`)
  xrefLines.push('0000000000 65535 f ')
  for (let i = 1; i <= maxObj; i += 1) {
    const offset = xref[i] || 0
    xrefLines.push(`${String(offset).padStart(10, '0')} 00000 n `)
  }
  const trailer = [
    'trailer',
    `<< /Size ${maxObj + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefStart),
    '%%EOF',
    '',
  ].join('\n')

  chunks.push(Buffer.from(xrefLines.join('\n') + '\n' + trailer, 'utf8'))

  return Buffer.concat(chunks)
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeMajorAmount(value: unknown): number | null {
  const n = toFiniteNumber(value)
  if (n === null) return null

  // payments.amount is currently written from Razorpay webhooks in paise.
  // chargedAmount is stored as a major-unit decimal. Use a conservative threshold
  // to avoid misinterpreting small major-unit values.
  if (n >= 10_000) return n / 100
  return n
}

function formatMoney(amount: unknown, currency: unknown) {
  const curr = typeof currency === 'string' && currency.length > 0 ? currency : 'INR'
  const n = normalizeMajorAmount(amount)
  if (n === null || !Number.isFinite(n)) return `${curr} —`
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: curr === 'INR' ? 2 : 2,
      minimumFractionDigits: curr === 'INR' ? 2 : 2,
    }).format(n as number)
  } catch {
    return `${curr} ${(n as number).toFixed(2)}`
  }
}

export const GET = withApiTelemetry(
  async (req: NextRequest, { params }: { params: { paymentId: string } }) => {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, params.paymentId), eq(payments.userId, userId)))
      .limit(1)

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const now = new Date()
    const created = payment.createdAt ? new Date(payment.createdAt as any) : now
    const chargedAmount = payment.chargedAmount ?? payment.amount

    const chargedCurrency = payment.chargedCurrency || payment.currency || 'INR'

    const meta: any = (payment as any).metadata || {}
    const planType = typeof meta?.planType === 'string' ? meta.planType : null
    const tier = typeof meta?.tier === 'string' ? meta.tier : null

    const lines: string[] = []
    lines.push('GuideMeCoach Invoice')
    lines.push(`Invoice: ${payment.id}`)
    lines.push(`Date: ${created.toLocaleString()}`)
    lines.push(`Billed to: ${user?.name || '—'} <${user?.email || '—'}>`)
    lines.push('')
    lines.push(`Amount: ${formatMoney(chargedAmount, chargedCurrency)}`)
    if (planType) lines.push(`Plan: ${planType}`)
    if (tier) lines.push(`Tier: ${tier}`)
    if (payment.provider) lines.push(`Provider: ${payment.provider}`)
    if (payment.razorpayPaymentId) lines.push(`Razorpay Payment: ${payment.razorpayPaymentId}`)
    if (payment.razorpayOrderId) lines.push(`Razorpay Order: ${payment.razorpayOrderId}`)
    if (payment.status) lines.push(`Status: ${payment.status}`)
    if (payment.description) lines.push(`Description: ${payment.description}`)

    const pdf = buildSimplePdf(lines)
    const pdfBody = new Uint8Array(pdf).buffer
    const filename = `guidemecoach-invoice-${payment.id}.pdf`

    return new NextResponse(pdfBody, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=0, no-cache',
      },
    })
  },
  { name: 'v1.subscription.invoice.pdf' }
)
