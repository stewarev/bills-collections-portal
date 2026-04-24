/**
 * Promise-to-Pay Workflow
 *
 * Handles promise-to-pay requests from AR reps and approvals from admin
 * Mock data layer for Phase 1
 */

import { Invoice } from '@/lib/types'

export interface PromiseToPayRequest {
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  promisedDate: string
  expiryDate: string // Promise is void after this date
  requestedBy: string // Rep name
  requestedByRepId: string
  requestedAt: string
  approvedBy?: string // Admin name
  approvedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  rejectionReason?: string
}

// Mock data: promise-to-pay requests
export const MOCK_PROMISE_REQUESTS: PromiseToPayRequest[] = [
  {
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    customerId: 'cust-001',
    customerName: 'Acme Corp',
    amount: 25000,
    promisedDate: '2026-04-25',
    expiryDate: '2026-05-02',
    requestedBy: 'Sajjad',
    requestedByRepId: 'rep-001',
    requestedAt: '2026-04-14T10:30:00Z',
    status: 'pending',
    notes: 'Customer said they will pay on Friday',
  },
  {
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    customerId: 'cust-001',
    customerName: 'Acme Corp',
    amount: 8500,
    promisedDate: '2026-04-20',
    expiryDate: '2026-04-27',
    requestedBy: 'Sajjad',
    requestedByRepId: 'rep-001',
    requestedAt: '2026-04-13T14:15:00Z',
    approvedBy: 'Christine',
    approvedAt: '2026-04-13T15:45:00Z',
    status: 'approved',
    notes: 'Customer called with promise to pay',
  },
  {
    invoiceId: 'inv-005',
    invoiceNumber: 'INV-2024-005',
    customerId: 'cust-004',
    customerName: 'Enterprise Ltd',
    amount: 18000,
    promisedDate: '2026-05-05',
    expiryDate: '2026-05-15',
    requestedBy: 'Rakshita',
    requestedByRepId: 'rep-004',
    requestedAt: '2026-04-12T09:20:00Z',
    status: 'pending',
    notes: 'Customer waiting on grant reimbursement',
  },
]

/**
 * Fetch all promise-to-pay requests (admin view)
 */
export async function fetchPromiseRequests(status?: 'pending' | 'approved' | 'rejected') {
  let requests = [...MOCK_PROMISE_REQUESTS]

  if (status) {
    requests = requests.filter((r) => r.status === status)
  }

  // Sort by requested date (newest first)
  return requests.sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  )
}

/**
 * Fetch pending promise-to-pay requests for a specific rep
 */
export async function fetchRepPromiseRequests(repId: string) {
  return MOCK_PROMISE_REQUESTS.filter((r) => r.requestedByRepId === repId).sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  )
}

/**
 * Request promise-to-pay for an invoice (called by rep)
 */
export async function requestPromiseToPay(
  invoiceId: string,
  promisedDate: string,
  expiryDate: string,
  repName: string,
  repId: string,
  notes?: string
): Promise<PromiseToPayRequest> {
  // In real implementation, this would create a database record
  // For now, just return a mock request object

  const request: PromiseToPayRequest = {
    invoiceId,
    invoiceNumber: `INV-${invoiceId}`,
    customerId: 'cust-unknown',
    customerName: 'Customer',
    amount: 0,
    promisedDate,
    expiryDate,
    requestedBy: repName,
    requestedByRepId: repId,
    requestedAt: new Date().toISOString(),
    status: 'pending',
    notes,
  }

  return request
}

/**
 * Approve promise-to-pay request (called by admin)
 */
export async function approvePromiseRequest(
  invoiceId: string,
  approvedBy: string
): Promise<PromiseToPayRequest | null> {
  // Find the request in mock data
  const request = MOCK_PROMISE_REQUESTS.find((r) => r.invoiceId === invoiceId)

  if (!request) {
    return null
  }

  // Update the request
  request.status = 'approved'
  request.approvedBy = approvedBy
  request.approvedAt = new Date().toISOString()

  return request
}

