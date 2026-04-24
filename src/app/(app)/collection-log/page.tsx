'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { buildUserInfo } from '@/lib/auth/user-roles'

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

const actionTypeColors: Record<string, string> = {
  'Email': 'bg-blue-100 text-blue-800',
  'Call': 'bg-green-100 text-green-800',
  'Escalate': 'bg-red-100 text-red-800',
  'Promise-to-Pay': 'bg-purple-100 text-purple-800',
  'Disputed': 'bg-yellow-100 text-yellow-800',
  'Paid': 'bg-green-200 text-green-900',
}

const outcomeColors: Record<string, string> = {
  'Sent': 'text-green-600',
  'Connected': 'text-green-600',
  'No Answer': 'text-yellow-600',
  'Left VM': 'text-orange-600',
  'Promise Accepted': 'text-blue-600',
  'Dispute Acknowledged': 'text-purple-600',
  'Confirmed': 'text-green-600',
}

const REPS = [
  { id: 'rep-001', name: 'Sajjad' },
  { id: 'rep-002', name: 'Yuliia' },
  { id: 'rep-003', name: 'Baz' },
  { id: 'rep-004', name: 'Rakshita' },
]

const ACTION_TYPES = ['Email', 'Call', 'Escalate', 'Promise-to-Pay', 'Disputed', 'Paid']

export default function CollectionLogPage() {
  const { data: session } = useSession()
  const [devUser, setDevUser] = useState<any>(null)

  // Load dev user from localStorage (for testing without Google OAuth)
  useEffect(() => {
    const saved = localStorage.getItem('devUser')
    if (saved) {
      try {
        setDevUser(JSON.parse(saved))
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [])

  // Use dev user if available, otherwise use session
  const email = devUser?.email || session?.user?.email
  const name = devUser?.name || session?.user?.name

  const userInfo = buildUserInfo(email, name, email || '')
  const isAdmin = userInfo.role === 'admin'

  const [actions, setActions] = useState<CollectionAction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionType, setActionType] = useState('')
  const [staffMember, setStaffMember] = useState('')
  const [tab, setTab] = useState<'all' | 'my' | 'overdue' | 'week'>('all')

  // Auto-set staffMember for reps after devUser or session loads
  useEffect(() => {
    if (!isAdmin && name) {
      setStaffMember(name)
    } else if (isAdmin) {
      setStaffMember('')
    }
  }, [isAdmin, name])

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (actionType) params.append('actionType', actionType)
      if (staffMember) params.append('staffMember', staffMember)
      params.append('tab', tab)

      const response = await fetch(`/api/collection-actions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActions(data.actions)
      }
    } catch (error) {
      console.error('Failed to fetch collection actions:', error)
    } finally {
      setLoading(false)
    }
  }, [search, actionType, staffMember, tab])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActions()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchActions])

  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Collection Action Log</h1>
        <p className="text-slate-600 mt-1">
          All collection interactions and follow-ups
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {['all', 'my', 'overdue', 'week'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'all' && 'All Actions'}
            {t === 'my' && 'My Actions'}
            {t === 'overdue' && 'Overdue Follow-ups'}
            {t === 'week' && 'This Week'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 bg-white p-4 rounded-lg border">
        <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by customer name or action summary..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Action Types</option>
          {ACTION_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={staffMember}
          onChange={(e) => setStaffMember(e.target.value)}
          className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Staff</option>
          {REPS.map(rep => (
            <option key={rep.id} value={rep.name}>{rep.name}</option>
          ))}
        </select>

        {(search || actionType || staffMember) && (
          <button
            onClick={() => {
              setSearch('')
              setActionType('')
              setStaffMember('')
            }}
            className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Action Type</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Outcome</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Summary</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Staff</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="border-b">
                    {[1, 2, 3, 4, 5, 6, 7].map(j => (
                      <td key={j} className="py-3 px-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                    No collection actions found
                  </td>
                </tr>
              ) : (
                actions.map(action => (
                  <tr key={action.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(action.date).toLocaleDateString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/customers/${action.customerId}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {action.customerName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`text-xs ${actionTypeColors[action.actionType] || 'bg-slate-100 text-slate-800'}`}>
                        {action.actionType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${outcomeColors[action.outcome] || 'text-slate-600'}`}>
                        {action.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {action.summary || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{action.staffMember}</td>
                    <td className="py-3 px-4 text-xs">
                      {action.nextActionDate ? (
                        <span className="text-orange-600">
                          {new Date(action.nextActionDate).toLocaleDateString('en-CA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
