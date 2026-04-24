# Admin Integrations Settings — Setup Guide

## Overview

The Bills Collections Portal supports integration with external services to pull data and provide context:

- **NetSuite**: Pull outstanding invoices and payment data
- **Linear**: Display customer-related issues for context

This guide explains how to configure these integrations.

---

## Access Settings

**Location**: `/settings` (admin only)
**Role Required**: Admin (Christine)
**Navigation**: Sidebar → Settings → NetSuite or Linear

---

## NetSuite Configuration

### Purpose

Syncs outstanding invoices from NetSuite into the portal's invoices table, providing real-time visibility into AR.

### Setup Steps

1. **Get NetSuite Credentials**:
   - Log in to NetSuite as Administrator
   - Go to: **Admin** → **Integration** → **API Keys**
   - Create a new API key (if not already created)
   - Copy the API Token and Account ID

2. **Configure in Portal**:
   - Navigate to `/settings/netsuite`
   - Paste API Token (password field, will be encrypted in Phase 2)
   - Paste Account ID
   - Select Sync Schedule:
     - **Manual Only**: Sync when clicking "Sync Now" button
     - **Daily**: Sync automatically at 3 AM UTC
     - **Weekly**: Sync every Sunday at 3 AM UTC
   - Click **Save Configuration**

3. **Test Sync**:
   - Click **Sync Now** button
   - Portal will:
     - Query NetSuite for outstanding invoices
     - Compare with existing invoices
     - Create new records, update payment status
     - Return count of synced invoices
   - First sync may take 1-2 minutes depending on invoice volume

### Scheduled Sync

Once saved with a daily/weekly schedule, Vercel Cron will automatically trigger the sync at the specified time.

**Monitoring**:
- Navigate to `/settings/sync-logs`
- View last sync timestamp
- Check for any errors

---

## Linear Configuration

### Purpose

Displays customer-related Linear issues on the customer detail page, providing context for why customers might not be paying (e.g., "Delayed invoice due to missing PO").

### Setup Steps

1. **Get Linear API Key**:
   - Go to Linear: **Settings** → **API** → **Personal API Keys**
   - Click **Create API Key**
   - Copy the key (starts with `lin_api_`)

2. **Get Workspace ID**:
   - Open any Linear URL: `https://linear.app/YOUR_WORKSPACE_KEY/issues`
   - Copy the workspace key (e.g., `GD` from `linear.app/GD/issues`)

3. **Configure in Portal**:
   - Navigate to `/settings/linear`
   - Paste API Key (password field)
   - Paste Workspace ID
   - Click **Save Configuration**

4. **Test Connection**:
   - Click **Test Connection** button
   - Portal will:
     - Query Linear GraphQL API
     - Verify credentials are valid
     - Show success or error message
   - On success, your Linear email will be displayed

5. **Verification**:
   - Navigate to any customer detail page
   - View the **Escalation** or **Issues** tab
   - If customer has open Linear tickets, they will appear

---

## API Endpoints Reference

### NetSuite

```
POST /api/integrations/netsuite
```
Save NetSuite configuration.

**Request**:
```json
{
  "apiToken": "string",
  "accountId": "string",
  "syncSchedule": "daily|weekly|manual"
}
```

**Response**:
```json
{
  "success": true,
  "message": "NetSuite configuration saved",
  "config": {
    "accountId": "string",
    "syncSchedule": "string"
  }
}
```

---

```
POST /api/sync/invoices
```
Manually trigger a NetSuite sync.

**Response**:
```json
{
  "status": "success",
  "message": "Invoice sync completed",
  "invoicesSynced": 45,
  "timestamp": "2026-04-16T12:30:00Z"
}
```

---

### Linear

```
POST /api/integrations/linear
```
Save Linear configuration.

**Request**:
```json
{
  "apiKey": "string",
  "workspaceId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Linear configuration saved",
  "config": {
    "workspaceId": "string"
  }
}
```

---

```
POST /api/integrations/linear/test
```
Test Linear API connection.

**Request**:
```json
{
  "apiKey": "string",
  "workspaceId": "string"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Linear connection successful",
  "user": "christine@gobolt.com"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| NetSuite sync returns 0 invoices | Check if Account ID is correct; verify API token has access to outstanding invoices |
| "API Token and Account ID are required" | Ensure both fields are filled before clicking Save |
| Linear test fails with invalid key | Double-check API key (should start with `lin_api_`); verify it's not expired |
| Linear issues don't appear on customer page | Verify workspace ID is correct; check if customer has related issues in Linear |
| Settings page shows "Admin access required" | Only admin (Christine) can access settings; verify your email ends with @gobolt.com |

---

## Phase 2 Enhancements

- Store credentials encrypted in Supabase (currently logged to console)
- Add "Last Sync" timestamp display
- Support custom sync schedules (hourly, every 6 hours, etc.)
- Webhook-based sync triggers (real-time instead of scheduled)
- Email alerts on sync failures
- Audit log of all configuration changes

---

## Related Documentation

- [Promise-to-Pay Workflow](./PROMISE_TO_PAY_WORKFLOW.md)
- [Cron Jobs](./CRON_JOBS.md)
- [API Reference](./API.md) (coming soon)
