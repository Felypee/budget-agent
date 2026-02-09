import {
  sendTextMessage,
  sendInteractiveButtons,
  sendDocument,
  markAsRead,
  downloadMedia,
} from "../utils/whatsappClient.js";
import { UserDB, ExpenseDB, BudgetDB, UnprocessedDB } from "../database/index.js";
import { FinanceAgent } from "../agents/financeAgent.js";
import {
  getCurrencyFromPhone,
  validateAmount,
  formatAmount,
  isValidCurrency,
  getCurrencyName,
} from "../utils/currencyUtils.js";
import {
  processExpenseImage,
  processExpenseAudio,
} from "../utils/mediaProcessor.js";
import {
  hasPendingReminder,
  clearPendingReminder,
} from "../services/reminderService.js";
import {
  getLanguageFromPhone,
  getMessage,
} from "../utils/languageUtils.js";
import { getUserCategories } from "../utils/categoryUtils.js";
import {
  isInTutorial,
  startTutorial,
  processTutorialResponse,
  advanceTutorial,
  advanceToStep,
  simulateExpenseResponse,
  simulateSummaryResponse,
  simulateBudgetResponse,
} from "../services/onboardingService.js";
import {
  checkLimit,
  trackUsage,
  canExport,
  getSubscriptionStatus,
  getAvailablePlans,
  getLimitExceededMessage,
  getUpgradeMessage,
  formatSubscriptionStatus,
  formatUpgradePlans,
  USAGE_TYPES,
} from "../services/subscriptionService.js";
import { BudgetDB as BudgetDBImport } from "../database/index.js";

/**
 * Handle incoming WhatsApp messages
 */
