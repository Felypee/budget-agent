# 🎯 Setup Guide - FinanceFlow MVP

Step-by-step guide to get FinanceFlow running.

## Part 1: WhatsApp Business API Setup

### Step 1: Create Meta Developer Account

1. Go to https://developers.facebook.com/
2. Click "Get Started" (top right)
3. Create or log into your Facebook account
4. Complete the registration

### Step 2: Create a Business App

1. In Meta Developer Dashboard, click "Create App"
2. Select "Business" as app type
3. Fill in app details:
   - **App name**: FinanceFlow MVP
   - **Contact email**: Your email
   - **Business Portfolio**: Create new or select existing
4. Click "Create App"

### Step 3: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in products
2. Click "Set Up"
3. You'll be directed to WhatsApp API setup page

### Step 4: Get Your Credentials

1. On the API Setup page, you'll see:
   - **Temporary Access Token** (valid 24 hours - get a permanent one later)
   - **Phone Number ID** (under "From" section)
   - **WhatsApp Business Account ID**

2. Copy these values to your `.env` file:
```env
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
```

3. Set a custom verify token (any random string):
```env
WHATSAPP_VERIFY_TOKEN=my_secure_random_token_12345
```

### Step 5: Get Permanent Access Token (Important!)

The temporary token expires in 24 hours. To get a permanent one:

1. In Meta Business Suite, go to **Business Settings**
2. Under **Users** → **System Users**, create a new System User
3. Assign the System User to your WhatsApp Business Account
4. Generate a token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. **Save this token** - it won't be shown again!
6. Update your `.env` with the permanent token

## Part 2: Anthropic API Setup

### Step 1: Get API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click "Create Key"
5. Copy the key and add to `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Step 2: Add Credits (if needed)

1. Ensure your account has credits
2. Go to **Billing** to add payment method
3. Claude Sonnet 4 pricing:
   - Input: ~$3 per million tokens
   - Output: ~$15 per million tokens

## Part 3: Local Development Setup

### Step 1: Install Dependencies

```bash
cd financeflow-mvp
npm install
```

### Step 2: Install MCP Server Dependencies

```bash
cd mcp-servers/expense-analytics
npm install
cd ../..
```

### Step 3: Setup ngrok (for local webhook testing)

1. Download ngrok: https://ngrok.com/download
2. Sign up for free account
3. Install authtoken:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

4. Start ngrok tunnel:
```bash
ngrok http 3000
```

5. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Configure Webhook in Meta

1. In WhatsApp API Setup page, find **Configuration**
2. Click "Edit" on Webhook
3. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Verify Token**: (the one from your `.env`)
4. Click "Verify and Save"
5. Subscribe to **messages** webhook field

### Step 5: Start the Server

```bash
npm start
```

You should see:
```
🚀 FinanceFlow server running on port 3000
📱 Webhook endpoint: http://localhost:3000/webhook
```

## Part 4: Testing

### Test 1: Send Test Message from Meta

1. In WhatsApp API Setup, find "Send and receive messages"
2. There's a test phone number you can use
3. Send a test message to your WhatsApp number
4. The bot should respond!

### Test 2: Manual Testing

From your phone (must be added as tester):

```
You: hi
Bot: 👋 Welcome to FinanceFlow! ...

You: spent 25 on coffee
Bot: ✅ Logged: $25 for food (coffee)

You: how am I doing?
Bot: 📊 January 2026 Summary ...
```

### Test 3: Check Logs

Server logs will show:
```
📨 Message from +1234567890: hi
📨 Message from +1234567890: spent 25 on coffee
```

## Part 5: Add Test Phone Numbers

Only you can message the bot initially. To add testers:

1. In Meta Developer Dashboard → WhatsApp → API Setup
2. Scroll to "Add test phone numbers"
3. Enter phone numbers (with country code)
4. They'll receive a code via WhatsApp
5. Once verified, they can test the bot

## Part 6: MCP Server Setup (Optional)

### For Use with Claude Desktop:

1. Open Claude Desktop config:
```bash
# Mac
open ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
notepad %APPDATA%\Claude\claude_desktop_config.json
```

2. Add MCP server configuration:
```json
{
  "mcpServers": {
    "expense-analytics": {
      "command": "node",
      "args": ["/FULL/PATH/TO/financeflow-mvp/mcp-servers/expense-analytics/server.js"]
    }
  }
}
```

3. Restart Claude Desktop
4. Look for 🔌 icon - MCP server should be connected

## Troubleshooting

### Problem: Webhook verification fails

**Solution:**
- Ensure ngrok is running
- Check verify token matches exactly
- Look at server logs for errors
- Try clicking "Verify and Save" again

### Problem: No messages received

**Solution:**
- Check ngrok URL is correct in webhook settings
- Verify phone number is added as tester
- Look at ngrok web interface (http://localhost:4040) for requests
- Check server is running on port 3000

### Problem: Bot doesn't respond

**Solution:**
- Check server logs for errors
- Verify Anthropic API key is correct
- Ensure you have API credits
- Check WhatsApp token is valid

### Problem: "Invalid access token"

**Solution:**
- Temporary token may have expired (get permanent one)
- Check token is copied correctly (no spaces)
- Verify token has correct permissions

## Environment Variables Checklist

Ensure all these are set in `.env`:

- [ ] WHATSAPP_TOKEN
- [ ] WHATSAPP_VERIFY_TOKEN
- [ ] WHATSAPP_PHONE_NUMBER_ID
- [ ] WHATSAPP_BUSINESS_ACCOUNT_ID
- [ ] ANTHROPIC_API_KEY
- [ ] PORT (default: 3000)

## Quick Test Commands

```bash
# Check if server is running
curl http://localhost:3000/health

# Simulate webhook verification
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# View ngrok requests
open http://localhost:4040
```

## Next Steps After Setup

1. ✅ Test basic expense logging
2. ✅ Test budget setting
3. ✅ Test AI conversations
4. ✅ Verify budget alerts work
5. 📝 Read the API documentation
6. 🚀 Plan production deployment

## Production Checklist

Before deploying to production:

- [ ] Replace in-memory DB with PostgreSQL
- [ ] Set up proper error logging
- [ ] Add rate limiting
- [ ] Implement data backups
- [ ] Add monitoring/alerting
- [ ] Set up CI/CD pipeline
- [ ] Create staging environment
- [ ] Write unit tests
- [ ] Document API endpoints
- [ ] Set up analytics

## Support Resources

- **WhatsApp Issues**: https://developers.facebook.com/community/
- **Anthropic Issues**: https://support.anthropic.com/
- **General Questions**: Check README.md

---

Good luck! 🚀 If you run into issues, check the logs and troubleshooting section above.
