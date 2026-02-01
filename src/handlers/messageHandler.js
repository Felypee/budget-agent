import {
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
} from "../utils/whatsappClient.js";
import { UserDB, ExpenseDB, BudgetDB } from "../database/index.js";
import { FinanceAgent } from "../agents/financeAgent.js";

/**
 * Handle incoming WhatsApp messages
 */
export async function handleIncomingMessage(message, phone) {
  try {
    // Mark message as read
    await markAsRead(message.id);

    // Get or create user
  const user = await UserDB.getOrCreate(phone);

    // Extract message text
    let messageText = "";
    if (message.type === "text") {
      messageText = message.text.body;
    } else if (message.type === "interactive") {
      // Handle button responses
      messageText = message.interactive.button_reply.title;
    } else {
      await sendTextMessage(
        phone,
        "I can only process text messages right now. Try sending a text!",
      );
      return;
    }

    console.log(`📨 Message from ${phone}: ${messageText}`);

    // Process commands
    const response = await processCommand(phone, messageText);

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

  // Auto-detect and log expense
  const expenseDetection = await agent.detectExpense(message);

    if (expenseDetection.detected) {
    const expense = await ExpenseDB.create(phone, {
      amount: expenseDetection.amount,
      category: expenseDetection.category,
      description: expenseDetection.description,
    });

    // Check budget alert
    const budgetAlert = await checkBudgetAlert(
      phone,
      expenseDetection.category,
    );

    let response = `✅ Logged: $${expense.amount} for ${expense.category}`;
    if (expense.description) {
      response += ` (${expense.description})`;
    }

    if (budgetAlert) {
      response += `\n\n${budgetAlert}`;
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

    const existing = await BudgetDB.getByCategory(phone, category);

    if (existing) {
      await BudgetDB.update(phone, category, amount);
      return `✅ Updated ${category} budget to $${amount}/month`;
    } else {
      await BudgetDB.create(phone, { category, amount, period: "monthly" });
      return `✅ Set ${category} budget to $${amount}/month`;
    }
  }

  return `To set a budget, say: "Set food budget to 500"`;
}

/**
 * Show user budgets
 */
async function handleShowBudgets(phone) {
  const budgets = (await BudgetDB.getByUser(phone)) || [];

  if (budgets.length === 0) {
    return `You haven't set any budgets yet. Try: "Set food budget to 500"`;
  }

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
    response += `Budget: $${budget.amount} | Spent: $${spent.toFixed(2)} (${percentage}%)\n`;
    response += `Remaining: $${remaining.toFixed(2)}\n`;
    response += `${getProgressBar(percentage)}\n\n`;
  }

  return response;
}

/**
 * Show spending summary
 */
async function handleSummary(phone) {
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
  response += `Total Spent: $${totalSpent.toFixed(2)}\n`;

  if (totalBudget > 0) {
    response += `Total Budget: $${totalBudget.toFixed(2)}\n`;
    response += `Remaining: $${(totalBudget - totalSpent).toFixed(2)}\n\n`;
  }

  response += `*By Category:*\n`;
  const sortedCategories = Object.entries(categorySummary).sort(
    (a, b) => b[1].total - a[1].total,
  );

  for (const [category, data] of sortedCategories) {
    response += `• ${category}: $${data.total.toFixed(2)} (${data.count} expenses)\n`;
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

  let response = `📝 *Recent Expenses*\n\n`;

  for (const expense of expenses) {
    const date = new Date(expense.date).toLocaleDateString();
    response += `• $${expense.amount} - ${expense.category}`;
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
async function checkBudgetAlert(phone, category) {
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
    return `⚠️ *Budget Alert!* You've exceeded your ${category} budget ($${spent.toFixed(2)}/$${budget.amount})`;
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
