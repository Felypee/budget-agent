# 💰 Monedita MVP

WhatsApp-based AI expense manager with MCP (Model Context Protocol) integration.

## 🌟 Features

- **Conversational Expense Tracking**: Log expenses by simply texting "Spent 45 on groceries"
- **AI-Powered Insights**: Claude analyzes your spending patterns and provides personalized advice
- **Budget Management**: Set budgets and get real-time alerts
- **WhatsApp Integration**: All interactions through WhatsApp - no app to download
- **MCP Analytics**: Advanced expense analytics through MCP server

## 🏗️ Architecture

```
┌─────────────────┐
│   WhatsApp      │
│   Business API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Express Server │◄────►│  Anthropic API   │
│  (Webhook)      │      │  (Claude AI)     │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Message        │      │  MCP Server      │
│  Handler        │◄────►│  (Analytics)     │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  In-Memory DB   │
│  (MVP only)     │
└─────────────────┘
```

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **WhatsApp Business Account** with API access
3. **Anthropic API Key** (for Claude AI)
4. **ngrok** or similar tool for local webhook testing (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd financeflow-mvp
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
WHATSAPP_TOKEN=your_whatsapp_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=3000
```

### 3. Get WhatsApp Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing
3. Add "WhatsApp" product
4. Navigate to API Setup to get:
   - Phone Number ID
   - Access Token
5. Set a verify token (any random string you choose)

### 4. Start the Server

```bash
npm start
```

Server runs on `http://localhost:3000`

### 5. Configure Webhook (Local Testing)

For local testing, use ngrok:

```bash
ngrok http 3000
```

Then configure webhook in Meta Dashboard:
- Callback URL: `https://your-ngrok-url.ngrok.io/webhook`
- Verify Token: (the one you set in .env)
- Subscribe to: `messages`

## 💬 Usage Examples

Once configured, users can interact via WhatsApp:

### Log Expenses
```
User: Spent 45 on groceries
Bot: ✅ Logged: $45 for food (groceries)

User: Lunch was 15 dollars
Bot: ✅ Logged: $15 for food (lunch)

User: Uber to work 12
Bot: ✅ Logged: $12 for transport (Uber to work)
```

### Set Budgets
```
User: Set food budget to 500
Bot: ✅ Set food budget to $500/month

User: Set transport budget to 200
Bot: ✅ Set transport budget to $200/month
```

### Check Status
```
User: How am I doing?
Bot: 📊 January 2026 Summary

Total Spent: $472.00
Total Budget: $700.00
Remaining: $228.00

By Category:
• food: $285.00 (12 expenses)
• transport: $120.00 (8 expenses)
• entertainment: $67.00 (3 expenses)
```

### View Budgets
```
User: Show budgets
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

### AI Conversations
```
User: What's my biggest expense?
Bot: Your biggest expense category is food at $285. 
You've been spending about $23 per day on food. 
Consider meal prepping to reduce costs!

User: Should I be worried about my spending?
Bot: You're doing well! You've spent $472 of your 
$700 budget (67%). At this rate, you'll finish the 
month $50 under budget. Keep it up! 👍
```

## 🔧 MCP Server

The MCP server provides advanced analytics:

### Start MCP Server
```bash
npm run mcp-server
```

### MCP Tools Available

1. **analyze_spending_trends**: Analyze trends over time
2. **predict_budget_overrun**: Predict budget violations
3. **get_category_insights**: Deep dive into categories
4. **compare_to_average**: Compare to other users

### MCP Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "expense-analytics": {
      "command": "node",
      "args": ["/path/to/financeflow-mvp/mcp-servers/expense-analytics/server.js"]
    }
  }
}
```

## 📁 Project Structure

```
financeflow-mvp/
├── src/
│   ├── server.js                 # Main Express server
│   ├── handlers/
│   │   └── messageHandler.js     # Message processing logic
│   ├── agents/
│   │   └── financeAgent.js       # AI agent with Claude
│   ├── database/
│   │   └── inMemoryDB.js         # Simple in-memory database
│   └── utils/
│       ├── whatsappClient.js     # WhatsApp API wrapper
│       └── webhookVerification.js # Webhook verification
├── mcp-servers/
│   └── expense-analytics/
│       ├── server.js              # MCP server
│       └── package.json
├── .env.example
├── package.json
└── README.md
```

## 🎯 Key Components

### 1. Message Handler
Processes incoming WhatsApp messages and routes them appropriately:
- Command detection (help, budgets, summary)
- Expense auto-detection
- AI conversation fallback

### 2. Finance Agent
AI-powered assistant using Claude:
- Extracts expenses from natural language
- Provides financial insights
- Conversational interface

### 3. Database
Simple in-memory storage (MVP only):
- Users
- Expenses
- Budgets

**Note**: For production, replace with PostgreSQL/MongoDB

### 4. WhatsApp Client
Handles all WhatsApp Business API interactions:
- Send text messages
- Send interactive buttons
- Mark messages as read

## 🔐 Security Notes

- **Never commit `.env`** to version control
- Use environment variables for all secrets
- Implement rate limiting in production
- Add authentication for sensitive operations
- Validate all user inputs

## 🚀 Production Deployment

### Upgrade Database
Replace in-memory DB with PostgreSQL:

```javascript
// Example with node-postgres
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Add Features
- User authentication
- Data encryption
- Receipt OCR (for image uploads)
- Export to CSV/PDF
- Multi-currency support
- Recurring expenses
- Shared budgets for families

### Deploy Options
- **Heroku**: Easy deployment with database add-ons
- **AWS**: EC2 + RDS for scalability
- **Digital Ocean**: App Platform for simplicity
- **Railway**: Modern deployment platform

### Monitoring
- Add logging (Winston, Pino)
- Error tracking (Sentry)
- Analytics (Mixpanel, Amplitude)
- Uptime monitoring

## 🐛 Troubleshooting

### Webhook not receiving messages
1. Check ngrok is running and URL is correct
2. Verify webhook subscription in Meta Dashboard
3. Check verify token matches `.env`
4. Look at server logs for errors

### Anthropic API errors
1. Verify API key is correct
2. Check account has credits
3. Ensure model name is correct
4. Review rate limits

### Messages not sending
1. Verify WhatsApp token is valid
2. Check phone number ID is correct
3. Review Meta Business account status
4. Check API quotas

## 📚 Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Express.js Guide](https://expressjs.com/)

## 🤝 Contributing

This is an MVP. Potential improvements:
- Add unit tests
- Implement proper database
- Add receipt OCR
- Create web dashboard
- Support multiple languages
- Add analytics dashboard

## 📄 License

MIT

## 🎉 Next Steps

1. **Test locally** with ngrok
2. **Deploy to staging** environment
3. **Add real database** (PostgreSQL)
4. **Implement OCR** for receipt images
5. **Build analytics dashboard**
6. **Launch beta** with real users

---

Built with ❤️ using WhatsApp Business API, Claude AI, and MCP
