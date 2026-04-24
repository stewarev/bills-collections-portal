'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, DollarSign, TrendingDown, Clock, BarChart3, Users, CheckCircle2, Clock3, TrendingUp, X, Loader2, Mail, Phone, ArrowUpRight, AlertTriangle, ListChecks } from 'lucide-react'
import { REPS } from '@/lib/netsuite/client'
import { buildUserInfo } from '@/lib/auth/user-roles'
import { PromiseToPayRequest, isPromiseExpired, daysUntilPromiseExpires } from '@/lib/db/promise-to-pay'
import { getDSOStatusColor, getDSOStatusLabel } from '@/lib/calculations/dso'
import { CollectionTodoItem } from '@/lib/cadence/next-action'
import { CommittedCashWeek } from '@/lib/db/promise-to-pay'

interface RepWorkload {
  repId: string
  repName: string
  invoiceCount: number
  totalOutstanding: number
  averageDaysOutstanding: number
  overdueCount: number
}

interface DSOMetric {
  repId: string
  repName: string
  dso: number
  adjustedDso: number
  accountsReceivable: number
  totalRevenue: number
  outstandingInvoiceCount: number
}

interface ARMetrics {
  totalOutstanding: number
  invoiceCount: number
  averageDaysOutstanding: number
  dso?: number
  adjustedDso?: number
  dsoByRep?: DSOMetric[]
  aging: {
    bucket0_30: { count: number; amount: number }
    bucket31_60: { count: number; amount: number }
    bucket60plus: { count: number; amount: number }
  }
  topOverdueInvoices: Array<{
    id: string
    invoiceNumber: string
    customerName: string
    amount: number
    days_overdue: number
  }>
  repWorkload?: RepWorkload[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<ARMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRepId, setSelectedRepId] = useState<string>('')
  const [promiseRequests, setPromiseRequests] = useState<PromiseToPayRequest[]>([])
  const [loadingPromises, setLoadingPromises] = useState(false)
  const [processingPromiseId, setProcessingPromiseId] = useState<string | null>(null)
  const [rejectingPromiseId, setRejectingPromiseId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [todoItems, setTodoItems] = useState<CollectionTodoItem[]>([])
  const [todoCounts, setTodoCounts] = useState<{ critical: number; high: number; medium: number; low: number; total: number } | null>(null)
  const [loadingTodo, setLoadingTodo] = useState(false)
  const [collectorStats, setCollectorStats] = useState<any[]>([])
  const [committedCash, setCommittedCash] = useState<CommittedCashWeek[]>([])
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

  // Detect user role
  const userInfo = buildUserInfo(email, name, email || '')
  const isAdmin = userInfo.role === 'admin'
  const repId = userInfo.repId

  async function loadMetrics(repIdParam?: string) {
    setLoading(true)
    try {
      const url = new URL('/api/metrics', window.location.origin)
      if (repIdParam) url.searchParams.set('repId', repIdParam)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTodoList(repIdParam?: string) {
    setLoadingTodo(true)
    try {
      const url = new URL('/api/todo-list', window.location.origin)
      if (repIdParam) url.searchParams.set('repId', repIdParam)

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTodoItems(data.items)
        setTodoCounts(data.counts)
      }
    } catch (error) {
      console.error('Failed to load action queue:', error)
    } finally {
      setLoadingTodo(false)
    }
  }

  async function loadPromiseRequests() {
    setLoadingPromises(true)
    try {
      // Admins see pending requests; reps see their own pending requests
      const url = new URL('/api/promise-to-pay', window.location.origin)
      if (isAdmin) {
        url.searchParams.set('status', 'pending')
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const requests = data.requests as PromiseToPayRequest[]

        // If rep, filter to only their requests
        if (!isAdmin && repId) {
          setPromiseRequests(requests.filter((r) => r.requestedByRepId === repId))
        } else {
          setPromiseRequests(requests)
        }
      }
    } catch (error) {
      console.error('Failed to load promise-to-pay requests:', error)
    } finally {
      setLoadingPromises(false)
    }
  }

  async function handleApprovePromise(invoiceId: string, repEmail: string) {
    setProcessingPromiseId(invoiceId)
    try {
      const response = await fetch('/api/promise-to-pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          action: 'approve',
          approvedBy: name || 'Admin',
          repEmail,
        }),
      })

      if (response.ok) {
        // Refresh the promise list
        await loadPromiseRequests()
      } else {
        const data = await response.json()
        console.error('Failed to approve promise:', data.error)
      }
    } catch (error) {
      console.error('Failed to approve promise:', error)
    } finally {
      setProcessingPromiseId(null)
    }
  }

  async function handleRejectPromise(invoiceId: string, repEmail: string) {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setProcessingPromiseId(invoiceId)
    try {
      const response = await fetch('/api/promise-to-pay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          action: 'reject',
          rejectionReason: rejectReason,
          repEmail,
        }),
      })

      if (response.ok) {
        // Refresh the promise list and clear the reason input
        await loadPromiseRequests()
        setRejectingPromiseId(null)
        setRejectReason('')
      } else {
        const data = await response.json()
        console.error('Failed to reject promise:', data.error)
      }
    } catch (error) {
      console.error('Failed to reject promise:', error)
    } finally {
      setProcessingPromiseId(null)
    }
  }

  useEffect(() => {
    // For reps, don't show rep filter
    if (!isAdmin) {
      loadMetrics(repId)
      loadTodoList(repId)
    } else {
      loadMetrics(selectedRepId || undefined)
      loadTodoList(selectedRepId || undefined)
    }
  }, [selectedRepId, isAdmin, repId])

  useEffect(() => {
    if (isAdmin) {
      loadPromiseRequests()
      // Load collector stats and committed cash for admin
      fetch('/api/collector-stats')
        .then((r) => r.json())
        .then((d) => setCollectorStats(d.stats || []))
        .catch(console.error)
      fetch('/api/promise-to-pay/committed-cash')
        .then((r) => r.json())
        .then((d) => setCommittedCash(d.weeks || []))
        .catch(console.error)
    }
  }, [])

  const today = new Date().toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAdmin ? 'AR Collections Dashboard' : `${session?.user?.name}'s AR Dashboard`}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Rep Filter - Admin Only */}
          {isAdmin && (
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="">All Reps</option>
              {REPS.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => {
              loadMetrics(isAdmin ? selectedRepId || undefined : repId)
              loadPromiseRequests()
            }}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading || loadingPromises ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6 h-24 bg-slate-100 animate-pulse rounded" />
              </Card>
            ))}
          </>
        ) : metrics ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Total Outstanding</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      ${(metrics.totalOutstanding / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Invoice Count</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.invoiceCount}</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Avg Days Outstanding</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.averageDaysOutstanding}d</p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">60+ Days Overdue</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">${(metrics.aging.bucket60plus.amount / 1000).toFixed(0)}K</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* ── Action Queue ─────────────────────────────────── */}
      <Card className={`${todoCounts && todoCounts.critical > 0 ? 'border-red-300' : 'border-slate-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-slate-600" />
              Today's Action Queue
              {todoCounts && todoCounts.total > 0 && (
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {todoCounts.total} action{todoCounts.total !== 1 ? 's' : ''} needed
                </span>
              )}
            </CardTitle>
            {todoCounts && (
              <div className="flex items-center gap-2 text-xs">
                {todoCounts.critical > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                    {todoCounts.critical} critical
                  </span>
                )}
                {todoCounts.high > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                    {todoCounts.high} high
                  </span>
                )}
                {todoCounts.medium > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                    {todoCounts.medium} medium
                  </span>
                )}
                {todoCounts.low > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {todoCounts.low} low
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingTodo ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : todoItems.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-sm text-slate-500">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              All caught up — no actions needed right now.
            </div>
          ) : (
            <div className="space-y-2">
              {todoItems.map((item) => {
                const urgencyConfig = {
                  critical: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-800', label: 'CRITICAL' },
                  high:     { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', label: 'HIGH' },
                  medium:   { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800', label: 'MEDIUM' },
                  low:      { bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-600', label: 'LOW' },
                }[item.urgency]

                const actionIcon = {
                  'Email': <Mail className="h-4 w-4" />,
                  'Call': <Phone className="h-4 w-4" />,
                  'Escalate': <ArrowUpRight className="h-4 w-4" />,
                  'Finance Action': <AlertTriangle className="h-4 w-4" />,
                }[item.recommendedAction]

                const actionColor = {
                  'Email': 'text-blue-600 bg-blue-50 border-blue-200',
                  'Call': 'text-green-700 bg-green-50 border-green-200',
                  'Escalate': 'text-purple-700 bg-purple-50 border-purple-200',
                  'Finance Action': 'text-red-700 bg-red-50 border-red-200',
                }[item.recommendedAction]

                return (
                  <div
                    key={item.invoiceId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Urgency bar */}
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${urgencyConfig.bar}`} />

                    {/* Action badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium flex-shrink-0 ${actionColor}`}>
                      {actionIcon}
                      {item.recommendedAction}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{item.customerName}</span>
                        <span className="text-xs text-slate-400 font-mono flex-shrink-0">{item.invoiceNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.reason}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900">${(item.amount / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-slate-500">
                        {item.daysSinceLastContact === 9999
                          ? 'No contact yet'
                          : `${item.daysSinceLastContact}d since last contact`}
                      </p>
                    </div>

                    {/* Urgency pill */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${urgencyConfig.badge}`}>
                      {urgencyConfig.label}
                    </span>

                    {/* Log Action button */}
                    <Link href={`/customers/${item.customerId}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0">
                        View
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Promise-to-Pay Requests (Admin Only) */}
      {isAdmin && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Clock3 className="h-5 w-5" />
              Pending Promise-to-Pay Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPromises ? (
              <div className="text-sm text-slate-500">Loading...</div>
            ) : promiseRequests.length === 0 ? (
              <div className="text-sm text-slate-500">No pending approvals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-2 px-2 font-medium text-purple-900">Invoice</th>
                      <th className="text-left py-2 px-2 font-medium text-purple-900">Customer</th>
                      <th className="text-right py-2 px-2 font-medium text-purple-900">Amount</th>
                      <th className="text-center py-2 px-2 font-medium text-purple-900">Promised By</th>
                      <th className="text-center py-2 px-2 font-medium text-purple-900">Expires</th>
                      <th className="text-left py-2 px-2 font-medium text-purple-900">Rep</th>
                      <th className="text-left py-2 px-2 font-medium text-purple-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promiseRequests.map((req) => {
                      const expired = isPromiseExpired(req)
                      const daysUntil = daysUntilPromiseExpires(req)
                      return (
                        <tr key={req.invoiceId} className="border-b border-purple-100 hover:bg-purple-100/50">
                          <td className="py-2 px-2 font-mono text-purple-900">{req.invoiceNumber}</td>
                          <td className="py-2 px-2 text-slate-600">{req.customerName}</td>
                          <td className="py-2 px-2 text-right font-medium text-purple-900">
                            ${(req.amount / 1000).toFixed(1)}K
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600">
                            {new Date(req.promisedDate).toLocaleDateString('en-CA')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="text-slate-600 text-xs">
                              {new Date(req.expiryDate).toLocaleDateString('en-CA')}
                              {expired ? (
                                <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Expired</Badge>
                              ) : daysUntil <= 3 ? (
                                <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">{daysUntil}d left</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-slate-600">{req.requestedBy}</td>
                          <td className="py-2 px-2">
                            {rejectingPromiseId === req.invoiceId ? (
                              <div className="flex flex-col gap-1 min-w-max">
                                <input
                                  type="text"
                                  placeholder="Reason for rejection..."
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  className="px-2 py-1 text-xs border rounded"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-6 px-2 bg-red-600 hover:bg-red-700 text-xs"
                                    disabled={processingPromiseId === req.invoiceId}
                                    onClick={() => handleRejectPromise(req.invoiceId, '')}
                                  >
                                    {processingPromiseId === req.invoiceId ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      'Confirm'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      setRejectingPromiseId(null)
                                      setRejectReason('')
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 bg-green-600 hover:bg-green-700"
                                  disabled={processingPromiseId === req.invoiceId}
                                  onClick={() => handleApprovePromise(req.invoiceId, '')}
                                >
                                  {processingPromiseId === req.invoiceId ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2"
                                  disabled={processingPromiseId === req.invoiceId}
                                  onClick={() => setRejectingPromiseId(req.invoiceId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DSO Metrics (Admin Only) */}
      {isAdmin && metrics?.dso !== undefined && (
        <>
          {/* Overall DSO Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`${getDSOStatusColor(metrics.dso).replace('text-', 'border-').replace('bg-', 'bg-')}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Days Sales Outstanding (DSO)</p>
                    <p className="text-3xl font-bold mt-2">{metrics.dso.toFixed(1)} days</p>
                    <p className={`text-xs font-medium mt-1 ${getDSOStatusColor(metrics.dso)}`}>
                      {getDSOStatusLabel(metrics.dso)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Accounts Receivable (Included)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      ${(metrics.totalOutstanding / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {metrics.invoiceCount} invoices
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-blue-500 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Revenue (365d)</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">
                      ${((metrics.totalOutstanding * 365 / (metrics.dso || 1)) / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Daily: ${(((metrics.totalOutstanding * 365 / (metrics.dso || 1)) / 365) / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-green-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rep DSO Breakdown */}
          {metrics.dsoByRep && metrics.dsoByRep.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  DSO by Rep
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-slate-600">Rep</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">DSO</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">Status</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">AR (Included)</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">Invoices</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.dsoByRep.map((rep) => (
                        <tr key={rep.repId} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium text-slate-900">{rep.repName}</td>
                          <td className="py-2 px-2 text-right font-bold">{rep.dso.toFixed(1)} days</td>
                          <td className="py-2 px-2 text-right">
                            <Badge className={`text-xs ${
                              rep.dso < 30 ? 'bg-green-100 text-green-800' :
                              rep.dso < 45 ? 'bg-blue-100 text-blue-800' :
                              rep.dso < 60 ? 'bg-yellow-100 text-yellow-800' :
                              rep.dso < 90 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {getDSOStatusLabel(rep.dso)}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-right text-slate-600">${(rep.accountsReceivable / 1000).toFixed(1)}K</td>
                          <td className="py-2 px-2 text-right text-slate-600">{rep.outstandingInvoiceCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Rep Workload (Admin Only) */}
      {isAdmin && !selectedRepId && metrics?.repWorkload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rep Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-slate-600">Rep</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Invoices</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Outstanding</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Avg Days</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Overdue</th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600 border-l border-slate-200 pl-4">
                      Actions <span className="text-slate-400 font-normal normal-case">(this wk)</span>
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-slate-600">Promises</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.repWorkload.map((rep) => {
                    const repStats = collectorStats.find((s: any) => s.repId === rep.repId)
                    return (
                      <tr key={rep.repId} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-900">{rep.repName}</td>
                        <td className="py-2 px-2 text-right text-slate-600">{rep.invoiceCount}</td>
                        <td className="py-2 px-2 text-right font-medium text-slate-900">${(rep.totalOutstanding / 1000).toFixed(1)}K</td>
                        <td className="py-2 px-2 text-right text-slate-600">{rep.averageDaysOutstanding}d</td>
                        <td className="py-2 px-2 text-right">
                          {rep.overdueCount > 0 ? (
                            <Badge variant="destructive">{rep.overdueCount}</Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right border-l border-slate-100 pl-4">
                          {repStats ? (
                            <span className={`font-medium ${repStats.thisWeek.actionsTotal === 0 ? 'text-red-500' : repStats.thisWeek.actionsTotal < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {repStats.thisWeek.actionsTotal}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {repStats && repStats.thisWeek.promisesObtained > 0 ? (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">
                              {repStats.thisWeek.promisesObtained}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Committed Cash Incoming (Admin Only) ─────────── */}
      {isAdmin && committedCash.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Committed Cash Incoming
              <span className="text-sm font-normal text-slate-500 ml-1">
                — from approved promises-to-pay
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {committedCash.map((week) => (
                <div
                  key={week.weekStart}
                  className="p-4 rounded-lg border border-green-200 bg-green-50"
                >
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    {week.weekLabel}
                  </p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    ${(week.totalCommitted / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {week.promiseCount} promise{week.promiseCount !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {week.promises.map((p, i) => (
                      <div key={i} className="text-xs text-green-700 flex justify-between">
                        <span className="truncate">{p.customerName}</span>
                        <span className="font-medium ml-2">${(p.amount / 1000).toFixed(1)}K</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Total committed: ${(committedCash.reduce((s, w) => s + w.totalCommitted, 0) / 1000).toFixed(1)}K across {committedCash.reduce((s, w) => s + w.promiseCount, 0)} active promises
            </p>
          </CardContent>
        </Card>
      )}

      {/* Aging Breakdown - Show for Admin or for Rep's own data */}
      {metrics && (isAdmin || !isAdmin) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aging Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900">0–30 Days</p>
                <p className="text-2xl font-bold text-green-600 mt-2">${(metrics.aging.bucket0_30.amount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-700 mt-1">{metrics.aging.bucket0_30.count} invoices</p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-900">31–60 Days</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">${(metrics.aging.bucket31_60.amount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-yellow-700 mt-1">{metrics.aging.bucket31_60.count} invoices</p>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-900">60+ Days</p>
                <p className="text-2xl font-bold text-red-600 mt-2">${(metrics.aging.bucket60plus.amount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-red-700 mt-1">{metrics.aging.bucket60plus.count} invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Overdue */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topOverdueInvoices.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No overdue invoices</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-slate-600">Invoice</th>
                        <th className="text-left py-2 px-2 font-medium text-slate-600">Customer</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">Amount</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-600">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topOverdueInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-2 text-slate-900 font-mono">{inv.invoiceNumber}</td>
                          <td className="py-2 px-2 text-slate-600">{inv.customerName}</td>
                          <td className="py-2 px-2 text-right text-slate-900 font-medium">${(inv.amount / 1000).toFixed(1)}K</td>
                          <td className="py-2 px-2 text-right">
                            <Badge variant={inv.days_overdue > 60 ? 'destructive' : inv.days_overdue > 30 ? 'secondary' : 'outline'}>
                              {inv.days_overdue}d
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Link href="/customers">
          <Button variant="outline" className="gap-2">
            <DollarSign className="h-4 w-4" />
            View Customers
          </Button>
        </Link>
        <Link href="/invoices">
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            View Invoices
          </Button>
        </Link>
      </div>
    </div>
  )
}
