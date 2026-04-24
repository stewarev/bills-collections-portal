import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { NextRequest, NextResponse } from 'next/server'

interface FilteredInvoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  companyName: string
  assignedRepId: string
  assignedRepName: string
  segment: string
  amount: number
  dueDate: string
  invoiceDate: string
  paymentStatus: string
  daysOverdue: number
  daysOutstanding: number
  disputeStatus: string
  excludeFromDSO: boolean
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Get filter parameters
    const search = searchParams.get('search')?.toLowerCase() || ''
    const status = searchParams.get('status')
    const repId = searchParams.get('repId')
    const segment = searchParams.get('segment')
    const agingBucket = searchParams.get('agingBucket') // '0-30', '31-60', '60+'
    const sortBy = searchParams.get('sortBy') || 'dueDate' // dueDate, amount, daysOverdue, customer
    const sortOrder = searchParams.get('sortOrder') || 'asc' // asc, desc

    // Get all customers and invoices
    const customers = await fetchCustomers()
    const allInvoices = await fetchOutstandingInvoices()

    // Build customer lookup
    const customerMap = new Map(customers.map(c => [c.id, c]))

    // Filter invoices
    let filtered: FilteredInvoice[] = allInvoices
      .map(invoice => {
        const customer = customerMap.get(invoice.customerId)
        if (!customer) return null

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          customerName: customer.name,
          companyName: customer.companyName,
          assignedRepId: customer.assignedRepId,
          assignedRepName: customer.assignedRepName,
          segment: customer.segment,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          invoiceDate: invoice.invoiceDate,
          paymentStatus: invoice.paymentStatus,
          daysOverdue: invoice.days_overdue,
          daysOutstanding: Math.floor((new Date().getTime() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)),
          disputeStatus: invoice.disputeStatus ?? 'none',
          excludeFromDSO: invoice.excludeFromDSO ?? false,
        } as FilteredInvoice
      })
      .filter((inv): inv is FilteredInvoice => inv !== null)

    // Apply search filter
    if (search) {
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search) ||
        inv.customerName.toLowerCase().includes(search) ||
        inv.companyName.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter(inv => inv.paymentStatus === status)
    }

    // Apply rep filter
    if (repId) {
      filtered = filtered.filter(inv => inv.assignedRepId === repId)
    }

    // Apply segment filter
    if (segment) {
      filtered = filtered.filter(inv => inv.segment === segment)
    }

    // Apply aging bucket filter
    if (agingBucket) {
      filtered = filtered.filter(inv => {
        if (agingBucket === '0-30') return inv.daysOverdue >= 0 && inv.daysOverdue <= 30
        if (agingBucket === '31-60') return inv.daysOverdue > 30 && inv.daysOverdue <= 60
        if (agingBucket === '60+') return inv.daysOverdue > 60
        return true
      })
    }

    // Sort invoices
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof FilteredInvoice]
      let bVal: any = b[sortBy as keyof FilteredInvoice]

      // Handle date sorting
      if (sortBy === 'dueDate' || sortBy === 'invoiceDate') {
        aVal = new Date(aVal as string).getTime()
        bVal = new Date(bVal as string).getTime()
      }

      // Handle numeric sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      // Handle string sorting
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return 0
    })

    return NextResponse.json({
      invoices: filtered,
      count: filtered.length,
    })
  } catch (error) {
    console.error('Invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}
