# Promise-to-Pay Workflow - Complete Guide

This document describes the complete promise-to-pay (PTP) workflow in the Bills Collections Portal, including submission, approval, tracking, and automated reminders.

## Overview

The promise-to-pay workflow enables:
- **AR Reps** to request customers commit to a payment date with an expiry date
- **Admin** to approve or reject these promises with email notifications
- **Automated Reminders** via scheduled cron jobs when promises are about to expire
- **Transparency** across the dashboard and invoices pages

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROMISE-TO-PAY WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

1. REP SUBMITS PROMISE
   ↓
   Customer Detail Page → Promise-to-Pay Modal
   - Select invoice(s)
   - Set promised payment date
   - Set promise expiry date (when promise becomes void)
   - Add notes (optional)
   - Click "Submit for Approval"
   ↓
   POST /api/promise-to-pay
   ↓
   ✉️ EMAIL: Admin notified of new promise request
   Status: "pending"

2. ADMIN REVIEWS PROMISE
   ↓
   Dashboard → Promise-to-Pay Approvals Table
   - View pending requests
   - Shows: invoice #, customer, amount, promised date, expiry date, rep
   - Two action buttons: Approve / Reject
   ↓
   PATCH /api/promise-to-pay { action: "approve" | "reject" }
   ↓
   IF APPROVED:
     ✉️ EMAIL: Rep notified - promise approved, reminder at expiry date
     Status: "approved"
     
   IF REJECTED:
     ✉️ EMAIL: Rep notified - promise rejected with reason
     Status: "rejected"

3. REP TRACKS PROMISE
   ↓
   Dashboard → Promise-to-Pay Approvals (rep view, if applicable)
   Invoices Page → Promise Status Column
   - Shows: Pending / Approved / Rejected / Expired
   - Color badges: Yellow=Pending, Green=Approved, Red=Rejected/Expired
   - Shows days remaining until expiry (e.g., "3d left")
   ↓
   Can view expiry date and follow up with customer

4. AUTOMATED REMINDER (3 days before expiry)
   ↓
   Vercel Cron Job: Daily at 9:00 AM UTC
   GET /api/cron/send-promise-reminders
   ↓
   Queries: All approved promises expiring in 3 days
   ↓
   For each matching promise:
     ✉️ EMAIL: Rep receives reminder with:
        - Customer name
        - Invoice number
        - Expiry date
        - Call to action: "Follow up with customer"
   ↓
   Logs: Success/failure of each reminder sent

5. PROMISE EXPIRES
   ↓
   Expiry date passes
   Status remains: "approved" (not auto-updated)
   ↓
   Dashboard/Invoices show: "Expired" badge
   ↓
   Rep should contact customer or request new promise
```

## Detailed Steps

### Step 1: Rep Submits Promise-to-Pay Request

**Location**: Customer Detail Page → "Log Collection Action" drawer

**Access**:
- AR Reps: View their assigned customers
- Admin: View all customers

**Action**:
1. Click "Promise-to-Pay" button on invoice
2. Modal opens with pre-filled invoice details
3. Enter fields:
   - **Promised Payment Date** (required): When customer promises to pay
   - **Promise Expires** (required): When promise becomes void if not paid
   - **Notes** (optional): Why promise was given, special terms, etc.
4. Click "Submit for Approval"

**Data Sent**:
```json
{
  "invoiceId": "inv-001",
  "promisedDate": "2026-04-25",
  "expiryDate": "2026-05-02",
  "repName": "Sajjad",
  "repId": "rep-001",
  "notes": "Customer will receive payment after client payoff"
}
```

**Result**:
- Promise created with status: `pending`
- Email sent to admin for review
- Rep sees modal confirmation
- Invoice shows "Promise Pending" status

### Step 2: Admin Approves or Rejects Promise

**Location**: Dashboard → "Pending Promise-to-Pay Approvals" section (Admin only)

**Access**: Admin only (Christine)

**Action**:

**To Approve**:
1. Review promise details in table
2. Click green checkmark button
3. Promise marked as `approved`
4. Rep receives approval email

**To Reject**:
1. Click reject button (X icon)
2. Input field appears for rejection reason
3. Enter reason (e.g., "Customer credit is frozen")
4. Click "Confirm"
5. Promise marked as `rejected`
6. Rep receives rejection email with reason

**Data Sent**:
```json
{
  "invoiceId": "inv-001",
  "action": "approve" | "reject",
  "approvedBy": "Christine",
  "rejectionReason": "Customer has payment processing delay",
  "repEmail": "rep@gobolt.com"
}
```

**Result**:
- Promise updated with status and timestamps
- Email sent to rep
- Dashboard auto-refreshes to remove from pending list

### Step 3: Track Active Promises

**Dashboard View** (All Users):
- Pending Promise-to-Pay Approvals table
- Shows all pending requests for admin
- Shows only their promises for reps

**Invoices Page** (All Users):
- New "Promise" column on invoices table
- Status badges:
  - **Pending** (yellow): Awaiting admin review
  - **Approved** (green with days): Active promise + days until expiry
  - **Expired** (red): Promise expiry date passed
  - **Rejected** (red): Admin rejected this promise
  - **—** (gray): No promise submitted

**Example States**:
```
Invoice-001: Approved 3d left    ← Expires in 3 days
Invoice-002: Approved 15d left   ← Expires in 15 days
Invoice-003: Expired             ← Expiry date has passed
Invoice-004: Pending             ← Awaiting admin approval
Invoice-005: Rejected            ← Admin rejected this promise
Invoice-006: —                   ← No promise submitted
```

### Step 4: Automated Expiry Reminders (Scheduled)

**Cron Job**: `/api/cron/send-promise-reminders`

**Schedule**: Daily at 9:00 AM UTC (configurable)

**How It Works**:
1. Job queries all approved promises
2. Filters for those expiring in exactly 3 days
3. Sends reminder email to rep for each matching promise
4. Logs success/failure and returns summary

**Email Content**:
```
To: rep@gobolt.com (rep assigned to customer)
Subject: ⏰ Follow Up Needed: Promise Expiring for Acme Corp
Body:
  - Invoice number
  - Customer name
  - Expiry date (in 3 days)
  - "Please follow up with customer to confirm payment"
