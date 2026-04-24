import { NextRequest, NextResponse } from 'next/server'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { getAllPromiseRequests } from '@/lib/db/promise-to-pay'

interface WorkItem {
  id: string
  type: 'due-today' | 'due-this-week' | 'promised-due' | 'overdue-action'
  title: string
  subtitle: string
  amount: number
  daysUntil: number
  priority: 'critical' | 'high' | 'medium'
  customerId: string
  invoiceNumber: string
  invoiceId: string
}

/**
 * GET /api/your-work-today
 *
 * Returns a consolidated view of work for a rep:
 * - Invoices due today/this week
 * - Promised payments coming due within 5 days
 * - Overdue invoices (high priority)
 *
 * Query params:
 *   - repId: filter to a specific rep (required)
 *
 * Response:
 *   - items: work items sorted by priority and due date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repId = searchParams.get('repId')

    if (!repId) {
      return NextResponse.json(
        { error: 'repId is required' },
        { status: 400 }
      )
    }

    // Fetch all required data
    const [invoices, customers, promises] = await Promise.all([
      fetchOutstandingInvoices(),
      fetchCustomers(),
      getAllPromiseRequests(),
    ])

    // Build lookup maps
    const customerMap = new Map(customers.map((c) => [c.id, c]))

    // Filter to rep's customers
    const repInvoices = invoices.filter((inv) => inv.assigned_rep_id === repId)

    // Active approved promises (not expired)
    const today = new Date().toISOString().split('T')[0]
    const activePromises = promises.filter(
      (p) => p.status === 'approved' && p.expiryDate >= today && p.requestedByRepId === repId
    )

    const workItems: WorkItem[] = []

    // 1. Invoices due today/this week (not yet overdue, but coming due)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    for (const invoice of repInvoices) {
      if (!invoice.dueDate) continue
      if (invoice.paymentStatus === 'Paid') continue

      const customer = customerMap.get(invoice.customerId)
      if (!customer) continue

      const daysUntilDue = Math.ceil(
        (new Date(invoice.dueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Due today
      if (daysUntilDue === 0) {
        workItems.push({
          id: `due-today-${invoice.id}`,
          type: 'due-today',
          title: customer.name,
          subtitle: `Invoice ${invoice.invoiceNumber}`,
          amount: invoice.amount,
          daysUntil: 0,
          priority: 'critical' as const,
          customerId: customer.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
        })
      }
      // Due this week (1-7 days)
      else if (daysUntilDue > 0 && daysUntilDue <= 7) {
        workItems.push({
          id: `due-week-${invoice.id}`,
          type: 'due-this-week',
          title: customer.name,
          subtitle: `Invoice ${invoice.invoiceNumber}`,
          amount: invoice.amount,
          daysUntil: daysUntilDue,
          priority: 'high' as const,
          customerId: customer.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
        })
      }
    }

    // 2. Promised payments due within 5 days
    for (const promise of activePromises) {
      const invoice = repInvoices.find((inv) => inv.id === promise.invoiceId)
      if (!invoice) continue

      const customer = customerMap.get(invoice.customerId)
      if (!customer) continue

      const daysUntilPromise = Math.ceil(
        (new Date(promise.promisedDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilPromise >= -1 && daysUntilPromise <= 5) {
        workItems.push({
          id: `promised-${promise.invoiceId}`,
          type: 'promised-due',
          title: customer.name,
          subtitle: `Promised payment - ${promise.promisedDate}`,
          amount: promise.amount,
          daysUntil: Math.max(0, daysUntilPromise),
          priority: 'medium' as const,
          customerId: customer.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: promise.invoiceId,
        })
      }
    }

    // 3. Overdue invoices (very high priority)
    for (const invoice of repInvoices) {
      if (invoice.days_overdue && invoice.days_overdue > 0) {
        const customer = customerMap.get(invoice.customerId)
        if (!customer) continue

        workItems.push({
          id: `overdue-${invoice.id}`,
          type: 'overdue-action',
          title: customer.name,
          subtitle: `Invoice ${invoice.invoiceNumber} - ${invoice.days_overdue}d overdue`,
          amount: invoice.amount,
          daysUntil: 0,
          priority: invoice.days_overdue > 60 ? 'critical' : invoice.days_overdue > 30 ? 'high' : 'medium',
          customerId: customer.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
        })
      }
    }

    // Sort by priority, then by daysUntil
    const priorityScore = { critical: 0, high: 1, medium: 2 }
    const sorted = workItems.sort((a, b) => {
      const priorityDiff = priorityScore[a.priority] - priorityScore[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return (a.daysUntil || 0) - (b.daysUntil || 0)
    })

    return NextResponse.json({ items: sorted }, { status: 200 })
  } catch (error) {
    console.error('[YOUR-WORK-TODAY] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work items' },
      { status: 500 }
    )
  }
}
