import { computeARMetrics } from '@/lib/netsuite/invoices'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Week 3 - Get current user's rep ID from session
    // For now, hardcode to rep-001 (Sajjad) for testing
    const repId = 'rep-001'

    const metrics = await computeARMetrics(repId)
    const allInvoices = await fetchOutstandingInvoices()
    const repInvoices = allInvoices.filter((inv) => inv.assigned_rep_id === repId)

    const overdueCount = repInvoices.filter((inv) => inv.days_overdue > 0).length

    return NextResponse.json({
      repName: 'Sajjad', // TODO: Fetch from database
      totalOutstanding: metrics.totalOutstanding,
      invoiceCount: metrics.invoiceCount,
      averageDaysOutstanding: metrics.averageDaysOutstanding,
      overdueCount,
      topOverdueInvoices: metrics.topOverdueInvoices,
    })
  } catch (error) {
    console.error('Rep metrics error:', error)
    return NextResponse.json({ error: 'Failed to compute rep metrics' }, { status: 500 })
  }
}
