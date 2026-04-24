'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Handshake,
  Check,
  X,
  AlertCircle,
  DollarSign,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from 'next-auth/react'
import { buildUserInfo } from '@/lib/auth/user-roles'
import { PromiseToPayRequest, getCommittedCashByWeek, daysUntilPromiseExpires, isPromiseExpired } from '@/lib/db/promise-to-pay'

interface CommittedCashWeek {
  weekLabel: string
  weekStart: string
  weekEnd: string
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function monthName(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

interface DayData {
  date: string | null
  day: number | null
  promises: PromiseToPayRequest[]
  totalAmount: number
}

export default function PromisesPage() {
  const { data: session } = useSession()
  const [devUser, setDevUser] = useState<any>(null)

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

  const email = devUser?.email || session?.user?.email
  const name = devUser?.name || session?.user?.name
  const userInfo = buildUserInfo(email, name, email || '')
  const isAdmin = userInfo.role === 'admin'

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [promises, setPromises] = useState<PromiseToPayRequest[]>([])
  const [weeks, setWeeks] = useState<CommittedCashWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(isoDate(today))
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all')

  const loadPromises = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/promise-to-pay')
      if (response.ok) {
        const data = await response.json()
        setPromises(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to load promises:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPromises()
  }, [loadPromises])

  function prevMonth() {
    if (month === 1) {
      setYear(y => y - 1)
      setMonth(12)
    } else {
      setMonth(m => m - 1)
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear(y => y + 1)
      setMonth(1)
    } else {
      setMonth(m => m + 1)
    }
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
    setSelectedDate(isoDate(today))
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)

  // Build calendar cells
  const cells: DayData[] = []

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ date: null, day: null, promises: [], totalAmount: 0 })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dateStr = isoDate(date)
    const dayPromises = promises.filter(
      p => p.promisedDate === dateStr && (filterStatus === 'all' || p.status === filterStatus)
    )
    const totalAmount = dayPromises.reduce((sum, p) => sum + p.amount, 0)

    cells.push({
      date: dateStr,
      day: d,
      promises: dayPromises,
      totalAmount,
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null, promises: [], totalAmount: 0 })
  }

  const selectedDatePromises = selectedDate
    ? promises.filter(
        p => p.promisedDate === selectedDate && (filterStatus === 'all' || p.status === filterStatus)
      )
    : []

  const selectedDateAmount = selectedDatePromises.reduce((sum, p) => sum + p.amount, 0)

  const todayStr = isoDate(today)
  const monthPromises = promises.filter(p => {
    const d = new Date(p.promisedDate)
    return d.getFullYear() === year && d.getMonth() + 1 === month && (filterStatus === 'all' || p.status === filterStatus)
  })

  const monthTotal = monthPromises.reduce((sum, p) => sum + p.amount, 0)
  const monthApproved = monthPromises.filter(p => p.status === 'approved').length
  const monthPending = monthPromises.filter(p => p.status === 'pending').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Handshake className="h-8 w-8 text-green-600" />
            Promises-to-Pay Calendar
          </h1>
          <p className="text-slate-600 mt-1">
            Track committed customer payments and promised payment dates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={loadPromises}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'approved'] as const).map(status => {
          const count = monthPromises.filter(p => status === 'all' || p.status === status).length
          const label = status === 'all' ? 'All' : status === 'pending' ? 'Pending' : 'Approved'
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Calendar Grid */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">{monthName(month, year)}</CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {loading ? (
              <div className="grid grid-cols-7 gap-px p-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {cells.map((cell, idx) => {
                  if (!cell.date || !cell.day) {
                    return <div key={`empty-${idx}`} className="bg-slate-50 min-h-[80px]" />
                  }

                  const isToday = cell.date === todayStr
                  const isSelected = cell.date === selectedDate
                  const hasPromises = cell.promises.length > 0

                  return (
                    <button
                      key={cell.date}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`min-h-[80px] p-2 flex flex-col items-start text-left transition-all focus:outline-none
                        ${isSelected ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-white hover:bg-slate-50'}
                        ${hasPromises && !isSelected ? 'ring-1 ring-green-200' : ''}
                      `}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isToday ? 'bg-slate-900 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-slate-600'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasPromises && (
                        <>
                          <div className="mt-1 flex gap-0.5">
                            {cell.promises.map(p => (
                              <span
                                key={p.invoiceId}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.status === 'approved' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-green-700 font-semibold mt-1">
                            ${(cell.totalAmount / 1000).toFixed(0)}K
                          </p>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Selected Day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Select a day'}
              </CardTitle>
              {selectedDate && selectedDateAmount > 0 && (
                <p className="text-xs text-slate-500">${selectedDateAmount.toLocaleString()} · {selectedDatePromises.length} promise{selectedDatePromises.length !== 1 ? 's' : ''}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedDate && selectedDatePromises.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No promises on this day</p>
              )}
              {!selectedDate && (
                <p className="text-sm text-slate-400 text-center py-4">Click a day to see promises</p>
              )}
              <div className="space-y-2">
                {selectedDatePromises.map(promise => (
                  <div
                    key={promise.invoiceId}
                    className="p-2 border rounded-lg bg-slate-50 hover:bg-slate-100"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {promise.customerName}
                        </p>
                        <p className="text-[10px] text-slate-500">{promise.invoiceNumber}</p>
                      </div>
                      <Badge
                        className={`text-[10px] flex-shrink-0 ${
                          promise.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : promise.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {promise.status}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      ${promise.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{promise.requestedBy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Month Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {monthName(month, year)} Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  ${(monthTotal / 1000).toFixed(1)}K
                </p>
                <p className="text-[11px] text-green-600 mt-0.5">Total Committed</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-lg p-2 border">
                  <p className="text-lg font-bold text-slate-900">{monthApproved}</p>
                  <p className="text-[10px] text-slate-600">Approved</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                  <p className="text-lg font-bold text-yellow-700">{monthPending}</p>
                  <p className="text-[10px] text-yellow-600">Pending</p>
                </div>
              </div>

              {monthPromises.some(p => isPromiseExpired(p)) && (
                <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {monthPromises.filter(p => isPromiseExpired(p)).length} Expired
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
