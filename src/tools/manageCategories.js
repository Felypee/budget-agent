/**
 * Tool: Manage Categories
 * Sends user to the web configuration page to manage their categories
 */

import { UserDB } from "../database/index.js";

export const definition = {
  name: "manage_categories",
  description: "Use when user wants to manage, add, edit, delete, change, or configure their expense categories. Examples: 'quiero agregar una categoría', 'cambiar mis categorías', 'editar categorías', 'add category', 'delete category', 'configurar categorías'",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "The action user wants to perform: add, edit, delete, list, or configure",
        enum: ["add", "edit", "delete", "list", "configure"]
      }
    },
    required: []
  }
};

export async function handler(phone, params, lang, userCurrency) {
  const { action } = params;

  // Get current categories if user has any
  const categories = await UserDB.getCategories(phone);
  const hasCustomCategories = categories && categories.length > 0;

  const messages = {
    en: {
      intro: hasCustomCategories
        ? `You have ${categories.length} categories configured.`
        : `You're using the default categories.`,
      cta: `To manage your categories and budgets, visit:`,
      link: `https://monedita.app/setup`,
      tip: `💡 There you can add, edit, or remove categories and set budgets for each one.`
    },
    es: {
      intro: hasCustomCategories
        ? `Tienes ${categories.length} categorías configuradas.`
        : `Estás usando las categorías por defecto.`,
      cta: `Para gestionar tus categorías y presupuestos, visita:`,
      link: `https://monedita.app/setup`,
      tip: `💡 Ahí puedes agregar, editar o eliminar categorías y asignar presupuestos a cada una.`
    },
    pt: {
      intro: hasCustomCategories
        ? `Você tem ${categories.length} categorias configuradas.`
        : `Você está usando as categorias padrão.`,
      cta: `Para gerenciar suas categorias e orçamentos, visite:`,
      link: `https://monedita.app/setup`,
      tip: `💡 Lá você pode adicionar, editar ou remover categorias e definir orçamentos para cada uma.`
    }
  };

  const msg = messages[lang] || messages.en;

  // If user asked to list, show current categories
  let categoryList = '';
  if (action === 'list' && hasCustomCategories) {
    categoryList = '\n\n' + categories.map(c => `${c.emoji} ${c.name}`).join('\n');
  }

  const response = `${msg.intro}${categoryList}

${msg.cta}
${msg.link}

${msg.tip}`;

  return { success: true, message: response };
}

export default { definition, handler };
