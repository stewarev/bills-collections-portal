import { NextRequest, NextResponse } from 'next/server'
import { calculateOverallDSO, calculateRepDSO } from '@/lib/calculations/dso'

// Mock invoice data - replace with actual NetSuite queries
const MOCK_INVOICES = [
  {
    id: '1',
    customer_id: 'cust-001',
    invoiceNumber: 'INV-2024-001',
    amount_due: 15000,
    invoice_date: '2024-02-15',
    payment_status: 'Outstanding' as string,
    exclude_from_dso: false,
  },
  {
    id: '2',
    customer_id: 'cust-002',
    invoiceNumber: 'INV-2024-002',
    amount_due: 8500,
    invoice_date: '2024-03-10',
    payment_status: 'Outstanding' as string,
    exclude_from_dso: false,
  },
  {
    id: '3',
    customer_id: 'cust-001',
    invoiceNumber: 'INV-2024-003',
    amount_due: 5200,
    invoice_date: '2024-03-20',
    payment_status: 'Partially Paid' as string,
    exclude_from_dso: false,
  },
  {
    id: '4',
    customer_id: 'cust-003',
    invoiceNumber: 'INV-2024-004',
    amount_due: 12000,
    invoice_date: '2024-01-05',
    payment_status: 'Outstanding' as string,
    exclude_from_dso: false,
  },
  {
    id: '5',
    customer_id: 'cust-002',
    invoiceNumber: 'INV-2024-005',
    amount_due: 3000,
    invoice_date: '2024-04-01',
    payment_status: 'Outstanding' as string,
    exclude_from_dso: false,
  },
  {
    id: '6',
    customer_id: 'cust-001',
    invoiceNumber: 'INV-2024-006',
    amount_due: 7500,
    invoice_date: '2024-02-01',
    payment_status: 'Outstanding' as const,
    exclude_from_dso: true,
  },
  {
    id: '7',
    customer_id: 'cust-004',
    invoiceNumber: 'INV-2024-007',
    amount_due: 25000,
    invoice_date: '2023-12-15',
    payment_status: 'Outstanding' as const,
    exclude_from_dso: false,
  },
  {
    id: '8',
    customer_id: 'cust-003',
    invoiceNumber: 'INV-2024-008',
    amount_due: 6000,
    invoice_date: '2024-03-01',
    payment_status: 'Paid' as const,
    exclude_from_dso: false,
  },
]

const MOCK_CUSTOMERS = [
  { id: 'cust-001', name: 'Acme Corp', assigned_rep_id: 'rep-001', assignedRepName: 'Sajjad' },
  { id: 'cust-002', name: 'Beta Industries', assigned_rep_id: 'rep-002', assignedRepName: 'Yuliia' },
  { id: 'cust-003', name: 'Gamma LLC', assigned_rep_id: 'rep-003', assignedRepName: 'Baz' },
  { id: 'cust-004', name: 'Delta Enterprises', assigned_rep_id: 'rep-001', assignedRepName: 'Sajjad' },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const repId = searchParams.get('repId')
    let invoices = MOCK_INVOICES
    let customers = MOCK_CUSTOMERS

    if (repId) {
      const repCustomerIds = customers.filter(c => c.assigned_rep_id === repId).map(c => c.id)
      invoices = invoices.filter(inv => repCustomerIds.includes(inv.customer_id))
    }

    const overallDSO = calculateOverallDSO(invoices)
    let dsoByRep = !repId ? calculateRepDSO(invoices, customers) : []

    const outstandingInvoices = invoices.filter(inv => inv.payment_status !== 'Paid' && inv.payment_status !== 'Promise-to-Pay Approved')
    const includedOutstanding = outstandingInvoices.filter(inv => !inv.exclude_from_dso)
    const totalOutstanding = includedOutstanding.reduce((sum, inv) => sum + inv.amount_due, 0)
    const invoiceCount = includedOutstanding.length

    const averageDaysOutstanding = invoiceCount > 0
      ? Math.round(includedOutstanding.reduce((sum, inv) => {
          const daysOutstanding = Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24))
          return sum + daysOutstanding
        }, 0) / invoiceCount)
      : 0

    const aging = { bucket0_30: { count: 0, amount: 0 }, bucket31_60: { count: 0, amount: 0 }, bucket60plus: { count: 0, amount: 0 } }

    includedOutstanding.forEach(inv => {
      const daysOutstanding = Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysOutstanding <= 30) {
        aging.bucket0_30.count++
        aging.bucket0_30.amount += inv.amount_due
      } else if (daysOutstanding <= 60) {
        aging.bucket31_60.count++
        aging.bucket31_60.amount += inv.amount_due
      } else {
        aging.bucket60plus.count++
        aging.bucket60plus.amount += inv.amount_due
      }
    })

    const topOverdueInvoices = outstandingInvoices.filter(inv => !inv.exclude_from_dso)
      .map(inv => {
        const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24)) - 30)
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: MOCK_CUSTOMERS.find(c => c.id === inv.customer_id)?.name || 'Unknown',
          amount: inv.amount_due,
          days_overdue: daysOverdue,
        }
      })
      .filter(inv => inv.days_overdue > 0)
      .sort((a, b) => b.days_overdue - a.days_overdue)
      .slice(0, 10)

    let repWorkload = []
    if (!repId) {
      repWorkload = customers.filter(c => c.assigned_rep_id).map(customer => {
        const customerInvoices = invoices.filter(inv => inv.customer_id === customer.id)
        const customerOutstanding = customerInvoices.filter(inv => inv.payment_status !== 'Paid' && inv.payment_status !== 'Promise-to-Pay Approved')
        const customerIncluded = customerOutstanding.filter(inv => !inv.exclude_from_dso)

        return {
          repId: customer.assigned_rep_id || '',
          repName: customer.assignedRepName || 'Unknown',
          invoiceCount: customerIncluded.length,
          totalOutstanding: customerIncluded.reduce((sum, inv) => sum + inv.amount_due, 0),
          averageDaysOutstanding: customerIncluded.length > 0
            ? Math.round(customerIncluded.reduce((sum, inv) => {
                const daysOutstanding = Math.floor((new Date().getTime() - new Date(inv.invoice_date).getTime()) / (1000 * 60 * 60 * 24))
                return sum + daysOutstanding
              }, 0) / customerIncluded.length)
            : 0,
          overdueCount: customerOutstanding.filter(inv => !inv.exclude_from_dso && inv.payment_status !== 'Paid').length,
        }
      }).reduce((acc, item) => {
        const existing = acc.find(r => r.repId === item.repId)
        if (existing) {
          existing.invoiceCount += item.invoiceCount
          existing.totalOutstanding += item.totalOutstanding
          existing.overdueCount += item.overdueCount
        } else {
          acc.push(item)
        }
        return acc
      }, [] as any[])
    }

    return NextResponse.json({
      totalOutstanding,
      invoiceCount,
      averageDaysOutstanding,
      dso: overallDSO.dso,
      adjustedDso: overallDSO.adjustedDso,
      dsoByRep,
      aging,
      topOverdueInvoices,
      repWorkload,
    })
  } catch (error) {
    console.error('Metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
