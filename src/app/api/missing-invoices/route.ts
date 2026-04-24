import { NextRequest, NextResponse } from 'next/server'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'

export interface MissingInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  invoiceDate: string
  lastAttemptedSync?: string
  syncError?: string
}

export interface MissingInvoicesResponse {
  missingInvoices: MissingInvoice[]
  count: number
  lastSyncCheck: string
}

export async function GET(request: NextRequest) {
  try {
    // Fetch invoices from NetSuite
    const netsuiteSyncedInvoices = await fetchOutstandingInvoices()

    // TODO: Fetch invoices from workbook (Google Sheets)
    // const workbookInvoices = await fetchWorkbookInvoices()

    // For now, return empty list since workbook integration is pending
    // Once integrated, this will compare workbook vs netsuite and find mismatches
    const missingInvoices: MissingInvoice[] = []

    return NextResponse.json({
      missingInvoices,
      count: missingInvoices.length,
      lastSyncCheck: new Date().toISOString(),
    } as MissingInvoicesResponse)
  } catch (error) {
    console.error('Missing invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to check for missing invoices' },
      { status: 500 }
    )
  }
}
