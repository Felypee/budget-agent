/**
 * Manage Subscription Tool
 * Allows users to cancel, reactivate, or check subscription status
 */

import {
  cancelAutoRenewal,
  reactivateAutoRenewal,
  getSubscriptionStatus,
} from "../services/wompiRecurringService.js";
import { SUBSCRIPTION_PLANS, formatPriceCOP } from "../services/wompiService.js";

export const definition = {
  name: "manage_subscription",
  description: `Manage the user's subscription. Use this tool when the user wants to:
- Cancel their subscription or auto-renewal ("cancelar suscripción", "cancel subscription", "no quiero renovar", "desactivar renovación")
- Reactivate auto-renewal ("reactivar suscripción", "activar renovación", "volver a suscribirse")
- Check detailed subscription status ("estado de suscripción", "subscription status", "cuando vence mi plan")
Note: For basic plan info and upgrade options, use subscription_status or upgrade_info instead.`,
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["cancel", "reactivate", "status"],
        description: "The action to perform: cancel (stop auto-renewal), reactivate (enable auto-renewal), or status (check detailed status)",
      },
    },
    required: ["action"],
  },
};

/**
 * Handler for subscription management
 * @param {string} phone - User's phone number
 * @param {object} params - Tool parameters
 * @param {string} lang - User's language
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function handler(phone, params, lang = "es") {
  const { action } = params;

  try {
    switch (action) {
      case "cancel":
        return handleCancel(phone, lang);
      case "reactivate":
        return handleReactivate(phone, lang);
      case "status":
        return handleStatus(phone, lang);
      default:
        return {
          success: false,
          message: getActionUnknownMessage(lang),
        };
    }
  } catch (error) {
    console.error("[manage_subscription] Error:", error);
    return {
      success: false,
      message: getErrorMessage(lang),
    };
  }
}

/**
 * Handle subscription cancellation
 */
async function handleCancel(phone, lang) {
  const status = await getSubscriptionStatus(phone);

  // Check if already cancelled or on free plan
  if (status.planId === "free") {
    return {
      success: false,
      message: getCancelFreeMessage(lang),
    };
  }

  if (!status.autoRenew || status.cancelledAt) {
    return {
      success: false,
      message: getAlreadyCancelledMessage(lang, status),
    };
  }

  const result = await cancelAutoRenewal(phone);

  if (!result.success) {
    return {
      success: false,
      message: getCancelErrorMessage(lang, result.error),
    };
  }

  return {
    success: true,
    message: getCancelSuccessMessage(lang, status),
  };
}

/**
 * Handle subscription reactivation
 */
async function handleReactivate(phone, lang) {
  const status = await getSubscriptionStatus(phone);

  if (status.planId === "free") {
    return {
      success: false,
      message: getReactivateFreeMessage(lang),
    };
  }

  if (status.autoRenew && !status.cancelledAt) {
    return {
      success: false,
      message: getAlreadyActiveMessage(lang),
    };
  }

  if (!status.hasPaymentMethod) {
    return {
      success: false,
      message: getNoPaymentMethodMessage(lang),
    };
  }

  const result = await reactivateAutoRenewal(phone);

  if (!result.success) {
    return {
      success: false,
      message: getReactivateErrorMessage(lang, result.error),
    };
  }

  return {
    success: true,
    message: getReactivateSuccessMessage(lang, status),
  };
}

/**
 * Handle status check
 */
async function handleStatus(phone, lang) {
  const status = await getSubscriptionStatus(phone);
  return {
    success: true,
    message: getStatusMessage(lang, status),
  };
}

// ============================================================
// Message generators
// ============================================================

function getCancelFreeMessage(lang) {
  const messages = {
    es: "Estás en el plan gratuito, no hay suscripción que cancelar.",
    en: "You're on the free plan, there's no subscription to cancel.",
    pt: "Você está no plano gratuito, não há assinatura para cancelar.",
  };
  return messages[lang] || messages.es;
}

