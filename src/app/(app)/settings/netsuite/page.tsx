'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NetSuiteSettingsPage() {
  const [apiToken, setApiToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [syncSchedule, setSyncSchedule] = useState('daily') // daily, weekly, manual
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSave = async () => {
    if (!apiToken || !accountId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/integrations/netsuite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken, accountId, syncSchedule }),
      })

      if (response.ok) {
        alert('✓ NetSuite configuration saved successfully')
      } else {
        const error = await response.json()
        alert(`✗ Error: ${error.error || 'Failed to save configuration'}`)
      }
    } catch (error) {
      alert('✗ Error saving configuration. Check your credentials.')
      console.error(error)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // TODO: Implement API call to trigger sync
      const response = await fetch('/api/sync/invoices', { method: 'POST' })
      if (response.ok) {
        setLastSyncTime(new Date().toISOString())
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">NetSuite Configuration</h1>
        <p className="text-slate-600 mt-1">
          Configure your NetSuite connection to sync invoices and payments
        </p>
      </div>

      {/* Config Card */}
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            API Token
          </label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Enter your NetSuite API token"
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-slate-500 mt-1">
            Get this from NetSuite Admin &gt; Integration &gt; API Keys
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Account ID
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="e.g., 1234567"
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-slate-500 mt-1">
            Your NetSuite account ID (visible in the URL when logged in)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Sync Schedule
          </label>
          <select
            value={syncSchedule}
            onChange={(e) => setSyncSchedule(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="manual">Manual Only</option>
            <option value="daily">Daily (3 AM UTC)</option>
            <option value="weekly">Weekly (Sundays 3 AM UTC)</option>
          </select>
        </div>

        <div className="pt-4 space-y-2">
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
            Save Configuration
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            variant="outline"
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </Card>

      {/* Last Sync Info */}
      {lastSyncTime && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800">
            ✓ Last sync: {new Date(lastSyncTime).toLocaleString()}
          </p>
        </Card>
      )}
    </div>
  )
}
