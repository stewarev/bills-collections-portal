'use client'

import { Phone, Mail, Globe, Building2, Briefcase, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface AccountDetailsField {
  label: string
  value: string
  icon?: React.ReactNode
}

interface AccountDetailsCardProps {
  title?: string
  leftColumn: AccountDetailsField[]
  rightColumn: AccountDetailsField[]
}

export function AccountDetailsCard({
  title = 'Account Details',
  leftColumn,
  rightColumn,
}: AccountDetailsCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <div className="p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">
          {title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column */}
          <div className="space-y-6">
            {leftColumn.map((field, idx) => (
              <div key={idx}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {field.label}
                </label>
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2 hover:border-blue-300 transition-colors">
                  {field.icon && (
                    <div className="text-slate-400 flex-shrink-0">{field.icon}</div>
                  )}
                  <p className="text-sm text-slate-900 font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {rightColumn.map((field, idx) => (
              <div key={idx}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {field.label}
                </label>
                <div className="flex items-center gap-3 border-b border-slate-200 pb-2 hover:border-blue-300 transition-colors">
                  {field.icon && (
                    <div className="text-slate-400 flex-shrink-0">{field.icon}</div>
                  )}
                  <p className="text-sm text-slate-900 font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Icon constants for easy use
export const ACCOUNT_ICONS = {
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
  type: <Briefcase className="h-4 w-4" />,
  industry: <Zap className="h-4 w-4" />,
}
