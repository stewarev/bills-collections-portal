'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, RefreshCw, DollarSign, TrendingDown, Clock } from 'lucide-react'

interface RepDashboardMetrics {
  repName: string
  totalOutstanding: number
  invoiceCount: number
  averageDaysOutstanding: number
  overdueCount: number
  topOverdueInvoices: Array<{
    id: string
    invoiceNumber: string
    customerName: string
    amount: number
    days_overdue: number
  }>
}

export default function RepDashboardPage() {
  const { data: session } = useSession()
  const [metrics, setMetrics] = useState<RepDashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadMetrics() {
    setLoading(true)
    try {
      // TODO: In Week 3, fetch only the logged-in rep's data based on session.user.id
      // For now, this is a template. The metrics API will need to know the current user.
      const response = await fetch('/api/rep-metrics')
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

  useEffect(() => {
    loadMetrics()
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
          <h1 className="text-3xl font-bold text-slate-900">My Collections</h1>
          <p className="text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <button
          onClick={loadMetrics}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
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
                    <p className="text-xs font-medium text-slate-500 uppercase">My Outstanding AR</p>
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
                  <Clock className="h-6 w-6 text-green-500 opacity-20" />
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
                    <p className="text-xs font-medium text-slate-500 uppercase">Overdue Invoices</p>
                    <p className={`text-2xl font-bold mt-2 ${metrics.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {metrics.overdueCount}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-500 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Top Overdue */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.topOverdueInvoices.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No overdue invoices — great job! 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-slate-600">Invoice</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-600">Customer</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-600">Amount</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-600">Days Overdue</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topOverdueInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-slate-50">
                        <td className="py-2 px-2 text-slate-900 font-mono">{inv.invoiceNumber}</td>
                        <td className="py-2 px-2 text-slate-600">{inv.customerName}</td>
                        <td className="py-2 px-2 text-right text-slate-900 font-medium">${(inv.amount / 1000).toFixed(1)}K</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant="destructive">{inv.days_overdue}d</Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <Link href={`/customers/${inv.id}`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Link href="/customers">
          <Button variant="outline">View My Customers</Button>
        </Link>
        <Link href="/collection-log">
          <Button variant="outline">Collection Log</Button>
        </Link>
      </div>
    </div>
  )
}
