import {
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
  downloadMedia,
} from "../utils/whatsappClient.js";
import { UserDB, ExpenseDB, BudgetDB } from "../database/index.js";
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

/**
 * Handle incoming WhatsApp messages
 */
export async function handleIncomingMessage(message, phone) {
  try {
    // Mark message as read
    await markAsRead(message.id);

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

    // Handle different message types
    let response;

    if (message.type === "text") {
      const messageText = message.text.body;
      console.log(`📨 Text from ${phone}: ${messageText}`);
      response = await processCommand(phone, messageText);
    } else if (message.type === "interactive") {
      const buttonId = message.interactive.button_reply.id;
      const buttonTitle = message.interactive.button_reply.title;
      console.log(`📨 Button from ${phone}: ${buttonTitle} (${buttonId})`);

      // Handle reminder button responses
      if (buttonId === "reminder_yes") {
        clearPendingReminder(phone);
        response = `Great! Tell me what you spent. You can:\n\n• Type: "Spent 50 on lunch"\n• Send a photo of your receipt\n• Send a voice message`;
      } else if (buttonId === "reminder_no") {
        clearPendingReminder(phone);
        response = `No problem! I'll check in with you later. Keep tracking your expenses!`;
      } else {
        // Other button responses - process as command
        response = await processCommand(phone, buttonTitle);
      }
    } else if (message.type === "image") {
      console.log(`📷 Image from ${phone}`);
      response = await processImageMessage(phone, message.image, user.currency);
    } else if (message.type === "audio") {
      console.log(`🎤 Audio from ${phone}`);
      response = await processAudioMessage(phone, message.audio, user.currency);
    } else {
      await sendTextMessage(
        phone,
        "I can process text, images (receipts), and voice messages. Try one of those!",
      );
      return;
    }

    if (response) {
      await sendTextMessage(phone, response);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    await sendTextMessage(
      phone,
      "Sorry, I encountered an error. Please try again.",
    );
  }
}

/**
 * Process user commands and messages
 */
async function processCommand(phone, message) {
  const agent = new FinanceAgent(phone);
  const lowerMsg = message.toLowerCase().trim();

  // Command: Start/Help
  if (
    lowerMsg === "hi" ||
    lowerMsg === "hello" ||
    lowerMsg === "start" ||
    lowerMsg === "help"
  ) {
    return `👋 Welcome to FinanceFlow!

I'm your AI expense manager. Here's what I can do:

💰 *Track Expenses*
Just tell me: "Spent 45 on groceries"

📊 *Check Status*
Ask: "How am I doing?" or "Show my spending"

🎯 *Set Budgets*
Say: "Set food budget to 500"

📈 *Get Insights*
Ask: "What's my biggest expense?"

Try it now! Tell me about a recent expense.`;
  }

  // Command: Set currency (only if not already set)
  const currencyMatch = lowerMsg.match(/my currency is\s+([a-z]{3})/i);
  if (currencyMatch) {
    return await handleSetCurrency(phone, currencyMatch[1].toUpperCase());
  }

  // Command: Set budget
  if (lowerMsg.includes("set") && lowerMsg.includes("budget")) {
    return await handleSetBudget(phone, message);
  }

  // Command: Show budgets
  if (lowerMsg.includes("show budget") || lowerMsg === "budgets") {
    return await handleShowBudgets(phone);
  }

  // Command: Summary
  if (
    lowerMsg.includes("summary") ||
    lowerMsg.includes("how am i doing") ||
    lowerMsg.includes("status")
  ) {
    return await handleSummary(phone);
  }

  // Command: Show expenses
  if (
    lowerMsg.includes("show expenses") ||
    lowerMsg.includes("list expenses")
  ) {
    return await handleShowExpenses(phone);
  }

  // Auto-detect and log expenses (supports multiple expenses in one message)
  const expenseDetection = await agent.detectExpenses(message);

  if (expenseDetection.detected && expenseDetection.expenses.length > 0) {
    // Get user's currency
    const userCurrency = await UserDB.getCurrency(phone);

    // Check if currency is set
    if (!userCurrency) {
      return `I couldn't detect your currency from your phone number. Please tell me your currency (e.g., "My currency is COP" or "My currency is USD").`;
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
      return `Sorry, I couldn't log some expenses:\n\n${validationErrors.join("\n")}`;
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
      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response = `✅ Logged: ${formatAmount(expense.amount, userCurrency)} for ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response = `✅ Logged ${createdExpenses.length} expenses:\n`;
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

    return response;
  }

  // Default: Use AI to respond
  return await agent.processMessage(message);
}

/**
 * Handle budget setting
 */
async function handleSetBudget(phone, message) {
  const regex = /set\s+(\w+)\s+budget\s+(?:to\s+)?(\d+)/i;
  const match = message.match(regex);

  if (match) {
    const category = match[1].toLowerCase();
    const amount = parseFloat(match[2]);
    const userCurrency = await UserDB.getCurrency(phone);

    const existing = await BudgetDB.getByCategory(phone, category);

    if (existing) {
      await BudgetDB.update(phone, category, amount);
      return `✅ Updated ${category} budget to ${formatAmount(amount, userCurrency)}/month`;
    } else {
      await BudgetDB.create(phone, { category, amount, period: "monthly" });
      return `✅ Set ${category} budget to ${formatAmount(amount, userCurrency)}/month`;
    }
  }

  return `To set a budget, say: "Set food budget to 500"`;
}

/**
 * Handle setting user currency
 */
async function handleSetCurrency(phone, currencyCode) {
  // Check if currency is already set
  const existingCurrency = await UserDB.getCurrency(phone);
  if (existingCurrency) {
    return `Your currency is already set to ${getCurrencyName(existingCurrency)} (${existingCurrency}). Currency cannot be changed once set.`;
  }

  // Validate currency code
  if (!isValidCurrency(currencyCode)) {
    return `Sorry, "${currencyCode}" is not a supported currency. Please use a valid 3-letter currency code like USD, EUR, COP, etc.`;
  }

  // Set the currency
  await UserDB.setCurrency(phone, currencyCode);
  return `✅ Your currency has been set to ${getCurrencyName(currencyCode)} (${currencyCode}). All your expenses will now be tracked in this currency.`;
}

/**
 * Show user budgets
 */
async function handleShowBudgets(phone) {
  const budgets = (await BudgetDB.getByUser(phone)) || [];

  if (budgets.length === 0) {
    return `You haven't set any budgets yet. Try: "Set food budget to 500"`;
  }

  const userCurrency = await UserDB.getCurrency(phone);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let response = `🎯 *Your Budgets* (${now.toLocaleString("default", { month: "long" })})\n\n`;

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
    response += `Budget: ${formatAmount(budget.amount, userCurrency)} | Spent: ${formatAmount(spent, userCurrency)} (${percentage}%)\n`;
    response += `Remaining: ${formatAmount(remaining, userCurrency)}\n`;
    response += `${getProgressBar(percentage)}\n\n`;
  }

  return response;
}

/**
 * Show spending summary
 */
async function handleSummary(phone) {
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

  let response = `📊 *${now.toLocaleString("default", { month: "long" })} Summary*\n\n`;
  response += `Total Spent: ${formatAmount(totalSpent, userCurrency)}\n`;

  if (totalBudget > 0) {
    response += `Total Budget: ${formatAmount(totalBudget, userCurrency)}\n`;
    response += `Remaining: ${formatAmount(totalBudget - totalSpent, userCurrency)}\n\n`;
  }

  response += `*By Category:*\n`;
  const sortedCategories = Object.entries(categorySummary).sort(
    (a, b) => b[1].total - a[1].total,
  );

  for (const [category, data] of sortedCategories) {
    response += `• ${category}: ${formatAmount(data.total, userCurrency)} (${data.count} expenses)\n`;
  }

  return response;
}

/**
 * Show recent expenses
 */
async function handleShowExpenses(phone) {
  const expenses = (await ExpenseDB.getByUser(phone)).slice(-10).reverse();

  if (expenses.length === 0) {
    return `You haven't logged any expenses yet. Try: "Spent 45 on groceries"`;
  }

  const userCurrency = await UserDB.getCurrency(phone);
  let response = `📝 *Recent Expenses*\n\n`;

  for (const expense of expenses) {
    const date = new Date(expense.date).toLocaleDateString();
    response += `• ${formatAmount(expense.amount, userCurrency)} - ${expense.category}`;
    if (expense.description) {
      response += ` (${expense.description})`;
    }
    response += ` - ${date}\n`;
  }

  return response;
}

/**
 * Check if expense triggers budget alert
 */
async function checkBudgetAlert(phone, category, userCurrency) {
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
    return `⚠️ *Budget Alert!* You've exceeded your ${category} budget (${formatAmount(spent, userCurrency)}/${formatAmount(budget.amount, userCurrency)})`;
  } else if (percentage >= 80) {
    return `⚠️ You've used ${percentage.toFixed(0)}% of your ${category} budget`;
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
async function processImageMessage(phone, imageData, userCurrency) {
  try {
    // Check if currency is set
    if (!userCurrency) {
      return `I couldn't detect your currency from your phone number. Please tell me your currency first (e.g., "My currency is COP" or "My currency is USD").`;
    }

    // Download the image
    const { buffer, mimeType } = await downloadMedia(imageData.id);

    // Process with Claude Vision
    const result = await processExpenseImage(buffer, mimeType);

    if (!result.detected || result.expenses.length === 0) {
      return `📷 I couldn't detect any expenses in this image. Please send a clearer photo of your receipt or bill, or type the expense manually.`;
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
      return `📷 Found expenses but couldn't log them:\n\n${validationErrors.join("\n")}`;
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

      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response = `📷 ✅ Logged from image: ${formatAmount(expense.amount, userCurrency)} for ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response = `📷 ✅ Logged ${createdExpenses.length} expenses from image:\n`;
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

    return response;
  } catch (error) {
    console.error("Error processing image:", error);
    return `📷 Sorry, I couldn't process that image. Please try again or type the expense manually.`;
  }
}

/**
 * Process audio message (voice note)
 */
async function processAudioMessage(phone, audioData, userCurrency) {
  try {
    // Check if currency is set
    if (!userCurrency) {
      return `I couldn't detect your currency from your phone number. Please tell me your currency first (e.g., "My currency is COP" or "My currency is USD").`;
    }

    // Download the audio
    const { buffer, mimeType } = await downloadMedia(audioData.id);

    // Process: transcribe and extract expenses
    const result = await processExpenseAudio(buffer, mimeType);

    if (result.error) {
      return `🎤 Sorry, I couldn't process that voice message. Please try again or type the expense.`;
    }

    if (!result.detected || result.expenses.length === 0) {
      if (result.transcription) {
        return `🎤 I heard: "${result.transcription}"\n\nBut I couldn't detect any expenses. Try saying something like "Gasté 50 mil en almuerzo" or "Spent 30 dollars on groceries".`;
      }
      return `🎤 I couldn't understand that voice message. Please try again or type the expense.`;
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
      return `🎤 I heard: "${result.transcription}"\n\nBut couldn't log the expenses:\n${validationErrors.join("\n")}`;
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

      const budgetAlert = await checkBudgetAlert(phone, exp.category, userCurrency);
      if (budgetAlert && !budgetAlerts.includes(budgetAlert)) {
        budgetAlerts.push(budgetAlert);
      }
    }

    // Build response
    let response = `🎤 I heard: "${result.transcription}"\n\n`;
    if (createdExpenses.length === 1) {
      const expense = createdExpenses[0];
      response += `✅ Logged: ${formatAmount(expense.amount, userCurrency)} for ${expense.category}`;
      if (expense.description) {
        response += ` (${expense.description})`;
      }
    } else {
      response += `✅ Logged ${createdExpenses.length} expenses:\n`;
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

    return response;
  } catch (error) {
    console.error("Error processing audio:", error);
    return `🎤 Sorry, I couldn't process that voice message. Please try again or type the expense.`;
  }
}
