import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { handleIncomingMessage } from './handlers/messageHandler.js';
import { verifyWebhook } from './utils/webhookVerification.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinanceFlow server is running' });
});

// Webhook verification endpoint (required by WhatsApp)
app.get('/webhook', verifyWebhook);

// Webhook endpoint to receive messages
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const phone = message.from;
        
        // Handle the message asynchronously
        handleIncomingMessage(message, phone).catch(err => {
          console.error('Error handling message:', err);
        });
      }

      // Acknowledge receipt immediately
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 FinanceFlow server running on port ${PORT}`);
  console.log(`📱 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`💡 Make sure to configure your WhatsApp Business API webhook to point here`);
});