function getAlreadyCancelledMessage(lang, status) {
  const plan = SUBSCRIPTION_PLANS[status.planId];
  const planName = plan?.name || status.planId;

  const messages = {
    es: `Tu suscripción *${planName}* ya está cancelada. Seguirá activa hasta el fin del período actual.

Para reactivar, escribe "reactivar suscripción".`,
    en: `Your *${planName}* subscription is already cancelled. It will remain active until the end of the current period.

To reactivate, type "reactivate subscription".`,
    pt: `Sua assinatura *${planName}* já está cancelada. Ela permanecerá ativa até o final do período atual.

Para reativar, digite "reativar assinatura".`,
  };
  return messages[lang] || messages.es;
}

function getCancelErrorMessage(lang, error) {
  const messages = {
    es: `No pudimos cancelar tu suscripción: ${error}`,
    en: `We couldn't cancel your subscription: ${error}`,
    pt: `Não conseguimos cancelar sua assinatura: ${error}`,
  };
  return messages[lang] || messages.es;
}

function getCancelSuccessMessage(lang, status) {
  const plan = SUBSCRIPTION_PLANS[status.planId];
  const planName = plan?.name || status.planId;
  const expiryDate = status.nextBillingDate
    ? new Date(status.nextBillingDate).toLocaleDateString(lang === "en" ? "en-US" : "es-CO")
    : "fin del período";

  const messages = {
    es: `Tu renovación automática ha sido cancelada.

Tu plan *${planName}* seguirá activo hasta *${expiryDate}*.

Después de esa fecha volverás al plan gratuito. Si cambias de opinión, puedes reactivar escribiendo "reactivar suscripción".`,
    en: `Your auto-renewal has been cancelled.

Your *${planName}* plan will remain active until *${expiryDate}*.

After that date you'll return to the free plan. If you change your mind, you can reactivate by typing "reactivate subscription".`,
    pt: `Sua renovação automática foi cancelada.

Seu plano *${planName}* permanecerá ativo até *${expiryDate}*.

Após essa data, você voltará ao plano gratuito. Se mudar de ideia, pode reativar digitando "reativar assinatura".`,
  };
  return messages[lang] || messages.es;
}

function getReactivateFreeMessage(lang) {
  const messages = {
    es: `Estás en el plan gratuito. Escribe *upgrade* para ver las opciones de planes pagos.`,
    en: `You're on the free plan. Type *upgrade* to see paid plan options.`,
    pt: `Você está no plano gratuito. Digite *upgrade* para ver as opções de planos pagos.`,
  };
  return messages[lang] || messages.es;
}

function getAlreadyActiveMessage(lang) {
  const messages = {
    es: "Tu suscripción ya está activa con renovación automática.",
    en: "Your subscription is already active with auto-renewal.",
    pt: "Sua assinatura já está ativa com renovação automática.",
  };
  return messages[lang] || messages.es;
}

function getNoPaymentMethodMessage(lang) {
  const messages = {
    es: `No tienes un método de pago registrado. Escribe *upgrade* para suscribirte con un nuevo pago.`,
    en: `You don't have a registered payment method. Type *upgrade* to subscribe with a new payment.`,
    pt: `Você não tem um método de pagamento registrado. Digite *upgrade* para assinar com um novo pagamento.`,
  };
  return messages[lang] || messages.es;
}

function getReactivateErrorMessage(lang, error) {
  const messages = {
    es: `No pudimos reactivar tu suscripción: ${error}`,
    en: `We couldn't reactivate your subscription: ${error}`,
    pt: `Não conseguimos reativar sua assinatura: ${error}`,
  };
  return messages[lang] || messages.es;
}

