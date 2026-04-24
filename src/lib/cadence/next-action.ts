/**
 * Dunning Automation — Next Action Engine
 *
 * Computes the recommended next collection action for each outstanding invoice
 * based on:
 *   - Customer segment (Bronze / Silver / Regular / Hyper-care / Finance Action)
 *   - Days overdue
 *   - Last collection action taken (type + date)
 *   - Active promise-to-pay status
 *   - Dispute status
 */

export type RecommendedAction = 'Email' | 'Call' | 'Escalate' | 'Finance Action'
export type Urgency = 'critical' | 'high' | 'medium' | 'low'

export interface SegmentCadence {
  name: string
  firstTouch: number    // days overdue threshold → Email
  secondTouch: number   // days overdue threshold → Call
  thirdTouch: number    // days overdue threshold → Escalate
  escalationEnabled: boolean
  financeAction?: boolean
}

export interface CollectionTodoItem {
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  daysOverdue: number
  segment: string
  assignedRepId: string
  assignedRepName: string
  recommendedAction: RecommendedAction
  reason: string
  urgency: Urgency
  lastActionDate?: string
  lastActionType?: string
  daysSinceLastContact: number
  hasActivePromise: boolean
  isDisputed: boolean
}

// ─────────────────────────────────────────────────────────
// Segment cadence configuration (mirrors Settings > Segments)
// In Phase 2: fetch these from Supabase settings table
// ─────────────────────────────────────────────────────────
export const SEGMENT_CADENCES: Record<string, SegmentCadence> = {
  Bronze: {
    name: 'Bronze',
    firstTouch: 15,
    secondTouch: 30,
    thirdTouch: 60,
    escalationEnabled: false,
  },
  Silver: {
    name: 'Silver',
    firstTouch: 10,
    secondTouch: 20,
    thirdTouch: 45,
    escalationEnabled: true,
  },
  Regular: {
    name: 'Regular',
    firstTouch: 7,
    secondTouch: 14,
    thirdTouch: 30,
    escalationEnabled: true,
  },
  'Hyper-care': {
    name: 'Hyper-care',
    firstTouch: 3,
    secondTouch: 7,
    thirdTouch: 14,
    escalationEnabled: true,
  },
  'Finance Action': {
    name: 'Finance Action',
    firstTouch: 1,
    secondTouch: 2,
    thirdTouch: 5,
    escalationEnabled: true,
    financeAction: true,
  },
}

// Cooldown windows — don't recommend the same action again within N days
const COOLDOWN_DAYS: Record<RecommendedAction, number> = {
  Email: 5,
  Call: 3,
  Escalate: 14,
  'Finance Action': 7,
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr)
  const today = new Date()
  const diffMs = today.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getUrgency(daysOverdue: number, cadence: SegmentCadence): Urgency {
  if (daysOverdue >= cadence.thirdTouch * 1.5) return 'critical'
  if (daysOverdue >= cadence.thirdTouch) return 'high'
  if (daysOverdue >= cadence.secondTouch) return 'medium'
  return 'low'
}

interface InvoiceInput {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  days_overdue: number
  paymentStatus: string
  assigned_rep_id?: string
  assigned_rep_name?: string
}

interface CustomerInput {
  id: string
  segment: string
}

interface CollectionActionInput {
  customerId: string
  actionType: string
  date: string
  outcome: string
}

interface PromiseInput {
  invoiceId: string
  status: 'pending' | 'approved' | 'rejected'
  expiryDate: string
}

/**
 * Core engine: computes the recommended next action for a single invoice
 *
 * Returns null if:
 *   - Invoice is not overdue
 *   - There's an active approved promise
 *   - Invoice is in dispute
 *   - Action was done recently (within cooldown)
 */
export function computeNextAction(
  invoice: InvoiceInput,
  customer: CustomerInput,
  lastAction: CollectionActionInput | null,
  activePromise: PromiseInput | null
): CollectionTodoItem | null {
  // Skip if not overdue yet
  if (invoice.days_overdue <= 0) return null

  // Skip if disputed
  const isDisputed = invoice.paymentStatus === 'Disputed'

  // Check for active promise-to-pay
  const today = new Date().toISOString().split('T')[0]
  const hasActivePromise =
    activePromise !== null &&
    activePromise.status === 'approved' &&
    activePromise.expiryDate >= today

  // If has active promise, skip — don't chase
  if (hasActivePromise) return null

  const cadence = SEGMENT_CADENCES[customer.segment] || SEGMENT_CADENCES.Regular
  const daysOverdue = invoice.days_overdue

  // Days since last contact
  const daysSinceLastContact = lastAction ? daysSince(lastAction.date) : 9999

  // Determine recommended action based on days overdue + cadence
  let recommendedAction: RecommendedAction
  let reason: string

  if (daysOverdue >= cadence.thirdTouch && cadence.escalationEnabled) {
    recommendedAction = cadence.financeAction ? 'Finance Action' : 'Escalate'
    reason = `${daysOverdue} days overdue — past third touch threshold (${cadence.thirdTouch}d). Escalation required.`
  } else if (daysOverdue >= cadence.secondTouch) {
    recommendedAction = 'Call'
    reason = `${daysOverdue} days overdue — past second touch threshold (${cadence.secondTouch}d). Follow-up call needed.`
  } else {
    recommendedAction = 'Email'
    reason = `${daysOverdue} days overdue — past first touch threshold (${cadence.firstTouch}d). Send reminder email.`
  }

  // Apply cooldown: if last action was the same type and within cooldown window, skip
  if (lastAction) {
    const cooldown = COOLDOWN_DAYS[recommendedAction]
    const lastActionWasSameType =
      lastAction.actionType === recommendedAction ||
      (recommendedAction === 'Email' && lastAction.actionType === 'Email') ||
      (recommendedAction === 'Call' && lastAction.actionType === 'Call')

    if (lastActionWasSameType && daysSinceLastContact < cooldown) {
      // Still in cooldown — no action needed yet
      return null
    }
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    amount: invoice.amount,
    daysOverdue,
    segment: customer.segment,
    assignedRepId: invoice.assigned_rep_id || '',
    assignedRepName: invoice.assigned_rep_name || 'Unassigned',
    recommendedAction,
    reason,
    urgency: getUrgency(daysOverdue, cadence),
    lastActionDate: lastAction?.date,
    lastActionType: lastAction?.actionType,
    daysSinceLastContact,
    hasActivePromise: !!activePromise && activePromise.status === 'approved',
    isDisputed,
  }
}

/**
 * Sort action items: critical first, then by amount descending
 */
export function sortTodoItems(items: CollectionTodoItem[]): CollectionTodoItem[] {
  const urgencyOrder: Record<Urgency, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }
  return items.sort((a, b) => {
    const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgencyDiff !== 0) return urgencyDiff
    return b.amount - a.amount // Largest amount first within same urgency
  })
}