```

**Timing Logic**:
- Checks daily at 9:00 AM UTC
- Sends reminder when `daysUntilExpiry === 3`
- Uses small time window (9:00-10:00) to prevent duplicate sends

**Example**:
```
Today: April 13, 2026
Promise Expires: April 16, 2026 (3 days from now)
✓ Email sent to Sajjad: "Your promise to Acme Corp expires on Apr 16"

Next Day: April 14, 2026
Promise Expires: April 17, 2026 (3 days from now)
✓ Email sent to Yuliia: "Your promise to TechCo expires on Apr 17"
```

### Step 5: Promise Expires

**No Automatic Action**:
- Status remains `approved` (not auto-updated)
- Dashboard/Invoices show "Expired" badge
- Rep should manually follow up

**Manual Follow-up**:
- Rep contacts customer about payment
- Options:
  - **Payment received**: Mark invoice as "Paid" (manual)
  - **New promise**: Submit new promise-to-pay request
  - **Escalation**: Submit escalation to manager/director

## Email Templates

### 1. Promise Request (Admin Notification)
**Sent**: When rep submits promise
**To**: Admin (christine@gobolt.com)
**Subject**: `[Action Required] Promise-to-Pay Request from Sajjad for Acme Corp`
**Content**: Full promise details + buttons to approve/reject

### 2. Promise Approved (Rep Notification)
**Sent**: When admin approves promise
**To**: Rep assigned to customer
**Subject**: `✓ Promise Approved: Acme Corp - INV-2024-001`
**Content**: 
- Invoice details
- Promised payment date
- Expiry date with days remaining
- Reminder: "Follow up before expiry date"

### 3. Promise Rejected (Rep Notification)
**Sent**: When admin rejects promise
**To**: Rep assigned to customer
**Subject**: `Promise Rejected: Acme Corp - INV-2024-001`
**Content**:
- Invoice details
- Rejection reason
- Next steps: "Contact admin to discuss"

### 4. Promise Expiring Soon (Rep Reminder)
**Sent**: Via cron job, 3 days before expiry
**To**: Rep assigned to customer
**Subject**: `⏰ Follow Up Needed: Promise Expiring for Acme Corp`
**Content**:
- Invoice number
- Customer name
- Expiry date
- Action: "Follow up or submit new promise"

## API Endpoints

### POST /api/promise-to-pay
Submit new promise-to-pay request

**Request**:
```json
{
  "invoiceId": "string",
  "promisedDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "repName": "string",
  "repId": "string",
  "notes": "string (optional)"
}
```

**Response** (201):
```json
{
  "invoiceId": "string",
  "invoiceNumber": "string",
  "customerName": "string",
  "amount": number,
  "promisedDate": "YYYY-MM-DD",
  "expiryDate": "YYYY-MM-DD",
  "status": "pending",
  "requestedBy": "string",
  "requestedAt": "ISO-8601"
}
```

### GET /api/promise-to-pay
Fetch promises (optionally filtered)

**Query Parameters**:
- `status=pending|approved|rejected` (optional)

**Response**:
```json
{
  "requests": [ /* array of PromiseToPayRequest */ ],
  "count": number
}
```

### PATCH /api/promise-to-pay
Approve or reject promise

**Request**:
```json
{
  "invoiceId": "string",
  "action": "approve" | "reject",
  "approvedBy": "string (for approve)",
  "rejectionReason": "string (for reject)",
  "repEmail": "string (for notification)"
}
```

**Response** (200):
```json
{
  "invoiceId": "string",
  "status": "approved" | "rejected",
  "approvedBy": "string",
  "approvedAt": "ISO-8601",
  "rejectionReason": "string"
}
```

### GET /api/cron/send-promise-reminders
Trigger scheduled reminder job

**Headers**:
```
Authorization: Bearer {CRON_SECRET}
```

**Response**:
```json
{
  "success": boolean,
  "message": "string",
  "remindersCount": number,
  "errors": [ "string" ]
}
```

## Data Models

### PromiseToPayRequest Interface

```typescript
interface PromiseToPayRequest {
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  amount: number
  promisedDate: string         // When customer promises to pay
  expiryDate: string           // When promise becomes void
  requestedBy: string          // Rep name
  requestedByRepId: string
  requestedAt: string          // ISO-8601 timestamp
  approvedBy?: string          // Admin name
  approvedAt?: string          // ISO-8601 timestamp
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  rejectionReason?: string
}
```

### Helper Functions

**isPromiseExpired(promise)**
- Returns `true` if promise expiry date has passed

**daysUntilPromiseExpires(promise)**
- Returns number of days until expiry (negative if expired)

**getPromisesExpiringWithin(days)**
- Returns array of approved promises expiring within N days

## Phase 2 Enhancements

### Planned Improvements

1. **Duplicate Prevention**
   - Add `reminder_sent_at` timestamp
   - Track which promises have had reminders sent
   - Prevent sending duplicate emails

2. **Customizable Settings**
   - Admin dashboard setting for reminder timing
   - Store in settings table
   - Support multiple reminder dates (1, 3, 7 days)

3. **Additional Cron Jobs**
   - Send reminder on expiry date itself
   - Send overdue reminder 1 day after expiry
   - Weekly summary of all active promises

4. **Email Service Integration**
   - Replace stub with Resend or SendGrid
   - Webhook integration for delivery tracking
   - Retry logic for failed sends

5. **Historical Tracking**
   - Store promise history in database
   - Dashboard widget showing completion rate
   - Analytics: How often promises are kept

6. **Promise Management UI**
   - Admin dashboard for all promises
   - Bulk approve/reject
   - Edit promised dates
   - Manual reminder triggering

## Configuration

### Environment Variables

```env
# Email
ADMIN_EMAIL=christine@gobolt.com
NEXT_PUBLIC_APP_URL=https://collections.gobolt.com

