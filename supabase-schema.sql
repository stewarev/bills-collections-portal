-- ============================================================
-- Bills Collections Portal — Supabase Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New Query)
-- ============================================================

-- Drop existing tables if re-running (safe to run multiple times)
DROP TABLE IF EXISTS linear_tickets CASCADE;
DROP TABLE IF EXISTS cadence_rules CASCADE;
DROP TABLE IF EXISTS escalation_contacts CASCADE;
DROP TABLE IF EXISTS collection_actions CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS (authentication)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);

-- ============================================================
-- SEGMENTS (AR customer segments with cadence rules)
-- ============================================================
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('Bronze', 'Silver', 'Regular', 'Hyper-care', 'Finance Action')),
  cadence_days_first_touch INT,        -- Days before due date
  cadence_days_second_touch INT,       -- Days after first reminder
  cadence_days_third_touch INT,        -- Days after second reminder
  escalation_enabled BOOLEAN DEFAULT TRUE,
  auto_charge_credit_card BOOLEAN DEFAULT FALSE,  -- For Finance Action segment
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX segments_name_idx ON segments(name);

-- ============================================================
-- CUSTOMERS (renamed from contacts, adapted for AR)
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  segment_id UUID NOT NULL REFERENCES segments(id),
  assigned_rep_id UUID REFERENCES users(id),
  total_outstanding DECIMAL(14,2) DEFAULT 0,
  last_payment_date DATE,
  last_contacted_at DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Prospect')),
  business_notes TEXT,
  personal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX customers_segment_id_idx ON customers(segment_id);
CREATE INDEX customers_assigned_rep_id_idx ON customers(assigned_rep_id);
CREATE INDEX customers_status_idx ON customers(status);
CREATE INDEX customers_last_contacted_at_idx ON customers(last_contacted_at);

-- ============================================================
-- INVOICES (outstanding AR to track)
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255) UNIQUE NOT NULL,
  amount_due DECIMAL(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Outstanding' CHECK (
    payment_status IN ('Outstanding', 'Partially Paid', 'Paid', 'Disputed', 'Overdue')
  ),
  payment_received_amount DECIMAL(14,2) DEFAULT 0,
  payment_received_date DATE,
  netsuite_id VARCHAR(255),  -- External reference to NetSuite
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX invoices_customer_id_idx ON invoices(customer_id);
CREATE INDEX invoices_payment_status_idx ON invoices(payment_status);
CREATE INDEX invoices_due_date_idx ON invoices(due_date);
CREATE INDEX invoices_netsuite_id_idx ON invoices(netsuite_id);

-- ============================================================
-- COLLECTION ACTIONS (renamed from call_log, adapted for AR)
-- ============================================================
CREATE TABLE collection_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_type VARCHAR(30) NOT NULL CHECK (
    action_type IN ('Email', 'Call', 'Escalate', 'Promise-to-Pay', 'Disputed', 'Paid')
  ),
  outcome VARCHAR(50) NOT NULL CHECK (
    outcome IN ('Sent', 'Connected', 'No Answer', 'Left VM', 'Promise Accepted', 'Dispute Acknowledged', 'Payment Applied', 'No Response')
  ),
  staff_member VARCHAR(255) NOT NULL,  -- Will be updated to link to users table
  summary TEXT,
  invoice_ids TEXT[],  -- JSON array or comma-separated invoice IDs affected
  promise_date DATE,   -- If action_type = 'Promise-to-Pay', the promised payment date
  next_action_date DATE,
  follow_up_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX collection_actions_customer_id_idx ON collection_actions(customer_id);
CREATE INDEX collection_actions_date_idx ON collection_actions(date);
CREATE INDEX collection_actions_action_type_idx ON collection_actions(action_type);
CREATE INDEX collection_actions_next_action_date_idx ON collection_actions(next_action_date);

-- ============================================================
-- ESCALATION CONTACTS (renamed from relationships, for escalation chains)
-- ============================================================
CREATE TABLE escalation_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  escalation_contact_id UUID REFERENCES users(id),  -- If internal manager/director
  name VARCHAR(255),  -- If external contact
  title VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  stage VARCHAR(50) NOT NULL CHECK (
    stage IN ('Stage 1', 'Stage 2', 'Stage 3', 'Internal Manager', 'Internal Director')
  ),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX escalation_contacts_customer_id_idx ON escalation_contacts(customer_id);
CREATE INDEX escalation_contacts_stage_idx ON escalation_contacts(stage);

-- ============================================================
-- CADENCE RULES (optional — can be hardcoded in app for Phase 1)
-- ============================================================
CREATE TABLE cadence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  sequence INT NOT NULL,  -- 1, 2, 3...
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('Email', 'Call', 'Escalate')),
  days_before_due INT,  -- Negative = before due date; positive = after
  message_template TEXT,  -- Auto-generate to-do text
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cadence_rules_segment_id_idx ON cadence_rules(segment_id);

-- ============================================================
-- LINEAR TICKETS (cached from Linear API for context)
-- ============================================================
CREATE TABLE linear_tickets (
  id VARCHAR(255) PRIMARY KEY,  -- Linear ticket ID
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  status VARCHAR(50),  -- 'Backlog', 'Todo', 'In Progress', 'Done', 'Canceled'
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX linear_tickets_customer_id_idx ON linear_tickets(customer_id);

-- ============================================================
-- DOCUMENTS (reused from GrainTrack)
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_url TEXT,
  uploaded_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX documents_customer_id_idx ON documents(customer_id);

-- ============================================================
-- UPDATED_AT trigger (auto-updates updated_at on row changes)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER segments_updated_at BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER collection_actions_updated_at BEFORE UPDATE ON collection_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER escalation_contacts_updated_at BEFORE UPDATE ON escalation_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED SEGMENTS (default data)
-- ============================================================
INSERT INTO segments (name, cadence_days_first_touch, cadence_days_second_touch, cadence_days_third_touch, description)
VALUES
  ('Bronze', -30, -20, -10, 'No contact until past due - light nudges only'),
  ('Silver', -7, -3, 0, 'Light reminder nudges - no aggressive tone'),
  ('Regular', -7, -3, 0, 'Standard messaging - escalating over 3 reminders'),
  ('Hyper-care', -7, -3, 0, 'Crazy escalation - suspended communications, banner'),
  ('Finance Action', NULL, NULL, NULL, 'Auto-charge credit card on due date - no reminders');

-- ============================================================
-- DISABLE ROW LEVEL SECURITY (demo — will enable with auth)
-- ============================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE segments DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE linear_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Schema complete. Run /api/seed next to populate with demo data.
