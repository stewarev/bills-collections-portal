'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  Clock,
  GitBranch,
  DollarSign,
  RefreshCw,
  ExternalLink,
  User,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type CalendarEventType = 'ar_deadline' | 'aging_flag' | 'linear_task' | 'promise_due'

interface CalendarEvent {
  id: string
  date: string
  type: CalendarEventType
  title: string
  subtitle?: string
  repName?: string
  customerId?: string
  customerName?: string
  amount?: number
  urgency?: 'critical' | 'high' | 'medium' | 'low'
  meta?: Record<string, string | number | boolean>
}

interface CalendarResponse {
  events: CalendarEvent[]
  byDate: Record<string, CalendarEvent[]>
  meta: {
    year: number
    month: number
    counts: {
      ar_deadline: number
      aging_flag: number
      linear_task: number
      promise_due: number
      total: number
    }
  }
}

// ─── Styling helpers ─────────────────────────────────────────────────────────

const EVENT_COLORS: Record<CalendarEventType, { dot: string; badge: string; bg: string; border: string; icon: React.ElementType }> = {
  ar_deadline: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    icon: Clock,
  },
  aging_flag: {
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 border-red-200',
    bg: 'bg-red-50',
    border: 'border-l-red-500',
    icon: TrendingUp,
  },
  linear_task: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    icon: GitBranch,
  },
  promise_due: {
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 border-green-200',
    bg: 'bg-green-50',
    border: 'border-l-green-500',
    icon: DollarSign,
  },
}

const EVENT_LABELS: Record<CalendarEventType, string> = {
  ar_deadline: 'Follow-up',
  aging_flag: 'Aging Flag',
  linear_task: 'Linear Task',
  promise_due: 'PTP Due',
}

