# 📖 API Reference - Monedita MVP

## WhatsApp Message Commands

### Basic Commands

#### `hi` / `hello` / `start` / `help`
Show welcome message with available commands.

**Example:**
```
User: hi
Bot: 👋 Welcome to Monedita!

I'm your AI expense manager. Here's what I can do:
...
```

---

### Expense Tracking

#### Natural Language Expense Logging
Log expenses by describing them naturally.

**Format:**
```
[verb] [amount] on/for [description]
```

**Examples:**
```
User: Spent 45 on groceries
Bot: ✅ Logged: $45 for food (groceries)

User: Lunch was 15 dollars
Bot: ✅ Logged: $15 for food (lunch)

User: Paid 120 for electricity bill
Bot: ✅ Logged: $120 for bills (electricity bill)

User: Coffee 5
Bot: ✅ Logged: $5 for food (coffee)
```

**Supported Categories:**
- `food` - Groceries, restaurants, coffee, etc.
- `transport` - Uber, gas, public transit, etc.
- `shopping` - Clothes, electronics, etc.
- `entertainment` - Movies, games, subscriptions
- `bills` - Utilities, rent, services
- `health` - Medical, pharmacy, gym
- `other` - Miscellaneous

---

### Budget Management

#### Set Budget
Create or update a budget for a category.

**Format:**
```
set [category] budget to [amount]
```

**Examples:**
```
User: Set food budget to 500
Bot: ✅ Set food budget to $500/month

User: Set transport budget 200
Bot: ✅ Set transport budget to $200/month
```

#### Show Budgets
View all budgets with spending progress.

**Command:** `show budgets` or `budgets`

**Example:**
```
User: show budgets
Bot: 🎯 Your Budgets (January)

food
Budget: $500 | Spent: $285.00 (57%)
Remaining: $215.00
█████░░░░░

transport
Budget: $200 | Spent: $120.00 (60%)
Remaining: $80.00
██████░░░░
```

---

### Reports & Insights

#### Summary
Get monthly spending summary.

**Commands:** `summary`, `how am i doing`, `status`

**Example:**
```
User: how am i doing?
Bot: 📊 January 2026 Summary

Total Spent: $472.00
Total Budget: $700.00
Remaining: $228.00

By Category:
• food: $285.00 (12 expenses)
• transport: $120.00 (8 expenses)
• entertainment: $67.00 (3 expenses)
```

#### Show Expenses
View recent expense history.

**Commands:** `show expenses`, `list expenses`

**Example:**
```
User: show expenses
Bot: 📝 Recent Expenses

• $45 - food (groceries) - 1/28/2026
• $15 - food (lunch) - 1/28/2026
• $12 - transport (Uber to work) - 1/27/2026
...
```

---

### AI Conversations

#### Ask Questions
Have natural conversations about your finances.

**Examples:**
```
User: What's my biggest expense?
Bot: Your biggest expense category is food at $285. 
You've been spending about $23 per day on food...

User: Should I be worried?
Bot: You're doing well! You've spent $472 of your 
$700 budget (67%)...

User: How can I save more?
Bot: Based on your spending, here are 3 tips:
1. Reduce food delivery (you're 40% over average)
2. Consolidate subscriptions ($45/month total)
3. Use public transport more...
```

---

## REST API Endpoints

### Webhook Endpoints

#### GET /webhook
Webhook verification endpoint (Meta requirement).

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Your verify token
- `hub.challenge` - Challenge string to echo back

**Response:**
```
200 OK
[challenge string]
```

#### POST /webhook
Receive WhatsApp messages.

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "1234567890",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "spent 45 on groceries"
          }
        }]
      }
    }]
  }]
}
```

**Response:**
```
200 OK
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Monedita server is running"
}
```

---

## Internal API (JavaScript)

### Database Operations

#### UserDB

```javascript
import { UserDB } from './database/inMemoryDB.js';

// Create user
UserDB.create(phone, { preferences: {} });

// Get user
const user = UserDB.get(phone);

// Get or create
const user = UserDB.getOrCreate(phone);

// Update user
UserDB.update(phone, { preferences: { currency: 'USD' } });
```

#### ExpenseDB

```javascript
import { ExpenseDB } from './database/inMemoryDB.js';

// Create expense
const expense = ExpenseDB.create(phone, {
  amount: 45.00,
  category: 'food',
  description: 'groceries',
  date: new Date()
});

// Get user's expenses
const expenses = ExpenseDB.getByUser(phone);

// Get by date range
const startDate = new Date('2026-01-01');
const endDate = new Date('2026-01-31');
const monthExpenses = ExpenseDB.getByDateRange(phone, startDate, endDate);

// Get category total
const total = ExpenseDB.getTotalByCategory(phone, 'food', startDate, endDate);

// Get summary
const summary = ExpenseDB.getCategorySummary(phone, startDate, endDate);
// Returns: { food: { total: 285, count: 12 }, ... }

