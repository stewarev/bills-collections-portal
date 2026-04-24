'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

interface AgingBucket {
  count: number
  amount: number
}

interface Aging {
  bucket0_30: AgingBucket
  bucket31_60: AgingBucket
  bucket60plus: AgingBucket
}

interface CommittedCash {
  weekLabel: string
  totalCommitted: number
  promiseCount: number
}

interface CashPositionProps {
  totalOutstanding: number
  dso?: number
  aging: Aging
  committedCash?: CommittedCash[]
}

export function CashPosition({ totalOutstanding, dso, aging, committedCash = [] }: CashPositionProps) {
  const getDSOStatus = (days: number) => {
    if (days < 30) return { color: 'text-green-600 bg-green-50', label: 'Excellent' }
    if (days < 45) return { color: 'text-blue-600 bg-blue-50', label: 'Good' }
    if (days < 60) return { color: 'text-yellow-600 bg-yellow-50', label: 'Fair' }
    if (days < 90) return { color: 'text-orange-600 bg-orange-50', label: 'Poor' }
    return { color: 'text-red-600 bg-red-50', label: 'Critical' }
  }

  const totalCommitted = committedCash.reduce((sum, week) => sum + week.totalCommitted, 0)
  const totalInvoices = aging.bucket0_30.count + aging.bucket31_60.count + aging.bucket60plus.count
  const dsoStatus = dso ? getDSOStatus(dso) : null

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          Cash Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top row: Total AR + DSO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
              Accounts Receivable
            </p>
            <p className="text-3xl font-bold text-slate-900">
              ${(totalOutstanding / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''}
            </p>
          </div>

          {dso && dsoStatus && (
            <div className={`p-4 rounded-lg border ${dsoStatus.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                Days Sales Outstanding
              </p>
              <p className="text-3xl font-bold">{dso.toFixed(1)} days</p>
              <p className="text-xs font-medium mt-1">{dsoStatus.label}</p>
            </div>
          )}
        </div>

        {/* Aging breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Aging Breakdown
          </h4>
          <div className="space-y-2">
            {/* 0-30 days */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-900">0–30 Days</p>
                <p className="text-xs text-green-700">{aging.bucket0_30.count} invoices</p>
              </div>
              <p className="text-sm font-bold text-green-700">
                ${(aging.bucket0_30.amount / 1000).toFixed(0)}K
              </p>
            </div>

            {/* 31-60 days */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex-1">
                <p className="text-xs font-semibold text-yellow-900">31–60 Days</p>
                <p className="text-xs text-yellow-700">{aging.bucket31_60.count} invoices</p>
              </div>
              <p className="text-sm font-bold text-yellow-700">
                ${(aging.bucket31_60.amount / 1000).toFixed(0)}K
              </p>
            </div>

            {/* 60+ days */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg border ${
                aging.bucket60plus.amount > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex-1">
                <p className={`text-xs font-semibold ${aging.bucket60plus.amount > 0 ? 'text-red-900' : 'text-slate-700'}`}>
                  60+ Days
                </p>
                <p className={`text-xs ${aging.bucket60plus.amount > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                  {aging.bucket60plus.count} invoices
                </p>
              </div>
              <p className={`text-sm font-bold ${aging.bucket60plus.amount > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                ${(aging.bucket60plus.amount / 1000).toFixed(0)}K
              </p>
            </div>
          </div>

          {/* Aging summary bar */}
          <div className="mt-3 flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
            {totalOutstanding > 0 && (
              <>
                <div
                  className="bg-green-500"
                  style={{ width: `${(aging.bucket0_30.amount / totalOutstanding) * 100}%` }}
                />
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(aging.bucket31_60.amount / totalOutstanding) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(aging.bucket60plus.amount / totalOutstanding) * 100}%` }}
                />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Current
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" /> 31-60d
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" /> Overdue
            </span>
          </div>
        </div>

        {/* Committed cash incoming */}
        {committedCash.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Expected Cash Inflow
              </h4>
              <span className="text-sm font-bold text-green-600">
                ${(totalCommitted / 1000).toFixed(1)}K committed
              </span>
            </div>
            <div className="space-y-2">
              {committedCash.slice(0, 4).map((week) => (
                <div key={week.weekLabel} className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-green-900">{week.weekLabel}</p>
                    <p className="text-xs text-green-700">{week.promiseCount} promise{week.promiseCount !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-sm font-bold text-green-700">
                    ${(week.totalCommitted / 1000).toFixed(1)}K
                  </p>
                </div>
              ))}
            </div>
            {committedCash.length > 4 && (
              <p className="text-xs text-slate-500 mt-2">
                +{committedCash.length - 4} more weeks
              </p>
            )}
          </div>
        )}

        {/* Insight */}
        {aging.bucket60plus.amount > totalOutstanding * 0.2 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <p className="font-semibold mb-0.5">High overdue balance</p>
              <p>Over 20% of AR is 60+ days past due. Prioritize escalations.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
