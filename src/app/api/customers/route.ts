import { fetchCustomers } from '@/lib/netsuite/customers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const segment = request.nextUrl.searchParams.get('segment') || undefined
    const repId = request.nextUrl.searchParams.get('assignedRepId') || undefined
    const search = request.nextUrl.searchParams.get('search') || undefined

    const filters: Parameters<typeof fetchCustomers>[0] = {}
    if (segment && segment !== 'All') filters.segment = segment
    if (repId) filters.assignedRepId = repId
    if (search) filters.search = search

    const customers = await fetchCustomers(filters)
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Customers error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
