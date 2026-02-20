/**
 * Tool: Manage Categories
 * Sends user to the web configuration page to manage their categories
 */

export const definition = {
  name: "manage_categories",
  description: "Use when user wants to manage, add, edit, delete, change, or configure their expense categories. Examples: 'quiero agregar una categoría', 'cambiar mis categorías', 'editar categorías', 'add category', 'delete category', 'configurar categorías'",
  input_schema: {
    type: "object",
    properties: {},
    required: []
  }
};

export async function handler(phone, params, lang) {
  const messages = {
    en: `⚙️ Set up your categories and budgets here:\nhttps://monedita.app/setup`,
    es: `⚙️ Configura tus categorías y presupuestos aquí:\nhttps://monedita.app/setup`,
    pt: `⚙️ Configure suas categorias e orçamentos aqui:\nhttps://monedita.app/setup`,
  };

  return { success: true, message: messages[lang] || messages.en };
}

export default { definition, handler };
