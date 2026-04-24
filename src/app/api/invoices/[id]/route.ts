import { NextRequest, NextResponse } from 'next/server'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import type { DisputeStatus } from '@/lib/netsuite/invoices'

// In-memory dispute overrides for Phase 1 (Phase 2: write to Supabase)
const disputeOverrides = new Map<string, DisputeStatus>()
const dsoExcludeOverrides = new Map<string, boolean>()

/**
 * PATCH /api/invoices/[id]
 * Update invoice flags: dispute status and/or excludeFromDSO
 * Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { disputeStatus, excludeFromDSO } = body as {
      disputeStatus?: DisputeStatus
      excludeFromDSO?: boolean
    }

    // Verify invoice exists
    const invoices = await fetchOutstandingInvoices()
    const invoice = invoices.find((inv) => inv.id === id)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Apply overrides
    if (disputeStatus !== undefined) {
      disputeOverrides.set(id, disputeStatus)
    }
    if (excludeFromDSO !== undefined) {
      dsoExcludeOverrides.set(id, excludeFromDSO)
    }

    console.log(`[INVOICE] Updated ${id}: disputeStatus=${disputeStatus}, excludeFromDSO=${excludeFromDSO}`)

    return NextResponse.json(
      {
        id,
        disputeStatus: disputeOverrides.get(id) ?? invoice.disputeStatus ?? 'none',
        excludeFromDSO: dsoExcludeOverrides.get(id) ?? invoice.excludeFromDSO ?? false,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[INVOICE PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

/**
 * Export overrides so the GET /api/invoices route can apply them
 * Phase 2: replace with Supabase reads
 */
export { disputeOverrides, dsoExcludeOverrides }