/**
 * Reject promise-to-pay request (called by admin)
 */
export async function rejectPromiseRequest(
  invoiceId: string,
  rejectionReason: string
): Promise<PromiseToPayRequest | null> {
  const request = MOCK_PROMISE_REQUESTS.find((r) => r.invoiceId === invoiceId)

  if (!request) {
    return null
  }

  request.status = 'rejected'
  request.rejectionReason = rejectionReason

  return request
}

/**
 * Get promise-to-pay status for an invoice
 */
export async function getInvoicePromiseStatus(
  invoiceId: string
): Promise<PromiseToPayRequest | null> {
  return MOCK_PROMISE_REQUESTS.find((r) => r.invoiceId === invoiceId) || null
}

/**
 * Check if a promise-to-pay has expired
 */
export function isPromiseExpired(promise: PromiseToPayRequest): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(promise.expiryDate)
  expiryDate.setHours(0, 0, 0, 0)
  return today > expiryDate
}

/**
 * Get days until promise expires (negative if expired)
 */
export function daysUntilPromiseExpires(promise: PromiseToPayRequest): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(promise.expiryDate)
  expiryDate.setHours(0, 0, 0, 0)
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get all promise-to-pay requests (used by todo-list engine)
 */
export async function getAllPromiseRequests(): Promise<PromiseToPayRequest[]> {
  return [...MOCK_PROMISE_REQUESTS]
}

export interface CommittedCashWeek {
  weekLabel: string      // e.g. "Apr 21 – Apr 27"
  weekStart: string      // ISO date
  weekEnd: string        // ISO date
  totalCommitted: number
  promiseCount: number
  promises: Array<{
    invoiceNumber: string
    customerName: string
    amount: number
    promisedDate: string
    repName: string
  }>
}

/**
 * Group approved active promises by promised payment week
 * Used for the "Committed Cash Incoming" dashboard widget
 */
export async function getCommittedCashByWeek(): Promise<CommittedCashWeek[]> {
  const today = new Date().toISOString().split('T')[0]
  const approved = MOCK_PROMISE_REQUESTS.filter(
    (p) => p.status === 'approved' && p.expiryDate >= today
  )

  // Group by ISO week of promisedDate
  const byWeek = new Map<string, CommittedCashWeek>()

  for (const promise of approved) {
    const date = new Date(promise.promisedDate)
    // Get Monday of that week
    const day = date.getDay()
    const daysToMon = day === 0 ? 6 : day - 1
    const mon = new Date(date)
    mon.setDate(date.getDate() - daysToMon)
    mon.setHours(0, 0, 0, 0)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)

    const weekKey = mon.toISOString().split('T')[0]

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    if (!byWeek.has(weekKey)) {
      byWeek.set(weekKey, {
        weekLabel: `${fmt(mon)} – ${fmt(sun)}`,
        weekStart: weekKey,
        weekEnd: sun.toISOString().split('T')[0],
        totalCommitted: 0,
        promiseCount: 0,
        promises: [],
      })
    }

    const week = byWeek.get(weekKey)!
    week.totalCommitted += promise.amount
    week.promiseCount++
    week.promises.push({
      invoiceNumber: promise.invoiceNumber,
      customerName: promise.customerName,
      amount: promise.amount,
      promisedDate: promise.promisedDate,
      repName: promise.requestedBy,
    })
  }

  // Sort by week ascending
  return Array.from(byWeek.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  )
}

/**
 * Get promises expiring within N days
 */
export async function getPromisesExpiringWithin(days: number): Promise<PromiseToPayRequest[]> {
  const approved = await fetchPromiseRequests('approved')

  return approved.filter(promise => {
    const daysUntil = daysUntilPromiseExpires(promise)
    return daysUntil > 0 && daysUntil <= days
  })
}
