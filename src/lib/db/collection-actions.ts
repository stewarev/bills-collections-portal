/**
 * Collection Action Management (Mock Data for Week 3)
 * Tracks all collection interactions: emails, calls, escalations, promises-to-pay
 */

export interface CollectionAction {
  id: string
  customerId: string
  actionType: 'Email' | 'Call' | 'Escalate' | 'Promise-to-Pay' | 'Disputed' | 'Paid'
  outcome: 'Sent' | 'Connected' | 'No Answer' | 'Left VM' | 'Promise Accepted' | 'Dispute Acknowledged' | 'Confirmed'
  summary: string
  date: string
  invoices?: string[]
  nextActionDate?: string
  staffMember: string
  createdAt?: string
}

// Mock collection actions by customer
const MOCK_COLLECTION_ACTIONS: Record<string, CollectionAction[]> = {
  'cust-001': [
    {
      id: 'act-001',
      customerId: 'cust-001',
      actionType: 'Email',
      outcome: 'Sent',
      summary: 'Invoice reminder email sent for overdue invoices',
      date: '2026-04-15',
      staffMember: 'Sajjad',
      nextActionDate: '2026-04-18',
    },
    {
      id: 'act-002',
      customerId: 'cust-001',
      actionType: 'Call',
      outcome: 'Connected',
      summary: 'Called Sarah Johnson, discussed payment timeline. Promised to pay by Friday.',
      date: '2026-04-14',
      staffMember: 'Sajjad',
    },
  ],
  'cust-002': [
    {
      id: 'act-003',
      customerId: 'cust-002',
      actionType: 'Email',
      outcome: 'Sent',
      summary: 'First reminder email sent',
      date: '2026-04-12',
      staffMember: 'Yuliia',
      nextActionDate: '2026-04-19',
    },
  ],
  'cust-003': [
    {
      id: 'act-004',
      customerId: 'cust-003',
      actionType: 'Call',
      outcome: 'No Answer',
      summary: 'Left voicemail for Jennifer Lee',
      date: '2026-04-13',
      staffMember: 'Baz',
      nextActionDate: '2026-04-16',
    },
    {
      id: 'act-005',
      customerId: 'cust-003',
      actionType: 'Promise-to-Pay',
      outcome: 'Promise Accepted',
      summary: 'Jennifer confirmed payment scheduled for April 20',
      date: '2026-04-11',
      staffMember: 'Baz',
      nextActionDate: '2026-04-20',
    },
  ],
}

/**
 * Fetch collection actions for a customer
 */
export async function fetchCollectionActions(customerId: string): Promise<CollectionAction[]> {
  return (MOCK_COLLECTION_ACTIONS[customerId] || []).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * Fetches all collection actions (admin view)
 */
export async function fetchAllCollectionActions(filters?: {
  action_type?: string
  staff_member?: string
  date_from?: string
  date_to?: string
}): Promise<CollectionAction[]> {
  const allActions = Object.values(MOCK_COLLECTION_ACTIONS).flat()

  return allActions.filter(action => {
    if (filters?.action_type && action.actionType !== filters.action_type) return false
    if (filters?.staff_member && action.staffMember !== filters.staff_member) return false
    if (filters?.date_from && action.date < filters.date_from) return false
    if (filters?.date_to && action.date > filters.date_to) return false
    return true
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/**
 * Fetches overdue follow-ups (customers that need action)
 */
export async function fetchOverdueFollowUps(): Promise<CollectionAction[]> {
  const today = new Date().toISOString().split('T')[0]
  const allActions = Object.values(MOCK_COLLECTION_ACTIONS).flat()

  return allActions.filter(action =>
    action.nextActionDate && action.nextActionDate < today
  ).sort((a, b) => {
    const dateA = a.nextActionDate || ''
    const dateB = b.nextActionDate || ''
    return dateA.localeCompare(dateB)
  })
}

/**
 * Fetches this week's collection actions
 */
export async function fetchWeeklyStats() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysToMonday)
  weekStart.setHours(0, 0, 0, 0)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const allActions = Object.values(MOCK_COLLECTION_ACTIONS).flat()
  const logs = allActions.filter(a => a.date >= weekStartStr)
  const successful = logs.filter((l) => l.outcome === 'Connected' || l.outcome === 'Promise Accepted').length

  return {
    total: logs.length,
    successful,
    successRate: logs.length > 0 ? Math.round((successful / logs.length) * 100) : 0,
    uniqueCustomers: new Set(logs.map((l) => l.customerId)).size,
  }
}

/**
 * Saves a new collection action (mock)
 */
export async function saveCollectionAction(entry: Omit<CollectionAction, 'id' | 'createdAt'>): Promise<CollectionAction> {
  const id = `act-${Date.now()}`
  const newAction: CollectionAction = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
  }

  if (!MOCK_COLLECTION_ACTIONS[entry.customerId]) {
    MOCK_COLLECTION_ACTIONS[entry.customerId] = []
  }
  MOCK_COLLECTION_ACTIONS[entry.customerId].push(newAction)
  return newAction
}

/**
 * Updates a collection action (e.g., mark follow-up as complete)
 */
export async function updateCollectionAction(
  id: string,
  updates: Partial<CollectionAction>
): Promise<CollectionAction | null> {
  for (const actions of Object.values(MOCK_COLLECTION_ACTIONS)) {
    const index = actions.findIndex((a) => a.id === id)
    if (index !== -1) {
      actions[index] = { ...actions[index], ...updates }
      return actions[index]
    }
  }
  return null
}
