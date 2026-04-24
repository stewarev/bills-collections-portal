'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Loader2 } from 'lucide-react'

interface PromiseToPayModalProps {
  invoiceId: string
  invoiceNumber: string
  customerName: string
  amount: number
  onClose: () => void
  onSuccess?: () => void
}

export function PromiseToPayModal({
  invoiceId,
  invoiceNumber,
  customerName,
  amount,
  onClose,
  onSuccess,
}: PromiseToPayModalProps) {
  const { data: session } = useSession()
  const [promisedDate, setPromisedDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!promisedDate) {
      setError('Please select a promised payment date')
      return
    }

    if (!expiryDate) {
      setError('Please select a promise expiry date')
      return
    }

    if (new Date(expiryDate) < new Date(promisedDate)) {
      setError('Expiry date must be on or after the promised payment date')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/promise-to-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          promisedDate,
          expiryDate,
          repName: session?.user?.name || 'Unknown',
          repId: session?.user?.email || 'unknown',
          notes: notes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit promise-to-pay request')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <Card className="w-full md:w-96 rounded-none md:rounded-lg md:ml-auto md:mr-0 md:mb-0 md:mt-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Promise-to-Pay Request</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Invoice Details */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200 space-y-1">
            <p className="text-xs font-medium text-blue-900 uppercase">Invoice</p>
            <p className="text-sm font-mono text-blue-900">{invoiceNumber}</p>
            <p className="text-sm text-blue-900">{customerName}</p>
            <p className="text-sm font-semibold text-blue-900">${(amount / 1000).toFixed(1)}K</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Promised Date & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Promised Payment Date *
              </label>
              <input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-slate-500 mt-1">
                Customer promises to pay by
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Promise Expires *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-slate-500 mt-1">
                Promise void after this date
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Customer will receive funds on Friday..."
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center pt-2">
            This request will be sent to the admin for approval
          </p>
        </form>
      </Card>
    </div>
  )
}
