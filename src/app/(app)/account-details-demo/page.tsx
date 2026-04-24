'use client'

import { AccountDetailsCard, ACCOUNT_ICONS } from '@/components/ui/account-details-card'

export default function AccountDetailsDemoPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Details Demo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Style experiment with minimal bottom-border aesthetic</p>
      </div>

      {/* Demo 1: Company Account */}
      <AccountDetailsCard
        title="Company Account Details"
        leftColumn={[
          {
            label: 'Company Name',
            value: 'GoBolt Inc.',
            icon: ACCOUNT_ICONS.company,
          },
          {
            label: 'Account Type',
            value: 'Business',
            icon: ACCOUNT_ICONS.type,
          },
          {
            label: 'Industry',
            value: 'Logistics & Fulfillment',
            icon: ACCOUNT_ICONS.industry,
          },
        ]}
        rightColumn={[
          {
            label: 'Phone',
            value: '(555) 123-4567',
            icon: ACCOUNT_ICONS.phone,
          },
          {
            label: 'Email',
            value: 'hello@gobolt.com',
            icon: ACCOUNT_ICONS.email,
          },
          {
            label: 'Website',
            value: 'www.gobolt.com',
            icon: ACCOUNT_ICONS.website,
          },
        ]}
      />

      {/* Demo 2: Customer Account */}
      <AccountDetailsCard
        title="Customer Account Details"
        leftColumn={[
          {
            label: 'Customer Name',
            value: 'Acme Corporation',
            icon: ACCOUNT_ICONS.company,
          },
          {
            label: 'Account Type',
            value: 'Enterprise',
            icon: ACCOUNT_ICONS.type,
          },
          {
            label: 'Industry',
            value: 'Manufacturing',
            icon: ACCOUNT_ICONS.industry,
          },
        ]}
        rightColumn={[
          {
            label: 'Phone',
            value: '(753) 633-5522',
            icon: ACCOUNT_ICONS.phone,
          },
          {
            label: 'Email',
            value: 'info@acmecorp.com',
            icon: ACCOUNT_ICONS.email,
          },
          {
            label: 'Website',
            value: 'www.acmecorp.com',
            icon: ACCOUNT_ICONS.website,
          },
        ]}
      />

      {/* Demo 3: No Icons */}
      <AccountDetailsCard
        title="Account Details (No Icons)"
        leftColumn={[
          {
            label: 'Account Name',
            value: 'TechStart Labs',
          },
          {
            label: 'Account Type',
            value: 'Startup',
          },
          {
            label: 'Industry',
            value: 'Software Development',
          },
        ]}
        rightColumn={[
          {
            label: 'Phone',
            value: '(555) 987-6543',
          },
          {
            label: 'Email',
            value: 'contact@techstart.com',
          },
          {
            label: 'Website',
            value: 'www.techstart.dev',
          },
        ]}
      />

      {/* Design Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-12">
        <h3 className="font-semibold text-blue-900 mb-3">Design Features</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✓ Minimal bottom-border aesthetic (not full borders)</li>
          <li>✓ Blue/slate color scheme matching app design</li>
          <li>✓ Lucide React icons for modern look</li>
          <li>✓ Two-column responsive grid (stacks on mobile)</li>
          <li>✓ Read-only display with hover effects</li>
          <li>✓ Reusable component with flexible field structure</li>
          <li>✓ Optional icon support</li>
        </ul>
      </div>

      {/* Styling Notes */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-3">Component Props</h3>
        <pre className="text-xs bg-white p-4 rounded border border-slate-200 overflow-x-auto">
{`interface AccountDetailsCardProps {
  title?: string              // Card title (default: "Account Details")
  leftColumn: AccountDetailsField[]  // Left column fields
  rightColumn: AccountDetailsField[] // Right column fields
}

interface AccountDetailsField {
  label: string      // Field label (shown uppercase)
  value: string      // Field value
  icon?: ReactNode   // Optional icon (use ACCOUNT_ICONS const)
}`}
        </pre>
      </div>
    </div>
  )
}
