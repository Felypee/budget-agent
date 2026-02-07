/**
 * Currency utilities for phone-based currency detection and validation
 */

// Map phone country codes to currency codes
export const COUNTRY_CODE_TO_CURRENCY = {
  '1': 'USD',      // USA, Canada
  '44': 'GBP',     // UK
  '49': 'EUR',     // Germany
  '33': 'EUR',     // France
  '34': 'EUR',     // Spain
  '39': 'EUR',     // Italy
  '31': 'EUR',     // Netherlands
  '32': 'EUR',     // Belgium
  '43': 'EUR',     // Austria
  '351': 'EUR',    // Portugal
  '353': 'EUR',    // Ireland
  '358': 'EUR',    // Finland
  '30': 'EUR',     // Greece
  '57': 'COP',     // Colombia
  '52': 'MXN',     // Mexico
  '55': 'BRL',     // Brazil
  '54': 'ARS',     // Argentina
  '56': 'CLP',     // Chile
  '51': 'PEN',     // Peru
  '81': 'JPY',     // Japan
  '82': 'KRW',     // South Korea
  '86': 'CNY',     // China
  '91': 'INR',     // India
  '61': 'AUD',     // Australia
  '64': 'NZD',     // New Zealand
  '41': 'CHF',     // Switzerland
  '46': 'SEK',     // Sweden
  '47': 'NOK',     // Norway
  '45': 'DKK',     // Denmark
  '48': 'PLN',     // Poland
  '7': 'RUB',      // Russia
  '90': 'TRY',     // Turkey
  '27': 'ZAR',     // South Africa
  '971': 'AED',    // UAE
  '966': 'SAR',    // Saudi Arabia
  '65': 'SGD',     // Singapore
  '852': 'HKD',    // Hong Kong
  '60': 'MYR',     // Malaysia
  '66': 'THB',     // Thailand
  '63': 'PHP',     // Philippines
  '62': 'IDR',     // Indonesia
  '84': 'VND',     // Vietnam
};

// Currency validation rules
export const CURRENCY_RULES = {
  'USD': { decimalPlaces: 2, minAmount: 0.01, symbol: '$', name: 'US Dollar' },
  'EUR': { decimalPlaces: 2, minAmount: 0.01, symbol: '€', name: 'Euro' },
  'GBP': { decimalPlaces: 2, minAmount: 0.01, symbol: '£', name: 'British Pound' },
  'COP': { decimalPlaces: 0, minAmount: 50, symbol: '$', name: 'Colombian Peso' },
  'MXN': { decimalPlaces: 2, minAmount: 0.01, symbol: '$', name: 'Mexican Peso' },
  'BRL': { decimalPlaces: 2, minAmount: 0.01, symbol: 'R$', name: 'Brazilian Real' },
  'ARS': { decimalPlaces: 2, minAmount: 0.01, symbol: '$', name: 'Argentine Peso' },
  'CLP': { decimalPlaces: 0, minAmount: 1, symbol: '$', name: 'Chilean Peso' },
  'PEN': { decimalPlaces: 2, minAmount: 0.01, symbol: 'S/', name: 'Peruvian Sol' },
  'JPY': { decimalPlaces: 0, minAmount: 1, symbol: '¥', name: 'Japanese Yen' },
  'KRW': { decimalPlaces: 0, minAmount: 1, symbol: '₩', name: 'South Korean Won' },
  'CNY': { decimalPlaces: 2, minAmount: 0.01, symbol: '¥', name: 'Chinese Yuan' },
  'INR': { decimalPlaces: 2, minAmount: 0.01, symbol: '₹', name: 'Indian Rupee' },
  'AUD': { decimalPlaces: 2, minAmount: 0.01, symbol: 'A$', name: 'Australian Dollar' },
  'NZD': { decimalPlaces: 2, minAmount: 0.01, symbol: 'NZ$', name: 'New Zealand Dollar' },
  'CHF': { decimalPlaces: 2, minAmount: 0.01, symbol: 'CHF', name: 'Swiss Franc' },
  'SEK': { decimalPlaces: 2, minAmount: 0.01, symbol: 'kr', name: 'Swedish Krona' },
  'NOK': { decimalPlaces: 2, minAmount: 0.01, symbol: 'kr', name: 'Norwegian Krone' },
  'DKK': { decimalPlaces: 2, minAmount: 0.01, symbol: 'kr', name: 'Danish Krone' },
  'PLN': { decimalPlaces: 2, minAmount: 0.01, symbol: 'zł', name: 'Polish Zloty' },
  'RUB': { decimalPlaces: 2, minAmount: 0.01, symbol: '₽', name: 'Russian Ruble' },
  'TRY': { decimalPlaces: 2, minAmount: 0.01, symbol: '₺', name: 'Turkish Lira' },
  'ZAR': { decimalPlaces: 2, minAmount: 0.01, symbol: 'R', name: 'South African Rand' },
  'AED': { decimalPlaces: 2, minAmount: 0.01, symbol: 'د.إ', name: 'UAE Dirham' },
  'SAR': { decimalPlaces: 2, minAmount: 0.01, symbol: '﷼', name: 'Saudi Riyal' },
  'SGD': { decimalPlaces: 2, minAmount: 0.01, symbol: 'S$', name: 'Singapore Dollar' },
  'HKD': { decimalPlaces: 2, minAmount: 0.01, symbol: 'HK$', name: 'Hong Kong Dollar' },
  'MYR': { decimalPlaces: 2, minAmount: 0.01, symbol: 'RM', name: 'Malaysian Ringgit' },
  'THB': { decimalPlaces: 2, minAmount: 0.01, symbol: '฿', name: 'Thai Baht' },
  'PHP': { decimalPlaces: 2, minAmount: 0.01, symbol: '₱', name: 'Philippine Peso' },
  'IDR': { decimalPlaces: 0, minAmount: 1, symbol: 'Rp', name: 'Indonesian Rupiah' },
  'VND': { decimalPlaces: 0, minAmount: 1, symbol: '₫', name: 'Vietnamese Dong' },
};

