/**
 * Tool: Edit Expense
 * Updates an existing expense (amount, category, or description)
 */

import { ExpenseDB } from "../database/index.js";
import { validateAmount, formatAmount } from "../utils/currencyUtils.js";
import { getMessage } from "../utils/languageUtils.js";

export const definition = {
  name: "edit_expense",
  description: "Edit/update an existing expense. Can change amount, category, or description. Use when user wants to fix, edit, update, correct, or change an expense. Can find expense by ID, by description/category name, or edit the last one. If multiple expenses match, will ask user to confirm which one. Examples: 'change expense 5 to 100', 'fix the rent expense to 1000000', 'correct the arriendo amount', 'update last expense category to food'",
  input_schema: {
    type: "object",
    properties: {
      expenseId: {
        type: "number",
        description: "The ID of the expense to edit"
      },
      editLast: {
        type: "boolean",
        description: "If true, edit the most recent expense"
      },
      searchTerm: {
        type: "string",
        description: "Find expense by matching description or category name (e.g., 'arriendo', 'rent', 'coffee', 'comida')"
      },
      newAmount: {
        type: "number",
        description: "New amount for the expense"
      },
      newCategory: {
        type: "string",
        description: "New category for the expense"
      },
      newDescription: {
        type: "string",
        description: "New description for the expense"
      }
    },
    required: []
  }
};

export async function handler(phone, params, lang, userCurrency) {
  const { expenseId, editLast, searchTerm, newAmount, newCategory, newDescription } = params;

  const expenses = await ExpenseDB.getByUser(phone);

  if (!expenses || expenses.length === 0) {
    return { success: false, message: getMessage('expenses_none', lang) };
  }

  // Find the expense to edit
  let expenseToEdit = null;

  if (expenseId) {
    expenseToEdit = expenses.find(e => e.id === expenseId);
    if (!expenseToEdit) {
      return {
        success: false,
        message: getLocalizedMessage('expense_not_found', lang, { id: expenseId })
      };
    }
  } else if (editLast) {
    expenseToEdit = expenses[expenses.length - 1];
  } else if (searchTerm) {
    // Search by description or category
    const termLower = searchTerm.toLowerCase();
    const matches = expenses.filter(e =>
      (e.description && e.description.toLowerCase().includes(termLower)) ||
      (e.category && e.category.toLowerCase().includes(termLower))
    );

    if (matches.length === 0) {
      return {
        success: false,
        message: getLocalizedMessage('expense_not_found_search', lang, { term: searchTerm })
      };
    } else if (matches.length === 1) {
      expenseToEdit = matches[0];
    } else {
      // Multiple matches - ask user to confirm which one
      const locale = lang === 'es' ? 'es-CO' : lang === 'pt' ? 'pt-BR' : 'en-US';
      let listMsg = getLocalizedMessage('multiple_matches', lang, { term: searchTerm, count: matches.length }) + '\n\n';

      for (const exp of matches.slice(0, 5)) { // Show max 5
        const date = new Date(exp.date);
        const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
        listMsg += `#${exp.id} • ${formatAmount(exp.amount, userCurrency)} - ${exp.category}`;
        if (exp.description) {
          listMsg += ` (${exp.description})`;
        }
        listMsg += ` - ${dateStr} ${timeStr}\n`;
      }

      listMsg += '\n' + getLocalizedMessage('specify_id', lang);

      return { success: false, message: listMsg };
    }
  } else {
    return {
      success: false,
      message: getLocalizedMessage('edit_expense_help', lang)
    };
  }

  // Check if there's something to update
  if (!newAmount && !newCategory && !newDescription) {
    return {
      success: false,
      message: getLocalizedMessage('edit_nothing_specified', lang)
    };
  }

  // Validate new amount if provided
  if (newAmount) {
    const validation = validateAmount(newAmount, userCurrency);
    if (!validation.valid) {
      return { success: false, message: validation.error };
    }
  }

  // Build update object
  const updates = {};
  const changes = [];

  if (newAmount) {
    updates.amount = newAmount;
    changes.push(`${getLocalizedMessage('amount', lang)}: ${formatAmount(newAmount, userCurrency)}`);
  }
  if (newCategory) {
    updates.category = newCategory.toLowerCase();
    changes.push(`${getLocalizedMessage('category', lang)}: ${newCategory.toLowerCase()}`);
  }
  if (newDescription) {
    updates.description = newDescription;
    changes.push(`${getLocalizedMessage('description', lang)}: ${newDescription}`);
  }

  // Update the expense in database (preserves original ID)
  await ExpenseDB.update(phone, expenseToEdit.id, updates);

  return {
    success: true,
    message: getLocalizedMessage('expense_updated', lang, {
      id: expenseToEdit.id,
      changes: changes.join(', ')
    })
  };
}

function getLocalizedMessage(key, lang, params = {}) {
  const messages = {
    en: {
      expense_not_found: "Expense #{id} not found. Use 'show expenses' to see your list with IDs.",
      expense_not_found_search: "Couldn't find an expense matching \"{term}\". Use 'show expenses' to see your list.",
      multiple_matches: "Found {count} expenses matching \"{term}\":",
      specify_id: "Please specify which one by ID. Example: 'edit expense #5 to 1000000'",
      edit_expense_help: "To edit an expense, say: 'edit expense 5 amount to 100' or 'change last expense category to food'",
      edit_nothing_specified: "Please specify what to change: amount, category, or description.",
      expense_updated: "Updated expense #{id}: {changes}",
      amount: "Amount",
      category: "Category",
      description: "Description"
    },
    es: {
      expense_not_found: "Gasto #{id} no encontrado. Usa 'ver gastos' para ver tu lista con IDs.",
      expense_not_found_search: "No encontré un gasto con \"{term}\". Usa 'ver gastos' para ver tu lista.",
      multiple_matches: "Encontré {count} gastos con \"{term}\":",
      specify_id: "¿Cuál quieres editar? Dime el número. Ejemplo: 'editar gasto #5 a 1000000'",
      edit_expense_help: "Para editar un gasto, di: 'editar gasto 5 monto a 100' o 'cambiar último gasto categoría a comida'",
      edit_nothing_specified: "Por favor especifica qué cambiar: monto, categoría o descripción.",
      expense_updated: "Gasto #{id} actualizado: {changes}",
      amount: "Monto",
      category: "Categoría",
      description: "Descripción"
    },
    pt: {
      expense_not_found: "Despesa #{id} não encontrada. Use 'ver despesas' para ver sua lista com IDs.",
      expense_not_found_search: "Não encontrei uma despesa com \"{term}\". Use 'ver despesas' para ver sua lista.",
      multiple_matches: "Encontrei {count} despesas com \"{term}\":",
      specify_id: "Qual você quer editar? Me diga o número. Exemplo: 'editar despesa #5 para 1000000'",
      edit_expense_help: "Para editar uma despesa, diga: 'editar despesa 5 valor para 100' ou 'mudar última despesa categoria para comida'",
      edit_nothing_specified: "Por favor especifique o que mudar: valor, categoria ou descrição.",
      expense_updated: "Despesa #{id} atualizada: {changes}",
      amount: "Valor",
      category: "Categoria",
      description: "Descrição"
    }
  };

  const langMessages = messages[lang] || messages.en;
  let message = langMessages[key] || messages.en[key] || key;

  for (const [param, value] of Object.entries(params)) {
    message = message.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
  }

  return message;
}

export default { definition, handler };
