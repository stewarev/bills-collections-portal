/**
 * Escalation Contact Management
 * Tracks decision-makers and contacts for escalation chains
 * Stage 1: AR Rep → Finance, Stage 2: Finance → Management, Stage 3: Management → Legal/Collections
 */

export interface EscalationContact {
  id: string
  customerId: string
  stage: 'Stage 1' | 'Stage 2' | 'Stage 3'
  name: string
  title: string
  email: string
  phone: string
  notes?: string
  createdAt?: string
}

// Mock escalation contacts by customer
const MOCK_ESCALATION_CONTACTS: Record<string, EscalationContact[]> = {
  'cust-001': [
    {
      id: 'esc-001',
      customerId: 'cust-001',
      stage: 'Stage 1',
      name: 'Sarah Johnson',
      title: 'Finance Manager',
      email: 'sarah.johnson@acmecorp.com',
      phone: '(555) 123-4568',
      notes: 'Primary contact for invoicing issues',
    },
    {
      id: 'esc-002',
      customerId: 'cust-001',
      stage: 'Stage 2',
      name: 'Michael Chen',
      title: 'CFO',
      email: 'michael.chen@acmecorp.com',
      phone: '(555) 123-4569',
      notes: 'Handles large disputes',
    },
  ],
  'cust-002': [
    {
      id: 'esc-003',
      customerId: 'cust-002',
      stage: 'Stage 1',
      name: 'David Rodriguez',
      title: 'Accounts Payable',
      email: 'david.r@techinnovations.com',
      phone: '(555) 234-5679',
    },
  ],
  'cust-003': [
    {
      id: 'esc-004',
      customerId: 'cust-003',
      stage: 'Stage 1',
      name: 'Jennifer Lee',
      title: 'Director of Operations',
      email: 'jen.lee@globalsolutions.com',
      phone: '(555) 345-6790',
      notes: 'Often unavailable Fridays',
    },
    {
      id: 'esc-005',
      customerId: 'cust-003',
      stage: 'Stage 2',
      name: 'Robert Kim',
      title: 'VP Finance',
      email: 'rkim@globalsolutions.com',
      phone: '(555) 345-6791',
    },
    {
      id: 'esc-006',
      customerId: 'cust-003',
      stage: 'Stage 3',
      name: 'Patricia White',
      title: 'General Counsel',
      email: 'pwhite@globalsolutions.com',
      phone: '(555) 345-6792',
    },
  ],
  'cust-004': [],
}

/**
 * Fetch escalation contacts for a customer
 */
export async function fetchEscalationContacts(customerId: string): Promise<EscalationContact[]> {
  return MOCK_ESCALATION_CONTACTS[customerId] || []
}

/**
 * Get contacts by stage
 */
export async function fetchEscalationContactsByStage(
  customerId: string,
  stage: 'Stage 1' | 'Stage 2' | 'Stage 3'
): Promise<EscalationContact | undefined> {
  const contacts = MOCK_ESCALATION_CONTACTS[customerId] || []
  return contacts.find((c) => c.stage === stage)
}

/**
 * Add escalation contact (mock)
 */
export async function addEscalationContact(
  customerId: string,
  contact: Omit<EscalationContact, 'id' | 'customerId'>
): Promise<EscalationContact> {
  const id = `esc-${Date.now()}`
  const newContact: EscalationContact = {
    ...contact,
    id,
    customerId,
    createdAt: new Date().toISOString(),
  }

  if (!MOCK_ESCALATION_CONTACTS[customerId]) {
    MOCK_ESCALATION_CONTACTS[customerId] = []
  }
  MOCK_ESCALATION_CONTACTS[customerId].push(newContact)
  return newContact
}

/**
 * Update escalation contact (mock)
 */
export async function updateEscalationContact(
  customerId: string,
  contactId: string,
  updates: Partial<Omit<EscalationContact, 'id' | 'customerId'>>
): Promise<EscalationContact | null> {
  const contacts = MOCK_ESCALATION_CONTACTS[customerId]
  if (!contacts) return null

  const index = contacts.findIndex((c) => c.id === contactId)
  if (index === -1) return null

  contacts[index] = { ...contacts[index], ...updates }
  return contacts[index]
}

/**
 * Delete escalation contact (mock)
 */
export async function deleteEscalationContact(customerId: string, contactId: string): Promise<boolean> {
  const contacts = MOCK_ESCALATION_CONTACTS[customerId]
  if (!contacts) return false

  const index = contacts.findIndex((c) => c.id === contactId)
  if (index === -1) return false

  contacts.splice(index, 1)
  return true
}
