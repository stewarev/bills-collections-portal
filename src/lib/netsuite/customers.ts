import { fetchOutstandingInvoices } from './invoices'

export interface Customer {
  id: string
  name: string
  companyName: string
  email: string
  phone: string
  segment: 'Bronze' | 'Silver' | 'Regular' | 'Hyper-care' | 'Finance Action'
  assignedRepId: string
  assignedRepName: string
  status: 'Active' | 'Inactive'
  lastPaymentDate?: string
  lastContactedAt?: string
}

export interface CustomerDetail extends Customer {
  totalOutstanding: number
  invoiceCount: number
  averageDaysOutstanding: number
  totalBilled: number
  daysToPayAvg: number
  invoices?: Array<{ id: string; number: string; amount: number; dueDate: string; status: string; daysOverdue: number }>
}

// Mock customer data
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'John Smith',
    companyName: 'Acme Corp',
    email: 'john@acmecorp.com',
    phone: '(555) 123-4567',
    segment: 'Regular',
    assignedRepId: 'rep-001',
    assignedRepName: 'Sajjad',
    status: 'Active',
    lastPaymentDate: '2026-03-20',
    lastContactedAt: '2026-04-10',
  },
  {
    id: 'cust-002',
    name: 'Sarah Johnson',
    companyName: 'Tech Innovations',
    email: 'sarah@techinnovations.com',
    phone: '(555) 234-5678',
    segment: 'Silver',
    assignedRepId: 'rep-002',
    assignedRepName: 'Yuliia',
    status: 'Active',
    lastPaymentDate: '2026-03-15',
    lastContactedAt: '2026-04-08',
  },
  {
    id: 'cust-003',
    name: 'Michael Chen',
    companyName: 'Global Solutions',
    email: 'michael@globalsolutions.com',
    phone: '(555) 345-6789',
    segment: 'Hyper-care',
    assignedRepId: 'rep-003',
    assignedRepName: 'Baz',
    status: 'Active',
    lastPaymentDate: '2026-02-01',
    lastContactedAt: '2026-03-25',
  },
  {
    id: 'cust-004',
    name: 'Lisa Anderson',
    companyName: 'Enterprise Ltd',
    email: 'lisa@enterpriseltd.com',
    phone: '(555) 456-7890',
    segment: 'Regular',
    assignedRepId: 'rep-004',
    assignedRepName: 'Rakshita',
    status: 'Active',
    lastPaymentDate: '2026-03-10',
    lastContactedAt: '2026-04-05',
  },
]

/**
 * Fetch all customers
 */
export async function fetchCustomers(filters?: {
  status?: string
  segment?: string
  assignedRepId?: string
  search?: string
}): Promise<Customer[]> {
  let customers = [...MOCK_CUSTOMERS]

  if (filters?.status) {
    customers = customers.filter((c) => c.status === filters.status)
  }

  if (filters?.segment) {
    customers = customers.filter((c) => c.segment === filters.segment)
  }

  if (filters?.assignedRepId) {
    customers = customers.filter((c) => c.assignedRepId === filters.assignedRepId)
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    customers = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.companyName.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search) ||
        c.phone.includes(search)
    )
  }

  return customers
}

/**
 * Fetch single customer with AR details
 */
export async function fetchCustomer(id: string): Promise<CustomerDetail | null> {
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id)
  if (!customer) return null

  // Get invoices for this customer
  const allInvoices = await fetchOutstandingInvoices()
  const customerInvoices = allInvoices.filter((inv) => inv.customerId === id)

  const totalOutstanding = customerInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const averageDaysOutstanding =
    customerInvoices.length > 0
      ? Math.round(customerInvoices.reduce((sum, inv) => sum + inv.days_overdue, 0) / customerInvoices.length)
      : 0

  // Mock: total billed (would come from NetSuite payment history)
  const totalBilled = customerInvoices.length > 0 ? totalOutstanding + 50000 : 0
  const daysToPayAvg = customerInvoices.length > 0 ? Math.round(Math.random() * 30) + 10 : 0

  return {
    ...customer,
    totalOutstanding,
    invoiceCount: customerInvoices.length,
    averageDaysOutstanding,
    totalBilled,
    daysToPayAvg,
    invoices: customerInvoices.map((inv) => ({
      id: inv.id,
      number: inv.invoiceNumber,
      amount: inv.amount,
      dueDate: inv.dueDate,
      status: inv.paymentStatus,
      daysOverdue: inv.days_overdue,
    })),
  }
}

/**
 * Fetch customers assigned to a rep
 */
export async function fetchRepCustomers(repId: string): Promise<Customer[]> {
  return fetchCustomers({ assignedRepId: repId, status: 'Active' })
}
