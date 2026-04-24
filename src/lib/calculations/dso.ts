// DSO (Days Sales Outstanding) Calculation
// DSO = (Accounts Receivable / Daily Revenue) × Number of Days
// Where:
// - AR = Sum of unpaid invoices (excluding excludeFromDSO flagged invoices)
// - Daily Revenue = Total invoiced amount in period / number of days in period
// - Number of Days = Days in the lookback period (typically 365 for annual)

export interface DSOMetrics {
  dso: number
  adjustedDso: number
  accountsReceivable: number
  totalRevenue: number
  outstandingInvoiceCount: number
  excludedInvoiceCount: number
}

export interface RepDSOMetrics {
  repId: string
  repName: string
  dso: number
  adjustedDso: number
  accountsReceivable: number
  totalRevenue: number
  outstandingInvoiceCount: number
}

interface Invoice {
  id: string
  customer_id: string
  amount_due: number
  invoice_date: string
  payment_status: string
  exclude_from_dso?: boolean
}

interface Customer {
  id: string
  assigned_rep_id: string | null
  assignedRepName?: string
}

/**
 * Calculate overall DSO metrics for all invoices
 */
export function calculateOverallDSO(
  invoices: Invoice[],
  lookbackDays: number = 365
): DSOMetrics {
  // Filter for outstanding invoices
  const outstandingInvoices = invoices.filter(
    inv => inv.payment_status !== 'Paid' && inv.payment_status !== 'Promise-to-Pay Approved'
  )

  // Separate excluded vs included
  const includedInvoices = outstandingInvoices.filter(inv => !inv.exclude_from_dso)
  const excludedInvoices = outstandingInvoices.filter(inv => inv.exclude_from_dso)

  // Calculate AR (accounts receivable - outstanding, non-excluded)
  const accountsReceivable = includedInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)

  // Calculate total revenue from all invoices in lookback period
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

  const revenueInvoices = invoices.filter(
    inv => new Date(inv.invoice_date) >= cutoffDate
  )
  const totalRevenue = revenueInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)

  // Calculate DSO
  const dailyRevenue = totalRevenue / lookbackDays
  const dso = dailyRevenue === 0 ? 0 : Math.round((accountsReceivable / dailyRevenue) * 100) / 100

  // Adjusted DSO is the same as DSO since we're already excluding flagged invoices
  const adjustedDso = dso

  return {
    dso,
    adjustedDso,
    accountsReceivable,
    totalRevenue,
    outstandingInvoiceCount: includedInvoices.length,
    excludedInvoiceCount: excludedInvoices.length,
  }
}

/**
 * Calculate DSO metrics broken down by rep
 */
export function calculateRepDSO(
  invoices: Invoice[],
  customers: Customer[],
  lookbackDays: number = 365
): RepDSOMetrics[] {
  // Group invoices by rep
  const invoicesByRep = new Map<string, Invoice[]>()
  const repNames = new Map<string, string>()

  invoices.forEach(inv => {
    const customer = customers.find(c => c.id === inv.customer_id)
    if (customer && customer.assigned_rep_id) {
      const repId = customer.assigned_rep_id
      if (!invoicesByRep.has(repId)) {
        invoicesByRep.set(repId, [])
      }
      invoicesByRep.get(repId)!.push(inv)

      // Store rep name if available
      if (customer.assignedRepName && !repNames.has(repId)) {
        repNames.set(repId, customer.assignedRepName)
      }
    }
  })

  // Calculate DSO for each rep
  const repMetrics: RepDSOMetrics[] = []

  invoicesByRep.forEach((repInvoices, repId) => {
    // Filter for outstanding, non-excluded
    const outstandingInvoices = repInvoices.filter(
      inv => inv.payment_status !== 'Paid' && inv.payment_status !== 'Promise-to-Pay Approved'
    )
    const includedInvoices = outstandingInvoices.filter(inv => !inv.exclude_from_dso)

    // Calculate AR
    const accountsReceivable = includedInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)

    // Calculate revenue for this rep's invoices in lookback period
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays)

    const revenueInvoices = repInvoices.filter(
      inv => new Date(inv.invoice_date) >= cutoffDate
    )
    const totalRevenue = revenueInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)

    // Calculate DSO
    const dailyRevenue = totalRevenue / lookbackDays
    const dso = dailyRevenue === 0 ? 0 : Math.round((accountsReceivable / dailyRevenue) * 100) / 100

    repMetrics.push({
      repId,
      repName: repNames.get(repId) || 'Unknown',
      dso,
      adjustedDso: dso,
      accountsReceivable,
      totalRevenue,
      outstandingInvoiceCount: includedInvoices.length,
    })
  })

  // Sort by DSO descending (highest DSO first - worst performers)
  return repMetrics.sort((a, b) => b.dso - a.dso)
}

/**
 * Get DSO status color for UI display
 */
export function getDSOStatusColor(dso: number): string {
  // Typical DSO benchmarks vary by industry, but as a general guideline:
  // < 30 days: Excellent (green)
  // 30-45 days: Good (blue)
  // 45-60 days: Fair (yellow)
  // 60-90 days: Poor (orange)
  // > 90 days: Critical (red)

  if (dso < 30) return 'text-green-600 bg-green-50'
  if (dso < 45) return 'text-blue-600 bg-blue-50'
  if (dso < 60) return 'text-yellow-600 bg-yellow-50'
  if (dso < 90) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

/**
 * Get DSO status label for UI display
 */
export function getDSOStatusLabel(dso: number): string {
  if (dso < 30) return 'Excellent'
  if (dso < 45) return 'Good'
  if (dso < 60) return 'Fair'
  if (dso < 90) return 'Poor'
  return 'Critical'
}
