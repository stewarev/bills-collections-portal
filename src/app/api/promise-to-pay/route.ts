import {
  fetchPromiseRequests,
  requestPromiseToPay,
  approvePromiseRequest,
  rejectPromiseRequest,
} from '@/lib/db/promise-to-pay'
import {
  sendPromiseRequestNotification,
  sendPromiseApprovedNotification,
  sendPromiseRejectedNotification,
} from '@/lib/email/send'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/promise-to-pay
 * Fetch all promise-to-pay requests, optionally filtered by status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null

    const requests = await fetchPromiseRequests(status || undefined)

    return NextResponse.json({
      requests,
      count: requests.length,
    })
  } catch (error) {
    console.error('Promise-to-pay fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promise-to-pay requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/promise-to-pay
 * Submit a new promise-to-pay request from an AR rep
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, promisedDate, expiryDate, repName, repId, notes } = body

    if (!invoiceId || !promisedDate || !expiryDate || !repName || !repId) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, promisedDate, expiryDate, repName, repId' },
        { status: 400 }
      )
    }

    // Validate dates
    const promised = new Date(promisedDate)
    const expiry = new Date(expiryDate)

    if (expiry < promised) {
      return NextResponse.json(
        { error: 'Expiry date must be on or after the promised payment date' },
        { status: 400 }
      )
    }

    const promiseRequest = await requestPromiseToPay(
      invoiceId,
      promisedDate,
      expiryDate,
      repName,
      repId,
      notes
    )

    // Send notification email to admin
    // TODO: Get actual admin email from database or environment
    const adminEmail = process.env.ADMIN_EMAIL || 'christine@gobolt.com'
    try {
      await sendPromiseRequestNotification(adminEmail, {
        repName,
        customerName: promiseRequest.customerName,
        invoiceNumber: promiseRequest.invoiceNumber,
        amount: promiseRequest.amount,
        promisedDate,
        expiryDate,
        notes,
      })
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails - promise was created successfully
    }

    return NextResponse.json(promiseRequest, { status: 201 })
  } catch (error) {
    console.error('Promise-to-pay creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create promise-to-pay request' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/promise-to-pay
 * Approve or reject a promise-to-pay request (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, action, approvedBy, rejectionReason, repEmail } = body

    if (!invoiceId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, action' },
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

      const updated = await approvePromiseRequest(invoiceId, approvedBy)

      if (!updated) {
        return NextResponse.json(
          { error: 'Promise-to-pay request not found' },
          { status: 404 }
        )
      }

      // Send approval email to rep
      if (repEmail) {
        try {
          await sendPromiseApprovedNotification(repEmail, {
            repName: updated.requestedBy,
            customerName: updated.customerName,
            invoiceNumber: updated.invoiceNumber,
            amount: updated.amount,
            expiryDate: updated.expiryDate,
          })
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError)
        }
      }

      return NextResponse.json(updated)
    } else if (action === 'reject') {
      if (!rejectionReason) {
        return NextResponse.json(
          { error: 'Missing required field: rejectionReason' },
          { status: 400 }
        )
      }

      const updated = await rejectPromiseRequest(invoiceId, rejectionReason)

      if (!updated) {
        return NextResponse.json(
          { error: 'Promise-to-pay request not found' },
          { status: 404 }
        )
      }

      // Send rejection email to rep
      if (repEmail) {
        try {
          await sendPromiseRejectedNotification(repEmail, {
            repName: updated.requestedBy,
            customerName: updated.customerName,
            invoiceNumber: updated.invoiceNumber,
            rejectionReason,
          })
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError)
        }
      }

      return NextResponse.json(updated)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Promise-to-pay update error:', error)
    return NextResponse.json(
      { error: 'Failed to update promise-to-pay request' },
      { status: 500 }
    )
  }
}
