/**
 * Neon MCP Client
 *
 * Communicates with Neon database via MCP (Model Context Protocol) endpoint
 * All external database writes MUST go through MCP server (Composio architecture)
 */

import { StampedPromotionPayload, PromotionLog } from '../types/stamped';

/**
 * Neon MCP configuration
 */
const NEON_MCP_CONFIG = {
  endpoint: process.env.NEON_MCP_ENDPOINT || 'http://localhost:3001/neon/insert',
  timeout: 30000, // 30 seconds
  retries: 3,
};

/**
 * MCP request payload structure (HEIR/ORBT compliant)
 */
interface McpRequestPayload {
  tool: string;
  data: any;
  unique_id: string;
  process_id: string;
  orbt_layer: number;
  blueprint_version: string;
}

/**
 * MCP response structure
 */
interface McpResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Neon MCP Client Class
 */
export class NeonMcpClient {
  /**
   * Generate HEIR-compliant unique_id
   */
  private static generateUniqueId(prefix: string): string {
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `HEIR-${timestamp}-${prefix}-${random}`;
  }

  /**
   * Generate HEIR-compliant process_id
   */
  private static generateProcessId(): string {
    const timestamp = Date.now();
    return `PRC-PROMO-${timestamp}`;
  }

  /**
   * Make MCP request with retries
   */
  private static async mcpRequest(
    tool: string,
    data: any,
    uniqueIdPrefix: string
  ): Promise<McpResponse> {
    const payload: McpRequestPayload = {
      tool,
      data,
      unique_id: this.generateUniqueId(uniqueIdPrefix),
      process_id: this.generateProcessId(),
      orbt_layer: 2,
      blueprint_version: '1.0',
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= NEON_MCP_CONFIG.retries; attempt++) {
      try {
        console.log(`[NeonMCP] Attempt ${attempt}/${NEON_MCP_CONFIG.retries} - Tool: ${tool}`);

        const response = await fetch(NEON_MCP_CONFIG.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(NEON_MCP_CONFIG.timeout),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`MCP request failed: ${response.status} - ${errorText}`);
        }

        const result: McpResponse = await response.json();

        if (!result.success) {
          throw new Error(`MCP tool execution failed: ${result.error || 'Unknown error'}`);
        }

        console.log(`[NeonMCP] Success - Tool: ${tool}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`[NeonMCP] Attempt ${attempt} failed:`, error);

        // Wait before retry (exponential backoff)
        if (attempt < NEON_MCP_CONFIG.retries) {
          const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw new Error(
      `MCP request failed after ${NEON_MCP_CONFIG.retries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Insert client data into Neon
   */
  static async insertClient(client: StampedPromotionPayload['client']): Promise<McpResponse> {
    return this.mcpRequest('neon_insert_client', { table: 'clients', record: client }, 'CLIENT');
  }

  /**
   * Insert employees data into Neon (batch)
   */
  static async insertEmployees(
    employees: StampedPromotionPayload['employees']
  ): Promise<McpResponse> {
    return this.mcpRequest(
      'neon_insert_employees',
      { table: 'employees', records: employees },
      'EMPLOYEES'
    );
  }

  /**
   * Insert compliance flags into Neon
   */
  static async insertComplianceFlags(
    complianceFlags: StampedPromotionPayload['compliance_flags']
  ): Promise<McpResponse> {
    return this.mcpRequest(
      'neon_insert_compliance',
      { table: 'compliance_flags', record: complianceFlags },
      'COMPLIANCE'
    );
  }

  /**
   * Insert financial models into Neon
   */
  static async insertFinancialModels(
    financialModels: StampedPromotionPayload['financial_models']
  ): Promise<McpResponse> {
    return this.mcpRequest(
      'neon_insert_financial',
      { table: 'financial_models', record: financialModels },
      'FINANCIAL'
    );
  }

  /**
   * Insert savings scenarios into Neon
   */
  static async insertSavingsScenarios(
    savingsScenarios: StampedPromotionPayload['savings_scenarios']
  ): Promise<McpResponse> {
    return this.mcpRequest(
      'neon_insert_savings',
      { table: 'savings_scenarios', record: savingsScenarios },
      'SAVINGS'
    );
  }

  /**
   * Insert promotion log entry into Neon
   */
  static async insertPromotionLog(promotionLog: PromotionLog): Promise<McpResponse> {
    return this.mcpRequest(
      'neon_insert_promotion_log',
      { table: 'promotion_log', record: promotionLog },
      'PROMO-LOG'
    );
  }

  /**
   * Master insert function: writes entire STAMPED payload to Neon
   * Executes all inserts in sequence, tracking progress
   */
  static async insertStampedPayload(
    payload: StampedPromotionPayload
  ): Promise<{
    success: boolean;
    records_inserted: {
      clients: number;
      employees: number;
      compliance_flags: number;
      financial_models: number;
      savings_scenarios: number;
    };
    errors: string[];
  }> {
    const errors: string[] = [];
    const recordsInserted = {
      clients: 0,
      employees: 0,
      compliance_flags: 0,
      financial_models: 0,
      savings_scenarios: 0,
    };

    try {
      // 1. Insert Client
      console.log('[NeonMCP] Inserting client...');
      await this.insertClient(payload.client);
      recordsInserted.clients = 1;
    } catch (error) {
      const errorMsg = `Failed to insert client: ${(error as Error).message}`;
      console.error('[NeonMCP]', errorMsg);
      errors.push(errorMsg);
    }

    try {
      // 2. Insert Employees
      console.log(`[NeonMCP] Inserting ${payload.employees.length} employees...`);
      await this.insertEmployees(payload.employees);
      recordsInserted.employees = payload.employees.length;
    } catch (error) {
      const errorMsg = `Failed to insert employees: ${(error as Error).message}`;
      console.error('[NeonMCP]', errorMsg);
      errors.push(errorMsg);
    }

    try {
      // 3. Insert Compliance Flags
      console.log('[NeonMCP] Inserting compliance flags...');
      await this.insertComplianceFlags(payload.compliance_flags);
      recordsInserted.compliance_flags = 1;
    } catch (error) {
      const errorMsg = `Failed to insert compliance flags: ${(error as Error).message}`;
      console.error('[NeonMCP]', errorMsg);
      errors.push(errorMsg);
    }

    try {
      // 4. Insert Financial Models
      console.log('[NeonMCP] Inserting financial models...');
      await this.insertFinancialModels(payload.financial_models);
      recordsInserted.financial_models = 1;
    } catch (error) {
      const errorMsg = `Failed to insert financial models: ${(error as Error).message}`;
      console.error('[NeonMCP]', errorMsg);
      errors.push(errorMsg);
    }

    try {
      // 5. Insert Savings Scenarios
      console.log('[NeonMCP] Inserting savings scenarios...');
      await this.insertSavingsScenarios(payload.savings_scenarios);
      recordsInserted.savings_scenarios = 1;
    } catch (error) {
      const errorMsg = `Failed to insert savings scenarios: ${(error as Error).message}`;
      console.error('[NeonMCP]', errorMsg);
      errors.push(errorMsg);
    }

    const success = errors.length === 0;
    console.log('[NeonMCP] Promotion insert complete:', {
      success,
      recordsInserted,
      errorCount: errors.length,
    });

    return {
      success,
      records_inserted: recordsInserted,
      errors,
    };
  }
}
