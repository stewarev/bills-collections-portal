import {
  approvePromiseRequest,
  rejectPromiseRequest,
  getInvoicePromiseStatus,
} from '@/lib/db/promise-to-pay'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/promise-to-pay/[invoiceId]
 * Get promise-to-pay status for a specific invoice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const promiseRequest = await getInvoicePromiseStatus(invoiceId)

    if (!promiseRequest) {
      return NextResponse.json(
        { error: 'No promise-to-pay request found for this invoice' },
        { status: 404 }
      )
    }

    return NextResponse.json(promiseRequest)
  } catch (error) {
    console.error('Promise-to-pay fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promise-to-pay status' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/promise-to-pay/[invoiceId]/approve
 * Admin approves a promise-to-pay request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params
    const body = await request.json()
    const { action, approvedBy, rejectionReason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      if (!approvedBy) {
        return NextResponse.json(
          { error: 'Missing required field: approvedBy' },
          { status: 400 }
        )
      }

      const result = await approvePromiseRequest(invoiceId, approvedBy)

      if (!result) {
        return NextResponse.json(
          { error: 'Promise-to-pay request not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(result)
    }

    if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Missing required field: rejectionReason' },
          { status: 400 }
        )
      }

      const result = await rejectPromiseRequest(invoiceId, rejectionReason)

      if (!result) {
        return NextResponse.json(
          { error: 'Promise-to-pay request not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Promise-to-pay action error:', error)
    return NextResponse.json(
      { error: 'Failed to process promise-to-pay request' },
      { status: 500 }
    )
  }
}
