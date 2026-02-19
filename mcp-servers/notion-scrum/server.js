#!/usr/bin/env node

/**
 * MCP Server for Notion Scrum/Project Management
 * This server provides tools to read tasks, comments, and manage the Monedita development backlog
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@notionhq/client';

class NotionScrumServer {
  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    this.server = new Server(
      {
        name: 'notion-scrum',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_databases',
          description: 'List all Notion databases accessible to the integration',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_database',
          description: 'Get details about a specific database including its properties/columns',
          inputSchema: {
            type: 'object',
            properties: {
              database_id: {
                type: 'string',
                description: 'The Notion database ID',
              },
            },
            required: ['database_id'],
          },
        },
        {
          name: 'query_tasks',
          description: 'Query tasks/items from a Notion database with optional filters',
          inputSchema: {
            type: 'object',
            properties: {
              database_id: {
                type: 'string',
                description: 'The Notion database ID',
              },
              status: {
                type: 'string',
                description: 'Filter by status (e.g., "To Do", "In Progress", "Done")',
              },
              assignee: {
                type: 'string',
                description: 'Filter by assignee name',
              },
              limit: {
                type: 'number',
                description: 'Max number of results (default 50)',
              },
            },
            required: ['database_id'],
          },
        },
        {
          name: 'get_page',
          description: 'Get full details of a Notion page/task including all properties',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: {
                type: 'string',
                description: 'The Notion page ID',
              },
            },
            required: ['page_id'],
          },
        },
        {
          name: 'get_page_content',
          description: 'Get the content/blocks of a Notion page (description, comments, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: {
                type: 'string',
                description: 'The Notion page ID',
              },
            },
            required: ['page_id'],
          },
        },
        {
          name: 'get_comments',
          description: 'Get comments on a Notion page',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: {
                type: 'string',
                description: 'The Notion page ID',
              },
            },
            required: ['page_id'],
          },
        },
        {
          name: 'update_task_status',
          description: 'Update the status of a task',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: {
                type: 'string',
                description: 'The Notion page ID',
              },
              status: {
                type: 'string',
                description: 'New status value',
              },
              status_property: {
                type: 'string',
                description: 'Name of the status property (default: "Status")',
              },
            },
            required: ['page_id', 'status'],
          },
        },
        {
          name: 'add_comment',
          description: 'Add a comment to a Notion page',
          inputSchema: {
            type: 'object',
            properties: {
              page_id: {
                type: 'string',
                description: 'The Notion page ID',
              },
              comment: {
                type: 'string',
                description: 'Comment text to add',
              },
            },
            required: ['page_id', 'comment'],
          },
        },
        {
          name: 'search',
          description: 'Search across all Notion pages and databases',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              filter_type: {
                type: 'string',
                enum: ['page', 'database'],
                description: 'Filter by object type',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'create_task',
          description: 'Create a new task/page in a Notion database',
          inputSchema: {
            type: 'object',
            properties: {
              database_id: {
                type: 'string',
                description: 'The Notion database ID',
              },
              title: {
                type: 'string',
                description: 'Task title/name',
              },
              status: {
                type: 'string',
                description: 'Task status (e.g., "Not started", "In progress", "Done")',
              },
              priority: {
                type: 'string',
                description: 'Task priority (e.g., "Low", "Medium", "High")',
              },
              task_type: {
                type: 'string',
                description: 'Type of task (e.g., "Feature", "Bug", "Research")',
              },
              description: {
                type: 'string',
                description: 'Task description (markdown supported)',
              },
            },
            required: ['database_id', 'title'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_databases':
            return this.listDatabases();
          case 'get_database':
            return this.getDatabase(args);
          case 'query_tasks':
            return this.queryTasks(args);
          case 'get_page':
            return this.getPage(args);
          case 'get_page_content':
            return this.getPageContent(args);
          case 'get_comments':
            return this.getComments(args);
          case 'update_task_status':
            return this.updateTaskStatus(args);
          case 'add_comment':
            return this.addComment(args);
          case 'search':
            return this.search(args);
          case 'create_task':
            return this.createTask(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async listDatabases() {
    const response = await this.notion.search({});

    const databases = response.results
      .filter((item) => item.object === 'database')
      .map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url,
      }));

    return {
      content: [
        {
          type: 'text',
          text: databases.length > 0
            ? JSON.stringify(databases, null, 2)
            : 'No databases found. Make sure to share your Notion databases with the "Claude Code - Monedita" integration.',
        },
      ],
    };
  }

  async getDatabase(args) {
    const { database_id } = args;
    const db = await this.notion.databases.retrieve({ database_id });

    const properties = Object.entries(db.properties).map(([name, prop]) => ({
      name,
      type: prop.type,
      options: prop.select?.options || prop.multi_select?.options || prop.status?.options || null,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: db.id,
              title: db.title?.[0]?.plain_text || 'Untitled',
              properties,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async queryTasks(args) {
    const { database_id, status, assignee, limit = 50 } = args;

    const filter = [];
    if (status) {
      filter.push({
        property: 'Status',
        status: { equals: status },
      });
    }
    if (assignee) {
      filter.push({
        property: 'Assignee',
        people: { contains: assignee },
      });
    }

    const queryParams = {
      database_id,
      page_size: limit,
    };

    if (filter.length === 1) {
      queryParams.filter = filter[0];
    } else if (filter.length > 1) {
      queryParams.filter = { and: filter };
    }

    const response = await this.notion.databases.query(queryParams);

    const tasks = response.results.map((page) => this.extractPageSummary(page));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(tasks, null, 2),
        },
      ],
    };
  }

  extractPageSummary(page) {
    const props = page.properties;
    const summary = {
      id: page.id,
      url: page.url,
    };

    for (const [name, prop] of Object.entries(props)) {
      summary[name] = this.extractPropertyValue(prop);
    }

    return summary;
  }

  extractPropertyValue(prop) {
    switch (prop.type) {
      case 'title':
        return prop.title?.[0]?.plain_text || '';
      case 'rich_text':
        return prop.rich_text?.[0]?.plain_text || '';
      case 'number':
        return prop.number;
      case 'select':
        return prop.select?.name || null;
      case 'multi_select':
        return prop.multi_select?.map((s) => s.name) || [];
      case 'status':
        return prop.status?.name || null;
      case 'date':
        return prop.date?.start || null;
      case 'people':
        return prop.people?.map((p) => p.name) || [];
      case 'checkbox':
        return prop.checkbox;
      case 'url':
        return prop.url;
      case 'email':
        return prop.email;
      case 'phone_number':
        return prop.phone_number;
      case 'formula':
        return prop.formula?.[prop.formula.type];
      case 'relation':
        return prop.relation?.map((r) => r.id) || [];
      case 'rollup':
        return prop.rollup?.[prop.rollup.type];
      case 'created_time':
        return prop.created_time;
      case 'last_edited_time':
        return prop.last_edited_time;
      case 'created_by':
        return prop.created_by?.name;
      case 'last_edited_by':
        return prop.last_edited_by?.name;
      default:
        return null;
    }
  }

  async getPage(args) {
    const { page_id } = args;
    const page = await this.notion.pages.retrieve({ page_id });
    const summary = this.extractPageSummary(page);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  async getPageContent(args) {
    const { page_id } = args;
    const blocks = await this.notion.blocks.children.list({ block_id: page_id });

    const content = blocks.results.map((block) => this.extractBlockContent(block));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(content, null, 2),
        },
      ],
    };
  }

  extractBlockContent(block) {
    const base = {
      type: block.type,
      id: block.id,
    };

    const blockData = block[block.type];
    if (blockData?.rich_text) {
      base.text = blockData.rich_text.map((t) => t.plain_text).join('');
    }
    if (blockData?.checked !== undefined) {
      base.checked = blockData.checked;
    }
    if (blockData?.url) {
      base.url = blockData.url;
    }

    return base;
  }

  async getComments(args) {
    const { page_id } = args;
    const comments = await this.notion.comments.list({ block_id: page_id });

    const formatted = comments.results.map((c) => ({
      id: c.id,
      author: c.created_by?.name || 'Unknown',
      created: c.created_time,
      text: c.rich_text?.map((t) => t.plain_text).join('') || '',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(formatted, null, 2),
        },
      ],
    };
  }

  async updateTaskStatus(args) {
    const { page_id, status, status_property = 'Status' } = args;

    await this.notion.pages.update({
      page_id,
      properties: {
        [status_property]: {
          status: { name: status },
        },
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, message: `Status updated to "${status}"` }),
        },
      ],
    };
  }

  async addComment(args) {
    const { page_id, comment } = args;

    const response = await this.notion.comments.create({
      parent: { page_id },
      rich_text: [
        {
          type: 'text',
          text: { content: comment },
        },
      ],
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            comment_id: response.id,
            message: 'Comment added successfully',
          }),
        },
      ],
    };
  }

  async search(args) {
    const { query, filter_type } = args;

    const searchParams = { query };

    const response = await this.notion.search(searchParams);

    let results = response.results;

    // Filter by type if specified
    if (filter_type) {
      results = results.filter((item) => item.object === filter_type);
    }

    const formatted = results.map((item) => {
      if (item.object === 'database') {
        return {
          type: 'database',
          id: item.id,
          title: item.title?.[0]?.plain_text || 'Untitled',
          url: item.url,
        };
      } else {
        return {
          type: 'page',
          id: item.id,
          title: item.properties?.Name?.title?.[0]?.plain_text ||
                 item.properties?.title?.title?.[0]?.plain_text ||
                 'Untitled',
          url: item.url,
        };
      }
    });

    return {
      content: [
        {
          type: 'text',
          text: formatted.length > 0
            ? JSON.stringify(formatted, null, 2)
            : 'No results found. Make sure to share your Notion pages/databases with the integration.',
        },
      ],
    };
  }

  async createTask(args) {
    const { database_id, title, status, priority, task_type, description } = args;

    const properties = {
      'Task name': {
        title: [
          {
            text: { content: title },
          },
        ],
      },
    };

    // Add status if provided
    if (status) {
      properties['Status'] = {
        status: { name: status },
      };
    }

    // Add priority if provided
    if (priority) {
      properties['Priority'] = {
        select: { name: priority },
      };
    }

    // Add task type if provided
    if (task_type) {
      properties['Task type'] = {
        select: { name: task_type },
      };
    }

    const pageData = {
      parent: { database_id },
      properties,
    };

    // Add description as page content if provided
    if (description) {
      pageData.children = this.markdownToBlocks(description);
    }

    const page = await this.notion.pages.create(pageData);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            id: page.id,
            url: page.url,
            message: `Task "${title}" created successfully`,
          }, null, 2),
        },
      ],
    };
  }

  markdownToBlocks(markdown) {
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

      if (line.startsWith('### ')) {
        blocks.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ type: 'text', text: { content: line.slice(4) } }],
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Notion Scrum MCP server running on stdio');
  }
}

const server = new NotionScrumServer();
server.run().catch(console.error);
