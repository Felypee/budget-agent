-- Recurring Payments Schema for Wompi
-- Run this migration after subscriptions_schema.sql

-- Table for tokenized payment sources (credit cards)
CREATE TABLE IF NOT EXISTS payment_sources (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  wompi_payment_source_id TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  status TEXT DEFAULT 'active',  -- active, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payment_sources_phone ON payment_sources(phone);
CREATE INDEX IF NOT EXISTS idx_payment_sources_status ON payment_sources(status);

-- Billing history for recurring charges
CREATE TABLE IF NOT EXISTS billing_history (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_cop INTEGER NOT NULL,
  wompi_transaction_id TEXT,
  status TEXT NOT NULL,  -- pending, approved, declined, error
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for billing history
CREATE INDEX IF NOT EXISTS idx_billing_history_phone ON billing_history(phone);
CREATE INDEX IF NOT EXISTS idx_billing_history_status ON billing_history(status);
CREATE INDEX IF NOT EXISTS idx_billing_history_next_retry ON billing_history(next_retry_at)
  WHERE status = 'declined' AND retry_count < 3;

-- Add auto_renew and next_billing_date to user_subscriptions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'next_billing_date'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- RLS Policies (if using Supabase auth)
-- ALTER TABLE payment_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