export async function handleIncomingMessage(message, phone) {
  try {
    // Mark message as read
    await markAsRead(message.id);

    // Check if this is an existing user
    const existingUser = await UserDB.get(phone);
    const isNewUser = !existingUser;

    // Get or create user
    const user = await UserDB.getOrCreate(phone);

    // Try to set currency from phone if not already set
    if (!user.currency) {
      const detectedCurrency = getCurrencyFromPhone(phone);
      if (detectedCurrency) {
        await UserDB.setCurrency(phone, detectedCurrency);
        user.currency = detectedCurrency;
      }
    }

    // Try to set language from phone if not already set
    if (!user.language) {
      const detectedLanguage = getLanguageFromPhone(phone);
      if (detectedLanguage) {
        await UserDB.setLanguage(phone, detectedLanguage);
        user.language = detectedLanguage;
      }
    }

    const lang = user.language || 'en';

    // Start tutorial for new users
    if (isNewUser) {
      const tutorialMsg = await startTutorial(phone, lang);
      await sendTextMessage(phone, tutorialMsg);
      return;
    }

    // Check if user is in tutorial mode
    if (message.type === "text") {
      const messageText = message.text.body;
      const lowerMsg = messageText.toLowerCase().trim();

      // Handle "tutorial" command to restart tutorial
      if (lowerMsg === "tutorial") {
        const tutorialMsg = await startTutorial(phone, lang);
        await sendTextMessage(phone, tutorialMsg);
        return;
      }

      // Check if in tutorial and process response
      if (await isInTutorial(phone)) {
        const tutorialResult = await processTutorialResponse(phone, messageText, lang);

        if (tutorialResult) {
          // Check if this is an action that should be processed
          if (tutorialResult.advance) {
            // Get user currency for formatting
            const userCurrency = user.currency || 'USD';

            if (tutorialResult.processExpense) {
              // SANDBOX: Simulate expense (don't save to real DB)
              const expenseResponse = simulateExpenseResponse(phone, messageText, userCurrency, lang);
              await sendTextMessage(phone, expenseResponse);

              // Advance to the next step
              const nextStepMsg = await advanceToStep(phone, tutorialResult.nextStep, lang);
              if (nextStepMsg) {
                await sendTextMessage(phone, nextStepMsg);
              }
              return;
            } else if (tutorialResult.processSummary) {
              // SANDBOX: Simulate summary (shows the expense they logged)
              const summaryResponse = simulateSummaryResponse(phone, userCurrency, lang);
              await sendTextMessage(phone, summaryResponse);

              const nextStepMsg = await advanceToStep(phone, tutorialResult.nextStep, lang);
              if (nextStepMsg) {
                await sendTextMessage(phone, nextStepMsg);
              }
              return;
            } else if (tutorialResult.processBudget) {
              // SANDBOX: Simulate budget (don't save to real DB)
              const budgetResponse = simulateBudgetResponse(messageText, userCurrency, lang);
              await sendTextMessage(phone, budgetResponse);

              const nextStepMsg = await advanceToStep(phone, tutorialResult.nextStep, lang);
              if (nextStepMsg) {
                await sendTextMessage(phone, nextStepMsg);
              }
              return;
            }
          } else {
            // Regular tutorial message (hint or step content)
            await sendTextMessage(phone, tutorialResult);
            return;
          }
        }
      }
    }

    // Handle different message types
    let response;

    if (message.type === "text") {
      const messageText = message.text.body;
      console.log(`📨 Text from ${phone}: ${messageText}`);
      response = await processCommand(phone, messageText, lang);
    } else if (message.type === "interactive") {
      const buttonId = message.interactive.button_reply.id;
      const buttonTitle = message.interactive.button_reply.title;
      console.log(`📨 Button from ${phone}: ${buttonTitle} (${buttonId})`);

      // Handle reminder button responses
      if (buttonId === "reminder_yes") {
        clearPendingReminder(phone);
        response = getMessage('reminder_yes_response', lang);
      } else if (buttonId === "reminder_no") {
        clearPendingReminder(phone);
        response = getMessage('reminder_no_response', lang);
      } else {
        // Other button responses - process as command
        response = await processCommand(phone, buttonTitle, lang);
      }
    } else if (message.type === "image") {
      console.log(`📷 Image from ${phone}`);
      response = await processImageMessage(phone, message.image, user.currency, lang);
    } else if (message.type === "audio") {
      console.log(`🎤 Audio from ${phone}`);
      response = await processAudioMessage(phone, message.audio, user.currency, lang);
    } else {
      await sendTextMessage(
        phone,
        getMessage('unsupported_message', lang),
      );
      return;
    }

    if (response) {
      await sendTextMessage(phone, response);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    const errorLang = user?.language || 'en';
    await sendTextMessage(
      phone,
      getMessage('error_generic', errorLang),
    );
  }
}

/**
 * Process user commands and messages
 */
async function processCommand(phone, message, lang = 'en') {
  const agent = new FinanceAgent(phone);
  const lowerMsg = message.toLowerCase().trim();

  // Command: Start/Help (detect Spanish greetings too)
  if (
    lowerMsg === "hi" ||
    lowerMsg === "hello" ||
    lowerMsg === "start" ||
    lowerMsg === "help" ||
    lowerMsg === "hola" ||
    lowerMsg === "ayuda" ||
    lowerMsg === "inicio"
  ) {
    return getMessage('welcome', lang);
  }

  // Command: Set currency (supports English and Spanish)
  const currencyMatch = lowerMsg.match(/(?:my currency is|mi moneda es)\s+([a-z]{3})/i);
  if (currencyMatch) {
    return await handleSetCurrency(phone, currencyMatch[1].toUpperCase(), lang);
  }

  // Command: Rename category (EN/ES/PT)
  const renameMatch = message.match(/(?:rename|renombrar|renomear)\s+(.+?)\s+(?:to|a|para)\s+(.+)/i);
  if (renameMatch) {
    const oldName = renameMatch[1].trim().toLowerCase();
    const newName = renameMatch[2].trim().toLowerCase();
    return await handleRenameCategory(phone, oldName, newName, lang);
  }

  // Command: Set budget (supports English and Spanish)
  if ((lowerMsg.includes("set") && lowerMsg.includes("budget")) ||
      (lowerMsg.includes("pon") && lowerMsg.includes("presupuesto"))) {
    return await handleSetBudget(phone, message, lang);
  }

  // Command: Show budgets
  if (lowerMsg.includes("show budget") || lowerMsg === "budgets" ||
      lowerMsg.includes("ver presupuesto") || lowerMsg === "presupuestos") {
    return await handleShowBudgets(phone, lang);
  }

  // Command: Summary
  if (
    lowerMsg.includes("summary") ||
    lowerMsg.includes("how am i doing") ||
    lowerMsg.includes("status") ||
    lowerMsg.includes("resumen") ||
    lowerMsg.includes("cómo voy") ||
    lowerMsg.includes("como voy")
  ) {
    return await handleSummary(phone, lang);
  }

  // Command: Show expenses
  if (
    lowerMsg.includes("show expenses") ||
    lowerMsg.includes("list expenses") ||
    lowerMsg.includes("ver gastos") ||
    lowerMsg.includes("mis gastos")
  ) {
    return await handleShowExpenses(phone, lang);
  }

  // Command: Export expenses as CSV
  if (lowerMsg === "export" || lowerMsg === "exportar") {
    return await handleExportExpenses(phone, lang);
  }

  // Command: Show subscription status
  if (lowerMsg === "subscription" || lowerMsg === "plan" || lowerMsg === "suscripcion" || lowerMsg === "plano") {
    return await handleSubscriptionStatus(phone, lang);
  }

  // Command: Show upgrade options
  if (lowerMsg === "upgrade" || lowerMsg === "mejorar" || lowerMsg === "atualizar") {
    return await handleUpgradeOptions(phone, lang);
  }

  // Check text message limit before processing
  const textLimitCheck = await checkLimit(phone, USAGE_TYPES.TEXT);
  if (!textLimitCheck.allowed) {
    const status = await getSubscriptionStatus(phone);
    const limitMsg = getLimitExceededMessage(USAGE_TYPES.TEXT, lang, textLimitCheck);
    const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
    return `${limitMsg}\n\n${upgradeMsg}`;
  }

  // Auto-detect and log expenses (supports multiple expenses in one message)
  const categories = await getUserCategories(phone, lang);
  const expenseDetection = await agent.detectExpenses(message, categories);

  if (expenseDetection.detected && expenseDetection.expenses.length > 0) {
    // Get user's currency
    const userCurrency = await UserDB.getCurrency(phone);

    // Check if currency is set
    if (!userCurrency) {
      return getMessage('currency_not_set', lang);
    }

    // Validate all amounts first
    const validationErrors = [];
    for (const exp of expenseDetection.expenses) {
      const validation = validateAmount(exp.amount, userCurrency);
      if (!validation.valid) {
        validationErrors.push(`• ${exp.description || exp.category}: ${validation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      return getMessage('validation_error_multi', lang) + validationErrors.join("\n");
    }

    // Create all expenses
    const createdExpenses = [];
    const budgetAlerts = [];

    for (const exp of expenseDetection.expenses) {
      const expense = await ExpenseDB.create(phone, {
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
      });
      createdExpenses.push(expense);

      // Check budget alert for each category
      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency, lang);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response = `${getMessage('expense_logged', lang)} ${formatAmount(expense.amount, userCurrency)} ${getMessage('expense_for', lang)} ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response = getMessage('expense_logged_multi', lang, { count: createdExpenses.length }) + "\n";
      for (const expense of createdExpenses) {
        response += `• ${formatAmount(expense.amount, userCurrency)} - ${expense.category}`;
        if (expense.description) {
          response += ` (${expense.description})`;
        }
        response += "\n";
      }
    }

    if (budgetAlerts.length > 0) {
      response += `\n${budgetAlerts.join("\n")}`;
    }

    // Track text message usage after successful expense logging
    await trackUsage(phone, USAGE_TYPES.TEXT);

    return response;
  }

  // Check AI conversation limit before AI fallback
  const aiLimitCheck = await checkLimit(phone, USAGE_TYPES.AI_CONVERSATION);
  if (!aiLimitCheck.allowed) {
    const status = await getSubscriptionStatus(phone);
    const limitMsg = getLimitExceededMessage(USAGE_TYPES.AI_CONVERSATION, lang, aiLimitCheck);
    const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
    return `${limitMsg}\n\n${upgradeMsg}`;
  }

  // Default: Use AI to respond
  const aiResponse = await agent.processMessage(message);

  // Track AI conversation usage after successful response
  await trackUsage(phone, USAGE_TYPES.AI_CONVERSATION);

  return aiResponse;
}

/**
 * Handle budget setting
 */
async function handleSetBudget(phone, message, lang = 'en') {
  // Support both English and Spanish patterns
  const regexEn = /set\s+(\w+)\s+budget\s+(?:to\s+)?(\d+)/i;
  const regexEs = /(?:pon|establecer?)\s+presupuesto\s+(?:de\s+)?(\w+)\s+(?:en\s+)?(\d+)/i;

  let match = message.match(regexEn);
  let category, amount;

  if (match) {
    category = match[1].toLowerCase();
    amount = parseFloat(match[2]);
  } else {
    match = message.match(regexEs);
    if (match) {
      category = match[1].toLowerCase();
      amount = parseFloat(match[2]);
    }
  }

  if (category && amount) {
    const userCurrency = await UserDB.getCurrency(phone);
    const existing = await BudgetDB.getByCategory(phone, category);

    if (existing) {
      await BudgetDB.update(phone, category, amount);
      return getMessage('budget_updated', lang, { category, amount: formatAmount(amount, userCurrency) });
    } else {
      // Check budget limit before creating new budget
      const budgetLimitCheck = await checkLimit(phone, USAGE_TYPES.BUDGET);
      if (!budgetLimitCheck.allowed) {
        const status = await getSubscriptionStatus(phone);
        const limitMsg = getLimitExceededMessage(USAGE_TYPES.BUDGET, lang, budgetLimitCheck);
        const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
        return `${limitMsg}\n\n${upgradeMsg}`;
      }

      await BudgetDB.create(phone, { category, amount, period: "monthly" });

      // Track budget usage after successful creation
      await trackUsage(phone, USAGE_TYPES.BUDGET);

      return getMessage('budget_set', lang, { category, amount: formatAmount(amount, userCurrency) });
    }
  }

  return getMessage('budget_help', lang);
}

/**
 * Handle setting user currency
 */
async function handleSetCurrency(phone, currencyCode, lang = 'en') {
  // Check if currency is already set
  const existingCurrency = await UserDB.getCurrency(phone);
  if (existingCurrency) {
    return getMessage('currency_already_set', lang, { currency: `${getCurrencyName(existingCurrency)} (${existingCurrency})` });
  }

  // Validate currency code
  if (!isValidCurrency(currencyCode)) {
    return getMessage('currency_invalid', lang, { code: currencyCode });
  }

  // Set the currency
  await UserDB.setCurrency(phone, currencyCode);
  return getMessage('currency_set', lang, { currency: `${getCurrencyName(currencyCode)} (${currencyCode})` });
}

/**
 * Handle renaming a category
 */
async function handleRenameCategory(phone, oldName, newName, lang = 'en') {
  // Check if old category exists in user's expenses or budgets
  const allExpenses = await ExpenseDB.getByUser(phone);
  const allBudgets = await BudgetDB.getByUser(phone);

  const hasExpenses = allExpenses.some(e => e.category === oldName);
  const hasBudget = allBudgets.some(b => b.category === oldName);

  if (!hasExpenses && !hasBudget) {
    return getMessage('category_not_found', lang, { category: oldName });
  }

  // Rename in expenses and budgets
  await ExpenseDB.renameCategory(phone, oldName, newName);
  await BudgetDB.renameCategory(phone, oldName, newName);

  // Update user's custom categories list
  const categories = await getUserCategories(phone, lang);
  const updatedCategories = categories.map(c => c === oldName ? newName : c);
  // Add newName if oldName wasn't in the default list (edge case)
  if (!updatedCategories.includes(newName)) {
    updatedCategories.push(newName);
  }
  await UserDB.setCategories(phone, updatedCategories);

  return getMessage('category_renamed', lang, { old: oldName, new: newName });
}

/**
 * Show user budgets
 */
async function handleShowBudgets(phone, lang = 'en') {
  const budgets = (await BudgetDB.getByUser(phone)) || [];

  if (budgets.length === 0) {
    return getMessage('budget_none', lang);
  }

  const userCurrency = await UserDB.getCurrency(phone);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthName = now.toLocaleString(lang === 'es' ? 'es' : 'en', { month: "long" });
  let response = `${getMessage('budget_title', lang)} (${monthName})\n\n`;

  for (const budget of budgets) {
    const spent = await ExpenseDB.getTotalByCategory(
      phone,
      budget.category,
      startOfMonth,
      endOfMonth,
    );
    const remaining = budget.amount - spent;
    const percentage = ((spent / parseFloat(budget.amount || 0)) * 100).toFixed(0);

    response += `*${budget.category}*\n`;
    response += `${getMessage('budget_label', lang)} ${formatAmount(budget.amount, userCurrency)} | ${getMessage('budget_spent', lang)} ${formatAmount(spent, userCurrency)} (${percentage}%)\n`;
    response += `${getMessage('budget_remaining', lang)} ${formatAmount(remaining, userCurrency)}\n`;
    response += `${getProgressBar(percentage)}\n\n`;
  }

  return response;
}

/**
 * Show spending summary
 */
async function handleSummary(phone, lang = 'en') {
  const userCurrency = await UserDB.getCurrency(phone);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = (await ExpenseDB.getByDateRange(phone, startOfMonth, endOfMonth)) || [];
  const categorySummary = (await ExpenseDB.getCategorySummary(
    phone,
    startOfMonth,
    endOfMonth,
  )) || {};
  const budgets = (await BudgetDB.getByUser(phone)) || [];

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

  const monthName = now.toLocaleString(lang === 'es' ? 'es' : 'en', { month: "long" });
  let response = getMessage('summary_title', lang, { month: monthName }) + "\n\n";
  response += `${getMessage('summary_total_spent', lang)} ${formatAmount(totalSpent, userCurrency)}\n`;

  if (totalBudget > 0) {
    response += `${getMessage('summary_total_budget', lang)} ${formatAmount(totalBudget, userCurrency)}\n`;
    response += `${getMessage('summary_remaining', lang)} ${formatAmount(totalBudget - totalSpent, userCurrency)}\n\n`;
  }

  response += `${getMessage('summary_by_category', lang)}\n`;
  const sortedCategories = Object.entries(categorySummary).sort(
    (a, b) => b[1].total - a[1].total,
  );

  for (const [category, data] of sortedCategories) {
    response += `• ${category}: ${formatAmount(data.total, userCurrency)} (${data.count} ${getMessage('summary_expenses', lang)})\n`;
  }

  return response;
}

/**
 * Show recent expenses
 */
async function handleShowExpenses(phone, lang = 'en') {
  const expenses = (await ExpenseDB.getByUser(phone)).slice(-10).reverse();

  if (expenses.length === 0) {
    return getMessage('expenses_none', lang);
  }

  const userCurrency = await UserDB.getCurrency(phone);
  let response = `${getMessage('expenses_title', lang)}\n\n`;

  for (const expense of expenses) {
    const date = new Date(expense.date).toLocaleDateString(lang === 'es' ? 'es' : 'en');
    response += `• ${formatAmount(expense.amount, userCurrency)} - ${expense.category}`;
    if (expense.description) {
      response += ` (${expense.description})`;
    }
    response += ` - ${date}\n`;
  }

  return response;
}

/**
 * Export all expenses as a CSV document
 */
async function handleExportExpenses(phone, lang = 'en') {
  try {
    // Check if CSV export is allowed for user's plan
    const canExportCsv = await canExport(phone, "csv");
    if (!canExportCsv) {
      const status = await getSubscriptionStatus(phone);
      const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
      return `${getMessage('export_not_allowed', lang)}\n\n${upgradeMsg}`;
    }

    const expenses = await ExpenseDB.getByUser(phone);

    if (!expenses || expenses.length === 0) {
      return getMessage('export_empty', lang);
    }

    const userCurrency = await UserDB.getCurrency(phone);

    // Build CSV
    const rows = ['Date,Amount,Currency,Category,Description'];
    for (const exp of expenses) {
      const date = new Date(exp.date).toISOString().split('T')[0];
      const amount = exp.amount;
      const currency = userCurrency || '';
      const category = csvEscape(exp.category || '');
      const description = csvEscape(exp.description || '');
      rows.push(`${date},${amount},${currency},${category},${description}`);
    }

    const csvString = rows.join('\n');
    const buffer = Buffer.from(csvString, 'utf-8');
    const today = new Date().toISOString().split('T')[0];
    const filename = `expenses_${today}.csv`;

    await sendDocument(phone, buffer, filename, getMessage('export_caption', lang));
    return null;
  } catch (error) {
    console.error('Error exporting expenses:', error);
    return getMessage('export_error', lang);
  }
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function csvEscape(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Check if expense triggers budget alert
 */
async function checkBudgetAlert(phone, category, userCurrency, lang = 'en') {
  const budget = await BudgetDB.getByCategory(phone, category);

  if (!budget) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const spent = await ExpenseDB.getTotalByCategory(
    phone,
    category,
    startOfMonth,
    endOfMonth,
  );
  const percentage = (spent / parseFloat(budget.amount || 0)) * 100;

  if (percentage >= 100) {
    return getMessage('budget_alert_exceeded', lang, {
      category,
      spent: formatAmount(spent, userCurrency),
      budget: formatAmount(budget.amount, userCurrency)
    });
  } else if (percentage >= 80) {
    return getMessage('budget_alert_warning', lang, {
      percentage: percentage.toFixed(0),
      category
    });
  }

  return null;
}

/**
 * Generate progress bar
 */
function getProgressBar(percentage) {
  const filled = Math.min(Math.floor(percentage / 10), 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

/**
 * Process image message (receipt/bill OCR)
 */
async function processImageMessage(phone, imageData, userCurrency, lang = 'en') {
  try {
    // Check image message limit
    const imageLimitCheck = await checkLimit(phone, USAGE_TYPES.IMAGE);
    if (!imageLimitCheck.allowed) {
      const status = await getSubscriptionStatus(phone);
      const limitMsg = getLimitExceededMessage(USAGE_TYPES.IMAGE, lang, imageLimitCheck);
      const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
      return `${limitMsg}\n\n${upgradeMsg}`;
    }

    // Check if currency is set
    if (!userCurrency) {
      return getMessage('currency_not_set', lang);
    }

    // Download the image
    const { buffer, mimeType } = await downloadMedia(imageData.id);

    // Process with Claude Vision (pass localized categories)
    const categories = await getUserCategories(phone, lang);
    const result = await processExpenseImage(buffer, mimeType, categories);

    if (!result.detected || result.expenses.length === 0) {
      await UnprocessedDB.create(phone, {
        type: 'image',
        media_id: imageData.id,
        reason: 'no_expense_detected',
        raw_result: result,
      });
      return getMessage('image_saved_for_review', lang);
    }

    // Validate all amounts
    const validationErrors = [];
    for (const exp of result.expenses) {
      const validation = validateAmount(exp.amount, userCurrency);
      if (!validation.valid) {
        validationErrors.push(`• ${exp.description || exp.category}: ${validation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      return getMessage('validation_error_multi', lang) + validationErrors.join("\n");
    }

    // Create all expenses
    const createdExpenses = [];
    const budgetAlerts = [];

    for (const exp of result.expenses) {
      const expense = await ExpenseDB.create(phone, {
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
      });
      createdExpenses.push(expense);

      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency, lang);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response = `${getMessage('image_logged', lang)} ${formatAmount(expense.amount, userCurrency)} ${getMessage('expense_for', lang)} ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response = getMessage('image_logged_multi', lang, { count: createdExpenses.length }) + "\n";
      for (const expense of createdExpenses) {
        response += `• ${formatAmount(expense.amount, userCurrency)} - ${expense.category}`;
        if (expense.description) {
          response += ` (${expense.description})`;
        }
        response += "\n";
      }
    }

    if (budgetAlerts.length > 0) {
      response += `\n${budgetAlerts.join("\n")}`;
    }

    // Track image usage after successful processing
    await trackUsage(phone, USAGE_TYPES.IMAGE);

    return response;
  } catch (error) {
    console.error("Error processing image:", error);
    await UnprocessedDB.create(phone, {
      type: 'image',
      media_id: imageData.id,
      reason: 'processing_error',
      content: error.message,
    });
    return getMessage('image_error', lang);
  }
}

/**
 * Process audio message (voice note)
 */
async function processAudioMessage(phone, audioData, userCurrency, lang = 'en') {
  try {
    // Check voice message limit
    const voiceLimitCheck = await checkLimit(phone, USAGE_TYPES.VOICE);
    if (!voiceLimitCheck.allowed) {
      const status = await getSubscriptionStatus(phone);
      const limitMsg = getLimitExceededMessage(USAGE_TYPES.VOICE, lang, voiceLimitCheck);
      const upgradeMsg = getUpgradeMessage(status.plan.id, lang);
      return `${limitMsg}\n\n${upgradeMsg}`;
    }

    // Check if currency is set
    if (!userCurrency) {
      return getMessage('currency_not_set', lang);
    }

    // Download the audio
    const { buffer, mimeType } = await downloadMedia(audioData.id);

    // Process: transcribe and extract expenses (pass localized categories)
    const categories = await getUserCategories(phone, lang);
    const result = await processExpenseAudio(buffer, mimeType, categories);

    if (result.error) {
      return getMessage('audio_error', lang);
    }

    if (!result.detected || result.expenses.length === 0) {
      await UnprocessedDB.create(phone, {
        type: 'audio',
        media_id: audioData.id,
        content: result.transcription || null,
        reason: 'no_expense_detected',
        raw_result: result,
      });
      if (result.transcription) {
        return `${getMessage('audio_heard', lang)} "${result.transcription}"\n\n${getMessage('audio_saved_for_review', lang)}`;
      }
      return getMessage('audio_saved_for_review', lang);
    }

    // Validate all amounts
    const validationErrors = [];
    for (const exp of result.expenses) {
      const validation = validateAmount(exp.amount, userCurrency);
      if (!validation.valid) {
        validationErrors.push(`• ${exp.description || exp.category}: ${validation.error}`);
      }
    }

    if (validationErrors.length > 0) {
      return `${getMessage('audio_heard', lang)} "${result.transcription}"\n\n${getMessage('validation_error_multi', lang)}${validationErrors.join("\n")}`;
    }

    // Create all expenses
    const createdExpenses = [];
    const budgetAlerts = [];

    for (const exp of result.expenses) {
      const expense = await ExpenseDB.create(phone, {
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
      });
      createdExpenses.push(expense);

      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency, lang);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response = `${getMessage('audio_heard', lang)} "${result.transcription}"\n\n`;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response += `${getMessage('expense_logged', lang)} ${formatAmount(expense.amount, userCurrency)} ${getMessage('expense_for', lang)} ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response += getMessage('expense_logged_multi', lang, { count: createdExpenses.length }) + "\n";
      for (const expense of createdExpenses) {
        response += `• ${formatAmount(expense.amount, userCurrency)} - ${expense.category}`;
        if (expense.description) {
          response += ` (${expense.description})`;
        }
        response += "\n";
      }
    }

    if (budgetAlerts.length > 0) {
      response += `\n${budgetAlerts.join("\n")}`;
    }

    // Track voice usage after successful processing
    await trackUsage(phone, USAGE_TYPES.VOICE);

    return response;
  } catch (error) {
    console.error("Error processing audio:", error);
    await UnprocessedDB.create(phone, {
      type: 'audio',
      media_id: audioData.id,
      reason: 'processing_error',
      content: error.message,
    });
    return getMessage('audio_error', lang);
  }
}

/**
 * Handle subscription status command
 */
async function handleSubscriptionStatus(phone, lang = 'en') {
  try {
    const status = await getSubscriptionStatus(phone);
    return formatSubscriptionStatus(status, lang);
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return getMessage('error_generic', lang);
  }
}

/**
 * Handle upgrade options command
 */
async function handleUpgradeOptions(phone, lang = 'en') {
  try {
    const status = await getSubscriptionStatus(phone);
    const plans = await getAvailablePlans();
    return formatUpgradePlans(plans, status.plan.id, lang);
  } catch (error) {
    console.error("Error getting upgrade options:", error);
    return getMessage('error_generic', lang);
  }
}
