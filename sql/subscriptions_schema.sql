-- Subscription & Pricing Control Schema
-- Run this in your Supabase SQL editor

-- 1. Subscription Plans - Static plan definitions with limits
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  -- Limits (-1 = unlimited)
  limit_text_messages INTEGER DEFAULT 30,
  limit_voice_messages INTEGER DEFAULT 5,
  limit_image_messages INTEGER DEFAULT 5,
  limit_ai_conversations INTEGER DEFAULT 10,
  limit_budgets INTEGER DEFAULT 1,
  can_export_csv BOOLEAN DEFAULT false,
  can_export_pdf BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (id, name, price_monthly, limit_text_messages, limit_voice_messages, limit_image_messages, limit_ai_conversations, limit_budgets, can_export_csv, can_export_pdf)
VALUES
  ('free', 'Free', 0, 30, 5, 5, 10, 1, false, false),
  ('basic', 'Basic', 2.99, 150, 30, 20, 50, 5, true, false),
  ('premium', 'Premium', 7.99, -1, 100, 50, -1, -1, true, true)
ON CONFLICT (id) DO NOTHING;

-- 2. User Subscriptions - User's current plan and billing cycle
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES subscription_plans(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by phone
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_phone ON user_subscriptions(phone);

-- 3. Usage Tracking - Monthly usage counts per message type
CREATE TABLE IF NOT EXISTS usage_tracking (
  id SERIAL PRIMARY KEY,
  phone TEXT NOT NULL,
  usage_type TEXT NOT NULL, -- 'text', 'voice', 'image', 'ai_conversation', 'budget'
  count INTEGER DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL, -- Start of billing period
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone, usage_type, period_start)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_tracking_phone ON usage_tracking(phone);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_phone_period ON usage_tracking(phone, period_start);

-- Function to get current billing period start for a user
CREATE OR REPLACE FUNCTION get_billing_period_start(user_phone TEXT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  sub_start TIMESTAMP WITH TIME ZONE;
  current_period TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user's subscription start date
  SELECT started_at INTO sub_start
  FROM user_subscriptions
  WHERE phone = user_phone AND is_active = true
  LIMIT 1;

  -- If no subscription, use first day of current month
  IF sub_start IS NULL THEN
    RETURN date_trunc('month', NOW());
  END IF;

  -- Calculate current billing period based on subscription start
  -- If started on the 15th, billing period is 15th to 14th of next month
  current_period := sub_start;
  WHILE current_period + INTERVAL '1 month' <= NOW() LOOP
    current_period := current_period + INTERVAL '1 month';
  END LOOP;

  RETURN current_period;
END;
$$ LANGUAGE plpgsql;

-- View to get user's current usage with limits
CREATE OR REPLACE VIEW user_usage_status AS
SELECT
  us.phone,
  us.plan_id,
  sp.name as plan_name,
  sp.limit_text_messages,
  sp.limit_voice_messages,
  sp.limit_image_messages,
  sp.limit_ai_conversations,
  sp.limit_budgets,
  sp.can_export_csv,
  sp.can_export_pdf,
  COALESCE(ut_text.count, 0) as used_text_messages,
  COALESCE(ut_voice.count, 0) as used_voice_messages,
  COALESCE(ut_image.count, 0) as used_image_messages,
  COALESCE(ut_ai.count, 0) as used_ai_conversations,
  COALESCE(ut_budget.count, 0) as used_budgets
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN usage_tracking ut_text ON us.phone = ut_text.phone
  AND ut_text.usage_type = 'text'
  AND ut_text.period_start = get_billing_period_start(us.phone)
LEFT JOIN usage_tracking ut_voice ON us.phone = ut_voice.phone
  AND ut_voice.usage_type = 'voice'
  AND ut_voice.period_start = get_billing_period_start(us.phone)
LEFT JOIN usage_tracking ut_image ON us.phone = ut_image.phone
  AND ut_image.usage_type = 'image'
  AND ut_image.period_start = get_billing_period_start(us.phone)
LEFT JOIN usage_tracking ut_ai ON us.phone = ut_ai.phone
  AND ut_ai.usage_type = 'ai_conversation'
  AND ut_ai.period_start = get_billing_period_start(us.phone)
LEFT JOIN usage_tracking ut_budget ON us.phone = ut_budget.phone
  AND ut_budget.usage_type = 'budget'
  AND ut_budget.period_start = get_billing_period_start(us.phone)
WHERE us.is_active = true;
