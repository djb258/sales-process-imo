/**
 * Composio Integration Module
 * Primary tool integration using Composio MCP Server
 * NO CUSTOM TOOL BUILDING - Use Composio's existing integrations
 */

import { ComposioToolSet } from 'composio-core';

// Initialize Composio as the default tool provider
export class ComposioIntegration {
  private toolset: ComposioToolSet;
  private initialized: boolean = false;

  constructor() {
    this.toolset = new ComposioToolSet({
      apiKey: process.env.COMPOSIO_API_KEY,
    });
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Connect to Composio MCP server
      await this.toolset.init();
      this.initialized = true;
      console.log('✅ Composio MCP Server initialized as primary integration');
    } catch (error) {
      console.error('Failed to initialize Composio:', error);
      throw new Error('Composio initialization failed - check API key');
    }
  }

  // Get available tools from Composio (no custom building)
  async getAvailableTools() {
    const tools = await this.toolset.getTools();
    return tools;
  }

  // Execute tool via Composio
  async executeTool(toolName: string, params: any) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Always use Composio's existing tools
    return await this.toolset.executeTool(toolName, params);
  }

  // Get specific integrations
  async getIntegrations() {
    return {
      apify: await this.toolset.getApp('APIFY'),
      email: await this.toolset.getApp('EMAIL_VALIDATOR'),
      database: await this.toolset.getApp('DATABASE'),
      scraper: await this.toolset.getApp('WEB_SCRAPER'),
      llm: await this.toolset.getApp('LLM_BRIDGE'),
    };
  }
}

// Singleton instance
export const composio = new ComposioIntegration();

// Default export for primary usage
export default composio;