function getReactivateSuccessMessage(lang, status) {
  const plan = SUBSCRIPTION_PLANS[status.planId];
  const planName = plan?.name || status.planId;

  const messages = {
    es: `¡Tu suscripción *${planName}* ha sido reactivada!

La renovación automática está activa nuevamente.`,
    en: `Your *${planName}* subscription has been reactivated!

Auto-renewal is now active again.`,
    pt: `Sua assinatura *${planName}* foi reativada!

A renovação automática está ativa novamente.`,
  };
  return messages[lang] || messages.es;
}

function getStatusMessage(lang, status) {
  const plan = SUBSCRIPTION_PLANS[status.planId];
  const planName = plan?.name || status.planId;
  const priceCOP = plan?.priceCOP || 0;

  const startDate = status.startedAt
    ? new Date(status.startedAt).toLocaleDateString(lang === "en" ? "en-US" : "es-CO")
    : "-";
  const nextBilling = status.nextBillingDate
    ? new Date(status.nextBillingDate).toLocaleDateString(lang === "en" ? "en-US" : "es-CO")
    : "-";

  const autoRenewStatus = status.autoRenew
    ? (lang === "es" ? "Activa" : lang === "pt" ? "Ativa" : "Active")
    : (lang === "es" ? "Cancelada" : lang === "pt" ? "Cancelada" : "Cancelled");

  const paymentMethod = status.hasPaymentMethod
    ? `${status.cardBrand || "Tarjeta"} ****${status.cardLastFour || "****"}`
    : (lang === "es" ? "No registrado" : lang === "pt" ? "Não registrado" : "Not registered");

  if (status.planId === "free") {
    const messages = {
      es: `*Estado de tu cuenta*

Plan: *Free* (Gratuito)
Precio: Gratis

Escribe *upgrade* para ver planes pagos con más moneditas.`,
      en: `*Your account status*

Plan: *Free*
Price: Free

Type *upgrade* to see paid plans with more moneditas.`,
      pt: `*Status da sua conta*

Plano: *Free* (Gratuito)
Preço: Grátis

Digite *upgrade* para ver planos pagos com mais moneditas.`,
    };
    return messages[lang] || messages.es;
  }

  const messages = {
    es: `*Estado de tu suscripción*

Plan: *${planName}*
Precio: ${formatPriceCOP(priceCOP)}/mes
Inicio: ${startDate}
Próxima renovación: ${nextBilling}
Renovación automática: ${autoRenewStatus}
Método de pago: ${paymentMethod}

${status.cancelledAt ? "⚠️ Tu suscripción está cancelada y no se renovará." : ""}`,
    en: `*Your subscription status*

Plan: *${planName}*
Price: ${formatPriceCOP(priceCOP)}/month
Started: ${startDate}
Next billing: ${nextBilling}
Auto-renewal: ${autoRenewStatus}
Payment method: ${paymentMethod}

${status.cancelledAt ? "⚠️ Your subscription is cancelled and won't renew." : ""}`,
    pt: `*Status da sua assinatura*

Plano: *${planName}*
Preço: ${formatPriceCOP(priceCOP)}/mês
Início: ${startDate}
Próxima renovação: ${nextBilling}
Renovação automática: ${autoRenewStatus}
Método de pagamento: ${paymentMethod}

${status.cancelledAt ? "⚠️ Sua assinatura está cancelada e não será renovada." : ""}`,
  };
  return messages[lang] || messages.es;
}

function getActionUnknownMessage(lang) {
  const messages = {
    es: "Acción no reconocida. Usa 'cancelar', 'reactivar' o 'estado'.",
    en: "Unknown action. Use 'cancel', 'reactivate', or 'status'.",
    pt: "Ação não reconhecida. Use 'cancelar', 'reativar' ou 'status'.",
  };
  return messages[lang] || messages.es;
}

function getErrorMessage(lang) {
  const messages = {
    es: "Ocurrió un error al procesar tu solicitud. Intenta de nuevo.",
    en: "An error occurred while processing your request. Please try again.",
    pt: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
  };
  return messages[lang] || messages.es;
}

export default { definition, handler };
