'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { fetchCustomers } from '@/lib/netsuite/customers'
import { REPS } from '@/lib/netsuite/client'
import type { Customer } from '@/lib/netsuite/customers'
import { Search, Phone, Mail } from 'lucide-react'

const SEGMENT_TABS = [
  { label: 'All', segment: 'All' as const },
  { label: 'Bronze', segment: 'Bronze' as const },
  { label: 'Silver', segment: 'Silver' as const },
  { label: 'Regular', segment: 'Regular' as const },
  { label: 'Hyper-care', segment: 'Hyper-care' as const },
  { label: 'Finance Action', segment: 'Finance Action' as const },
]

const segmentColors: Record<string, string> = {
  'Bronze': 'bg-orange-100 text-orange-800',
  'Silver': 'bg-slate-100 text-slate-800',
  'Regular': 'bg-blue-100 text-blue-800',
  'Hyper-care': 'bg-red-100 text-red-800',
  'Finance Action': 'bg-purple-100 text-purple-800',
}

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Header with name and segment badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-blue-600 text-sm truncate block">
              {customer.name}
            </Link>
            <p className="text-xs text-slate-500">{customer.companyName}</p>
          </div>
          <Badge className={`text-xs whitespace-nowrap ${segmentColors[customer.segment]}`}>
            {customer.segment}
          </Badge>
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline truncate">
              {customer.email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
              {customer.phone}
            </a>
          </div>
        </div>

        {/* Rep and last contact */}
        <div className="text-xs text-slate-600 space-y-1 border-t pt-2">
          <div>
            <span className="font-medium">Rep:</span> {customer.assignedRepName}
          </div>
          {customer.lastContactedAt && (
            <div>
              <span className="font-medium">Last Contacted:</span>{' '}
              {new Date(customer.lastContactedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* View button */}
        <Link href={`/customers/${customer.id}`} className="block">
          <Button size="sm" variant="outline" className="w-full">
            View
          </Button>
        </Link>
      </div>
    </Card>
  )
}

export default function CustomersPage() {
  const [activeSegment, setActiveSegment] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [selectedRep, setSelectedRep] = useState<string>('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLoading(true)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(async () => {
      try {
        const filters: Parameters<typeof fetchCustomers>[0] = {
          status: 'Active',
          ...(activeSegment !== 'All' && { segment: activeSegment }),
          ...(selectedRep && { assignedRepId: selectedRep }),
          ...(search && { search }),
        }
        const data = await fetchCustomers(filters)
        setCustomers(data)
      } catch (error) {
        console.error('Failed to load customers:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [search, activeSegment, selectedRep])

  const activeCount = customers.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{activeCount} active customers</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, company, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          {/* Segment filter */}
          <select
            value={activeSegment}
            onChange={(e) => setActiveSegment(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {SEGMENT_TABS.map((tab) => (
              <option key={tab.segment} value={tab.segment}>
                {tab.label}
              </option>
            ))}
          </select>

          {/* Rep filter */}
          <select
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Reps</option>
            {REPS.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : activeCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  )
}
