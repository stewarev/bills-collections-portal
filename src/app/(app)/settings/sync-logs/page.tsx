'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface SyncLog {
  id: string
  source: 'NetSuite' | 'Linear'
  status: 'success' | 'error' | 'in-progress'
  started_at: string
  completed_at: string | null
  records_synced: number
  error_message: string | null
}

const MOCK_SYNC_LOGS: SyncLog[] = [
  {
    id: '1',
    source: 'NetSuite',
    status: 'success',
    started_at: '2024-04-16T03:00:00Z',
    completed_at: '2024-04-16T03:15:32Z',
    records_synced: 487,
    error_message: null,
  },
  {
    id: '2',
    source: 'Linear',
    status: 'success',
    started_at: '2024-04-16T03:16:00Z',
    completed_at: '2024-04-16T03:18:45Z',
    records_synced: 23,
    error_message: null,
  },
  {
    id: '3',
    source: 'NetSuite',
    status: 'success',
    started_at: '2024-04-15T03:00:00Z',
    completed_at: '2024-04-15T03:14:12Z',
    records_synced: 482,
    error_message: null,
  },
  {
    id: '4',
    source: 'Linear',
    status: 'error',
    started_at: '2024-04-15T03:15:00Z',
    completed_at: '2024-04-15T03:15:30Z',
    records_synced: 0,
    error_message: 'API rate limit exceeded',
  },
]

export default function SyncLogsPage() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(MOCK_SYNC_LOGS)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-CA')
  }

  const getDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return '—'
    const start = new Date(startedAt).getTime()
    const end = new Date(completedAt).getTime()
    const minutes = Math.floor((end - start) / 60000)
    const seconds = Math.floor(((end - start) % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Sync Logs</h1>
        <p className="text-slate-600 mt-1">
          View history of all data syncs from NetSuite and Linear
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Last NetSuite Sync</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {formatDate(MOCK_SYNC_LOGS[0].completed_at || MOCK_SYNC_LOGS[0].started_at)}
          </p>
          <p className="text-xs text-green-600 mt-1">✓ Success</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Last Linear Sync</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {formatDate(MOCK_SYNC_LOGS[1].completed_at || MOCK_SYNC_LOGS[1].started_at)}
          </p>
          <p className="text-xs text-green-600 mt-1">✓ Success</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Syncs</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{syncLogs.length}</p>
          <p className="text-xs text-slate-600 mt-1">across all sources</p>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Source</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Started</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Records</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Message</th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.map(log => (
                <tr key={log.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm font-medium text-slate-900">{log.source}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                      {log.status === 'success' && '✓ Success'}
                      {log.status === 'error' && '✗ Error'}
                      {log.status === 'in-progress' && '⏳ In Progress'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {formatDate(log.started_at)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {getDuration(log.started_at, log.completed_at)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-slate-900 text-right">
                    {log.records_synced}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {log.error_message ? (
                      <span className="text-red-600">{log.error_message}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
