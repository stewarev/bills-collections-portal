# Graintrack — Improvements & Future Work

This file tracks improvements, bugs, and feature ideas. Items are grouped by priority.

For active development, move items to GitHub Issues so they can be assigned, commented on, and linked to commits.

---

## High Priority (Before Demo / Launch)

- [ ] **Vercel deployment** — Michelle needs a real URL, not localhost. Required before she can access it on her own.
- [ ] **Auth / login screen** — Anyone with the URL can access right now. Add Supabase Auth with Google OAuth before sharing broadly.
- [ ] **Edit contact form** — Edit button on customer profile does nothing. Needs a drawer or modal to update name, phone, tier, tags, etc.
- [ ] **New customer form** — "New Customer" button on customers list does nothing. Needs a create flow.

---

## Medium Priority (Quality of Life)

- [ ] **Mobile optimization** — Layout works on desktop. Needs responsive tuning for phone use (Willie may log calls from her phone).
- [ ] **Outreach status updates from Log Call** — The "Suggestion: Mark status as Active?" prompt in the Log Call drawer doesn't actually save the status change yet. Wire it up.
- [ ] **Contact count on tier tabs** — Customers list tab bar shows tier labels but not counts. Add `(12)` style counts.
- [ ] **Overdue Follow-Ups link to contact** — Already links, but could also show tier badge inline.
- [ ] **Birthday call logging** — Upcoming birthday card could have a "Log Call" shortcut right from the birthday row.
- [ ] **Grain history — edit rows** — Grain History table is read-only. Add inline editing or a row edit modal.
- [ ] **Compliance — upload signed form** — Compliance tab shows signed/unsigned status. Add ability to upload the PDF or mark as signed.

---

## Lower Priority / Future

- [ ] **Market-driven calling** — When corn or soy prices move significantly, surface customers with open positions automatically. (Placeholder card on dashboard.)
- [ ] **Reports page** — Currently shows "coming soon." Build a weekly/monthly summary: calls made, connection rate, customers reached, overdue trend.
- [ ] **Bid sheet email list** — Table exists in DB (`bid_sheet_email_list`). Needs a UI to manage who gets bid sheet emails and a way to track who was added/removed.
- [ ] **Relationships tab** — Customer profile has an Additional tab but no Relationships tab yet. Schema supports it (`relationships` table).
- [ ] **Documents tab** — Schema has a `documents` table and storage bucket. Wire up file upload and display on customer profile.
- [ ] **Bulk actions on customers list** — Select multiple contacts and log a call, change tier, or add a tag.
- [ ] **Call log CSV export** — Export filtered call log to CSV for reporting to Michelle.
- [ ] **Dark mode** — Low priority but nice to have.

---

## Technical Debt

- [ ] **Hardcoded staff list** — StaffMember enum in `types.ts` is hardcoded (Willie, Michelle, Sarah, Nick). Should eventually come from a `users` table.
- [ ] **Row Level Security (RLS)** — RLS is disabled on all tables for the demo. Before production, add RLS policies tied to auth user.
- [ ] **Server-side data fetching** — Dashboard and customer pages use client-side `useEffect`. Could switch to Next.js Server Components for faster initial load.
- [ ] **Optimistic UI on Log Call save** — Currently shows "Saving..." and waits for Supabase. Could update local state immediately.

---

## GMS Integration (Requires Nick's Server)

- [ ] **Live GMS contracts** — Currently seeded with mock data. Real pull requires Nick's local GMS parser. Swap the data source, keep the UI as-is.
- [ ] **Live GMS tickets** — Same as above.
- [ ] **GMS sync frequency** — Decide how often to pull from GMS (on-demand vs. scheduled).

---

## How to Manage This List

**For now:** Edit this file directly. Keep items under the right priority section.

**When development scales:** Move to GitHub Issues.
- One issue per item
- Label by priority: `priority: high`, `priority: medium`, `priority: low`
- Label by type: `bug`, `feature`, `tech-debt`, `gms-integration`
- Milestone per release (e.g., "Demo Ready", "v1.0 Launch")

GitHub Issues lets you assign work, track progress in PRs, and close items automatically when a commit lands.
