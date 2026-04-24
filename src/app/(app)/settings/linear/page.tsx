'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LinearSettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = async () => {
    if (!apiKey || !workspaceId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/integrations/linear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, workspaceId }),
      })

      if (response.ok) {
        alert('✓ Linear configuration saved successfully')
      } else {
        const error = await response.json()
        alert(`✗ Error: ${error.error || 'Failed to save configuration'}`)
      }
    } catch (error) {
      alert('✗ Error saving configuration. Check your credentials.')
      console.error(error)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      // TODO: Implement API call to test Linear connection
      const response = await fetch('/api/integrations/linear/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, workspaceId }),
      })
      if (response.ok) {
        alert('✓ Linear connection successful!')
      } else {
        alert('✗ Linear connection failed. Check your credentials.')
      }
    } catch (error) {
      alert('✗ Error testing connection')
      console.error(error)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Linear Configuration</h1>
        <p className="text-slate-600 mt-1">
          Configure your Linear API key to display customer issues and context
        </p>
      </div>

      {/* Config Card */}
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="lin_api_..."
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-slate-500 mt-1">
            Get this from Linear Settings &gt; API &gt; Create API Key
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Workspace ID
          </label>
          <input
            type="text"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            placeholder="e.g., GD (your workspace key)"
            className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-slate-500 mt-1">
            Your Linear workspace key (visible in URLs like linear.app/GD/...)
          </p>
        </div>

        <div className="pt-4 space-y-2">
          <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">
            Save Configuration
          </Button>
          <Button
            onClick={handleTest}
            disabled={isTesting || !apiKey || !workspaceId}
            variant="outline"
            className="w-full"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Once configured, customer issues from Linear will appear on customer detail pages
        </p>
      </Card>
    </div>
  )
}
