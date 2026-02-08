# FinanceFlow Subscription Pricing Analysis

**Document Version:** 1.0
**Date:** February 2026
**Purpose:** Calculate per-user costs and define subscription tiers (Free, Pro, Max)

---

## Table of Contents

1. [Infrastructure Costs](#1-infrastructure-costs)
2. [Per-User Variable Costs](#2-per-user-variable-costs)
3. [Usage Scenarios](#3-usage-scenarios)
4. [Cost Calculations](#4-cost-calculations)
5. [Proposed Subscription Tiers](#5-proposed-subscription-tiers)
6. [Break-Even Analysis](#6-break-even-analysis)7. [Recommendations](#7-recommendations)

---

## 1. Infrastructure Costs

### 1.1 Railway Hosting

| Plan | Monthly Cost | Included Usage | Best For |
|------|-------------|----------------|----------|
| Hobby | $5/month | $5 in compute credits | Development, small user base |
| Pro | $20/month | $20 in compute credits | Production, scaling |

**Key Notes:**
- Usage-based billing (CPU + memory)
- No per-seat pricing
- Idle apps cost less (pay for actual utilization)

**Source:** [Railway Pricing](https://railway.com/pricing)

### 1.2 Supabase Database

| Plan | Monthly Cost | Database | MAUs | Storage |
|------|-------------|----------|------|---------|
| Free | $0 | 500 MB | 50,000 | 1 GB |
| Pro | $25/month | 8 GB | 100,000 | 100 GB |
| Team | $599/month | Custom | Custom | Custom |

**Overage Costs (Pro plan):**
- Additional MAUs: $0.00325 per MAU
- Database storage: $0.125 per GB
- File storage: $0.021 per GB
- Egress: $0.09 per GB

**Source:** [Supabase Pricing](https://supabase.com/pricing)

### 1.3 Fixed Monthly Infrastructure Costs

| Scenario | Railway | Supabase | Total Fixed |
|----------|---------|----------|-------------|
| Startup (< 50K users) | $5 | $0 | **$5/month** |
| Growth (< 100K users) | $20 | $25 | **$45/month** |
| Scale (100K+ users) | $20+ | $25+ | **$45+/month** |

---

## 2. Per-User Variable Costs

### 2.1 Claude API (claude-sonnet-4-20250514)

| Token Type | Cost per 1M tokens | Cost per 1K tokens |
|------------|-------------------|-------------------|
| Input | $3.00 | $0.003 |
| Output | $15.00 | $0.015 |

**Batch API:** 50% discount (asynchronous processing)
**Prompt Caching:** 90% savings on repeated context

**Source:** [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

### 2.2 WhatsApp Business API

| Message Type | Cost | Notes |
|--------------|------|-------|
| Service Messages | **FREE** | Customer-initiated, replies within 24h |
| Marketing Templates | $0.025-$0.14/msg | Varies by country |
| Utility Templates | $0.004-$0.05/msg | Varies by country |
| Authentication | $0.004-$0.05/msg | Varies by country |

**Key Insight:** Since FinanceFlow responds to user messages (expense logging, queries), most messages fall under **SERVICE MESSAGES = FREE**.

**Source:** [WhatsApp Platform Pricing](https://business.whatsapp.com/products/platform-pricing)

### 2.3 Groq Whisper (Voice Transcription)

| Model | Cost per Hour |
|-------|--------------|
| Distil-Whisper | $0.02/hour |
| Whisper Large V3 Turbo | $0.04/hour |
| Whisper Large V3 | $0.111/hour |

**Comparison:** OpenAI Whisper costs $0.36/hour (9x more expensive)

**Source:** [Groq Pricing](https://groq.com/pricing)

---

## 3. Usage Scenarios

### 3.1 User Behavior Assumptions

| Metric | Light User | Average User | Power User |
|--------|------------|--------------|------------|
| Messages/month | 30 | 100 | 300 |
| Expenses logged/month | 15 | 50 | 150 |
| Budget checks/month | 5 | 15 | 50 |
| Voice messages/month | 0 | 5 | 20 |
| Receipt images/month | 0 | 3 | 15 |
| Summary requests/month | 2 | 10 | 30 |

### 3.2 Token Estimates per Interaction

| Interaction Type | Input Tokens | Output Tokens |
|------------------|--------------|---------------|
| Expense detection (simple) | ~200 | ~100 |
| Expense detection (complex) | ~400 | ~200 |
| Budget query | ~500 | ~150 |
| Summary request | ~800 | ~400 |
| Receipt OCR | ~1,500 | ~200 |
| Conversational query | ~600 | ~300 |

### 3.3 Voice Message Assumptions

- Average voice message: 15 seconds (0.25 minutes)
- Using Distil-Whisper at $0.02/hour = $0.00033/minute

---

## 4. Cost Calculations

### 4.1 Claude API Cost per User Type (Monthly)

#### Light User (30 messages/month)
```
Expense detection: 15 × (200 input + 100 output) = 3,000 input + 1,500 output
Budget checks: 5 × (500 input + 150 output) = 2,500 input + 750 output
Summaries: 2 × (800 input + 400 output) = 1,600 input + 800 output

Total: 7,100 input tokens + 3,050 output tokens

Cost: (7,100 × $0.003/1000) + (3,050 × $0.015/1000)
    = $0.0213 + $0.0458
    = $0.067/month
```

#### Average User (100 messages/month)
```
Expense detection: 50 × (300 input + 150 output) = 15,000 input + 7,500 output
Budget checks: 15 × (500 input + 150 output) = 7,500 input + 2,250 output
Summaries: 10 × (800 input + 400 output) = 8,000 input + 4,000 output
Receipt OCR: 3 × (1,500 input + 200 output) = 4,500 input + 600 output
Other queries: 22 × (600 input + 300 output) = 13,200 input + 6,600 output

Total: 48,200 input tokens + 20,950 output tokens

Cost: (48,200 × $0.003/1000) + (20,950 × $0.015/1000)
    = $0.145 + $0.314
    = $0.46/month
```

#### Power User (300 messages/month)
```
Expense detection: 150 × (300 input + 150 output) = 45,000 input + 22,500 output
Budget checks: 50 × (500 input + 150 output) = 25,000 input + 7,500 output
Summaries: 30 × (800 input + 400 output) = 24,000 input + 12,000 output
Receipt OCR: 15 × (1,500 input + 200 output) = 22,500 input + 3,000 output
Other queries: 55 × (600 input + 300 output) = 33,000 input + 16,500 output

Total: 149,500 input tokens + 61,500 output tokens

Cost: (149,500 × $0.003/1000) + (61,500 × $0.015/1000)
    = $0.449 + $0.923
    = $1.37/month
```

### 4.2 Voice Transcription Cost per User

| User Type | Voice Msgs/Month | Duration (min) | Cost |
|-----------|------------------|----------------|------|
| Light | 0 | 0 | $0.00 |
| Average | 5 | 1.25 | $0.0004 |
| Power | 20 | 5 | $0.0017 |

**Voice transcription cost is negligible** (~$0.001/month for average user)

### 4.3 WhatsApp Cost per User

**All service messages (responses to user-initiated messages) are FREE.**

Only outbound marketing (proactive notifications/reminders) would cost money:
- If sending 2 utility reminders/month: ~$0.01-0.05/user depending on country

### 4.4 Database Storage per User

Average expense record: ~500 bytes
Average user profile: ~2 KB
Monthly storage growth per active user: ~25 KB (50 expenses × 500 bytes)

**Storage cost per user:** Negligible within free tier limits

---

## 5. Cost Summary per User Type

### 5.1 Variable Cost per User (Monthly)

| Component | Light User | Average User | Power User |
|-----------|------------|--------------|------------|
| Claude API | $0.07 | $0.46 | $1.37 |
| Voice (Groq) | $0.00 | $0.00 | $0.00 |
| WhatsApp | $0.00 | $0.00 | $0.00 |
| Storage | $0.00 | $0.00 | $0.00 |
| **Total Variable** | **$0.07** | **$0.46** | **$1.37** |

### 5.2 Fixed Cost Allocation

With 1,000 users (mixed usage):
- Infrastructure: $45/month
- Per-user allocation: $0.045/user

With 10,000 users:
- Infrastructure: ~$60/month (slight scaling)
- Per-user allocation: $0.006/user

---

## 6. Proposed Subscription Tiers

### Tier Overview

| Feature | Free | Pro | Max |
|---------|------|-----|-----|
| **Monthly Price** | $0 | $4.99 | $9.99 |
| **Messages/month** | 50 | 300 | Unlimited |
| **Expenses tracked** | 30 | 200 | Unlimited |
| **Voice messages** | 5 | 30 | Unlimited |
| **Receipt scanning** | 3 | 20 | Unlimited |
| **Budget categories** | 3 | 10 | Unlimited |
| **Spending summaries** | Weekly | Daily | Real-time |
| **Export (CSV)** | No | Yes | Yes |
| **Analytics insights** | Basic | Advanced | AI-powered |
| **Priority support** | No | Email | WhatsApp + Email |
| **Data retention** | 3 months | 12 months | Unlimited |

### Cost Breakdown per Tier

#### Free Tier
```
Expected usage: Light user profile
Estimated cost per user: $0.07/month
Revenue: $0
Net: -$0.07/user/month

Strategy: Acquisition funnel, convert to paid
```

#### Pro Tier ($4.99/month)
```
Expected usage: Average user profile
Estimated cost per user: $0.46/month
Revenue: $4.99
Gross margin: $4.53/user (91%)
```

#### Max Tier ($9.99/month)
```
Expected usage: Power user profile
Estimated cost per user: $1.37/month
Revenue: $9.99
Gross margin: $8.62/user (86%)
```

---

## 7. Break-Even Analysis

### 7.1 Monthly Fixed Costs

| Cost | Startup Phase | Growth Phase |
|------|--------------|--------------|
| Railway | $5 | $20 |
| Supabase | $0 | $25 |
| **Total Fixed** | **$5** | **$45** |

### 7.2 Break-Even Scenarios

#### Startup Phase ($5/month fixed)

| Scenario | Free Users | Pro Users | Max Users | Monthly Revenue | Monthly Cost | Net |
|----------|------------|-----------|-----------|-----------------|--------------|-----|
| All Free | 100 | 0 | 0 | $0 | $12 | -$12 |
| 90/10 Mix | 90 | 10 | 0 | $49.90 | $14.62 | +$35.28 |
| 80/15/5 Mix | 80 | 15 | 5 | $124.80 | $20.73 | +$104.07 |

#### Growth Phase ($45/month fixed)

| Scenario | Free Users | Pro Users | Max Users | Monthly Revenue | Monthly Cost | Net |
|----------|------------|-----------|-----------|-----------------|--------------|-----|
| 1000 users (70/20/10) | 700 | 200 | 100 | $1,997 | $481 | +$1,516 |
| 5000 users (80/15/5) | 4000 | 750 | 250 | $6,240 | $1,431 | +$4,809 |

### 7.3 Break-Even Point

**Minimum paid users needed to cover fixed costs:**

Startup phase ($5 fixed):
- 1 Pro user generates $4.53 profit
- Break-even: 2 Pro users

Growth phase ($45 fixed):
- Break-even: 10 Pro users OR 6 Max users

---

## 8. Feature Limitations Implementation

### 8.1 How to Limit by Plan

| Limit Type | Implementation |
|------------|----------------|
| Message count | Counter in user record, reset monthly |
| Expense count | Query expense table COUNT per month |
| Voice messages | Counter, check before transcription |
| Receipt scans | Counter, check before OCR processing |
| Categories | Enforce limit when adding budgets |
| Data retention | Background job to delete old records |

### 8.2 Upgrade Prompts

Trigger upgrade prompts when user hits 80% of their limit:
- "You've used 40 of your 50 messages this month. Upgrade to Pro for unlimited messaging!"

---

## 9. Competitive Analysis

| Competitor | Free Tier | Paid Tier | Notes |
|------------|-----------|-----------|-------|
| YNAB | 34-day trial | $14.99/mo | No WhatsApp |
| Mint | Free (ads) | Discontinued | - |
| Copilot | Free | $9.99/mo | iOS only |
| Simplifi | 30-day trial | $5.99/mo | No AI |

**FinanceFlow Advantage:** WhatsApp-native, AI-powered, no app download required.

---

## 10. Recommendations

### 10.1 Pricing Strategy

1. **Start with Free + Pro only** - Simpler to manage, validate demand
2. **Add Max tier after 1,000+ users** - When you have power users to convert
3. **Consider annual discounts** - 20% off for yearly ($47.90/year Pro)

### 10.2 Cost Optimization Opportunities

1. **Prompt caching** - Save 90% on repeated context (user history)
2. **Batch API for analytics** - 50% savings on non-real-time features
3. **Switch to Haiku for simple tasks** - 10x cheaper for expense detection
4. **Regional pricing** - Lower prices for developing markets

### 10.3 Revenue Projections (Year 1)

| Month | Total Users | Free | Pro | Max | MRR |
|-------|-------------|------|-----|-----|-----|
| 1 | 100 | 90 | 10 | 0 | $50 |
| 3 | 500 | 400 | 80 | 20 | $600 |
| 6 | 2,000 | 1,500 | 400 | 100 | $2,996 |
| 12 | 10,000 | 7,000 | 2,400 | 600 | $17,970 |

---

## 11. Summary

### Per-User Cost Reality

| User Type | Your Cost | Recommended Price | Margin |
|-----------|-----------|-------------------|--------|
| Light (Free) | $0.07/mo | $0 | -$0.07 |
| Average (Pro) | $0.46/mo | $4.99 | 91% |
| Power (Max) | $1.37/mo | $9.99 | 86% |

### Key Takeaways

1. **Claude API is your main variable cost** - ~95% of per-user costs
2. **WhatsApp is essentially free** - Service messages have no charge
3. **Voice transcription is negligible** - Groq Whisper is extremely cheap
4. **High margins are achievable** - 86-91% gross margin on paid tiers
5. **Free tier is sustainable** - $0.07/user is affordable for acquisition

---

## Sources

- [Railway Pricing](https://railway.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [Groq Pricing](https://groq.com/pricing)

---

*Document created: February 2026*
*Last updated: February 2026*
