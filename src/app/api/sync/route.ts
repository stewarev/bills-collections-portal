import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

/**
 * POST /api/sync/invoices
 * 
 * Triggers a manual sync of invoices from NetSuite
 * Checks configuration and pulls outstanding invoices
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@gobolt.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // TODO: Phase 2 - Fetch NetSuite credentials from integrations table
    const netsuiteApiToken = process.env.NETSUITE_API_TOKEN
    const netsuiteAccountId = process.env.NETSUITE_ACCOUNT_ID

    if (!netsuiteApiToken || !netsuiteAccountId) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'NetSuite credentials not configured. Please configure in Settings > NetSuite',
          invoicesSynced: 0,
        },
        { status: 400 }
      )
    }

    console.log(`[SYNC] Starting invoice sync for account ${netsuiteAccountId}...`)

    // TODO: Week 2+ - Implement actual NetSuite API integration
    // 1. Create src/lib/netsuite/client.ts (REST API client)
    // 2. Create src/lib/netsuite/invoices.ts (fetch outstanding invoices)
    // 3. Query NetSuite for outstanding invoices
    // 4. Compare with existing invoices table
    // 5. Insert new invoices, update payment status
    // 6. Log sync results

    // For Phase 1: Return mock response
    const mockInvoices = []

    console.log(`[SYNC] Completed. Synced ${mockInvoices.length} invoices`)

    return NextResponse.json(
      {
        status: 'success',
        message: 'Invoice sync completed',
        invoicesSynced: mockInvoices.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[SYNC] Invoices sync error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/invoices
 * Check sync status and configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@gobolt.com')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const netsuiteConfigured = !!(
      process.env.NETSUITE_API_TOKEN && process.env.NETSUITE_ACCOUNT_ID
    )

    return NextResponse.json(
      {
        status: 'ok',
        netsuiteConfigured,
        lastSync: null, // TODO: Fetch from database
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}
