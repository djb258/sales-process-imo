/**
 * Builder.io Operations via Composio MCP
 *
 * 🚨 CRITICAL: ALL Builder.io API calls MUST go through Composio MCP
 * This module wraps Builder.io operations with proper HEIR/ORBT payload format
 *
 * MCP Server: http://localhost:3001
 */

const MCP_URL = import.meta.env.IMOCREATOR_MCP_URL || 'http://localhost:3001';
const MCP_TOOL_ENDPOINT = `${MCP_URL}/tool`;

// ============================================================================
// TYPES
// ============================================================================

interface MCPPayload {
  tool: string;
  data: Record<string, any>;
  unique_id: string;
  process_id: string;
  orbt_layer: number;
  blueprint_version: string;
}

interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BuilderPage {
  id: string;
  name: string;
  data: {
    url: string;
    blocks: BuilderBlock[];
    state?: Record<string, any>;
  };
  published: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface BuilderBlock {
  id: string;
  component: {
    name: string;
    options: Record<string, any>;
  };
  children?: BuilderBlock[];
}

// ============================================================================
// CORE MCP CALLER
// ============================================================================

/**
 * Calls Composio MCP with proper HEIR/ORBT format
 */
async function callComposioMCP<T = any>(payload: MCPPayload): Promise<MCPResponse<T>> {
  try {
    const response = await fetch(MCP_TOOL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Composio MCP call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generates HEIR unique ID
 */
function generateUniqueId(operation: string): string {
  const timestamp = Date.now();
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HEIR-2025-10-CALC-${operation.toUpperCase()}-${seq}`;
}

/**
 * Generates ORBT process ID
 */
function generateProcessId(): string {
  return `PRC-CALC-${Date.now()}`;
}

/**
 * Creates MCP payload with HEIR/ORBT metadata
 */
function createMCPPayload(tool: string, data: Record<string, any>, operation: string): MCPPayload {
  return {
    tool,
    data,
    unique_id: generateUniqueId(operation),
    process_id: generateProcessId(),
    orbt_layer: 2,
    blueprint_version: '1.0',
  };
}

// ============================================================================
// BUILDER.IO OPERATIONS
// ============================================================================

/**
 * Creates a new Builder.io page
 *
 * @example
 * ```typescript
 * const page = await createBuilderPage(
 *   'Dashboard',
 *   '/dashboard/:prospectId',
 *   [{ id: 'main', component: { name: 'Dashboard Layout', options: {} } }]
 * );
 * console.log('Created page:', page.data.id);
 * ```
 */
export async function createBuilderPage(
  name: string,
  url: string,
  blocks: BuilderBlock[],
  state?: Record<string, any>
): Promise<MCPResponse<BuilderPage>> {
  const payload = createMCPPayload(
    'BUILDER_CREATE_CONTENT',
    {
      model: 'page',
      name,
      data: {
        url,
        blocks,
        state: state || {},
      },
      published: false,
    },
    'CREATE-PAGE'
  );

  return callComposioMCP<BuilderPage>(payload);
}

/**
 * Gets Builder.io content by URL
 *
 * @example
 * ```typescript
 * const content = await getBuilderContent('page', '/dashboard/:prospectId');
 * if (content.success) {
 *   console.log('Page blocks:', content.data.data.blocks);
 * }
 * ```
 */
export async function getBuilderContent(
  model: 'page' | 'section' | 'symbol',
  url: string
): Promise<MCPResponse<BuilderPage>> {
  const payload = createMCPPayload(
    'BUILDER_GET_CONTENT',
    {
      model,
      url,
    },
    'GET-CONTENT'
  );

  return callComposioMCP<BuilderPage>(payload);
}

/**
 * Updates existing Builder.io content
 *
 * @example
 * ```typescript
 * await updateBuilderContent('page', 'page-id-123', {
 *   blocks: [
 *     {
 *       id: 'dashboard-1',
 *       component: {
 *         name: 'Dashboard Layout',
 *         options: { colors: { primary: '#8b5cf6' } }
 *       }
 *     }
 *   ]
 * });
 * ```
 */
export async function updateBuilderContent(
  model: 'page' | 'section' | 'symbol',
  id: string,
  data: Partial<BuilderPage['data']>
): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'BUILDER_UPDATE_CONTENT',
    {
      model,
      id,
      data,
    },
    'UPDATE-CONTENT'
  );

  return callComposioMCP(payload);
}

/**
 * Deletes Builder.io content
 *
 * @example
 * ```typescript
 * await deleteBuilderContent('page', 'old-page-id');
 * ```
 */
export async function deleteBuilderContent(
  model: 'page' | 'section' | 'symbol',
  id: string
): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'BUILDER_DELETE_CONTENT',
    {
      model,
      id,
    },
    'DELETE-CONTENT'
  );

  return callComposioMCP(payload);
}

/**
 * Publishes Builder.io content (makes it live)
 *
 * @example
 * ```typescript
 * await publishBuilderContent('page', 'page-id-123');
 * ```
 */
export async function publishBuilderContent(
  model: 'page' | 'section' | 'symbol',
  id: string
): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'BUILDER_PUBLISH_CONTENT',
    {
      model,
      id,
    },
    'PUBLISH-CONTENT'
  );

  return callComposioMCP(payload);
}

/**
 * Lists all Builder.io models (page, section, symbol, etc.)
 *
 * @example
 * ```typescript
 * const models = await listBuilderModels();
 * console.log('Available models:', models.data);
 * ```
 */
export async function listBuilderModels(): Promise<MCPResponse<string[]>> {
  const payload = createMCPPayload('BUILDER_LIST_MODELS', {}, 'LIST-MODELS');

  return callComposioMCP<string[]>(payload);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Updates colors in a Builder.io page
 *
 * @example
 * ```typescript
 * await updatePageColors('page-id-123', {
 *   primary: '#8b5cf6',
 *   accent: '#ec4899',
 * });
 * ```
 */
export async function updatePageColors(
  pageId: string,
  colors: {
    primary?: string;
    accent?: string;
    success?: string;
    danger?: string;
  }
): Promise<MCPResponse> {
  // First, get the current page
  const currentPage = await getBuilderContent('page', ''); // Need to fetch by ID instead

  if (!currentPage.success || !currentPage.data) {
    return { success: false, error: 'Failed to fetch current page' };
  }

  // Update color options in all Dashboard Layout components
  const updatedBlocks = currentPage.data.data.blocks.map((block) => {
    if (block.component.name === 'Dashboard Layout') {
      return {
        ...block,
        component: {
          ...block.component,
          options: {
            ...block.component.options,
            colors: {
              ...block.component.options.colors,
              ...colors,
            },
          },
        },
      };
    }
    return block;
  });

  return updateBuilderContent('page', pageId, {
    blocks: updatedBlocks,
  });
}

/**
 * Updates CTA text in Sniper Marketing component
 *
 * @example
 * ```typescript
 * await updateSniperMarketingCTA('page-id-123', {
 *   buttonText: 'Schedule Consultation',
 *   buttonUrl: '/contact',
 * });
 * ```
 */
export async function updateSniperMarketingCTA(
  pageId: string,
  cta: {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    gradient?: string;
  }
): Promise<MCPResponse> {
  // Similar to updatePageColors - fetch current page and update Sniper Marketing component
  const currentPage = await getBuilderContent('page', '');

  if (!currentPage.success || !currentPage.data) {
    return { success: false, error: 'Failed to fetch current page' };
  }

  const updatedBlocks = currentPage.data.data.blocks.map((block) => {
    if (block.component.name === 'Sniper Marketing') {
      return {
        ...block,
        component: {
          ...block.component,
          options: {
            ...block.component.options,
            cta: {
              ...block.component.options.cta,
              ...cta,
            },
          },
        },
      };
    }
    return block;
  });

  return updateBuilderContent('page', pageId, {
    blocks: updatedBlocks,
  });
}

/**
 * Checks if Composio MCP server is running
 *
 * @example
 * ```typescript
 * const isHealthy = await checkMCPHealth();
 * if (!isHealthy) {
 *   console.error('MCP server is not running on port 3001');
 * }
 * ```
 */
export async function checkMCPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}/mcp/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('MCP health check failed:', error);
    return false;
  }
}

// ============================================================================
// TEMPLATE HELPERS
// ============================================================================

/**
 * Creates a dashboard page from template
 */
export async function createDashboardFromTemplate(
  prospectId: string,
  companyName: string
): Promise<MCPResponse<BuilderPage>> {
  return createBuilderPage(
    `Dashboard - ${companyName}`,
    `/dashboard/${prospectId}`,
    [
      {
        id: 'header',
        component: {
          name: 'Box',
          options: {
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '48px 24px',
              color: 'white',
              textAlign: 'center',
            },
          },
        },
        children: [
          {
            id: 'title',
            component: {
              name: 'Text',
              options: {
                text: `<h1>${companyName} - Insurance Analysis</h1>`,
              },
            },
          },
        ],
      },
      {
        id: 'dashboard-main',
        component: {
          name: 'Dashboard Layout',
          options: {
            prospectId,
            defaultTab: 'factfinder',
            colors: {
              primary: '#3b82f6',
              accent: '#8b5cf6',
              success: '#10b981',
              danger: '#ef4444',
            },
          },
        },
      },
    ],
    {
      prospectId: {
        type: 'string',
        default: prospectId,
      },
      companyName: {
        type: 'string',
        default: companyName,
      },
    }
  );
}

/**
 * Creates a factfinder page from template
 */
export async function createFactfinderFromTemplate(): Promise<MCPResponse<BuilderPage>> {
  return createBuilderPage(
    'Factfinder',
    '/factfinder',
    [
      {
        id: 'hero',
        component: {
          name: 'Box',
          options: {
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '48px 24px',
              color: 'white',
              textAlign: 'center',
            },
          },
        },
        children: [
          {
            id: 'hero-title',
            component: {
              name: 'Text',
              options: {
                text: '<h1>Get Your Custom Insurance Analysis</h1>',
              },
            },
          },
        ],
      },
      {
        id: 'form',
        component: {
          name: 'Factfinder Form',
          options: {
            onSubmitSuccess: '/dashboard/:prospectId',
            primaryColor: '#3b82f6',
            formTitle: 'Factfinder - Company Information',
          },
        },
      },
    ]
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core operations
  createBuilderPage,
  getBuilderContent,
  updateBuilderContent,
  deleteBuilderContent,
  publishBuilderContent,
  listBuilderModels,

  // Helpers
  updatePageColors,
  updateSniperMarketingCTA,
  checkMCPHealth,

  // Templates
  createDashboardFromTemplate,
  createFactfinderFromTemplate,
};
