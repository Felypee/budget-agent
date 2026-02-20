/**
 * Supabase database for payment sources and billing history
 * Drop-in replacement for paymentSourceDB.inMemory.js
 */

import { supabase } from "./supabaseDB.js";

/**
 * Payment Source operations (tokenized cards)
 */
export const PaymentSourceDB = {
  /**
   * Create a new payment source for a user
   * @param {string} phone - User's phone number
   * @param {object} data - Payment source data
   * @returns {Promise<object>} Created payment source
   */
  async create(phone, data) {
    const { data: result, error } = await supabase
      .from("payment_sources")
      .upsert([
        {
          phone,
          wompi_payment_source_id: data.wompiPaymentSourceId,
          card_last_four: data.cardLastFour || null,
          card_brand: data.cardBrand || null,
          status: 'active',
        },
      ], { onConflict: 'phone' })
      .select()
      .single();

    if (error) throw error;
    return this._map(result);
  },

  /**
   * Get payment source for a user
   * @param {string} phone - User's phone number
   * @returns {Promise<object|null>} Payment source or null
   */
  async get(phone) {
    const { data, error } = await supabase
      .from("payment_sources")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this._map(data) : null;
  },

  /**
   * Update payment source
   * @param {string} phone - User's phone number
   * @param {object} data - Fields to update
   * @returns {Promise<object|null>} Updated payment source
   */
  async update(phone, data) {
    const updateData = {};
    if (data.wompiPaymentSourceId !== undefined) {
      updateData.wompi_payment_source_id = data.wompiPaymentSourceId;
    }
    if (data.cardLastFour !== undefined) updateData.card_last_four = data.cardLastFour;
    if (data.cardBrand !== undefined) updateData.card_brand = data.cardBrand;
    if (data.status !== undefined) updateData.status = data.status;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from("payment_sources")
      .update(updateData)
      .eq("phone", phone)
      .select()
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return result ? this._map(result) : null;
  },

  /**
   * Cancel (soft delete) a payment source
   * @param {string} phone - User's phone number
   * @returns {Promise<object|null>} Updated payment source
   */
  async cancel(phone) {
    return this.update(phone, { status: 'cancelled' });
  },

  /**
   * Reactivate a cancelled payment source
   * @param {string} phone - User's phone number
   * @returns {Promise<object|null>} Updated payment source
   */
  async reactivate(phone) {
    return this.update(phone, { status: 'active' });
  },

  /**
   * Delete payment source completely
   * @param {string} phone - User's phone number
   */
  async delete(phone) {
    const { error } = await supabase
      .from("payment_sources")
      .delete()
      .eq("phone", phone);

    if (error) throw error;
  },

  /**
   * Get all active payment sources
   * @returns {Promise<Array>} List of active payment sources
   */
  async getAllActive() {
    const { data, error } = await supabase
      .from("payment_sources")
      .select("*")
      .eq("status", "active");

    if (error) throw error;
    return (data || []).map(this._map);
  },

  /**
   * Map database row to JS object
   */
  _map(row) {
    return {
      id: row.id,
      phone: row.phone,
      wompiPaymentSourceId: row.wompi_payment_source_id,
      cardLastFour: row.card_last_four,
      cardBrand: row.card_brand,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

/**
 * Billing History operations
 */
export const BillingHistoryDB = {
  /**
   * Create a billing record
   * @param {object} data - Billing data
   * @returns {Promise<object>} Created billing record
   */
  async create(data) {
    const { data: result, error } = await supabase
      .from("billing_history")
      .insert([
        {
          phone: data.phone,
          plan_id: data.planId,
          amount_cop: data.amountCop,
          wompi_transaction_id: data.wompiTransactionId || null,
          status: data.status || 'pending',
          retry_count: data.retryCount || 0,
          next_retry_at: data.nextRetryAt || null,
          error_message: data.errorMessage || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return this._map(result);
  },

  /**
   * Get billing history for a user
   * @param {string} phone - User's phone number
   * @param {number} limit - Maximum records to return
   * @returns {Promise<Array>} Billing records
   */
  async getByPhone(phone, limit = 10) {
    const { data, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(this._map);
  },

  /**
   * Get pending retries (failed payments that need retry)
   * @returns {Promise<Array>} Records needing retry
   */
  async getPendingRetries() {
    const { data, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("status", "declined")
      .lt("retry_count", 3)
      .lte("next_retry_at", new Date().toISOString());

    if (error) throw error;
    return (data || []).map(this._map);
  },

  /**
   * Update billing record
   * @param {number} id - Record ID
   * @param {object} data - Fields to update
   * @returns {Promise<object|null>} Updated record
   */
  async update(id, data) {
    const updateData = {};
    if (data.wompiTransactionId !== undefined) {
      updateData.wompi_transaction_id = data.wompiTransactionId;
    }
    if (data.status !== undefined) updateData.status = data.status;
    if (data.retryCount !== undefined) updateData.retry_count = data.retryCount;
    if (data.nextRetryAt !== undefined) updateData.next_retry_at = data.nextRetryAt;
    if (data.errorMessage !== undefined) updateData.error_message = data.errorMessage;
    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase
      .from("billing_history")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return result ? this._map(result) : null;
  },

  /**
   * Get record by ID
   * @param {number} id - Record ID
   * @returns {Promise<object|null>} Billing record
   */
  async get(id) {
    const { data, error } = await supabase
      .from("billing_history")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ? this._map(data) : null;
  },

  /**
   * Get latest billing record for a user
   * @param {string} phone - User's phone number
   * @returns {Promise<object|null>} Latest billing record
   */
  async getLatest(phone) {
    const records = await this.getByPhone(phone, 1);
    return records[0] || null;
  },

  /**
   * Map database row to JS object
   */
  _map(row) {
    return {
      id: row.id,
      phone: row.phone,
      planId: row.plan_id,
      amountCop: row.amount_cop,
      wompiTransactionId: row.wompi_transaction_id,
      status: row.status,
      retryCount: row.retry_count,
      nextRetryAt: row.next_retry_at,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

export default { PaymentSourceDB, BillingHistoryDB };
