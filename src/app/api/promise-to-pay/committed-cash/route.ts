import { NextResponse } from 'next/server'
import { getCommittedCashByWeek } from '@/lib/db/promise-to-pay'

/**
 * GET /api/promise-to-pay/committed-cash
 * Returns approved active promises grouped by promised payment week
 * Used for the "Committed Cash Incoming" dashboard widget
 */
export async function GET() {
  try {
    const weeks = await getCommittedCashByWeek()
    const totalCommitted = weeks.reduce((sum, w) => sum + w.totalCommitted, 0)

    return NextResponse.json({ weeks, totalCommitted }, { status: 200 })
  } catch (error) {
    console.error('[COMMITTED-CASH] Error:', error)
    return NextResponse.json({ error: 'Failed to compute committed cash' }, { status: 500 })
  }
}
