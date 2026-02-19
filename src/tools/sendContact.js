/**
 * Tool: send_contact
 * Sends the Monedita vCard so users can save the contact
 */

import { sendContactCard, sendTextMessage } from "../utils/whatsappClient.js";

export const definition = {
  name: "send_contact",
  description:
    "Use this when the user asks to save the contact, wants the vCard, or asks how to see 'Monedita' instead of the phone number in their chats. Keywords: guardar contacto, save contact, vCard, ver nombre, show name, agregar contacto",
  input_schema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handler(phone, params, lang, userCurrency) {
  const botNumber = process.env.WHATSAPP_BOT_NUMBER;

  if (!botNumber) {
    console.error("[send_contact] WHATSAPP_BOT_NUMBER not configured");
    return {
      success: false,
      message: null, // Agent will handle error
    };
  }

  try {
    // Send the vCard
    await sendContactCard(phone, {
      name: "Monedita",
      phone: `+${botNumber}`,
      website: "https://monedita.app",
    });

    // Send instruction message
    const messages = {
      en: `Here's my contact card!

Tap on it and select *"Add to Contacts"* to save me as *Monedita* in your phone.

That way you'll see my name instead of just the number in your chats.`,
      es: `Aqui esta mi tarjeta de contacto!

Toca en ella y selecciona *"Agregar a Contactos"* para guardarme como *Monedita* en tu telefono.

Asi veras mi nombre en lugar de solo el numero en tus chats.`,
      pt: `Aqui esta meu cartao de contato!

Toque nele e selecione *"Adicionar aos Contatos"* para me salvar como *Monedita* no seu celular.

Assim voce vera meu nome ao inves do numero nos seus chats.`,
    };

    return {
      success: true,
      message: messages[lang] || messages.en,
    };
  } catch (error) {
    console.error("[send_contact] Error:", error);
    return {
      success: false,
      message: null,
    };
  }
}

export default { definition, handler };
