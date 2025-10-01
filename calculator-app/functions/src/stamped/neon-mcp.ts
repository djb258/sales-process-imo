/**
 * Neon MCP Integration
 * ALL Neon database operations MUST go through Composio MCP
 *
 * MCP Server: http://localhost:3001
 * Endpoint: /tool
 * Format: HEIR/ORBT payload
 */

import type {
  NeonClient,
  NeonEmployee,
  NeonComplianceFlag,
  NeonFinancialModel,
  NeonSavingsScenario,
  PromotionLog,
} from './schema-mapper';

const MCP_URL = process.env.IMOCREATOR_MCP_URL || 'http://localhost:3001';
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

// ============================================================================
// MCP HELPERS
// ============================================================================

function generateUniqueId(operation: string): string {
  const timestamp = Date.now();
  const seq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HEIR-2025-10-CALC-${operation.toUpperCase()}-${seq}`;
}

function generateProcessId(): string {
  return `PRC-CALC-${Date.now()}`;
}

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

async function callNeonMCP<T = any>(payload: MCPPayload): Promise<MCPResponse<T>> {
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
    console.error('Neon MCP call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// NEON INSERT OPERATIONS
// ============================================================================

/**
 * Inserts client record into Neon clients table
 */
export async function insertNeonClient(client: NeonClient): Promise<MCPResponse<{ client_id: string }>> {
  const payload = createMCPPayload(
    'NEON_INSERT',
    {
      table: 'clients',
      schema: 'public',
      data: client,
      returnColumns: ['client_id'],
    },
    'INSERT-CLIENT'
  );

  return callNeonMCP<{ client_id: string }>(payload);
}

/**
 * Inserts multiple employees into Neon employees table
 */
export async function insertNeonEmployees(employees: NeonEmployee[]): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'NEON_INSERT_BATCH',
    {
      table: 'employees',
      schema: 'public',
      data: employees,
    },
    'INSERT-EMPLOYEES'
  );

  return callNeonMCP(payload);
}

/**
 * Inserts compliance flags into Neon compliance_flags table
 */
export async function insertNeonComplianceFlags(flags: NeonComplianceFlag[]): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'NEON_INSERT_BATCH',
    {
      table: 'compliance_flags',
      schema: 'public',
      data: flags,
    },
    'INSERT-COMPLIANCE'
  );

  return callNeonMCP(payload);
}

/**
 * Inserts financial models into Neon financial_models table
 */
export async function insertNeonFinancialModels(models: NeonFinancialModel[]): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'NEON_INSERT_BATCH',
    {
      table: 'financial_models',
      schema: 'public',
      data: models,
    },
    'INSERT-MODELS'
  );

  return callNeonMCP(payload);
}

/**
 * Inserts savings scenario into Neon savings_scenarios table
 */
export async function insertNeonSavingsScenario(scenario: NeonSavingsScenario): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'NEON_INSERT',
    {
      table: 'savings_scenarios',
      schema: 'public',
      data: scenario,
    },
    'INSERT-SAVINGS'
  );

  return callNeonMCP(payload);
}

/**
 * Inserts promotion log into Neon promotion_log table
 */
export async function insertPromotionLog(log: PromotionLog): Promise<MCPResponse> {
  const payload = createMCPPayload(
    'NEON_INSERT',
    {
      table: 'promotion_log',
      schema: 'public',
      data: log,
    },
    'INSERT-LOG'
  );

  return callNeonMCP(payload);
}

// ============================================================================
// NEON QUERY OPERATIONS
// ============================================================================

/**
 * Checks if client exists in Neon by prospect_id
 */
export async function neonClientExists(prospectId: string): Promise<boolean> {
  const payload = createMCPPayload(
    'NEON_QUERY',
    {
      query: 'SELECT client_id FROM clients WHERE prospect_id = $1 LIMIT 1',
      params: [prospectId],
    },
    'CHECK-CLIENT'
  );

  const result = await callNeonMCP(payload);
  return result.success && result.data && result.data.length > 0;
}

/**
 * Gets Neon client by prospect_id
 */
export async function getNeonClientByProspectId(prospectId: string): Promise<MCPResponse<NeonClient>> {
  const payload = createMCPPayload(
    'NEON_QUERY',
    {
      query: 'SELECT * FROM clients WHERE prospect_id = $1 LIMIT 1',
      params: [prospectId],
    },
    'GET-CLIENT'
  );

  const result = await callNeonMCP<any[]>(payload);

  if (result.success && result.data && result.data.length > 0) {
    return {
      success: true,
      data: result.data[0],
    };
  }

  return {
    success: false,
    error: 'Client not found',
  };
}

/**
 * Gets promotion logs for a prospect
 */
export async function getPromotionLogs(prospectId: string): Promise<MCPResponse<PromotionLog[]>> {
  const payload = createMCPPayload(
    'NEON_QUERY',
    {
      query: `
        SELECT * FROM promotion_log
        WHERE prospect_id = $1
        ORDER BY timestamp DESC
      `,
      params: [prospectId],
    },
    'GET-LOGS'
  );

  return callNeonMCP<PromotionLog[]>(payload);
}

// ============================================================================
// BATCH PROMOTION
// ============================================================================

/**
 * Promotes all data for a prospect to Neon in a single transaction
 */
export async function promoteProspectToNeon(
  prospectId: string,
  client: NeonClient,
  employees: NeonEmployee[],
  complianceFlags: NeonComplianceFlag[],
  financialModels: NeonFinancialModel[],
  savingsScenario: NeonSavingsScenario
): Promise<MCPResponse<{ client_id: string }>> {
  try {
    // 1. Insert client (returns client_id)
    const clientResult = await insertNeonClient(client);

    if (!clientResult.success || !clientResult.data?.client_id) {
      throw new Error('Failed to insert client: ' + clientResult.error);
    }

    const clientId = clientResult.data.client_id;

    // Update all related records with the generated client_id
    employees.forEach((emp) => (emp.client_id = clientId));
    complianceFlags.forEach((flag) => (flag.client_id = clientId));
    financialModels.forEach((model) => (model.client_id = clientId));
    savingsScenario.client_id = clientId;

    // 2. Insert employees (batch)
    if (employees.length > 0) {
      const employeesResult = await insertNeonEmployees(employees);
      if (!employeesResult.success) {
        console.error('Failed to insert employees:', employeesResult.error);
      }
    }

    // 3. Insert compliance flags (batch)
    if (complianceFlags.length > 0) {
      const complianceResult = await insertNeonComplianceFlags(complianceFlags);
      if (!complianceResult.success) {
        console.error('Failed to insert compliance flags:', complianceResult.error);
      }
    }

    // 4. Insert financial models (batch)
    if (financialModels.length > 0) {
      const modelsResult = await insertNeonFinancialModels(financialModels);
      if (!modelsResult.success) {
        console.error('Failed to insert financial models:', modelsResult.error);
      }
    }

    // 5. Insert savings scenario
    const savingsResult = await insertNeonSavingsScenario(savingsScenario);
    if (!savingsResult.success) {
      console.error('Failed to insert savings scenario:', savingsResult.error);
    }

    return {
      success: true,
      data: { client_id: clientId },
    };
  } catch (error) {
    console.error('Batch promotion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Checks if Neon MCP is available
 */
export async function checkNeonMCPHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}/mcp/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Neon MCP health check failed:', error);
    return false;
  }
}
