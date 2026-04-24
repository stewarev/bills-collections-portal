'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MissingInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  invoiceDate: string
  lastAttemptedSync?: string
  syncError?: string
}

interface MissingInvoicesAlertProps {
  isAdmin?: boolean
}

export function MissingInvoicesAlert({ isAdmin = false }: MissingInvoicesAlertProps) {
  const [missingCount, setMissingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [missingInvoices, setMissingInvoices] = useState<MissingInvoice[]>([])

  async function loadMissingInvoices() {
    setLoading(true)
    try {
      const response = await fetch('/api/missing-invoices')
      if (response.ok) {
        const data = await response.json()
        setMissingCount(data.count)
        setMissingInvoices(data.missingInvoices)
      }
    } catch (error) {
      console.error('Failed to load missing invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMissingInvoices()
    // Check for missing invoices every 5 minutes
    const interval = setInterval(loadMissingInvoices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (dismissed || (missingCount === 0 && !expanded)) {
    return null
  }

  return (
    <Card className={`border-amber-300 bg-amber-50 ${missingCount > 0 ? 'ring-1 ring-amber-200' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900">
                {missingCount > 0 ? 'Invoices Pending Sync' : 'Workbook Sync Status'}
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {missingCount > 0
                  ? `${missingCount} invoice${missingCount !== 1 ? 's' : ''} in build_invoicing_workbook not yet synced to NetSuite.`
                  : 'All invoices are synced. Workbook sync is current.'}
              </p>

              {missingCount > 0 && expanded && missingInvoices.length > 0 && (
                <div className="mt-3 space-y-2 text-xs">
                  {missingInvoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
                      <div>
                        <p className="font-mono text-amber-900">{inv.invoiceNumber}</p>
                        <p className="text-amber-700">{inv.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-amber-900">${(inv.amount / 1000).toFixed(1)}K</p>
                        {inv.syncError && (
                          <p className="text-red-600 text-xs mt-0.5">{inv.syncError}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {missingInvoices.length > 5 && (
                    <p className="text-amber-700 text-xs italic">
                      +{missingInvoices.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {missingCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-amber-700 hover:bg-amber-100"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Hide' : 'Show'} details
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100"
              onClick={loadMissingInvoices}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {missingCount === 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-amber-700 hover:bg-amber-100"
                onClick={() => setDismissed(true)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
