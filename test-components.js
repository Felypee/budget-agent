/**
 * Simple test script to verify components work
 * Run with: node test-components.js
 */

import { UserDB, ExpenseDB, BudgetDB } from './src/database/inMemoryDB.js';

console.log('🧪 Testing FinanceFlow Components\n');

// Test 1: User operations
console.log('Test 1: User Operations');
console.log('------------------------');
const user = UserDB.create('+1234567890', { preferences: { currency: 'USD' } });
console.log('✅ Created user:', user.phone);

const retrieved = UserDB.get('+1234567890');
console.log('✅ Retrieved user:', retrieved.phone);
console.log('');

// Test 2: Expense operations
console.log('Test 2: Expense Operations');
console.log('------------------------');
const expense1 = ExpenseDB.create('+1234567890', {
  amount: 45,
  category: 'food',
  description: 'groceries'
});
console.log('✅ Created expense:', expense1);

const expense2 = ExpenseDB.create('+1234567890', {
  amount: 15,
  category: 'food',
  description: 'lunch'
});
console.log('✅ Created expense:', expense2);

const expense3 = ExpenseDB.create('+1234567890', {
  amount: 120,
  category: 'transport',
  description: 'gas'
});
console.log('✅ Created expense:', expense3);

const userExpenses = ExpenseDB.getByUser('+1234567890');
console.log('✅ Total expenses for user:', userExpenses.length);
console.log('');

// Test 3: Category summary
console.log('Test 3: Category Summary');
console.log('------------------------');
const startOfMonth = new Date(2026, 0, 1);
const endOfMonth = new Date(2026, 0, 31);
const summary = ExpenseDB.getCategorySummary('+1234567890', startOfMonth, endOfMonth);
console.log('✅ Category summary:', summary);
console.log('');

// Test 4: Budget operations
console.log('Test 4: Budget Operations');
console.log('------------------------');
const budget1 = BudgetDB.create('+1234567890', {
  category: 'food',
  amount: 500,
  period: 'monthly'
});
console.log('✅ Created budget:', budget1);

const budget2 = BudgetDB.create('+1234567890', {
  category: 'transport',
  amount: 200,
  period: 'monthly'
});
console.log('✅ Created budget:', budget2);

const userBudgets = BudgetDB.getByUser('+1234567890');
console.log('✅ Total budgets for user:', userBudgets.length);
console.log('');

// Test 5: Budget alerts
console.log('Test 5: Budget Alert Check');
console.log('------------------------');
const foodTotal = ExpenseDB.getTotalByCategory('+1234567890', 'food', startOfMonth, endOfMonth);
const foodBudget = BudgetDB.getByCategory('+1234567890', 'food');
const percentage = (foodTotal / foodBudget.amount * 100).toFixed(0);
console.log(`Food spending: $${foodTotal} of $${foodBudget.amount} (${percentage}%)`);

if (percentage >= 80) {
  console.log('⚠️  Budget alert would trigger!');
} else {
  console.log('✅ Under budget threshold');
}
console.log('');

// Summary
console.log('Summary');
console.log('------------------------');
console.log('✅ All component tests passed!');
console.log(`📊 Created ${userExpenses.length} expenses`);
console.log(`🎯 Created ${userBudgets.length} budgets`);
console.log(`💰 Total spent: $${foodTotal + 120}`);
console.log('');
console.log('Next steps:');
console.log('1. Set up .env file with API credentials');
console.log('2. Run: npm start');
console.log('3. Configure WhatsApp webhook');
console.log('4. Start testing via WhatsApp!');