// Delete expense
ExpenseDB.delete(phone, expenseId);
```

#### BudgetDB

```javascript
import { BudgetDB } from './database/inMemoryDB.js';

// Create budget
const budget = BudgetDB.create(phone, {
  category: 'food',
  amount: 500,
  period: 'monthly'
});

// Get user's budgets
const budgets = BudgetDB.getByUser(phone);

// Get by category
const foodBudget = BudgetDB.getByCategory(phone, 'food');

// Update budget
BudgetDB.update(phone, 'food', 600);

// Delete budget
BudgetDB.delete(phone, 'food');
```

---

### WhatsApp Client

```javascript
import { 
  sendTextMessage, 
  sendInteractiveButtons, 
  markAsRead 
} from './utils/whatsappClient.js';

// Send text message
await sendTextMessage('+1234567890', 'Hello!');

// Send interactive buttons
await sendInteractiveButtons(
  '+1234567890',
  'Choose an option:',
  [
    { id: 'opt1', title: 'Option 1' },
    { id: 'opt2', title: 'Option 2' }
  ]
);

// Mark message as read
await markAsRead(messageId);
```

---

### Finance Agent

```javascript
import { FinanceAgent } from './agents/financeAgent.js';

const agent = new FinanceAgent(userPhone);

// Get financial context
const context = agent.getFinancialContext();
// Returns: { expenses, budgets, categorySummary, totalSpent, totalBudget }

// Process message with AI
const response = await agent.processMessage('How am I doing?');

// Detect expense in message
const detection = await agent.detectExpense('Spent 45 on groceries');
// Returns: { detected: true, amount: 45, category: 'food', description: 'groceries' }
```

---

## MCP Server Tools

### analyze_spending_trends

Analyze spending trends over time.

**Input:**
```json
{
  "user_id": "1234567890",
  "period": "month"
}
```

**Output:**
```json
{
  "period": "month",
  "trend": "increasing",
  "percentage_change": 12.5,
  "insights": [
    "Spending has increased by 12.5% compared to last month",
    "Food category shows highest growth (+25%)"
  ]
}
```

### predict_budget_overrun

Predict if user will exceed budget.

**Input:**
```json
{
  "user_id": "1234567890",
  "category": "food"
}
```

**Output:**
```json
{
  "category": "food",
  "current_spending": 350,
  "budget": 500,
  "days_remaining": 15,
  "projected_total": 580,
  "will_exceed": true,
  "recommendation": "Reduce daily spending by $8 to stay within budget"
}
```

### get_category_insights

Get detailed insights about a category.

**Input:**
```json
{
  "user_id": "1234567890",
  "category": "food"
}
```

**Output:**
```json
{
  "category": "food",
  "average_transaction": 25.50,
  "most_common_time": "weekday evenings",
  "top_merchants": ["Store A", "Store B"],
  "anomalies": ["Unusually high transaction of $150 on Jan 15"]
}
```

### compare_to_average

Compare user spending to average.

**Input:**
```json
{
  "user_id": "1234567890",
  "category": "food"
}
```

**Output:**
```json
{
  "user_spending": 450,
  "average_spending": 380,
  "percentile": 65,
  "status": "above_average",
  "message": "You spend 18% more than average users"
}
```

---

## Error Handling

### Common Error Responses

#### WhatsApp API Errors
```json
{
  "error": {
    "message": "Invalid access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

#### Anthropic API Errors
```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Invalid API key"
  }
}
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 190 | Invalid access token | Refresh token |
| 100 | Invalid parameter | Check request format |
| 429 | Rate limit exceeded | Wait and retry |
| 500 | Server error | Check logs |

---

## Rate Limits

### WhatsApp Business API
- **Messaging**: Varies by tier (check Meta dashboard)
- **Typical limit**: 1000 messages/day (Tier 1)

### Anthropic API
- **Rate limit**: Varies by plan
- **Typical**: 50 requests/minute

### Best Practices
- Implement exponential backoff
- Queue messages during high traffic
- Cache frequent queries
- Monitor usage metrics

---

## Data Models

### User
```javascript
{
  phone: String,           // Phone number (primary key)
  createdAt: Date,         // Account creation date
  preferences: Object      // User preferences
}
```

### Expense
```javascript
{
  id: Number,              // Auto-increment ID
  phone: String,           // User's phone
  amount: Number,          // Expense amount
  category: String,        // Category
  description: String,     // Description
  date: Date,              // Expense date
  createdAt: Date          // Record creation date
}
```

### Budget
```javascript
{
  id: Number,              // Auto-increment ID
  phone: String,           // User's phone
  category: String,        // Category
  amount: Number,          // Budget amount
  period: String,          // 'weekly', 'monthly', 'yearly'
  createdAt: Date          // Record creation date
}
```

---

## Webhooks

### Message Events

WhatsApp sends events when:
- User sends a message
- Message is delivered
- Message is read
- User interacts with button

### Event Structure
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "PHONE_NUMBER",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [...]
      }
    }]
  }]
}
```

---

For more information, see README.md and SETUP_GUIDE.md
