/**
 * Gatekeeper Validator
 *
 * Validates that all required conditions are met before promoting prospect → client
 * Ensures data completeness and engine execution success before Neon promotion
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    factfinder_complete: boolean;
    montecarlo_exists: boolean;
    insurance_split_exists: boolean;
    compliance_matched: boolean;
    savings_calculated: boolean;
    timestamp: number;
  };
}

/**
 * Gatekeeper Validator Class
 */
export class GatekeeperValidator {
  /**
   * Validate factfinder completeness
   */
  static validateFactfinder(factfinder: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check validated flag
    if (!factfinder.validated) {
      errors.push('Factfinder is not validated (validated=false)');
    }

    // Check company data
    if (!factfinder.company) {
      errors.push('Missing company data');
    } else {
      if (!factfinder.company.name) errors.push('Missing company.name');
      if (!factfinder.company.ein) errors.push('Missing company.ein');
      if (!factfinder.company.employeeCount) errors.push('Missing company.employeeCount');
      if (!factfinder.company.state) errors.push('Missing company.state');
    }

    // Check claims data
    if (!factfinder.claims) {
      errors.push('Missing claims data');
    } else {
      if (!factfinder.claims.totalAnnualCost) {
        errors.push('Missing claims.totalAnnualCost');
      }
    }

    // Check census data (optional but recommended)
    if (factfinder.census?.employees && factfinder.census.employees.length === 0) {
      errors.push('Census exists but has no employees');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Monte Carlo simulation output
   */
  static validateMonteCarlo(montecarlo: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!montecarlo) {
      errors.push('Monte Carlo simulation data not found');
      return { valid: false, errors };
    }

    // Check summary statistics
    if (!montecarlo.summary) {
      errors.push('Missing Monte Carlo summary');
    } else {
      if (!montecarlo.summary.p50 && montecarlo.summary.p50 !== 0) {
        errors.push('Missing Monte Carlo p50 value');
      }
      if (!montecarlo.summary.p95 && montecarlo.summary.p95 !== 0) {
        errors.push('Missing Monte Carlo p95 value');
      }
    }

    // Check iterations
    if (!montecarlo.iterations || montecarlo.iterations < 1000) {
      errors.push('Monte Carlo iterations too low (minimum 1000 required)');
    }

    // Check timestamp (must be recent)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!montecarlo.timestamp || montecarlo.timestamp < oneDayAgo) {
      errors.push('Monte Carlo data is stale (older than 24 hours)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Insurance Split calculation (10/85 rule)
   */
  static validateInsuranceSplit(insuranceSplit: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!insuranceSplit) {
      errors.push('Insurance split data not found');
      return { valid: false, errors };
    }

    // Check high utilizers
    if (!insuranceSplit.high_utilizers) {
      errors.push('Missing high_utilizers data');
    } else {
      if (!insuranceSplit.high_utilizers.count && insuranceSplit.high_utilizers.count !== 0) {
        errors.push('Missing high_utilizers.count');
      }
      if (
        !insuranceSplit.high_utilizers.cost_total &&
        insuranceSplit.high_utilizers.cost_total !== 0
      ) {
        errors.push('Missing high_utilizers.cost_total');
      }
    }

    // Check low utilizers
    if (!insuranceSplit.low_utilizers) {
      errors.push('Missing low_utilizers data');
    } else {
      if (!insuranceSplit.low_utilizers.count && insuranceSplit.low_utilizers.count !== 0) {
        errors.push('Missing low_utilizers.count');
      }
      if (
        !insuranceSplit.low_utilizers.cost_total &&
        insuranceSplit.low_utilizers.cost_total !== 0
      ) {
        errors.push('Missing low_utilizers.cost_total');
      }
    }

    // Check timestamp
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!insuranceSplit.timestamp || insuranceSplit.timestamp < oneDayAgo) {
      errors.push('Insurance split data is stale (older than 24 hours)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Compliance matching
   */
  static validateCompliance(compliance: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!compliance) {
      errors.push('Compliance data not found');
      return { valid: false, errors };
    }

    // Check matched requirements
    if (!compliance.matched) {
      errors.push('Missing compliance.matched object');
    } else {
      // At minimum, federal requirements should exist
      if (!compliance.matched.federal || !Array.isArray(compliance.matched.federal)) {
        errors.push('Missing or invalid compliance.matched.federal array');
      }

      // State requirements should exist
      if (!compliance.matched.state || !Array.isArray(compliance.matched.state)) {
        errors.push('Missing or invalid compliance.matched.state array');
      }
    }

    // Check ACA flag
    if (typeof compliance.aca_applicable !== 'boolean') {
      errors.push('Missing or invalid compliance.aca_applicable boolean');
    }

    // Check ERISA flag
    if (typeof compliance.erisa_plan !== 'boolean') {
      errors.push('Missing or invalid compliance.erisa_plan boolean');
    }

    // Check timestamp
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!compliance.timestamp || compliance.timestamp < oneDayAgo) {
      errors.push('Compliance data is stale (older than 24 hours)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Savings scenarios
   */
  static validateSavings(savings: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!savings) {
      errors.push('Savings scenarios data not found');
      return { valid: false, errors };
    }

    // Check retro savings
    if (!savings.retro) {
      errors.push('Missing savings.retro data');
    } else {
      if (!savings.retro.total_savings && savings.retro.total_savings !== 0) {
        errors.push('Missing retro.total_savings');
      }
      if (!savings.retro.percent_saved && savings.retro.percent_saved !== 0) {
        errors.push('Missing retro.percent_saved');
      }
    }

    // Check forward projections
    if (!savings.forward) {
      errors.push('Missing savings.forward data');
    } else {
      if (
        !savings.forward.projected_savings_year1 &&
        savings.forward.projected_savings_year1 !== 0
      ) {
        errors.push('Missing forward.projected_savings_year1');
      }
      if (
        !savings.forward.projected_savings_year3 &&
        savings.forward.projected_savings_year3 !== 0
      ) {
        errors.push('Missing forward.projected_savings_year3');
      }
      if (
        !savings.forward.projected_savings_year5 &&
        savings.forward.projected_savings_year5 !== 0
      ) {
        errors.push('Missing forward.projected_savings_year5');
      }
    }

    // Check timestamp
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!savings.timestamp || savings.timestamp < oneDayAgo) {
      errors.push('Savings data is stale (older than 24 hours)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Master validation function: checks all requirements before promotion
   */
  static async validatePromotion(
    prospectId: string,
    firebaseData: {
      factfinder: any;
      montecarlo: any;
      insuranceSplit: any;
      compliance: any;
      savings: any;
    }
  ): Promise<ValidationResult> {
    const allErrors: string[] = [];
    const warnings: string[] = [];

    // Validate each component
    const factfinderResult = this.validateFactfinder(firebaseData.factfinder);
    const montecarloResult = this.validateMonteCarlo(firebaseData.montecarlo);
    const insuranceSplitResult = this.validateInsuranceSplit(firebaseData.insuranceSplit);
    const complianceResult = this.validateCompliance(firebaseData.compliance);
    const savingsResult = this.validateSavings(firebaseData.savings);

    // Aggregate errors
    allErrors.push(...factfinderResult.errors);
    allErrors.push(...montecarloResult.errors);
    allErrors.push(...insuranceSplitResult.errors);
    allErrors.push(...complianceResult.errors);
    allErrors.push(...savingsResult.errors);

    // Check for warnings (non-blocking issues)
    if (!firebaseData.factfinder.census || firebaseData.factfinder.census.employees?.length === 0) {
      warnings.push('No employee census data provided (optional but recommended)');
    }

    if (!firebaseData.factfinder.company.renewalDate) {
      warnings.push('No renewal date specified (optional)');
    }

    // Build validation result
    const result: ValidationResult = {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings,
      metadata: {
        factfinder_complete: factfinderResult.valid,
        montecarlo_exists: montecarloResult.valid,
        insurance_split_exists: insuranceSplitResult.valid,
        compliance_matched: complianceResult.valid,
        savings_calculated: savingsResult.valid,
        timestamp: Date.now(),
      },
    };

    console.log(`[Gatekeeper] Validation for prospect ${prospectId}:`, {
      isValid: result.isValid,
      errorCount: allErrors.length,
      warningCount: warnings.length,
    });

    return result;
  }
}
