import { fetchAllCollectionActions, fetchOverdueFollowUps, fetchWeeklyStats } from '@/lib/db/collection-actions'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { NextRequest, NextResponse } from 'next/server'

interface CollectionAction {
  id: string
  customerId: string
  customerName: string
  actionType: string
  outcome: string
  summary: string
  date: string
  staffMember: string
  nextActionDate?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Get parameters
    const search = searchParams.get('search')?.toLowerCase() || ''
    const actionType = searchParams.get('actionType')
    const staffMember = searchParams.get('staffMember')
    const tab = searchParams.get('tab') || 'all'

    // Get customers for lookup
    const customers = await fetchCustomers()
    const customerMap = new Map(customers.map(c => [c.id, c]))

    let allActions
    if (tab === 'overdue') {
      allActions = await fetchOverdueFollowUps()
    } else if (tab === 'week') {
      // Get actions from the past week
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const weekStart = weekAgo.toISOString().split('T')[0]
      const allData = await fetchAllCollectionActions()
      allActions = allData.filter(a => a.date >= weekStart)
    } else {
      // tab === 'all' or 'my'
      allActions = await fetchAllCollectionActions()
    }

    // Build action list with customer names
    let filtered: CollectionAction[] = allActions
      .map(action => {
        const customer = customerMap.get(action.customerId)
        if (!customer) return null

        return {
          id: action.id,
          customerId: action.customerId,
          customerName: customer.name,
          actionType: action.actionType,
          outcome: action.outcome,
          summary: action.summary,
          date: action.date,
          staffMember: action.staffMember,
          nextActionDate: action.nextActionDate,
        } as CollectionAction
      })
      .filter((action): action is CollectionAction => action !== null)

    // Apply search filter
    if (search) {
      filtered = filtered.filter(action =>
        action.customerName.toLowerCase().includes(search) ||
        action.summary.toLowerCase().includes(search)
      )
    }

    // Apply action type filter
    if (actionType) {
      filtered = filtered.filter(action => action.actionType === actionType)
    }

    // Apply staff member filter
    if (staffMember) {
      filtered = filtered.filter(action => action.staffMember === staffMember)
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      actions: filtered,
      count: filtered.length,
    })
  } catch (error) {
    console.error('Collection actions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collection actions' },
      { status: 500 }
    )
  }
}
