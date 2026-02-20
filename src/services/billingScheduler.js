/**
 * Billing Scheduler Service
 * Handles automatic recurring payments via cron jobs
 *
 * Schedule:
 * - 8:00 AM daily: Process subscriptions due for renewal
 * - 2:00 PM daily: Retry failed payments
 */

import cron from "node-cron";
import { UserSubscriptionDB, PaymentSourceDB, BillingHistoryDB } from "../database/index.js";
import {
  chargeRecurringPayment,
  retryFailedPayment,
} from "./wompiRecurringService.js";

/**
 * Process subscriptions due for renewal
 * Called daily at 8 AM
 */
export async function processDueRenewals() {
  console.log("[billing] Starting daily renewal check...");

  try {
    // Get all active payment sources (users with auto-renew enabled)
    const activeSources = await PaymentSourceDB.getAllActive();

    if (!activeSources || activeSources.length === 0) {
      console.log("[billing] No active payment sources to process");
      return { processed: 0, success: 0, failed: 0 };
    }

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (const source of activeSources) {
      const phone = source.phone;

      // Get subscription
      const subscription = await UserSubscriptionDB.get(phone);
      if (!subscription) continue;

      // Skip if not auto-renew or cancelled
      if (!subscription.autoRenew) continue;
      if (subscription.cancelledAt) continue;

      // Check if billing is due
      const nextBilling = subscription.nextBillingDate
        ? new Date(subscription.nextBillingDate)
        : null;

      if (!nextBilling) continue;

      const now = new Date();
      if (nextBilling > now) {
        // Not due yet
        continue;
      }

      console.log(`[billing] Processing renewal for ${phone}, plan: ${subscription.planId}`);
      processed++;

      const result = await chargeRecurringPayment(phone, subscription.planId);

      if (result.success) {
        success++;
        console.log(`[billing] ✅ Renewal successful for ${phone}`);
      } else {
        failed++;
        console.log(`[billing] ❌ Renewal failed for ${phone}: ${result.error}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[billing] Daily renewal complete: ${processed} processed, ${success} success, ${failed} failed`);
    return { processed, success, failed };
  } catch (error) {
    console.error("[billing] Error in processDueRenewals:", error);
    return { processed: 0, success: 0, failed: 0, error: error.message };
  }
}

/**
 * Retry failed payments
 * Called daily at 2 PM
 */
export async function processFailedRetries() {
  console.log("[billing] Starting retry check for failed payments...");

  try {
    // Get payments that need retry
    const pendingRetries = await BillingHistoryDB.getPendingRetries();

    if (!pendingRetries || pendingRetries.length === 0) {
      console.log("[billing] No pending retries to process");
      return { processed: 0, success: 0, failed: 0 };
    }

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (const record of pendingRetries) {
      console.log(`[billing] Retrying payment for ${record.phone}, attempt ${record.retryCount + 1}`);
      processed++;

      const result = await retryFailedPayment(record);

      if (result.success) {
        success++;
        console.log(`[billing] ✅ Retry successful for ${record.phone}`);
      } else {
        failed++;
        console.log(`[billing] ❌ Retry failed for ${record.phone}: ${result.error}`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`[billing] Retry processing complete: ${processed} processed, ${success} success, ${failed} failed`);
    return { processed, success, failed };
  } catch (error) {
    console.error("[billing] Error in processFailedRetries:", error);
    return { processed: 0, success: 0, failed: 0, error: error.message };
  }
}

/**
 * Start the billing scheduler
 * Uses node-cron for scheduling
 */
export function startBillingScheduler() {
  // Process renewals at 8:00 AM daily (server time)
  cron.schedule("0 8 * * *", async () => {
    console.log("[billing] ⏰ Running scheduled renewal processing...");
    await processDueRenewals();
  });

  // Process retries at 2:00 PM daily (server time)
  cron.schedule("0 14 * * *", async () => {
    console.log("[billing] ⏰ Running scheduled retry processing...");
    await processFailedRetries();
  });

  console.log("[billing] Billing scheduler started (renewals at 8 AM, retries at 2 PM)");
}

/**
 * Manually trigger renewal processing (for testing/admin)
 */
export async function triggerRenewals() {
  return processDueRenewals();
}

/**
 * Manually trigger retry processing (for testing/admin)
 */
export async function triggerRetries() {
  return processFailedRetries();
}

export default {
  startBillingScheduler,
  processDueRenewals,
  processFailedRetries,
  triggerRenewals,
  triggerRetries,
};
