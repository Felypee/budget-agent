#!/usr/bin/env node

/**
 * MCP Server for Expense Analytics
 * This server provides tools for analyzing expense data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Simulated expense data store (in real implementation, connect to database)
const expenseData = new Map();

class ExpenseAnalyticsServer {
  constructor() {
    this.server = new Server(
      {
        name: 'expense-analytics',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_spending_trends',
          description: 'Analyze spending trends over time for a user',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User identifier (phone number)',
              },
              period: {
                type: 'string',
                enum: ['week', 'month', 'quarter', 'year'],
                description: 'Time period to analyze',
              },
            },
            required: ['user_id', 'period'],
          },
        },
        {
          name: 'predict_budget_overrun',
          description: 'Predict if user will exceed budget based on current spending',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User identifier',
              },
              category: {
                type: 'string',
                description: 'Budget category to analyze',
              },
            },
            required: ['user_id', 'category'],
          },
        },
        {
          name: 'get_category_insights',
          description: 'Get insights about spending in a specific category',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User identifier',
              },
              category: {
                type: 'string',
                description: 'Category to analyze',
              },
            },
            required: ['user_id', 'category'],
          },
        },
        {
          name: 'compare_to_average',
          description: 'Compare user spending to average across all users',
          inputSchema: {
            type: 'object',
            properties: {
              user_id: {
                type: 'string',
                description: 'User identifier',
              },
              category: {
                type: 'string',
                description: 'Category to compare',
              },
            },
            required: ['user_id'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_spending_trends':
            return this.analyzeSpendingTrends(args);
          case 'predict_budget_overrun':
            return this.predictBudgetOverrun(args);
          case 'get_category_insights':
            return this.getCategoryInsights(args);
          case 'compare_to_average':
            return this.compareToAverage(args);
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

  async analyzeSpendingTrends(args) {
    const { user_id, period } = args;
    
    // Simulated trend analysis
    const trend = {
      period,
      trend: 'increasing',
      percentage_change: 12.5,
      insights: [
        `Spending has increased by 12.5% compared to last ${period}`,
        'Food category shows highest growth (+25%)',
        'Consider reviewing subscription services',
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trend, null, 2),
        },
      ],
    };
  }

  async predictBudgetOverrun(args) {
    const { user_id, category } = args;
    
    // Simulated prediction
    const prediction = {
      category,
      current_spending: 350,
      budget: 500,
      days_remaining: 15,
      projected_total: 580,
      will_exceed: true,
      recommendation: 'Reduce daily spending by $8 to stay within budget',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(prediction, null, 2),
        },
      ],
    };
  }

  async getCategoryInsights(args) {
    const { user_id, category } = args;
    
    const insights = {
      category,
      average_transaction: 25.50,
      most_common_time: 'weekday evenings',
      top_merchants: ['Store A', 'Store B', 'Store C'],
      anomalies: ['Unusually high transaction of $150 on Jan 15'],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(insights, null, 2),
        },
      ],
    };
  }

  async compareToAverage(args) {
    const { user_id, category } = args;
    
    const comparison = {
      user_spending: 450,
      average_spending: 380,
      percentile: 65,
      status: 'above_average',
      message: 'You spend 18% more than average users',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Expense Analytics MCP server running on stdio');
  }
}

const server = new ExpenseAnalyticsServer();
server.run().catch(console.error);
