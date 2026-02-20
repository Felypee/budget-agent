/**
 * In-memory database for payment sources and billing history
 * Mirrors the Supabase implementation for local development/testing
 */

// Payment sources storage: phone -> payment source data
const paymentSources = new Map();

// Billing history storage: array of billing records
const billingHistory = [];
let billingIdCounter = 1;

/**
 * Payment Source operations (tokenized cards)
 */
export const PaymentSourceDB = {
  /**
   * Create a new payment source for a user
   * @param {string} phone - User's phone number
   * @param {object} data - Payment source data
   * @returns {object} Created payment source
   */
  create(phone, data) {
    const paymentSource = {
      id: Date.now(),
      phone,
      wompiPaymentSourceId: data.wompiPaymentSourceId,
      cardLastFour: data.cardLastFour || null,
      cardBrand: data.cardBrand || null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    paymentSources.set(phone, paymentSource);
    return paymentSource;
  },

  /**
   * Get payment source for a user
   * @param {string} phone - User's phone number
   * @returns {object|null} Payment source or null
   */
  get(phone) {
    return paymentSources.get(phone) || null;
  },

  /**
   * Update payment source
   * @param {string} phone - User's phone number
   * @param {object} data - Fields to update
   * @returns {object|null} Updated payment source
   */
  update(phone, data) {
    const existing = paymentSources.get(phone);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    paymentSources.set(phone, updated);
    return updated;
  },

  /**
   * Cancel (soft delete) a payment source
   * @param {string} phone - User's phone number
   * @returns {object|null} Updated payment source
   */
  cancel(phone) {
    return this.update(phone, { status: 'cancelled' });
  },

  /**
   * Reactivate a cancelled payment source
   * @param {string} phone - User's phone number
   * @returns {object|null} Updated payment source
   */
  reactivate(phone) {
    return this.update(phone, { status: 'active' });
  },

  /**
   * Delete payment source completely
   * @param {string} phone - User's phone number
   */
  delete(phone) {
    paymentSources.delete(phone);
  },

  /**
   * Get all active payment sources
   * @returns {Array} List of active payment sources
   */
  getAllActive() {
    return Array.from(paymentSources.values()).filter(ps => ps.status === 'active');
  },
};

/**
 * Billing History operations
 */
export const BillingHistoryDB = {
  /**
   * Create a billing record
   * @param {object} data - Billing data
   * @returns {object} Created billing record
   */
  create(data) {
    const record = {
      id: billingIdCounter++,
      phone: data.phone,
      planId: data.planId,
      amountCop: data.amountCop,
      wompiTransactionId: data.wompiTransactionId || null,
      status: data.status || 'pending',
      retryCount: data.retryCount || 0,
      nextRetryAt: data.nextRetryAt || null,
      errorMessage: data.errorMessage || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    billingHistory.push(record);
    return record;
  },

  /**
   * Get billing history for a user
   * @param {string} phone - User's phone number
   * @param {number} limit - Maximum records to return
   * @returns {Array} Billing records
   */
  getByPhone(phone, limit = 10) {
    return billingHistory
      .filter(r => r.phone === phone)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  /**
   * Get pending retries (failed payments that need retry)
   * @returns {Array} Records needing retry
   */
  getPendingRetries() {
    const now = new Date();
    return billingHistory.filter(r =>
      r.status === 'declined' &&
      r.retryCount < 3 &&
      r.nextRetryAt &&
      new Date(r.nextRetryAt) <= now
    );
  },

  /**
   * Update billing record
   * @param {number} id - Record ID
   * @param {object} data - Fields to update
   * @returns {object|null} Updated record
   */
  update(id, data) {
    const index = billingHistory.findIndex(r => r.id === id);
    if (index === -1) return null;

    billingHistory[index] = {
      ...billingHistory[index],
      ...data,
      updatedAt: new Date(),
    };

    return billingHistory[index];
  },

  /**
   * Get record by ID
   * @param {number} id - Record ID
   * @returns {object|null} Billing record
   */
  get(id) {
    return billingHistory.find(r => r.id === id) || null;
  },

  /**
   * Get latest billing record for a user
   * @param {string} phone - User's phone number
   * @returns {object|null} Latest billing record
   */
  getLatest(phone) {
    const records = this.getByPhone(phone, 1);
    return records[0] || null;
  },
};

export default { PaymentSourceDB, BillingHistoryDB };
