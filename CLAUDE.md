# Bills Bills Bills AR Collections Portal

**Project:** AR Collections & Performance Management Portal for GoBolt  
**Status:** Phase 1 - MVP Development  
**Team:** Technical Lead (build) + Evan (support/PM)  
**Timeline:** 6 weeks (Weeks 1-6 per implementation plan)

## Key Context

This is a fork of the HF CRM (GrainTrack) project, adapted for AR collections instead of farm relationships.

**Problem it solves:**
- Christine can't see what's outstanding vs what's being invoiced (Excel only shows outbound)
- AR reps don't know which customers to contact or why they haven't paid
- No visibility into collection progress or team performance

**Phase 1 Goals:**
- Real-time visibility into outstanding AR (invoices + aging)
- Per-customer context (why they haven't paid, escalation contacts, related issues)
- Collection workflow (email, call, escalate, promise-to-pay tracking)
- Rep accountability (who owns which accounts, what's their workload)

## Key Differences from GrainTrack

| Aspect | GrainTrack | Bills Collections |
|--------|-----------|-----------------|
| Master entity | Contact (person) | Customer (company owing $) |
| Primary data | Grain acreage, delivery | Invoices, payments, aging |
| Cadence logic | Contact frequency by tier | Collection touch points by segment |
| Integration | GMS (read) | NetSuite (invoices, payments) + Linear (issues) |
| Users | Farm marketing team | AR reps + admin |

## Implementation Plan Location

See `/Users/evanstewart/.claude/plans/wondrous-wibbling-teacup.md` for full 6-week roadmap.

## File Structure Changes (Week 1)

**Remove:**
- `/src/app/(app)/grain-positions/`
- `/src/app/(app)/compliance/`
- `/src/app/(app)/reports/` (stub only for Phase 1)
- `/src/lib/db/grain.ts`
- `/src/lib/db/compliance.ts`

**Rename:**
- `call_log` → `collection_actions` (database)
- `contacts` → `customers` (database)
- `relationships` → `escalation_contacts` (database)

**Create:**
- `/src/lib/netsuite/` (NetSuite API client)
- `/src/lib/linear/` (Linear API client)
- `/src/app/(app)/invoices/` (new page)
- `/src/app/(app)/collection-log/` (new page)
- `/src/app/auth/login/` (Google OAuth)
- `/src/app/api/sync/` (NetSuite + Linear refresh)

## Database Schema

See `supabase-schema.sql` (updated for AR context). Key tables:
- `customers` (from contacts, adapted for AR)
- `invoices` (new, tracks outstanding AR)
- `collection_actions` (from call_log, adapted)
- `segments` (Bronze/Silver/Regular/Hyper-care/Finance Action)
- `escalation_contacts` (from relationships, for escalation chains)
- `linear_tickets` (cached from Linear, context for payment delays)
- `users` (same, with added role-based access)

## Critical Path (Week 1 Blockers)

1. **Authentication:** NextAuth.js + Google Workspace OAuth (MUST HAVE before anything else)
2. **Database:** Supabase project + schema migration
3. **Row Level Security:** RLS policies so reps only see their customers

## Technologies

Same as GrainTrack:
- Next.js 16.2.3
- Supabase (PostgreSQL)
- shadcn/ui + Tailwind CSS 4
- NextAuth.js (NEW: for Google OAuth)
- TypeScript 5

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth.js
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# External APIs
NETSUITE_API_TOKEN=
NETSUITE_ACCOUNT_ID=
LINEAR_API_KEY=
```

## Current Status

✅ Project scaffolded  
⏳ Week 1: Auth + schema setup (in progress)  
⏳ Week 2: NetSuite integration + admin dashboard  
⏳ Week 3: Customer list/detail + escalation  
⏳ Week 4: Invoice list + collection log  
⏳ Week 5: Linear integration + polish  
⏳ Week 6: Testing + deployment

## Contact

- **Evan Stewart** (PM/Support): /users/evanstewart
- **Technical Lead:** (Name TBD)
- **Stakeholders:** Christine (admin), AR reps (Sajjad, Yuliia, Baz, Rakshita)
