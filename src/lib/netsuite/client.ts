/**
 * NetSuite REST API Client
 *
 * Currently using mock data. In Week 2+, swap this to real NetSuite API calls.
 *
 * Real implementation will:
 * - Use OAuth2 or API token for authentication
 * - Query NetSuite's REST API for invoices and payments
 * - Handle pagination and error handling
 */

export const REPS = [
  { id: 'rep-001', name: 'Sajjad' },
  { id: 'rep-002', name: 'Yuliia' },
  { id: 'rep-003', name: 'Baz' },
  { id: 'rep-004', name: 'Rakshita' },
]

interface NetSuiteConfig {
  accountId: string
  apiToken: string
  apiSecret: string
}

export class NetSuiteClient {
  private config: NetSuiteConfig

  constructor(config: NetSuiteConfig) {
    this.config = config
  }

  /**
   * Fetch outstanding invoices from NetSuite
   * Mock implementation returns sample data
   */
  async fetchOutstandingInvoices() {
    // TODO: Replace with real NetSuite API call
    // const response = await fetch(`https://${this.config.accountId}.suiteapis.com/services/rest/record/v1/salesorder`, ...)

    return [
      {
        id: 'inv-001',
        invoiceNumber: 'INV-2024-001',
        customerId: 'cust-001',
        customerName: 'Acme Corp',
        amount: 25000,
        dueDate: '2026-04-10',
        invoiceDate: '2026-03-10',
        paymentStatus: 'Outstanding',
        days_overdue: 5,
        assigned_rep_id: 'rep-001',
        assigned_rep_name: 'Sajjad',
        disputeStatus: 'none' as const,
        excludeFromDSO: false,
      },
      {
        id: 'inv-002',
        invoiceNumber: 'INV-2024-002',
        customerId: 'cust-002',
        customerName: 'Tech Innovations',
        amount: 15000,
        dueDate: '2026-04-20',
        invoiceDate: '2026-03-20',
        paymentStatus: 'Outstanding',
        days_overdue: 0,
        assigned_rep_id: 'rep-002',
        assigned_rep_name: 'Yuliia',
        disputeStatus: 'none' as const,
        excludeFromDSO: false,
      },
      {
        id: 'inv-003',
        invoiceNumber: 'INV-2024-003',
        customerId: 'cust-001',
        customerName: 'Acme Corp',
        amount: 8500,
        dueDate: '2026-03-15',
        invoiceDate: '2026-02-15',
        paymentStatus: 'Outstanding',
        days_overdue: 31,
        assigned_rep_id: 'rep-001',
        assigned_rep_name: 'Sajjad',
        disputeStatus: 'disputed' as const,
        excludeFromDSO: false,
      },
      {
        id: 'inv-004',
        invoiceNumber: 'INV-2024-004',
        customerId: 'cust-003',
        customerName: 'Global Solutions',
        amount: 32000,
        dueDate: '2026-02-28',
        invoiceDate: '2026-01-28',
        paymentStatus: 'Outstanding',
        days_overdue: 76,
        assigned_rep_id: 'rep-003',
        assigned_rep_name: 'Baz',
        disputeStatus: 'none' as const,
        excludeFromDSO: false,
      },
      {
        id: 'inv-005',
        invoiceNumber: 'INV-2024-005',
        customerId: 'cust-004',
        customerName: 'Enterprise Ltd',
        amount: 18000,
        dueDate: '2026-03-25',
        invoiceDate: '2026-02-25',
        paymentStatus: 'Outstanding',
        days_overdue: 21,
        assigned_rep_id: 'rep-004',
        assigned_rep_name: 'Rakshita',
        disputeStatus: 'in_review' as const,
        excludeFromDSO: false,
      },
    ]
  }

  /**
   * Fetch payments received
   * Mock implementation returns sample data
   */
  async fetchRecentPayments() {
    // TODO: Replace with real NetSuite API call

    return [
      {
        id: 'pay-001',
        invoiceId: 'inv-006',
        customerId: 'cust-005',
        amount: 12000,
        receivedDate: '2026-04-12',
      },
      {
        id: 'pay-002',
        invoiceId: 'inv-007',
        customerId: 'cust-002',
        amount: 15000,
        receivedDate: '2026-04-10',
      },
    ]
  }
}

export function createNetSuiteClient(): NetSuiteClient {
  return new NetSuiteClient({
    accountId: process.env.NETSUITE_ACCOUNT_ID || 'demo',
    apiToken: process.env.NETSUITE_API_TOKEN || 'demo',
    apiSecret: process.env.NETSUITE_API_SECRET || 'demo',
  })
}
