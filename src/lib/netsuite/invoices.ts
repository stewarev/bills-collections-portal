import { createNetSuiteClient } from './client'

export type DisputeStatus = 'none' | 'disputed' | 'in_review' | 'resolved'

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  dueDate: string
  invoiceDate: string
  paymentStatus: string
  days_overdue: number
  assigned_rep_id?: string
  assigned_rep_name?: string
  disputeStatus?: DisputeStatus
  excludeFromDSO?: boolean
}

export interface RepWorkload {
  repId: string
  repName: string
  invoiceCount: number
  totalOutstanding: number
  averageDaysOutstanding: number
  overdueCount: number
}

export interface ARMetrics {
  totalOutstanding: number
  invoiceCount: number
  averageDaysOutstanding: number
  aging: {
    bucket0_30: { count: number; amount: number }
    bucket31_60: { count: number; amount: number }
    bucket60plus: { count: number; amount: number }
  }
  topOverdueInvoices: Invoice[]
  repWorkload?: RepWorkload[]
}

/**
 * Fetch all outstanding invoices
 */
export async function fetchOutstandingInvoices(): Promise<Invoice[]> {
  const client = createNetSuiteClient()
  return client.fetchOutstandingInvoices()
}

/**
 * Compute AR metrics from invoices
 */
export async function computeARMetrics(filterRepId?: string): Promise<ARMetrics> {
  let invoices = await fetchOutstandingInvoices()

  // Filter by rep if specified
  if (filterRepId) {
    invoices = invoices.filter((inv) => inv.assigned_rep_id === filterRepId)
  }

  // Compute aging buckets
  const aging = {
    bucket0_30: { count: 0, amount: 0 },
    bucket31_60: { count: 0, amount: 0 },
    bucket60plus: { count: 0, amount: 0 },
  }

  let totalOutstanding = 0
  let totalDaysOutstanding = 0

  invoices.forEach((inv) => {
    totalOutstanding += inv.amount
    totalDaysOutstanding += inv.days_overdue

    if (inv.days_overdue <= 30) {
      aging.bucket0_30.count++
      aging.bucket0_30.amount += inv.amount
    } else if (inv.days_overdue <= 60) {
      aging.bucket31_60.count++
      aging.bucket31_60.amount += inv.amount
    } else {
      aging.bucket60plus.count++
      aging.bucket60plus.amount += inv.amount
    }
  })

  // Top 10 overdue invoices
  const topOverdueInvoices = invoices.sort((a, b) => b.days_overdue - a.days_overdue).slice(0, 10)

  // Rep workload (only for admin view, not filtered)
  const repWorkload = !filterRepId ? computeRepWorkload(await fetchOutstandingInvoices()) : undefined

  return {
    totalOutstanding,
    invoiceCount: invoices.length,
    averageDaysOutstanding: invoices.length > 0 ? Math.round(totalDaysOutstanding / invoices.length) : 0,
    aging,
    topOverdueInvoices,
    repWorkload,
  }
}

/**
 * Compute workload metrics per rep
 */
function computeRepWorkload(invoices: Invoice[]): RepWorkload[] {
  const repMap = new Map<string, { count: number; total: number; daysTotal: number; overdue: number }>()

  invoices.forEach((inv) => {
    const repId = inv.assigned_rep_id || 'unassigned'
    const repName = inv.assigned_rep_name || 'Unassigned'

    if (!repMap.has(repId)) {
      repMap.set(repId, { count: 0, total: 0, daysTotal: 0, overdue: 0 })
    }

    const stats = repMap.get(repId)!
    stats.count++
    stats.total += inv.amount
    stats.daysTotal += inv.days_overdue
    if (inv.days_overdue > 0) stats.overdue++
  })

  return Array.from(repMap.entries()).map(([repId, stats]) => ({
    repId,
    repName: invoices.find((inv) => inv.assigned_rep_id === repId)?.assigned_rep_name || 'Unassigned',
    invoiceCount: stats.count,
    totalOutstanding: stats.total,
    averageDaysOutstanding: Math.round(stats.daysTotal / stats.count),
    overdueCount: stats.overdue,
  }))
}

/**
 * Fetch invoices by customer
 */
export async function fetchCustomerInvoices(customerId: string): Promise<Invoice[]> {
  const invoices = await fetchOutstandingInvoices()
  return invoices.filter((inv) => inv.customerId === customerId)
}

/**
 * Fetch overdue invoices (past due date)
 */
export async function fetchOverdueInvoices(): Promise<Invoice[]> {
  const invoices = await fetchOutstandingInvoices()
  return invoices.filter((inv) => inv.days_overdue > 0)
}
