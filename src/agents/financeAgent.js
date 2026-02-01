import axios from "axios";
import dotenv from "dotenv";
import { ExpenseDB, BudgetDB } from "../database/index.js";

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * AI Agent for processing expense-related queries
 */
export class FinanceAgent {
  constructor(userPhone) {
    this.userPhone = userPhone;
  }

  /**
   * Get user's financial context for the AI
   */
  async getFinancialContext() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenses = (await ExpenseDB.getByDateRange(
      this.userPhone,
      startOfMonth,
      endOfMonth,
    )) || [];

    const budgets = (await BudgetDB.getByUser(this.userPhone)) || [];

    const categorySummary = (await ExpenseDB.getCategorySummary(
      this.userPhone,
      startOfMonth,
      endOfMonth,
    )) || {};

    const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    return {
      expenses,
      budgets,
      categorySummary,
      totalSpent,
      totalBudget,
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
    };
  }

  /**
   * Process user message with AI
   */
  async processMessage(userMessage) {
  const context = await this.getFinancialContext();

    const systemPrompt = `You are FinanceFlow, a helpful AI assistant for expense management via WhatsApp.

Current user financial data for ${context.month}:
- Total spent: $${context.totalSpent.toFixed(2)}
- Total budget: $${context.totalBudget.toFixed(2)}
- Expenses by category: ${JSON.stringify(context.categorySummary, null, 2)}

User's active budgets:
${context.budgets.map((b) => `- ${b.category}: $${b.amount}/${b.period}`).join("\n") || "No budgets set"}

Recent expenses (last 5):
${
  context.expenses
    .slice(-5)
    .map(
      (e) =>
        `- ${e.description || e.category}: $${e.amount} (${new Date(e.date).toLocaleDateString()})`,
    )
    .join("\n") || "No expenses yet"
}

Your capabilities:
1. Help users understand their spending patterns only in spanish
2. Provide budget alerts and recommendations
3. Extract expense information from messages
4. Answer questions about their financial status

When users mention an expense, extract: amount, category, and description.
Be conversational, helpful, and concise. Keep responses under 200 words for WhatsApp.`;

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: userMessage }],
          system: systemPrompt,
        },
        {
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        },
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error(
        "Error calling Anthropic API:",
        error.response?.data || error.message,
      );
      return "I'm having trouble processing that right now. Please try again in a moment.";
    }
  }

  /**
   * Detect if message contains an expense and extract it
   */
  async detectExpense(message) {
    const systemPrompt = `Extract expense information from user messages. 
Return ONLY a JSON object with: amount (number), category (string), description (string).
If no expense is detected, return: {"detected": false}

Categories: food, transport, shopping, entertainment, bills, health, other

Examples:
"Spent 45 on groceries" → {"detected": true, "amount": 45, "category": "food", "description": "groceries"}
"Lunch was 15 dollars" → {"detected": true, "amount": 15, "category": "food", "description": "lunch"}
"Uber to work 12" → {"detected": true, "amount": 12, "category": "transport", "description": "Uber to work"}
"How am I doing?" → {"detected": false}`;

    try {
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [{ role: "user", content: message }],
          system: systemPrompt,
        },
        {
          headers: {
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        },
      );

      const result = response.data.content[0].text;
      const cleaned = result
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error(
        "Error detecting expense:",
        error.response?.data || error.message,
      );
      return { detected: false };
    }
  }
}
