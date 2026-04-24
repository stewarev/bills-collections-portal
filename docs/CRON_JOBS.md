# Scheduled Cron Jobs

This document describes the automated cron jobs running in the Bills Collections Portal.

## Overview

Cron jobs are scheduled tasks that run automatically on a defined schedule. In this application, they're implemented using Vercel Cron Functions (for production) and can be triggered manually during development.

## Promise Expiry Reminder Job

### Purpose
Automatically sends email reminders to AR reps when a promise-to-pay is about to expire (3 days before expiration date).

### Location
`/src/app/api/cron/send-promise-reminders.ts`

### Schedule
- **Frequency**: Daily
- **Time**: 9:00 AM UTC
- **Configuration**: `vercel.json` → `crons[0]`

### How It Works

1. **Verification**: Checks Vercel cron authorization header (`CRON_SECRET`)
2. **Query**: Fetches all approved promise-to-pay requests
3. **Filter**: Identifies promises expiring in exactly 3 days
4. **Send**: Emails reminder to the rep assigned to the customer
5. **Log**: Records success/failure of each reminder

### Email Sent
```
Subject: ⏰ Follow Up Needed: Promise Expiring for {Customer Name}

Template: promiseExpiringTemplate()
Recipients: AR Rep email
Content: Invoice number, expiry date, action required
```

### Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "Cron job completed. Sent 5/5 reminders.",
  "remindersCount": 5,
  "errors": []
}
```

**Failure (500):**
```json
{
  "success": false,
  "message": "Cron job failed",
  "remindersCount": 0,
  "errors": ["Error message here"]
}
```

## Setup & Configuration

### Environment Variables

Add to `.env.local`:
```env
# Cron Job Security
CRON_SECRET=your-super-secret-cron-key-change-this

# Email Configuration
ADMIN_EMAIL=christine@gobolt.com
NEXT_PUBLIC_APP_URL=https://collections.gobolt.com
```

### Vercel Deployment

1. **Add `vercel.json` to root**: Already configured ✓
2. **Set `CRON_SECRET` in Vercel dashboard**:
   - Go to Project Settings → Environment Variables
   - Add `CRON_SECRET` with a strong random value
   - Redeploy after adding the variable

3. **Verify in Vercel Logs**:
   - Dashboard → Deployments → Logs
   - Look for "send-promise-reminders" to see execution history

## Testing & Manual Trigger

### Local Development

Trigger manually via curl:
```bash
curl -X POST http://localhost:3000/api/cron/send-promise-reminders \
  -H "Authorization: Bearer test-secret" \
  -H "Content-Type: application/json"
```

**Note**: In development mode (`NODE_ENV=development`), authorization is not required for POST requests.

### Production Testing

Use Vercel's test functionality:
```bash
vercel logs --follow
```

Then manually trigger via the Vercel dashboard or wait for the scheduled time.

## Monitoring & Debugging

### View Execution History

**Vercel Dashboard:**
1. Go to your project
2. Select "Deployments" tab
3. View cron logs under "Logs" → "Cron"

**Local Logs:**
Cron endpoint logs to console:
```
🕐 Starting promise expiry reminder job...
📧 Found 3 promises expiring in 3 days
  Sending reminder for INV-2024-001 (Sajjad)
  ✓ Reminder sent for INV-2024-001
✅ Promise expiry reminder job completed
   Sent: 3/3 reminders
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Cron not running | 1. Check `vercel.json` exists in root<br>2. Verify `CRON_SECRET` is set in Vercel<br>3. Redeploy after changing env vars |
| Reminders not being sent | 1. Check email service integration (Resend/SendGrid)<br>2. Verify rep email addresses in database<br>3. Check cron logs for errors |
| Too many emails | Adjust `daysUntil` condition in cron handler (currently 3 days) |
| Emails being sent twice | Implement `reminder_sent_at` timestamp in database to track sent reminders |

## Future Enhancements

### Phase 2 Improvements

1. **Duplicate Prevention**
   - Add `reminder_sent_at` timestamp to promise records
   - Only send reminder once per promise

2. **Customizable Timing**
   - Add setting to admin dashboard for reminder timing (1, 3, 5, 7 days)
   - Store in `settings` table

3. **Bulk Operations**
   - Add ability to manually trigger reminders for specific customer
   - Send catchup reminders for promises already past the 3-day window

4. **Additional Reminders**
   - Add job for reminders on expiry date itself
   - Add job for reminders 1 day after expiry (overdue promises)

5. **Logging & Analytics**
   - Store reminder history in database
   - Track which reminders were sent, when, and if successful
   - Create admin dashboard widget for cron job health

6. **Email Service Integration**
   - Replace stub implementation with Resend or SendGrid
   - Add retry logic for failed sends
   - Track email delivery status via webhooks

## API Reference

### GET /api/cron/send-promise-reminders

Executes the cron job.

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": boolean,
  "message": string,
  "remindersCount": number,
  "errors": string[]
}
```

### POST /api/cron/send-promise-reminders

Manual trigger (development only).

**Headers (Production):**
```
Authorization: Bearer {CRON_SECRET}
```

**Headers (Development):**
```
(No authorization required)
```

**Response:**
Same as GET endpoint.

## Related Files

- `/src/app/api/cron/send-promise-reminders.ts` - Cron job implementation
- `/src/lib/db/promise-to-pay.ts` - Database functions & helpers
- `/src/lib/email/send.ts` - Email sending
- `/src/lib/email/templates.ts` - Email templates
- `vercel.json` - Vercel cron configuration
- `.env.local` - Environment variables

## Security Notes

1. **CRON_SECRET**: Must be strong and unique. Change from default.
2. **Authorization**: All cron endpoints require `CRON_SECRET` in production.
3. **Rate Limiting**: Cron sends emails with 500ms delays to avoid rate limiting.
4. **Data Access**: Cron job only accesses promises - no customer data modification.

## Support

For issues or questions about cron jobs:
1. Check logs in Vercel dashboard
2. Verify environment variables are set
3. Test manually with curl command
4. Review email service integration status
