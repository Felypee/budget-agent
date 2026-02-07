# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FinanceFlow is a WhatsApp-based AI expense manager that uses Claude for natural language expense tracking and financial insights. Users interact via WhatsApp to log expenses, set budgets, and get spending summaries.

## Commands

```bash
# Install dependencies
npm install

# Start main Express server (port 3000)
npm start

# Start with file watching (development)
npm run dev

# Start MCP analytics server (separate process)
npm run mcp-server

# MCP server has separate dependencies
cd mcp-servers/expense-analytics && npm install
```

## Architecture

### Request Flow
1. WhatsApp message → Meta webhook → Express `/webhook` endpoint
2. `messageHandler.js` processes message: detects commands or uses AI
3. `FinanceAgent` calls Claude API for expense extraction or conversational responses
4. Response sent back via WhatsApp Business API

### Key Components

- **src/server.js**: Express entry point with `/webhook` (POST for messages, GET for verification) and `/health` endpoints
- **src/handlers/messageHandler.js**: Message router - handles text commands, images (receipts), and voice messages. Delegates to FinanceAgent for AI processing
- **src/agents/financeAgent.js**: Claude integration - `detectExpenses()` extracts multiple expenses from text, `processMessage()` handles general queries with financial context
- **src/utils/currencyUtils.js**: Currency detection from phone country codes, amount validation, and formatting
- **src/utils/mediaProcessor.js**: Image OCR (Claude Vision) and audio transcription (Whisper) for expense extraction
- **src/database/index.js**: DB selector using `DB_DRIVER` env var (`inmemory` or `supabase`)
- **src/database/inMemoryDB.js**: In-memory storage with UserDB, ExpenseDB, BudgetDB classes
- **src/database/supabaseDB.js**: Supabase implementation (same interface as inMemoryDB)
- **src/utils/whatsappClient.js**: WhatsApp API wrapper for sending messages

### MCP Server (mcp-servers/expense-analytics/)
Standalone MCP server providing analytics tools: `analyze_spending_trends`, `predict_budget_overrun`, `get_category_insights`, `compare_to_average`. Currently returns simulated data.

## Environment Variables

Required in `.env`:
- `WHATSAPP_TOKEN` - WhatsApp Business API access token
- `WHATSAPP_VERIFY_TOKEN` - Custom string for webhook verification
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID from Meta
- `ANTHROPIC_API_KEY` - For Claude API calls
- `PORT` - Server port (default 3000)

For Supabase:
- `DB_DRIVER=supabase`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

For voice messages (at least one required):
- `GROQ_API_KEY` - Groq Whisper API (free tier available, preferred)
- `OPENAI_API_KEY` - OpenAI Whisper API ($0.006/min fallback)

## Code Patterns

- ES modules (`"type": "module"` in package.json)
- Async/await throughout
- Database operations return promises and handle null gracefully
- Expense categories: `food`, `transport`, `shopping`, `entertainment`, `bills`, `health`, `other`
- Claude model: `claude-sonnet-4-20250514`
- AI prompts include user's financial context (expenses, budgets, category summaries)