# Cron
CRON_SECRET=your-secret-key

# Email Service (Phase 2)
RESEND_API_KEY=your-resend-key
```

### Vercel Configuration

`vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-promise-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

## Testing

### Manual Testing Checklist

- [ ] Rep submits promise with valid dates
- [ ] Admin receives email notification
- [ ] Admin approves promise
- [ ] Rep receives approval email
- [ ] Promise shows on dashboard
- [ ] Promise shows on invoices page
- [ ] Admin rejects promise
- [ ] Rep receives rejection email with reason
- [ ] Cron job runs successfully (manual trigger)
- [ ] Rep receives expiry reminder email

### Testing Commands

**Trigger cron job (development)**:
```bash
curl -X POST http://localhost:3000/api/cron/send-promise-reminders
```

**Trigger cron job (production)**:
```bash
curl -X POST https://your-app.vercel.app/api/cron/send-promise-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Promise not submitting | Check browser console for errors; verify API endpoint is reachable |
| Approval email not sent | Check ADMIN_EMAIL is correct; verify email service credentials |
| Cron job not running | Verify CRON_SECRET is set; check Vercel logs; confirm vercel.json exists |
| Reminders not sending | Check rep email addresses in database; verify email service integration |

## Related Documentation

- [Cron Jobs Guide](./CRON_JOBS.md)
- [Email Integration](./EMAIL_INTEGRATION.md) (Phase 2)
- [API Reference](./API.md)
- [Database Schema](../supabase-schema.sql)