/**
 * Extract currency code from phone number
 * @param {string} phone - Phone number (may include + prefix)
 * @returns {string|null} Currency code or null if not found
 */
export function getCurrencyFromPhone(phone) {
  if (!phone) return null;

  // Remove + prefix and any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Try matching country codes from longest to shortest (3, 2, 1 digits)
  for (const length of [3, 2, 1]) {
    const prefix = cleanPhone.substring(0, length);
    if (COUNTRY_CODE_TO_CURRENCY[prefix]) {
      return COUNTRY_CODE_TO_CURRENCY[prefix];
    }
  }

  return null;
}

/**
 * Validate an amount against currency rules
 * @param {number} amount - The amount to validate
 * @param {string} currencyCode - The currency code
 * @returns {{valid: boolean, error?: string}}
 */
export function validateAmount(amount, currencyCode) {
  const rules = CURRENCY_RULES[currencyCode];

  if (!rules) {
    // Unknown currency, allow anything reasonable
    return { valid: true };
  }

  // Check decimal places
  if (rules.decimalPlaces === 0) {
    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: `${rules.name} (${currencyCode}) does not allow decimals. Please enter a whole number.`
      };
    }
  }

  // Check minimum amount
  if (amount < rules.minAmount) {
    const formattedMin = rules.decimalPlaces === 0
      ? rules.minAmount.toString()
      : rules.minAmount.toFixed(rules.decimalPlaces);
    const formattedAmount = rules.decimalPlaces === 0
      ? Math.floor(amount).toString()
      : amount.toFixed(rules.decimalPlaces);
    return {
      valid: false,
      error: `Amount must be at least ${rules.symbol}${formattedMin}. You entered ${rules.symbol}${formattedAmount}.`
    };
  }

  return { valid: true };
}

/**
 * Format an amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code
 * @returns {string} Formatted amount with symbol
 */
export function formatAmount(amount, currencyCode) {
  const rules = CURRENCY_RULES[currencyCode];

  if (!rules) {
    // Default formatting for unknown currencies
    return `$${amount.toFixed(2)}`;
  }

  const formattedNumber = rules.decimalPlaces === 0
    ? Math.round(amount).toLocaleString()
    : amount.toFixed(rules.decimalPlaces);

  return `${rules.symbol}${formattedNumber}`;
}

/**
 * Check if a currency code is valid
 * @param {string} currencyCode - The currency code to check
 * @returns {boolean}
 */
export function isValidCurrency(currencyCode) {
  return currencyCode && CURRENCY_RULES.hasOwnProperty(currencyCode.toUpperCase());
}

/**
 * Get currency name
 * @param {string} currencyCode - The currency code
 * @returns {string} The currency name or the code if not found
 */
export function getCurrencyName(currencyCode) {
  const rules = CURRENCY_RULES[currencyCode];
  return rules ? rules.name : currencyCode;
}
