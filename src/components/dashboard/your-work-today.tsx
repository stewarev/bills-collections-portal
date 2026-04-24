'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Calendar, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'

interface WorkItem {
  id: string
  type: 'due-today' | 'due-this-week' | 'promised-due' | 'overdue-action'
  title: string
  subtitle?: string
  amount: number
  daysUntil?: number
  priority: 'critical' | 'high' | 'medium'
  customerId: string
  invoiceNumber: string
  invoiceId: string
}

interface YourWorkTodayProps {
  items: WorkItem[]
  loading?: boolean
}

export function YourWorkToday({ items, loading }: YourWorkTodayProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Your Work Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Your Work Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 py-4 text-sm text-green-700">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            All caught up — no urgent work items today.
          </div>
        </CardContent>
      </Card>
    )
  }

  const typeConfig = {
    'due-today': {
      icon: Calendar,
      badge: 'bg-red-100 text-red-800',
      label: 'Due Today',
      color: 'border-red-200',
    },
    'due-this-week': {
      icon: Calendar,
      badge: 'bg-orange-100 text-orange-800',
      label: 'Due This Week',
      color: 'border-orange-200',
    },
    'promised-due': {
      icon: CheckCircle2,
      badge: 'bg-purple-100 text-purple-800',
      label: 'Promised Due',
      color: 'border-purple-200',
    },
    'overdue-action': {
      icon: AlertTriangle,
      badge: 'bg-red-100 text-red-800',
      label: 'Overdue - Action Needed',
      color: 'border-red-200',
    },
  }

  const priorityConfig = {
    critical: { bar: 'bg-red-500', dot: 'bg-red-500' },
    high: { bar: 'bg-orange-500', dot: 'bg-orange-500' },
    medium: { bar: 'bg-yellow-400', dot: 'bg-yellow-400' },
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Your Work Today
          </CardTitle>
          <div className="text-xs text-slate-500 font-medium">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const config = typeConfig[item.type]
            const Config = config.icon
            const priority = priorityConfig[item.priority]

            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${config.color} hover:bg-slate-50/50 transition-colors`}
              >
                {/* Priority dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.dot}`} />

                {/* Type icon + badge */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 ${config.badge}`}>
                  <Config className="h-3.5 w-3.5" />
                  {config.label}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  )}
                </div>

                {/* Amount + days */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900">${(item.amount / 1000).toFixed(1)}K</p>
                  {item.daysUntil !== undefined && (
                    <p className="text-xs text-slate-500">
                      {item.daysUntil === 0 ? 'Today' : `${item.daysUntil}d`}
                    </p>
                  )}
                </div>

                {/* View button */}
                <Link href={`/customers/${item.customerId}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0">
                    View
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
