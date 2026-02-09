import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Send a text message via WhatsApp
 */
export async function sendTextMessage(to, message) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send an interactive message with buttons
 */
export async function sendInteractiveButtons(to, bodyText, buttons) {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((btn, idx) => ({
              type: 'reply',
              reply: {
                id: btn.id || `btn_${idx}`,
                title: btn.title
              }
            }))
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending interactive message:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Mark message as read
 */
export async function markAsRead(messageId) {
  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error marking message as read:', error.response?.data || error.message);
  }
}

/**
 * Send a document (file) via WhatsApp
 * @param {string} to - Recipient phone number
 * @param {Buffer} fileBuffer - File content as Buffer
 * @param {string} filename - Filename with extension (e.g. "expenses_2026-02-08.csv")
 * @param {string} caption - Caption shown below the document
 */
export async function sendDocument(to, fileBuffer, filename, caption) {
  // Step 1: Upload media
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', 'text/csv');
  formData.append('file', fileBuffer, {
    filename,
    contentType: 'text/csv',
  });

  const uploadResponse = await axios.post(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/media`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        ...formData.getHeaders(),
      },
    }
  );

  const mediaId = uploadResponse.data.id;

  // Step 2: Send document message
  const response = await axios.post(
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        id: mediaId,
        filename,
        caption,
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Send typing indicator to show bot is processing
 * Note: WhatsApp doesn't have a direct "typing" API, but we can use
 * a reaction or mark as read to indicate activity. For now, this is a placeholder
 * that could be replaced with a "processing" message approach.
 */
export async function sendTypingIndicator(to) {
  try {
    // WhatsApp Cloud API doesn't support typing indicators directly
    // But we can use the "mark as read" to show we've seen the message
    // For better UX, some implementations send a brief "..." message
    // that gets replaced, but that's not ideal for WhatsApp.

    // Alternative: Use presence update if available in future API versions
    // For now, we just log - the actual "typing" effect is simulated
    // by the quick "read" status
    console.log(`[whatsapp] Typing indicator for ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending typing indicator:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Download media from WhatsApp
 * @param {string} mediaId - The media ID from the message
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
export async function downloadMedia(mediaId) {
  try {
    // First, get the media URL
    const mediaResponse = await axios.get(
      `${WHATSAPP_API_URL}/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    const mediaUrl = mediaResponse.data.url;
    const mimeType = mediaResponse.data.mime_type;

    // Download the actual media file
    const fileResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      responseType: 'arraybuffer'
    });

    return {
      buffer: Buffer.from(fileResponse.data),
      mimeType
    };
  } catch (error) {
    console.error('Error downloading media:', error.response?.data || error.message);
    throw error;
  }
}
