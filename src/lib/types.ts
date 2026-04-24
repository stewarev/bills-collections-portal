// ============================================================
// Bills Collections Portal Types
// AR/Collections-specific types
// ============================================================

// Enums
export type SegmentName = 'Bronze' | 'Silver' | 'Regular' | 'Hyper-care' | 'Finance Action'
export type PaymentStatus = 'Outstanding' | 'Partially Paid' | 'Paid' | 'Disputed' | 'Overdue' | 'Promise-to-Pay Pending' | 'Promise-to-Pay Approved'
export type CollectionActionType = 'Email' | 'Call' | 'Escalate' | 'Promise-to-Pay' | 'Disputed' | 'Paid'
export type CollectionOutcome = 'Sent' | 'Connected' | 'No Answer' | 'Left VM' | 'Promise Accepted' | 'Dispute Acknowledged' | 'Payment Applied' | 'No Response'
export type EscalationStage = 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Internal Manager' | 'Internal Director'
export type UserRole = 'staff' | 'admin'
export type CustomerStatus = 'Active' | 'Inactive' | 'Prospect'
export type InvoiceType = 'Standard' | 'Credit Memo' | 'Return' | 'Adjustment' | 'Debit Memo'

// Interfaces
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Segment {
  id: string
  name: string
  cadence_days_first_touch: number | null
  cadence_days_second_touch: number | null
  cadence_days_third_touch: number | null
  escalation_enabled: boolean
  auto_charge_credit_card: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  company_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  segment_id: string
  assigned_rep_id: string | null
  total_outstanding: number
  last_payment_date: string | null
  last_contacted_at: string | null
  status: CustomerStatus
  business_notes: string | null
  personal_notes: string | null
  created_at: string
  updated_at: string
  // Joined
  segment?: Segment
  assigned_rep?: Pick<User, 'id' | 'name' | 'email'>
  // Computed
  days_since_contact?: number | null
}

export interface Invoice {
  id: string
  customer_id: string
  invoice_number: string
  amount_due: number
  currency: string
  invoice_date: string
  due_date: string
  payment_status: PaymentStatus
  payment_received_amount: number
  payment_received_date: string | null
  netsuite_id: string | null
  invoice_type: InvoiceType
  exclude_from_dso: boolean
  // Promise-to-Pay fields
  promise_to_pay_date?: string | null
  promise_to_pay_requested_by?: string | null
  promise_to_pay_requested_at?: string | null
  promise_to_pay_approved_by?: string | null
  promise_to_pay_approved_at?: string | null
  promise_to_pay_notes?: string | null
  promise_to_pay_expires_at?: string | null
  created_at: string
  updated_at: string
  // Computed
  days_overdue?: number
  days_outstanding?: number
  is_past_due?: boolean
}

export interface CollectionAction {
  id: string
  customer_id: string
  date: string
  action_type: CollectionActionType
  outcome: CollectionOutcome
  staff_member: string
  summary: string | null
  invoice_ids: string[] | null
  promise_date: string | null
  next_action_date: string | null
  follow_up_complete: boolean
  created_at: string
  updated_at: string
  // Joined
  customer?: Pick<Customer, 'id' | 'name' | 'company_name'>
}

export interface EscalationContact {
  id: string
  customer_id: string
  escalation_contact_id: string | null  // If internal
  name: string | null  // If external
  title: string | null
  phone: string | null
  email: string | null
  stage: EscalationStage
  description: string | null
  created_at: string
  updated_at: string
}

export interface LinearTicket {
  id: string
  customer_id: string
  title: string
  status: string
  url: string | null
  created_at: string
  synced_at: string
}

export interface CadenceRule {
  id: string
  segment_id: string
  sequence: number
  action_type: CollectionActionType
  days_before_due: number
  message_template: string | null
  created_at: string
}

export interface Document {
  id: string
  customer_id: string
  file_name: string
  file_type: string | null
  file_url: string | null
  uploaded_by: string | null
  notes: string | null
  created_at: string
}

// Color mappings for UI
export const SEGMENT_COLORS: Record<SegmentName, string> = {
  'Bronze': 'bg-orange-100 text-orange-800 border-orange-200',
  'Silver': 'bg-gray-100 text-gray-700 border-gray-200',
  'Regular': 'bg-blue-100 text-blue-800 border-blue-200',
  'Hyper-care': 'bg-red-100 text-red-800 border-red-200',
  'Finance Action': 'bg-purple-100 text-purple-800 border-purple-200',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  'Outstanding': 'bg-blue-100 text-blue-800 border-blue-200',
  'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Paid': 'bg-green-100 text-green-800 border-green-200',
  'Disputed': 'bg-red-100 text-red-800 border-red-200',
  'Overdue': 'bg-red-200 text-red-900 border-red-300',
  'Promise-to-Pay Pending': 'bg-purple-100 text-purple-800 border-purple-200',
  'Promise-to-Pay Approved': 'bg-purple-200 text-purple-900 border-purple-300',
}

export const OUTCOME_COLORS: Record<CollectionOutcome, string> = {
  'Sent': 'text-green-600',
  'Connected': 'text-green-600',
  'No Answer': 'text-yellow-600',
  'Left VM': 'text-orange-500',
  'Promise Accepted': 'text-blue-600',
  'Dispute Acknowledged': 'text-purple-600',
  'Payment Applied': 'text-green-600',
  'No Response': 'text-red-500',
}

export const ESCALATION_STAGE_ORDER: EscalationStage[] = [
  'Stage 1',
  'Stage 2',
  'Stage 3',
  'Internal Manager',
  'Internal Director',
]

// Legacy tier colors (for old GrainTrack components still in codebase)
export type SegmentTier = 'Gold' | 'Silver' | 'Bronze' | 'Non-Podium' | 'Harvest Only'

export const TIER_COLORS: Record<SegmentTier | 'Gold' | 'Silver' | 'Bronze' | 'Non-Podium' | 'Harvest Only', string> = {
  'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Silver': 'bg-gray-100 text-gray-700 border-gray-200',
  'Bronze': 'bg-orange-100 text-orange-800 border-orange-200',
  'Non-Podium': 'bg-slate-100 text-slate-700 border-slate-200',
  'Harvest Only': 'bg-green-100 text-green-800 border-green-200',
}
