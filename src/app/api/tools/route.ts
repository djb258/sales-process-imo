/**
 * Tools API Route
 * All tool requests go through Composio MCP Server
 * NO CUSTOM TOOL BUILDING
 */

import { NextRequest, NextResponse } from 'next/server';
import composio from '@/lib/composio-integration';

export async function GET(request: NextRequest) {
  try {
    // Initialize Composio if not already done
    await composio.initialize();
    
    // Get available tools from Composio
    const tools = await composio.getAvailableTools();
    
    return NextResponse.json({
      provider: 'composio',
      tools,
      message: 'Using Composio MCP Server for all integrations'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tools from Composio' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tool, params } = await request.json();
    
    // Execute tool via Composio only
    const result = await composio.executeTool(tool, params);
    
    return NextResponse.json({
      provider: 'composio',
      tool,
      result,
      message: 'Executed via Composio MCP Server'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Tool execution failed via Composio' },
      { status: 500 }
    );
  }
}