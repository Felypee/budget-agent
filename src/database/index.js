// DB selector: exports the same names used across the app
// Use DB_DRIVER env var to choose between 'inmemory' (default) and 'supabase'
import * as InMemory from './inMemoryDB.js';

const driver = (process.env.DB_DRIVER || 'inmemory').toLowerCase();

let UserDB = InMemory.UserDB;
let ExpenseDB = InMemory.ExpenseDB;
let BudgetDB = InMemory.BudgetDB;
let testConnection = () => Promise.resolve(true);
let supabase = null;

// Dynamically import supabase implementation only when requested.
// The supabase module throws on missing env vars, so avoid static import.
if (driver === 'supabase' || driver === 'supa') {
  try {
    const Supabase = await import('./supabaseDB.js');
    UserDB = Supabase.UserDB;
    ExpenseDB = Supabase.ExpenseDB;
    BudgetDB = Supabase.BudgetDB;
    testConnection = Supabase.testConnection;
    supabase = Supabase.supabase;
  } catch (err) {
    // If dynamic import fails, keep using in-memory and warn
    console.warn('Could not load Supabase DB module, falling back to in-memory DB:', err.message || err);
  }
}

export { UserDB, ExpenseDB, BudgetDB, testConnection, supabase };
