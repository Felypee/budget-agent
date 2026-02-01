/**
 * Webhook verification for WhatsApp Business API
 * This endpoint is called by Meta to verify the webhook
 */
export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed - invalid token');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
}
