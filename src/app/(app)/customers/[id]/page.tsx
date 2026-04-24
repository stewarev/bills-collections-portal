'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Phone, Mail, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'
import { EscalationContacts } from '@/components/shared/escalation-contacts'
import { getDSOStatusColor, getDSOStatusLabel } from '@/lib/calculations/dso'

const segmentColors: Record<string, string> = {
  'Bronze': 'bg-orange-100 text-orange-800',
  'Silver': 'bg-slate-100 text-slate-800',
  'Regular': 'bg-blue-100 text-blue-800',
  'Hyper-care': 'bg-red-100 text-red-800',
  'Finance Action': 'bg-purple-100 text-purple-800',
}

interface CustomerDetail {
  id: string
  name: string
  companyName: string
  email: string
  phone: string
  segment: string
  assignedRepId: string
  assignedRepName: string
  status: string
  lastPaymentDate?: string
  lastContactedAt?: string
  totalOutstanding: number
  invoiceCount: number
  averageDaysOutstanding: number
  totalBilled: number
  daysToPayAvg: number
  dso?: number
  customerDSOImpact?: number
  invoices?: Array<{ id: string; number: string; amount: number; dueDate: string; status: string; daysOverdue: number }>
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/customers/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Customer not found')
          } else {
            setError('Failed to load customer')
          }
          return
        }
        const data = await response.json()
        setCustomer(data)
      } catch (error) {
        console.error('Failed to load customer:', error)
        setError('Failed to load customer')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Link href="/customers" className="flex items-center gap-1 text-sm text-blue-600 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
        <p className="text-slate-500">{error || 'Customer not found.'}</p>
      </div>
    )
  }

  const outstanding = customer.totalOutstanding
  const invoiceCount = customer.invoiceCount
  const avgDaysOutstanding = customer.averageDaysOutstanding

  return (
    <div className="p-6 space-y-6">
      {/* Back nav */}
      <Link href="/customers" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 inline-block">
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-slate-500 mt-1">{customer.companyName}</p>
          </div>
          <Badge className={`text-sm ${segmentColors[customer.segment]}`}>
            {customer.segment}
          </Badge>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-slate-600">
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 hover:text-blue-600">
              <Mail className="h-4 w-4" />
              {customer.email}
            </a>
          )}
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 hover:text-blue-600">
              <Phone className="h-4 w-4" />
              {customer.phone}
            </a>
          )}
        </div>
      </div>

      {/* AR Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Outstanding AR</p>
              <p className="text-2xl font-bold text-slate-900">${(outstanding / 1000).toFixed(1)}K</p>
            </div>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Invoice Count</p>
            <p className="text-2xl font-bold text-slate-900">{invoiceCount}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Avg Days Outstanding</p>
              <p className="text-2xl font-bold text-slate-900">{Math.round(avgDaysOutstanding)}d</p>
            </div>
            {avgDaysOutstanding > 60 && <AlertCircle className="h-5 w-5 text-red-500" />}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="invoices">Invoices {invoiceCount > 0 && <span className="ml-2 text-xs">{invoiceCount}</span>}</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
          <TabsTrigger value="tickets">Linear Tickets</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Company Name" value={customer.companyName} />
              <Field label="Contact Name" value={customer.name} />
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone} />
              <Field label="Assigned Rep" value={customer.assignedRepName} />
              <Field label="Segment" value={customer.segment} />
              <Field label="Status" value={customer.status} />
              {customer.lastContactedAt && (
                <Field
                  label="Last Contacted"
                  value={new Date(customer.lastContactedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                />
              )}
            </div>
          </Card>

          {/* DSO Metrics Card */}
          {customer.dso !== undefined && (
            <Card className={`p-6 ${getDSOStatusColor(customer.dso).replace('text-', 'border-').replace('bg-', 'bg-')}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    DSO Impact
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Customer's DSO Contribution</p>
                      <p className={`text-2xl font-bold ${getDSOStatusColor(customer.dso)}`}>
                        {customer.customerDSOImpact ? `${customer.customerDSOImpact.toFixed(1)} days` : 'Calculating...'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Company DSO</p>
                      <p className="text-lg font-semibold text-slate-900">{customer.dso.toFixed(1)} days</p>
                      <p className={`text-xs font-medium mt-1 ${getDSOStatusColor(customer.dso)}`}>
                        {getDSOStatusLabel(customer.dso)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-4 pt-4 border-t border-slate-200">
                This customer represents ${(outstanding / 1000).toFixed(1)}K of the company's ${((outstanding / customer.invoiceCount) * 100).toFixed(0)}K average outstanding AR.
              </p>
            </Card>
          )}

        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {customer.invoices && customer.invoices.length > 0 ? (
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Invoice #</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{inv.number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{new Date(inv.dueDate).toLocaleDateString('en-CA')}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">${inv.amount.toLocaleString()}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{inv.status}</Badge></td>
                      <td className={`py-3 px-4 text-sm font-medium ${inv.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : 'Current'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500">No invoices found.</Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="p-8 text-center text-slate-500">
            Payments integration coming soon. Week 4 feature.
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <Card className="p-8 text-center text-slate-500">
            Collection action log coming soon. Week 4 feature.
          </Card>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation">
          <EscalationContacts customerId={customer.id} />
        </TabsContent>

        {/* Linear Tickets Tab */}
        <TabsContent value="tickets">
          <Card className="p-8 text-center text-slate-500">
            Linear tickets integration coming soon. Week 5 feature.
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-900">{value || <span className="text-slate-400 italic">—</span>}</p>
    </div>
  )
}
