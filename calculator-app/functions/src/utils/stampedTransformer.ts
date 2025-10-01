/**
 * STAMPED Transformer Utilities
 *
 * Transforms Firebase SPVPET schema data to Neon STAMPED schema
 * Following the mapping configuration in spvpet_to_stamped.json
 */

import {
  Client,
  Employee,
  ComplianceFlag,
  ComplianceRequirement,
  FinancialModel,
  SavingsScenario,
  StampedPromotionPayload,
} from '../types/stamped';

/**
 * Transformation utility functions
 */
export class StampedTransformer {
  /**
   * Format EIN with hyphen (XX-XXXXXXX)
   */
  static formatEIN(ein: string): string {
    const cleaned = ein.replace(/[^0-9]/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 2)}-${cleaned.substring(2)}`;
    }
    return ein;
  }

  /**
   * Parse currency string to decimal number
   */
  static parseCurrency(value: string | number): number {
    if (typeof value === 'number') return value;
    const cleaned = value.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parse date to ISO 8601 string
   */
  static parseDate(value: string | number | Date): string {
    if (typeof value === 'string') return new Date(value).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    return value.toISOString();
  }

  /**
   * Convert array to JSONB-compatible structure
   */
  static toJsonArray<T>(arr: T[]): T[] {
    return Array.isArray(arr) ? arr : [];
  }

  /**
   * Transform factfinder data to Client
   */
  static transformToClient(factfinder: any, prospectId: string): Client {
    return {
      client_id: prospectId,
      company_name: factfinder.company?.name || '',
      company_ein: this.formatEIN(factfinder.company?.ein || ''),
      industry_classification: factfinder.company?.industry,
      employee_count: factfinder.company?.employeeCount || 0,
      primary_state: (factfinder.company?.state || '').toUpperCase(),
      renewal_date: factfinder.company?.renewalDate
        ? this.parseDate(factfinder.company.renewalDate)
        : undefined,
      promotion_timestamp: Date.now(),
      timestamp_last_touched: Date.now(),
      section_number: 1,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Transform census data to Employees array
   */
  static transformToEmployees(
    factfinder: any,
    prospectId: string
  ): Employee[] {
    const census = factfinder.census?.employees || [];
    const timestamp = Date.now();

    return census.map((emp: any) => ({
      employee_id: emp.id || `emp_${Math.random().toString(36).substr(2, 9)}`,
      client_id: prospectId,
      age: emp.age || 0,
      gender: emp.gender ? emp.gender.toUpperCase() : undefined,
      dependent_count: emp.dependents || 0,
      coverage_tier: emp.coverage_tier || 'employee',
      annual_claims_cost: emp.annual_claims
        ? this.parseCurrency(emp.annual_claims)
        : undefined,
      timestamp_last_touched: timestamp,
      section_number: 2,
      created_at: new Date().toISOString(),
    }));
  }

  /**
   * Transform compliance data to ComplianceFlag
   */
  static transformToComplianceFlags(
    compliance: any,
    prospectId: string
  ): ComplianceFlag {
    const transformRequirement = (req: any): ComplianceRequirement => ({
      requirement_code: req.code || req.id || '',
      requirement_name: req.name || req.requirement || '',
      applies: req.applies !== false,
      threshold: req.threshold,
      notes: req.notes,
    });

    return {
      compliance_flag_id: `cf_${prospectId}`,
      client_id: prospectId,
      federal_requirements: this.toJsonArray(
        (compliance.matched?.federal || []).map(transformRequirement)
      ),
      state_requirements: this.toJsonArray(
        (compliance.matched?.state || []).map(transformRequirement)
      ),
      local_requirements: this.toJsonArray(
        (compliance.matched?.local || []).map(transformRequirement)
      ),
      aca_applicable: compliance.aca_applicable !== false,
      erisa_plan: compliance.erisa_plan !== false,
      compliance_check_date: compliance.timestamp || Date.now(),
      timestamp_last_touched: Date.now(),
      section_number: 3,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Transform Monte Carlo and Insurance Split data to FinancialModel
   */
  static transformToFinancialModel(
    montecarlo: any,
    insuranceSplit: any,
    prospectId: string
  ): FinancialModel {
    return {
      financial_model_id: `fm_${prospectId}`,
      client_id: prospectId,
      mc_p50_cost: this.parseCurrency(montecarlo.summary?.p50 || 0),
      mc_p95_cost: this.parseCurrency(montecarlo.summary?.p95 || 0),
      mc_iterations: montecarlo.iterations || 10000,
      mc_volatility_factor: montecarlo.volatility || 0.2,
      high_cost_utilizer_count: insuranceSplit.high_utilizers?.count || 0,
      high_cost_utilizers_total: this.parseCurrency(
        insuranceSplit.high_utilizers?.cost_total || 0
      ),
      low_cost_utilizer_count: insuranceSplit.low_utilizers?.count || 0,
      low_cost_utilizers_total: this.parseCurrency(
        insuranceSplit.low_utilizers?.cost_total || 0
      ),
      model_run_timestamp: montecarlo.timestamp || Date.now(),
      timestamp_last_touched: Date.now(),
      section_number: 4,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Transform savings data to SavingsScenario
   */
  static transformToSavingsScenario(
    savings: any,
    prospectId: string
  ): SavingsScenario {
    return {
      savings_scenario_id: `ss_${prospectId}`,
      client_id: prospectId,
      retro_total_savings: this.parseCurrency(savings.retro?.total_savings || 0),
      retro_percent_saved: savings.retro?.percent_saved || 0,
      forward_savings_year1: this.parseCurrency(
        savings.forward?.projected_savings_year1 || 0
      ),
      forward_savings_year3: this.parseCurrency(
        savings.forward?.projected_savings_year3 || 0
      ),
      forward_savings_year5: this.parseCurrency(
        savings.forward?.projected_savings_year5 || 0
      ),
      trend_factor: savings.assumptions?.trend_factor,
      calculation_timestamp: savings.timestamp || Date.now(),
      timestamp_last_touched: Date.now(),
      section_number: 5,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Master transformation function: Firebase → Neon
   * Aggregates all individual transformations into complete STAMPED payload
   */
  static async transformFirebaseToNeon(
    prospectId: string,
    firebaseData: {
      factfinder: any;
      montecarlo: any;
      insuranceSplit: any;
      compliance: any;
      savings: any;
    },
    blueprintVersionHash: string
  ): Promise<StampedPromotionPayload> {
    return {
      client: this.transformToClient(firebaseData.factfinder, prospectId),
      employees: this.transformToEmployees(firebaseData.factfinder, prospectId),
      compliance_flags: this.transformToComplianceFlags(
        firebaseData.compliance,
        prospectId
      ),
      financial_models: this.transformToFinancialModel(
        firebaseData.montecarlo,
        firebaseData.insuranceSplit,
        prospectId
      ),
      savings_scenarios: this.transformToSavingsScenario(
        firebaseData.savings,
        prospectId
      ),
      promotion_metadata: {
        prospect_id: prospectId,
        promotion_timestamp: Date.now(),
        schema_version: '1.0.0',
        blueprint_version_hash: blueprintVersionHash,
      },
    };
  }
}
