/**
 * Setup Routes - API endpoints for the category/budget setup page
 * Allows users to configure their categories and budgets from the web
 */

import express from 'express';
import { UserDB, BudgetDB } from '../database/index.js';
import { getCurrencyFromPhone } from '../utils/currencyUtils.js';
import { getLanguageFromPhone } from '../utils/languageUtils.js';

const router = express.Router();

/**
 * POST /api/setup
 * Save user's category and budget configuration
 * Body: {
 *   phone: "+573001234567",
 *   categories: [
 *     { id: "food", name: "Comida", emoji: "🍔", budget: 500000 },
 *     { id: "transport", name: "Transporte", emoji: "🚗", budget: 200000 }
 *   ]
 * }
 */
router.post('/api/setup', async (req, res) => {
  try {
    const { phone, categories } = req.body;

    // Validate phone
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone: remove spaces, dashes, ensure it starts with country code
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate categories
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    // Get or create user
    let user = await UserDB.get(normalizedPhone);
    if (!user) {
      // Create user if doesn't exist (they came from web first)
      user = await UserDB.create(normalizedPhone, {
        currency: getCurrencyFromPhone(normalizedPhone),
        language: getLanguageFromPhone(normalizedPhone),
      });
    }

    // Save categories to user
    const categoryList = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji || '📦',
    }));
    await UserDB.setCategories(normalizedPhone, categoryList);

    // Create/update budgets for categories that have a budget set
    const budgetsCreated = [];
    for (const cat of categories) {
      if (cat.budget && parseFloat(cat.budget) > 0) {
        await BudgetDB.create(normalizedPhone, {
          category: cat.id,
          amount: parseFloat(cat.budget),
          period: 'monthly',
        });
        budgetsCreated.push({
          category: cat.id,
          amount: parseFloat(cat.budget),
        });
      }
    }

    // Mark user as setup complete
    await UserDB.update(normalizedPhone, { setup_complete: true });

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: {
        phone: normalizedPhone,
        categoriesCount: categoryList.length,
        budgetsCount: budgetsCreated.length,
        categories: categoryList,
        budgets: budgetsCreated,
      },
    });
  } catch (error) {
    console.error('[setupRoutes] Error saving setup:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

/**
 * GET /api/setup/categories
 * Get default categories for a language
 * Query: ?lang=es (optional, defaults to phone detection or 'en')
 */
router.get('/api/setup/categories', (req, res) => {
  const lang = req.query.lang || 'en';

  const categories = getDefaultCategories(lang);

  res.json({
    language: lang,
    categories,
  });
});

/**
 * GET /api/setup/:phone
 * Get existing setup for a user (if any)
 */
router.get('/api/setup/:phone', async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.params.phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const user = await UserDB.get(normalizedPhone);
    if (!user) {
      return res.json({
        exists: false,
        categories: null,
        budgets: null,
      });
    }

    const categories = await UserDB.getCategories(normalizedPhone);
    const budgets = await BudgetDB.getByUser(normalizedPhone);

    res.json({
      exists: true,
      setup_complete: user.setup_complete || false,
      currency: user.currency,
      language: user.language,
      categories: categories || null,
      budgets: budgets || [],
    });
  } catch (error) {
    console.error('[setupRoutes] Error getting setup:', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

/**
 * Normalize phone number to standard format
 * Input: "+57 300 123 4567" or "573001234567" or "3001234567"
 * Output: "573001234567" (no + prefix for consistency with WhatsApp)
 */
function normalizePhone(phone) {
  if (!phone) return null;

  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-\(\)]/g, '');

  // Remove leading + if present
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }

  // Basic validation: should be 10-15 digits
  if (!/^\d{10,15}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Get default categories for a language
 */
function getDefaultCategories(lang) {
  const categories = {
    en: [
      { id: 'food', name: 'Food', emoji: '🍔' },
      { id: 'transport', name: 'Transport', emoji: '🚗' },
      { id: 'shopping', name: 'Shopping', emoji: '🛒' },
      { id: 'entertainment', name: 'Entertainment', emoji: '🎬' },
      { id: 'bills', name: 'Bills', emoji: '📄' },
      { id: 'health', name: 'Health', emoji: '💊' },
      { id: 'other', name: 'Other', emoji: '📦' },
    ],
    es: [
      { id: 'comida', name: 'Comida', emoji: '🍔' },
      { id: 'transporte', name: 'Transporte', emoji: '🚗' },
      { id: 'compras', name: 'Compras', emoji: '🛒' },
      { id: 'entretenimiento', name: 'Entretenimiento', emoji: '🎬' },
      { id: 'servicios', name: 'Servicios', emoji: '📄' },
      { id: 'salud', name: 'Salud', emoji: '💊' },
      { id: 'otros', name: 'Otros', emoji: '📦' },
    ],
    pt: [
      { id: 'comida', name: 'Comida', emoji: '🍔' },
      { id: 'transporte', name: 'Transporte', emoji: '🚗' },
      { id: 'compras', name: 'Compras', emoji: '🛒' },
      { id: 'entretenimento', name: 'Entretenimento', emoji: '🎬' },
      { id: 'contas', name: 'Contas', emoji: '📄' },
      { id: 'saude', name: 'Saúde', emoji: '💊' },
      { id: 'outros', name: 'Outros', emoji: '📦' },
    ],
  };

  return categories[lang] || categories.en;
}

export default router;