const URGENCY_RING: Record<string, string> = {
  critical: 'ring-2 ring-red-400',
  high: 'ring-1 ring-orange-300',
  medium: '',
  low: '',
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function monthName(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay() // 0=Sun, 6=Sat
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function EventDots({ events }: { events: CalendarEvent[] }) {
  // Show up to 3 dots, then "+N"
  const types = [...new Set(events.map(e => e.type))]
  const hasCritical = events.some(e => e.urgency === 'critical')

  return (
    <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
      {types.slice(0, 3).map(type => (
        <span
          key={type}
          className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[type].dot} ${hasCritical && type === 'aging_flag' ? 'animate-pulse' : ''}`}
        />
      ))}
      {events.length > 3 && (
        <span className="text-[9px] text-slate-500 leading-none">+{events.length - 3}</span>
      )}
    </div>
  )
}

function EventCard({ event }: { event: CalendarEvent }) {
  const config = EVENT_COLORS[event.type]
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${config.border} ${config.bg} border border-transparent`}>
      <div className={`p-1.5 rounded ${config.badge} flex-shrink-0`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900 leading-tight">{event.title}</p>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${config.badge}`}>
            {EVENT_LABELS[event.type]}
          </Badge>
        </div>
        {event.subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {event.repName && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <User className="h-3 w-3" />
              {event.repName}
            </span>
          )}
          {event.amount && (
            <span className="text-xs font-medium text-slate-700">
              ${event.amount.toLocaleString()}
            </span>
          )}
          {event.urgency && event.urgency !== 'low' && (
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
              event.urgency === 'critical' ? 'bg-red-100 text-red-700' :
              event.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {event.urgency}
            </span>
          )}
          {event.customerId && (
            <Link
              href={`/customers/${event.customerId}`}
              className="ml-auto flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
            >
              View <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1) // 1-indexed
  const [data, setData] = useState<CalendarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(isoDate(today))
  const [filterType, setFilterType] = useState<CalendarEventType | 'all'>('all')

  const loadEvents = useCallback(async (y: number, m: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar-events?year=${y}&month=${m}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load calendar events', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents(year, month)
  }, [year, month, loadEvents])

  // ── Navigation ────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth() + 1)
    setSelectedDate(isoDate(today))
  }

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month) // 0=Sun

  // Build grid cells (up to 42 = 6 weeks)
  const cells: Array<{ date: string | null; day: number | null }> = []

  // Leading empty cells
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ date: null, day: null })
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    cells.push({ date: isoDate(date), day: d })
  }

  // Trailing empty cells to complete the last row
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null })
  }

  const byDate = data?.byDate || {}
  const todayStr = isoDate(today)

  // Filter events for selected day
  const selectedEvents = selectedDate
    ? (byDate[selectedDate] || []).filter(e => filterType === 'all' || e.type === filterType)
    : []

  // Month summary counts
  const counts = data?.meta.counts

  // Events for the whole visible month (for summary)
  const allMonthEvents = Object.entries(byDate)
    .filter(([date]) => {
      const d = new Date(date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })
    .flatMap(([, evts]) => evts)

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-slate-600" />
            AR Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Follow-ups · Aging flags · Promise dates · Linear tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => loadEvents(year, month)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Legend + Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {(Object.entries(EVENT_COLORS) as [CalendarEventType, typeof EVENT_COLORS[CalendarEventType]][]).map(([type, cfg]) => {
          const Icon = cfg.icon
          const count = allMonthEvents.filter(e => e.type === type).length
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'all' : type)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                filterType === type || filterType === 'all'
                  ? cfg.badge
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {EVENT_LABELS[type]}
              {count > 0 && <span className="font-bold">{count}</span>}
            </button>
          )
        })}
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            Show all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Calendar grid ──────────────────────────────────────────────── */}
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
            {/* Day-of-week headers */}
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
                  <Skeleton key={i} className="h-16 rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-px bg-slate-100 border-t border-slate-100">
                {cells.map((cell, idx) => {
                  if (!cell.date || !cell.day) {
                    return <div key={`empty-${idx}`} className="bg-slate-50 min-h-[72px]" />
                  }

                  const dayEvents = (byDate[cell.date] || []).filter(
                    e => filterType === 'all' || e.type === filterType
                  )
                  const isToday = cell.date === todayStr
                  const isSelected = cell.date === selectedDate
                  const hasCritical = dayEvents.some(e => e.urgency === 'critical')

                  return (
                    <button
                      key={cell.date}
                      onClick={() => setSelectedDate(cell.date)}
                      className={`
                        min-h-[72px] bg-white p-1.5 flex flex-col items-center text-center transition-all
                        hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-300
                        ${isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : ''}
                        ${hasCritical && !isSelected ? 'ring-1 ring-red-200' : ''}
                      `}
                    >
                      <span
                        className={`
                          text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                          ${isToday ? 'bg-slate-900 text-white' : isSelected ? 'text-blue-700 font-bold' : 'text-slate-600'}
                        `}
                      >
                        {cell.day}
                      </span>
                      {dayEvents.length > 0 && <EventDots events={dayEvents} />}
                      {dayEvents.length > 0 && (
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Day Detail Panel ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Selected day header */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })
                  : 'Select a day'}
              </CardTitle>
              {selectedDate && selectedEvents.length > 0 && (
                <p className="text-xs text-slate-500">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
              )}
            </CardHeader>
            <CardContent>
              {selectedDate && selectedEvents.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  {filterType !== 'all' ? 'No events of this type' : 'No events on this day'}
                </p>
              )}
              {!selectedDate && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Click a day to see events
                </p>
              )}
              <div className="space-y-2">
                {selectedEvents.map(evt => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Month-level summary */}
          {!loading && data && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-600">
                  {monthName(month, year)} Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{allMonthEvents.filter(e => e.type === 'ar_deadline').length}</p>
                    <p className="text-[10px] text-blue-600">Follow-ups</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-red-700">{allMonthEvents.filter(e => e.type === 'aging_flag').length}</p>
                    <p className="text-[10px] text-red-600">Aging Flags</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-green-700">{allMonthEvents.filter(e => e.type === 'promise_due').length}</p>
                    <p className="text-[10px] text-green-600">PTP Dates</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-purple-700">{allMonthEvents.filter(e => e.type === 'linear_task').length}</p>
                    <p className="text-[10px] text-purple-600">Linear Tasks</p>
                  </div>
                </div>

                {/* Critical items this month */}
                {allMonthEvents.filter(e => e.urgency === 'critical').length > 0 && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      {allMonthEvents.filter(e => e.urgency === 'critical').length} Critical items
                    </p>
                    <div className="space-y-0.5">
                      {allMonthEvents.filter(e => e.urgency === 'critical').slice(0, 3).map(evt => (
                        <p key={evt.id} className="text-[11px] text-red-600 truncate">
                          · {evt.title} ({evt.date})
                        </p>
                      ))}
                      {allMonthEvents.filter(e => e.urgency === 'critical').length > 3 && (
                        <p className="text-[11px] text-red-500">
                          + {allMonthEvents.filter(e => e.urgency === 'critical').length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Upcoming aging crossings */}
                {(() => {
                  const upcoming = allMonthEvents
                    .filter(e => e.type === 'aging_flag' && e.date >= todayStr)
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 3)
                  if (!upcoming.length) return null
                  return (
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs font-semibold text-orange-700 flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3" />
                        Upcoming Aging Crossings
                      </p>
                      {upcoming.map(evt => (
                        <div key={evt.id} className="flex justify-between items-center text-[11px] text-orange-600">
                          <span className="truncate">{evt.customerName || evt.title}</span>
                          <span className="flex-shrink-0 ml-2">{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
