/**
 * STAMPED Schema TypeScript Definitions
 *
 * Type definitions for Neon database tables following STAMPED doctrine
 * S = Section, T = Table, A = Attributes, M = Metadata, P = Permissions, E = Events, D = Data
 */

/**
 * Base interface for all STAMPED tables with doctrine compliance
 */
export interface StampedBase {
  timestamp_last_touched: number;
  section_number: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Clients Table - Company-level data
 * Section 1: Core client information
 */
export interface Client extends StampedBase {
  client_id: string;
  company_name: string;
  company_ein: string;
  industry_classification?: string;
  employee_count: number;
  primary_state: string;
  renewal_date?: string;
  promotion_timestamp: number;
}

/**
 * Employees Table - Census-level employee data
 * Section 2: Individual employee records
 */
export interface Employee extends StampedBase {
  employee_id: string;
  client_id: string;
  age: number;
  gender?: string;
  dependent_count: number;
  coverage_tier: string;
  annual_claims_cost?: number;
}

/**
 * Compliance Flags Table - Regulatory requirements
 * Section 3: Federal, state, and local compliance tracking
 */
export interface ComplianceFlag extends StampedBase {
  compliance_flag_id: string;
  client_id: string;
  federal_requirements: ComplianceRequirement[];
  state_requirements: ComplianceRequirement[];
  local_requirements?: ComplianceRequirement[];
  aca_applicable: boolean;
  erisa_plan: boolean;
  compliance_check_date: number;
}

/**
 * Individual compliance requirement structure
 */
export interface ComplianceRequirement {
  requirement_code: string;
  requirement_name: string;
  applies: boolean;
  threshold?: number;
  notes?: string;
}

/**
 * Financial Models Table - Monte Carlo and insurance split outputs
 * Section 4: Actuarial and financial modeling results
 */
export interface FinancialModel extends StampedBase {
  financial_model_id: string;
  client_id: string;
  mc_p50_cost: number;
  mc_p95_cost: number;
  mc_iterations: number;
  mc_volatility_factor: number;
  high_cost_utilizer_count: number;
  high_cost_utilizers_total: number;
  low_cost_utilizer_count: number;
  low_cost_utilizers_total: number;
  model_run_timestamp: number;
}

/**
 * Savings Scenarios Table - Retro and forward savings calculations
 * Section 5: Savings projections and historical analysis
 */
export interface SavingsScenario extends StampedBase {
  savings_scenario_id: string;
  client_id: string;
  retro_total_savings: number;
  retro_percent_saved: number;
  forward_savings_year1: number;
  forward_savings_year3: number;
  forward_savings_year5: number;
  trend_factor?: number;
  calculation_timestamp: number;
}

/**
 * Promotion Log Table - Audit trail for Firebase → Neon promotions
 * Special audit table (not part of numbered sections)
 */
export interface PromotionLog {
  promotion_id: string;
  prospect_id: string;
  client_id: string;
  promotion_timestamp: number;
  agent_execution_signature: string;
  schema_version: string;
  blueprint_version_hash: string;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
  error_message?: string;
  records_inserted?: {
    clients?: number;
    employees?: number;
    compliance_flags?: number;
    financial_models?: number;
    savings_scenarios?: number;
  };
  created_at: string;
}

/**
 * Complete STAMPED promotion payload
 * Aggregates all data required for a full promotion from Firebase → Neon
 */
export interface StampedPromotionPayload {
  client: Client;
  employees: Employee[];
  compliance_flags: ComplianceFlag;
  financial_models: FinancialModel;
  savings_scenarios: SavingsScenario;
  promotion_metadata: {
    prospect_id: string;
    promotion_timestamp: number;
    schema_version: string;
    blueprint_version_hash: string;
  };
}
