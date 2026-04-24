import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCollectionActions } from '@/lib/db/collection-actions'
import { fetchOutstandingInvoices } from '@/lib/netsuite/invoices'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { getAllPromiseRequests } from '@/lib/db/promise-to-pay'

export type CalendarEventType = 'ar_deadline' | 'aging_flag' | 'linear_task' | 'promise_due'

export interface CalendarEvent {
  id: string
  date: string           // ISO date string YYYY-MM-DD
  type: CalendarEventType
  title: string
  subtitle?: string
  repName?: string
  customerId?: string
  customerName?: string
  amount?: number
  urgency?: 'critical' | 'high' | 'medium' | 'low'
  meta?: Record<string, string | number | boolean>
}

/**
 * GET /api/calendar-events?year=2026&month=4
 * Returns all calendar events for the given month (+ adjacent weeks for grid alignment)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString()) // 1-12

    // Window: show 2 weeks before + 2 weeks after the month for context
    const windowStart = new Date(year, month - 1, 1)
    windowStart.setDate(windowStart.getDate() - 14)
    const windowEnd = new Date(year, month, 0) // last day of month
    windowEnd.setDate(windowEnd.getDate() + 14)

    const windowStartStr = windowStart.toISOString().split('T')[0]
    const windowEndStr = windowEnd.toISOString().split('T')[0]

    const events: CalendarEvent[] = []

    // ─── SOURCE 1: AR Deadlines (follow-up dates from collection actions) ───────
    const actions = await fetchAllCollectionActions()
    for (const action of actions) {
      if (!action.nextActionDate) continue
      if (action.nextActionDate < windowStartStr || action.nextActionDate > windowEndStr) continue

      const isOverdue = action.nextActionDate < new Date().toISOString().split('T')[0]

      events.push({
        id: `followup-${action.id}`,
        date: action.nextActionDate,
        type: 'ar_deadline',
        title: `Follow-up: ${action.staffMember}`,
        subtitle: `${action.actionType} → ${action.customerId}`,
        repName: action.staffMember,
        customerId: action.customerId,
        urgency: isOverdue ? 'critical' : 'medium',
        meta: {
          actionType: action.actionType,
          lastOutcome: action.outcome,
          summary: action.summary,
        },
      })
    }

    // ─── SOURCE 2: Promise-to-Pay Due Dates ──────────────────────────────────
    const promises = await getAllPromiseRequests()
    for (const p of promises) {
      if (p.status === 'rejected') continue
      if (p.promisedDate < windowStartStr || p.promisedDate > windowEndStr) continue

      const isOverdue = p.promisedDate < new Date().toISOString().split('T')[0]
      const isApproved = p.status === 'approved'

      events.push({
        id: `promise-${p.invoiceId}`,
        date: p.promisedDate,
        type: 'promise_due',
        title: `PTP: ${p.customerName}`,
        subtitle: `$${p.amount.toLocaleString()} · ${p.invoiceNumber}`,
        repName: p.requestedBy,
        customerId: p.customerId,
        customerName: p.customerName,
        amount: p.amount,
        urgency: isOverdue ? 'critical' : isApproved ? 'high' : 'medium',
        meta: {
          status: p.status,
          invoiceNumber: p.invoiceNumber,
          approvedBy: p.approvedBy || '',
          expiryDate: p.expiryDate,
        },
      })
    }

    // ─── SOURCE 3: Aging Bucket Crossing Flags ───────────────────────────────
    // For each invoice, compute when it crossed 30d and 60d overdue marks.
    // date_crossed = invoice.dueDate + threshold_days
    const invoices = await fetchOutstandingInvoices()
    const customers = await fetchCustomers()
    const customerMap = new Map(customers.map(c => [c.id, c]))

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.dueDate)
      const customer = customerMap.get(invoice.customerId)
      const customerName = customer?.companyName || invoice.customerName || invoice.customerId
      const repName = customer?.assignedRepName || invoice.assigned_rep_name || 'Unknown'

      // 30-day crossing
      const cross30 = new Date(dueDate)
      cross30.setDate(dueDate.getDate() + 30)
      const cross30Str = cross30.toISOString().split('T')[0]

      if (cross30Str >= windowStartStr && cross30Str <= windowEndStr) {
        const isPast = cross30Str < new Date().toISOString().split('T')[0]
        events.push({
          id: `aging-30-${invoice.id}`,
          date: cross30Str,
          type: 'aging_flag',
          title: `${customerName} → 30d overdue`,
          subtitle: `${invoice.invoiceNumber} · $${invoice.amount.toLocaleString()}`,
          repName,
          customerId: invoice.customerId,
          customerName,
          amount: invoice.amount,
          urgency: isPast ? 'high' : 'medium',
          meta: {
            bucket: '0→30',
            invoiceNumber: invoice.invoiceNumber,
            daysOverdue: invoice.days_overdue,
          },
        })
      }

      // 60-day crossing
      const cross60 = new Date(dueDate)
      cross60.setDate(dueDate.getDate() + 60)
      const cross60Str = cross60.toISOString().split('T')[0]

      if (cross60Str >= windowStartStr && cross60Str <= windowEndStr) {
        const isPast = cross60Str < new Date().toISOString().split('T')[0]
        events.push({
          id: `aging-60-${invoice.id}`,
          date: cross60Str,
          type: 'aging_flag',
          title: `${customerName} → 60d overdue`,
          subtitle: `${invoice.invoiceNumber} · $${invoice.amount.toLocaleString()}`,
          repName,
          customerId: invoice.customerId,
          customerName,
          amount: invoice.amount,
          urgency: isPast ? 'critical' : 'high',
          meta: {
            bucket: '30→60',
            invoiceNumber: invoice.invoiceNumber,
            daysOverdue: invoice.days_overdue,
          },
        })
      }

      // 90-day crossing
      const cross90 = new Date(dueDate)
      cross90.setDate(dueDate.getDate() + 90)
      const cross90Str = cross90.toISOString().split('T')[0]

      if (cross90Str >= windowStartStr && cross90Str <= windowEndStr) {
        const isPast = cross90Str < new Date().toISOString().split('T')[0]
        events.push({
          id: `aging-90-${invoice.id}`,
          date: cross90Str,
          type: 'aging_flag',
          title: `${customerName} → 90d overdue`,
          subtitle: `${invoice.invoiceNumber} · $${invoice.amount.toLocaleString()}`,
          repName,
          customerId: invoice.customerId,
          customerName,
          amount: invoice.amount,
          urgency: 'critical',
          meta: {
            bucket: '60→90',
            invoiceNumber: invoice.invoiceNumber,
            daysOverdue: invoice.days_overdue,
          },
        })
      }
    }

    // ─── SOURCE 4: Linear Tasks (mock — real integration pulls from Linear API) ─
    // These represent AR/Finance team tasks with due dates from Linear
    const mockLinearTasks = ([
      {
        id: 'linear-001',
        date: new Date(year, month - 1, 8).toISOString().split('T')[0],
        type: 'linear_task',
        title: 'Monthly AR Review',
        subtitle: 'Finance team · Linear AR-12',
        urgency: 'medium',
        meta: { linearId: 'AR-12', status: 'In Progress', project: 'AR Operations' },
      },
      {
        id: 'linear-002',
        date: new Date(year, month - 1, 15).toISOString().split('T')[0],
        type: 'linear_task',
        title: 'Reconcile NetSuite invoices',
        subtitle: 'Finance team · Linear AR-14',
        urgency: 'high',
        meta: { linearId: 'AR-14', status: 'Todo', project: 'AR Operations' },
      },
      {
        id: 'linear-003',
        date: new Date(year, month - 1, 22).toISOString().split('T')[0],
        type: 'linear_task',
        title: 'Q2 Collections Report',
        subtitle: 'Finance team · Linear FIN-08',
        urgency: 'medium',
        meta: { linearId: 'FIN-08', status: 'Backlog', project: 'Finance Reports' },
      },
      {
        id: 'linear-004',
        date: new Date(year, month - 1, 28).toISOString().split('T')[0],
        type: 'linear_task',
        title: 'Month-End AR Close',
        subtitle: 'Finance team · Linear AR-15',
        urgency: 'high',
        meta: { linearId: 'AR-15', status: 'Todo', project: 'AR Operations' },
      },
    ] as CalendarEvent[]).filter(e => e.date >= windowStartStr && e.date <= windowEndStr)

    events.push(...mockLinearTasks)

    // Sort by date
    events.sort((a, b) => a.date.localeCompare(b.date))

    // Group by date for easy frontend use
    const byDate: Record<string, CalendarEvent[]> = {}
    for (const evt of events) {
      if (!byDate[evt.date]) byDate[evt.date] = []
      byDate[evt.date].push(evt)
    }

    return NextResponse.json({
      events,
      byDate,
      meta: {
        year,
        month,
        windowStart: windowStartStr,
        windowEnd: windowEndStr,
        counts: {
          ar_deadline: events.filter(e => e.type === 'ar_deadline').length,
          aging_flag: events.filter(e => e.type === 'aging_flag').length,
          linear_task: events.filter(e => e.type === 'linear_task').length,
          promise_due: events.filter(e => e.type === 'promise_due').length,
          total: events.length,
        },
      },
    })
  } catch (error) {
    console.error('[CALENDAR-EVENTS] Error:', error)
    return NextResponse.json({ error: 'Failed to load calendar events' }, { status: 500 })
  }
}
