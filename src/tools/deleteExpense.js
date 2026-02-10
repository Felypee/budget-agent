/**
 * Tool: Delete Expense
 * Removes an expense by ID or the most recent one
 */

import { ExpenseDB } from "../database/index.js";
import { formatAmount } from "../utils/currencyUtils.js";
import { getMessage } from "../utils/languageUtils.js";

export const definition = {
  name: "delete_expense",
  description: "Delete an expense. Use when user wants to remove, delete, or undo an expense. Can delete by ID, by description/category name, or the last expense. If multiple expenses match, will ask user to confirm which one. Examples: 'delete expense 5', 'remove last expense', 'undo', 'delete the coffee expense', 'eliminar el de arriendo'",
  input_schema: {
    type: "object",
    properties: {
      expenseId: {
        type: "number",
        description: "The ID of the expense to delete (shown in expense list)"
      },
      deleteLast: {
        type: "boolean",
        description: "If true, delete the most recent expense"
      },
      description: {
        type: "string",
        description: "Description to match if user refers to expense by name"
      }
    },
    required: []
  }
};

export async function handler(phone, params, lang, userCurrency) {
  const { expenseId, deleteLast, description } = params;

  const expenses = await ExpenseDB.getByUser(phone);

  if (!expenses || expenses.length === 0) {
    return { success: false, message: getMessage('expenses_none', lang) };
  }

  let expenseToDelete = null;

  // Find expense by ID
  if (expenseId) {
    expenseToDelete = expenses.find(e => e.id === expenseId);
    if (!expenseToDelete) {
      return {
        success: false,
        message: getLocalizedMessage('expense_not_found', lang, { id: expenseId })
      };
    }
  }
  // Delete last expense
  else if (deleteLast) {
    expenseToDelete = expenses[expenses.length - 1];
  }
  // Find by description
  else if (description) {
    const descLower = description.toLowerCase();
    const matches = expenses.filter(e =>
      (e.description && e.description.toLowerCase().includes(descLower)) ||
      (e.category && e.category.toLowerCase().includes(descLower))
    );

    if (matches.length === 0) {
      return {
        success: false,
        message: getLocalizedMessage('expense_not_found_desc', lang, { description })
      };
    } else if (matches.length === 1) {
      expenseToDelete = matches[0];
    } else {
      // Multiple matches - ask user to confirm which one
      const locale = lang === 'es' ? 'es-CO' : lang === 'pt' ? 'pt-BR' : 'en-US';
      let listMsg = getLocalizedMessage('multiple_matches', lang, { term: description, count: matches.length }) + '\n\n';

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
  }
  else {
    return {
      success: false,
      message: getLocalizedMessage('delete_expense_help', lang)
    };
  }

  // Delete the expense
  await ExpenseDB.delete(phone, expenseToDelete.id);

  const expenseInfo = `${formatAmount(expenseToDelete.amount, userCurrency)} - ${expenseToDelete.category}`;
  const desc = expenseToDelete.description ? ` (${expenseToDelete.description})` : '';

  return {
    success: true,
    message: getLocalizedMessage('expense_deleted', lang, { expense: expenseInfo + desc })
  };
}

function getLocalizedMessage(key, lang, params = {}) {
  const messages = {
    en: {
      expense_not_found: "Expense #{id} not found. Use 'show expenses' to see your expense list with IDs.",
      expense_not_found_desc: "Couldn't find an expense matching \"{description}\". Use 'show expenses' to see your list.",
      multiple_matches: "Found {count} expenses matching \"{term}\":",
      specify_id: "Which one do you want to delete? Tell me the number. Example: 'delete expense #5'",
      delete_expense_help: "To delete an expense, say: 'delete expense #5' or 'delete last expense' or 'remove the coffee expense'",
      expense_deleted: "Deleted: {expense}"
    },
    es: {
      expense_not_found: "Gasto #{id} no encontrado. Usa 'ver gastos' para ver tu lista con IDs.",
      expense_not_found_desc: "No encontré un gasto con \"{description}\". Usa 'ver gastos' para ver tu lista.",
      multiple_matches: "Encontré {count} gastos con \"{term}\":",
      specify_id: "¿Cuál quieres eliminar? Dime el número. Ejemplo: 'eliminar gasto #5'",
      delete_expense_help: "Para eliminar un gasto, di: 'eliminar gasto #5' o 'eliminar último gasto' o 'borrar el gasto del café'",
      expense_deleted: "Eliminado: {expense}"
    },
    pt: {
      expense_not_found: "Despesa #{id} não encontrada. Use 'ver despesas' para ver sua lista com IDs.",
      expense_not_found_desc: "Não encontrei uma despesa com \"{description}\". Use 'ver despesas' para ver sua lista.",
      multiple_matches: "Encontrei {count} despesas com \"{term}\":",
      specify_id: "Qual você quer excluir? Me diga o número. Exemplo: 'excluir despesa #5'",
      delete_expense_help: "Para excluir uma despesa, diga: 'excluir despesa #5' ou 'excluir última despesa' ou 'remover a despesa do café'",
      expense_deleted: "Excluído: {expense}"
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
