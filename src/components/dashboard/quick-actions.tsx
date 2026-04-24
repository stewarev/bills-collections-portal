'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, DollarSign, AlertTriangle, Clock, Plus } from 'lucide-react'

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href="/customers">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-12 flex flex-col items-center justify-center gap-1.5"
            >
              <Phone className="h-4 w-4" />
              <span className="text-xs text-center">Log Call</span>
            </Button>
          </Link>

          <Link href="/invoices">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-12 flex flex-col items-center justify-center gap-1.5"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-xs text-center">Mark Paid</span>
            </Button>
          </Link>

          <Link href="/customers">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-12 flex flex-col items-center justify-center gap-1.5"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs text-center">Escalate</span>
            </Button>
          </Link>

          <Link href="/customers">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-12 flex flex-col items-center justify-center gap-1.5"
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs text-center">Promise-to-Pay</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
