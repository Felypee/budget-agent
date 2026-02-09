/**
 * Supabase database for subscription management
 * Drop-in replacement for subscriptionDB.inMemory.js
 */

import { supabase } from "./supabaseDB.js";

/**
 * Subscription Plan operations (read from DB, but plans are static)
 */
export const SubscriptionPlanDB = {
  async get(planId) {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this._mapPlan(data) : null;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_monthly", { ascending: true });

    if (error) throw error;
    return (data || []).map(this._mapPlan);
  },

  async getDefault() {
    return this.get("free");
  },

  // Map DB column names to JS camelCase
  _mapPlan(row) {
    return {
      id: row.id,
      name: row.name,
      priceMonthly: parseFloat(row.price_monthly),
      limitTextMessages: row.limit_text_messages,
      limitVoiceMessages: row.limit_voice_messages,
      limitImageMessages: row.limit_image_messages,
      limitAiConversations: row.limit_ai_conversations,
      limitBudgets: row.limit_budgets,
      canExportCsv: row.can_export_csv,
      canExportPdf: row.can_export_pdf,
    };
  },
};

/**
 * User Subscription operations
 */
export const UserSubscriptionDB = {
  async create(phone, planId = "free") {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert([
        {
          phone,
          plan_id: planId,
          started_at: new Date().toISOString(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return this._mapSubscription(data);
  },

  async get(phone) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("phone", phone)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this._mapSubscription(data) : null;
  },

  async getOrCreate(phone) {
    let subscription = await this.get(phone);
    if (!subscription) {
      subscription = await this.create(phone, "free");
    }
    return subscription;
  },

  async update(phone, data) {
    const updateData = {};
    if (data.planId !== undefined) updateData.plan_id = data.planId;
    if (data.startedAt !== undefined) updateData.started_at = data.startedAt;
    if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from("user_subscriptions")
      .update(updateData)
      .eq("phone", phone)
      .select()
      .single();

    if (error) throw error;
    return this._mapSubscription(result);
  },

  async upgradePlan(phone, newPlanId) {
    let subscription = await this.get(phone);

    if (!subscription) {
      subscription = await this.create(phone, newPlanId);
    } else {
      subscription = await this.update(phone, {
        planId: newPlanId,
        startedAt: new Date().toISOString(), // Reset billing period
      });
    }

    return subscription;
  },

  async getPlan(phone) {
    const subscription = await this.getOrCreate(phone);
    return SubscriptionPlanDB.get(subscription.planId);
  },

  /**
   * Get the start of the current billing period for a user
   */
  async getBillingPeriodStart(phone) {
    const subscription = await this.getOrCreate(phone);
    const startedAt = new Date(subscription.startedAt);
    const now = new Date();

    // Calculate how many full months have passed since subscription started
    let periodStart = new Date(startedAt);
    while (periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 <= now.getTime()) {
      periodStart = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return periodStart;
  },

  _mapSubscription(row) {
    return {
      id: row.id,
      phone: row.phone,
      planId: row.plan_id,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

/**
 * Usage Tracking operations
 */
export const UsageDB = {
  /**
   * Get the period start for storage
   */
  async _getPeriodStart(phone) {
    return UserSubscriptionDB.getBillingPeriodStart(phone);
  },

  /**
   * Get current usage count for a specific type
   */
  async getUsage(phone, usageType) {
    const periodStart = await this._getPeriodStart(phone);

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("count")
      .eq("phone", phone)
      .eq("usage_type", usageType)
      .eq("period_start", periodStart.toISOString())
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? data.count : 0;
  },

  /**
   * Increment usage count for a specific type
   */
  async increment(phone, usageType) {
    const periodStart = await this._getPeriodStart(phone);

    // Use upsert to either create or increment
    const { data: existing } = await supabase
      .from("usage_tracking")
      .select("id, count")
      .eq("phone", phone)
      .eq("usage_type", usageType)
      .eq("period_start", periodStart.toISOString())
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("usage_tracking")
        .update({
          count: existing.count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("count")
        .single();

      if (error) throw error;
      return data.count;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("usage_tracking")
        .insert([
          {
            phone,
            usage_type: usageType,
            count: 1,
            period_start: periodStart.toISOString(),
          },
        ])
        .select("count")
        .single();

      if (error) throw error;
      return data.count;
    }
  },

  /**
   * Get all usage for current period
   */
  async getAllUsage(phone) {
    const periodStart = await this._getPeriodStart(phone);

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("usage_type, count")
      .eq("phone", phone)
      .eq("period_start", periodStart.toISOString());

    if (error) throw error;

    const usageMap = {
      text: 0,
      voice: 0,
      image: 0,
      ai_conversation: 0,
      budget: 0,
    };

    for (const row of data || []) {
      usageMap[row.usage_type] = row.count;
    }

    return usageMap;
  },

  /**
   * Reset usage for current billing period
   */
  async resetPeriod(phone) {
    const periodStart = await this._getPeriodStart(phone);

    const { error } = await supabase
      .from("usage_tracking")
      .delete()
      .eq("phone", phone)
      .eq("period_start", periodStart.toISOString());

    if (error) throw error;
  },

  /**
   * Check if user has exceeded limit for a specific type
   * Returns { allowed: boolean, used: number, limit: number, remaining: number }
   */
  async checkLimit(phone, usageType) {
    const plan = await UserSubscriptionDB.getPlan(phone);
    const used = await this.getUsage(phone, usageType);

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
