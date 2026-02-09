/**
 * In-memory database for subscription management
 * Mirrors the Supabase implementation for local development/testing
 */

// Static plan definitions
const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    limitTextMessages: 30,
    limitVoiceMessages: 5,
    limitImageMessages: 5,
    limitAiConversations: 10,
    limitBudgets: 1,
    canExportCsv: false,
    canExportPdf: false,
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 2.99,
    limitTextMessages: 150,
    limitVoiceMessages: 30,
    limitImageMessages: 20,
    limitAiConversations: 50,
    limitBudgets: 5,
    canExportCsv: true,
    canExportPdf: false,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 7.99,
    limitTextMessages: -1, // unlimited
    limitVoiceMessages: 100,
    limitImageMessages: 50,
    limitAiConversations: -1, // unlimited
    limitBudgets: -1, // unlimited
    canExportCsv: true,
    canExportPdf: true,
  },
};

// User subscriptions: phone -> subscription data
const subscriptions = new Map();

// Usage tracking: phone -> { usageType -> { periodStart -> count } }
const usage = new Map();

/**
 * Subscription Plan operations (read-only, static data)
 */
export const SubscriptionPlanDB = {
  get(planId) {
    return PLANS[planId] || null;
  },

  getAll() {
    return Object.values(PLANS);
  },

  getDefault() {
    return PLANS.free;
  },
};

/**
 * User Subscription operations
 */
export const UserSubscriptionDB = {
  create(phone, planId = 'free') {
    const plan = SubscriptionPlanDB.get(planId);
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    const subscription = {
      phone,
      planId,
      startedAt: new Date(),
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    subscriptions.set(phone, subscription);
    return subscription;
  },

  get(phone) {
    return subscriptions.get(phone) || null;
  },

  getOrCreate(phone) {
    let subscription = this.get(phone);
    if (!subscription) {
      subscription = this.create(phone, 'free');
    }
    return subscription;
  },

  update(phone, data) {
    const subscription = subscriptions.get(phone);
    if (subscription) {
      Object.assign(subscription, data, { updatedAt: new Date() });
      subscriptions.set(phone, subscription);
    }
    return subscription;
  },

  upgradePlan(phone, newPlanId) {
    const plan = SubscriptionPlanDB.get(newPlanId);
    if (!plan) {
      throw new Error(`Invalid plan: ${newPlanId}`);
    }

    let subscription = this.get(phone);
    if (!subscription) {
      subscription = this.create(phone, newPlanId);
    } else {
      subscription.planId = newPlanId;
      subscription.startedAt = new Date(); // Reset billing period on upgrade
      subscription.updatedAt = new Date();
      subscriptions.set(phone, subscription);
    }

    return subscription;
  },

  getPlan(phone) {
    const subscription = this.getOrCreate(phone);
    return SubscriptionPlanDB.get(subscription.planId);
  },

  /**
   * Get the start of the current billing period for a user
   * Based on when they subscribed
   */
  getBillingPeriodStart(phone) {
    const subscription = this.getOrCreate(phone);
    const startedAt = new Date(subscription.startedAt);
    const now = new Date();

    // Calculate how many full months have passed since subscription started
    let periodStart = new Date(startedAt);
    while (periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 <= now.getTime()) {
      periodStart = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return periodStart;
  },
};

/**
 * Usage Tracking operations
 */
export const UsageDB = {
  /**
   * Get the period key for storage
   */
  _getPeriodKey(phone) {
    const periodStart = UserSubscriptionDB.getBillingPeriodStart(phone);
    return periodStart.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  /**
   * Get current usage count for a specific type
   */
  getUsage(phone, usageType) {
    const periodKey = this._getPeriodKey(phone);
    const userUsage = usage.get(phone);
    if (!userUsage) return 0;

    const typeUsage = userUsage[usageType];
    if (!typeUsage) return 0;

    return typeUsage[periodKey] || 0;
  },

  /**
   * Increment usage count for a specific type
   */
  increment(phone, usageType) {
    const periodKey = this._getPeriodKey(phone);

    let userUsage = usage.get(phone);
    if (!userUsage) {
      userUsage = {};
      usage.set(phone, userUsage);
    }

    if (!userUsage[usageType]) {
      userUsage[usageType] = {};
    }

    userUsage[usageType][periodKey] = (userUsage[usageType][periodKey] || 0) + 1;

    return userUsage[usageType][periodKey];
  },

  /**
   * Get all usage for current period
   */
  getAllUsage(phone) {
    const periodKey = this._getPeriodKey(phone);
    const userUsage = usage.get(phone) || {};

    return {
      text: userUsage.text?.[periodKey] || 0,
      voice: userUsage.voice?.[periodKey] || 0,
      image: userUsage.image?.[periodKey] || 0,
      ai_conversation: userUsage.ai_conversation?.[periodKey] || 0,
      budget: userUsage.budget?.[periodKey] || 0,
    };
  },

  /**
   * Reset usage for a new billing period (usually automatic based on period key)
   */
  resetPeriod(phone) {
    // Not really needed for in-memory since period key changes automatically
    // But can be used for testing
    const userUsage = usage.get(phone);
    if (userUsage) {
      const periodKey = this._getPeriodKey(phone);
      for (const type of Object.keys(userUsage)) {
        delete userUsage[type][periodKey];
      }
    }
  },

  /**
   * Check if user has exceeded limit for a specific type
   * Returns { allowed: boolean, used: number, limit: number, remaining: number }
   */
  checkLimit(phone, usageType) {
    const plan = UserSubscriptionDB.getPlan(phone);
    const used = this.getUsage(phone, usageType);

    // Map usage type to plan limit field
    const limitMap = {
      text: plan.limitTextMessages,
      voice: plan.limitVoiceMessages,
      image: plan.limitImageMessages,
      ai_conversation: plan.limitAiConversations,
      budget: plan.limitBudgets,
    };

    const limit = limitMap[usageType];

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, used, limit: -1, remaining: -1 };
    }

    const remaining = Math.max(0, limit - used);
    return {
      allowed: used < limit,
      used,
      limit,
      remaining,
    };
  },
};
