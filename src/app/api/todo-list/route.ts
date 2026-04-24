import { NextRequest, NextResponse } from 'next/server'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { fetchAllCollectionActions } from '@/lib/db/collection-actions'
import { getAllPromiseRequests } from '@/lib/db/promise-to-pay'
import { computeNextAction, sortTodoItems, CollectionTodoItem } from '@/lib/cadence/next-action'

/**
 * GET /api/todo-list
 *
 * Returns a prioritized action queue for AR reps.
 * For each outstanding overdue invoice, computes the recommended next
 * collection action based on segment cadence, days overdue, and last contact.
 *
 * Query params:
 *   - repId: filter to a specific rep (required for rep view, optional for admin)
 *
 * Response:
 *   - items: CollectionTodoItem[] sorted by urgency + amount
 *   - counts: { critical, high, medium, low, total }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repId = searchParams.get('repId') || undefined

    // Fetch all required data in parallel
    const [invoices, customers, collectionActions, promises] = await Promise.all([
      fetchOutstandingInvoices(),
      fetchCustomers(),
      fetchAllCollectionActions(),
      getAllPromiseRequests(),
    ])

    // Build lookup maps for O(1) access
    const customerMap = new Map(customers.map((c) => [c.id, c]))

    // Latest action per customer (sorted by date desc, take first)
    const latestActionByCustomer = new Map<string, (typeof collectionActions)[0]>()
    const sortedActions = [...collectionActions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    for (const action of sortedActions) {
      if (!latestActionByCustomer.has(action.customerId)) {
        latestActionByCustomer.set(action.customerId, action)
      }
    }

    // Active promise per invoice (approved, not expired)
    const today = new Date().toISOString().split('T')[0]
    const activePromiseByInvoice = new Map<string, (typeof promises)[0]>()
    for (const promise of promises) {
      if (promise.status === 'approved' && promise.expiryDate >= today) {
        activePromiseByInvoice.set(promise.invoiceId, promise)
      }
    }

    // Filter invoices by rep if specified
    const filteredInvoices = repId
      ? invoices.filter((inv) => inv.assigned_rep_id === repId)
      : invoices

    // Compute next action for each overdue invoice
    const todoItems: CollectionTodoItem[] = []

    for (const invoice of filteredInvoices) {
      if (invoice.days_overdue <= 0) continue // Skip invoices not yet overdue

      const customer = customerMap.get(invoice.customerId)
      if (!customer) continue

      const lastAction = latestActionByCustomer.get(invoice.customerId) || null
      const activePromise = activePromiseByInvoice.get(invoice.id) || null

      const item = computeNextAction(invoice, customer, lastAction, activePromise)
      if (item) {
        todoItems.push(item)
      }
    }

    // Sort by urgency + amount
    const sorted = sortTodoItems(todoItems)

    // Compute counts
    const counts = {
      critical: sorted.filter((i) => i.urgency === 'critical').length,
      high: sorted.filter((i) => i.urgency === 'high').length,
      medium: sorted.filter((i) => i.urgency === 'medium').length,
      low: sorted.filter((i) => i.urgency === 'low').length,
      total: sorted.length,
    }

    return NextResponse.json({ items: sorted, counts }, { status: 200 })
  } catch (error) {
    console.error('[TODO-LIST] Error computing action queue:', error)
    return NextResponse.json(
      { error: 'Failed to compute action queue' },
      { status: 500 }
    )
  }
}
