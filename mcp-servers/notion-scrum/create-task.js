#!/usr/bin/env node

/**
 * Script to create a task in Notion
 * Usage: NOTION_TOKEN=xxx node create-task.js
 */

import { Client } from '@notionhq/client';

const DATABASE_ID = '30b9a9a9-9cd9-80ce-9224-000bf0f6a2e9';

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const description = `## Objetivo
Investigar la viabilidad de integrar Apple Pay con un proveedor de Open Banking para permitir a los usuarios de Monedita conectar y obtener datos de transacciones de múltiples bancos automáticamente.

## Contexto
Actualmente los usuarios registran gastos manualmente. Con Open Banking podríamos:
- Importar transacciones automáticamente de cuentas bancarias
- Categorizar gastos basándose en datos reales del banco
- Ofrecer una visión consolidada de todas las cuentas del usuario

## Áreas a investigar
1. **Proveedores de Open Banking** - Evaluar opciones como Belvo, Plaid, Fintoc para LATAM
2. **Integración con Apple Pay** - Cómo acceder a datos de transacciones de Apple Pay
3. **Regulaciones** - Requisitos legales para Open Banking en Colombia/LATAM
4. **Costos** - Modelos de pricing de los proveedores
5. **UX** - Flujo de conexión de cuentas vía WhatsApp

## Entregables
- Documento comparativo de proveedores
- Propuesta técnica de integración
- Estimación de costos y timeline`;

function markdownToBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }],
        },
      });
      i++;
      continue;
    }

    // Numbered list items
    if (/^\d+\.\s/.test(line)) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\.\s+/, '') } }],
        },
      });
      i++;
      continue;
    }

    // Bullet list items
    if (line.startsWith('- ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }],
        },
      });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: line } }],
      },
    });
    i++;
  }

  return blocks;
}

async function createTask() {
  try {
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        'Task name': {
          title: [
            {
              text: { content: 'Investigar integración Apple Pay + Open Banking para conexión multi-banco' },
            },
          ],
        },
        'Status': {
          status: { name: 'Not started' },
        },
        'Priority': {
          select: { name: 'Medium' },
        },
        'Task type': {
          select: { name: 'Research' },
        },
      },
      children: markdownToBlocks(description),
    });

    console.log('✅ Task created successfully!');
    console.log(`   ID: ${page.id}`);
    console.log(`   URL: ${page.url}`);
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
    if (error.code === 'unauthorized') {
      console.error('   Make sure NOTION_TOKEN is set and the database is shared with the integration.');
    }
    process.exit(1);
  }
}

createTask();
