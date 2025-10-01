/**
 * Promotion Gatekeeper
 * Validates that prospect is ready for promotion to Neon
 *
 * Checks:
 * 1. Factfinder completeness
 * 2. Engine outputs exist (Monte Carlo, Insurance Split, Compliance, Savings)
 * 3. Data integrity
 * 4. Required fields present
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

export interface GatekeeperResult {
  canPromote: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    factfinderComplete: boolean;
    monteCarloExists: boolean;
    insuranceSplitExists: boolean;
    complianceExists: boolean;
    savingsExists: boolean;
    dataIntegrity: boolean;
  };
}

/**
 * Validates prospect is ready for promotion
 */
export async function validateProspectForPromotion(
  prospectId: string
): Promise<GatekeeperResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const result: GatekeeperResult = {
    canPromote: true,
    errors,
    warnings,
    checks: {
      factfinderComplete: false,
      monteCarloExists: false,
      insuranceSplitExists: false,
      complianceExists: false,
      savingsExists: false,
      dataIntegrity: false,
    },
  };

  try {
    // 1. Check Factfinder
    const factfinderDoc = await db.collection('factfinder').doc(prospectId).get();

    if (!factfinderDoc.exists) {
      errors.push('Factfinder document does not exist');
      result.canPromote = false;
      return result;
    }

    const factfinder = factfinderDoc.data();

    // Check factfinder completeness
    if (!factfinder?.validated) {
      errors.push('Factfinder not validated');
      result.canPromote = false;
    }

    if (!factfinder?.company?.name) {
      errors.push('Company name is required');
      result.canPromote = false;
    }

    if (!factfinder?.company?.state) {
      errors.push('Company state is required');
      result.canPromote = false;
    }

    if (!factfinder?.company?.employeeCount || factfinder.company.employeeCount < 1) {
      errors.push('Valid employee count is required');
      result.canPromote = false;
    }

    if (!factfinder?.claims?.totalAnnualCost || factfinder.claims.totalAnnualCost < 0) {
      errors.push('Valid total annual cost is required');
      result.canPromote = false;
    }

    if (errors.length === 0) {
      result.checks.factfinderComplete = true;
    }

    // 2. Check Monte Carlo
    const monteCarloDoc = await db.collection('montecarlo').doc(prospectId).get();

    if (!monteCarloDoc.exists) {
      errors.push('Monte Carlo simulation does not exist');
      result.canPromote = false;
    } else {
      const monteCarlo = monteCarloDoc.data();

      if (!monteCarlo?.percentiles?.p10 || !monteCarlo?.percentiles?.p50 || !monteCarlo?.percentiles?.p90) {
        errors.push('Monte Carlo percentiles incomplete');
        result.canPromote = false;
      } else {
        result.checks.monteCarloExists = true;
      }
    }

    // 3. Check Insurance Split
    const insuranceSplitDoc = await db.collection('insurance_split').doc(prospectId).get();

    if (!insuranceSplitDoc.exists) {
      errors.push('Insurance Split data does not exist');
      result.canPromote = false;
    } else {
      const insuranceSplit = insuranceSplitDoc.data();

      if (!insuranceSplit?.highUtilizers || !insuranceSplit?.standardUtilizers) {
        errors.push('Insurance Split data incomplete');
        result.canPromote = false;
      } else {
        result.checks.insuranceSplitExists = true;
      }
    }

    // 4. Check Compliance
    const complianceDoc = await db.collection('compliance').doc(prospectId).get();

    if (!complianceDoc.exists) {
      errors.push('Compliance requirements do not exist');
      result.canPromote = false;
    } else {
      const compliance = complianceDoc.data();

      if (!compliance?.requirements) {
        errors.push('Compliance requirements incomplete');
        result.canPromote = false;
      } else {
        result.checks.complianceExists = true;
      }
    }

    // 5. Check Savings
    const savingsDoc = await db.collection('savings_scenarios').doc(prospectId).get();

    if (!savingsDoc.exists) {
      errors.push('Savings scenarios do not exist');
      result.canPromote = false;
    } else {
      const savings = savingsDoc.data();

      if (!savings?.actual || !savings?.withSavings || !savings?.withoutSavings) {
        errors.push('Savings scenarios incomplete');
        result.canPromote = false;
      } else {
        result.checks.savingsExists = true;
      }
    }

    // 6. Data Integrity Checks
    if (result.checks.factfinderComplete && result.checks.monteCarloExists) {
      // Check that total annual cost matches between factfinder and monte carlo baseline
      const totalAnnualCost = factfinder.claims.totalAnnualCost;
      const monteCarloBaseline = monteCarloDoc.data()?.baseline;

      if (Math.abs(totalAnnualCost - monteCarloBaseline) > 1) {
        warnings.push('Total annual cost mismatch between factfinder and Monte Carlo');
      }
    }

    if (
      result.checks.factfinderComplete &&
      result.checks.insuranceSplitExists
    ) {
      // Check employee count matches
      const employeeCount = factfinder.company.employeeCount;
      const insuranceSplitTotal =
        (insuranceSplitDoc.data()?.highUtilizers?.count || 0) +
        (insuranceSplitDoc.data()?.standardUtilizers?.count || 0);

      if (employeeCount !== insuranceSplitTotal) {
        warnings.push('Employee count mismatch between factfinder and insurance split');
      }
    }

    // All checks passed
    if (
      result.checks.factfinderComplete &&
      result.checks.monteCarloExists &&
      result.checks.insuranceSplitExists &&
      result.checks.complianceExists &&
      result.checks.savingsExists
    ) {
      result.checks.dataIntegrity = true;
    }

    // Final determination
    result.canPromote = errors.length === 0;

    return result;
  } catch (error) {
    console.error('Gatekeeper validation error:', error);
    errors.push(`Validation error: ${error}`);
    result.canPromote = false;
    return result;
  }
}

/**
 * Checks if prospect has already been promoted
 */
export async function isAlreadyPromoted(prospectId: string): Promise<boolean> {
  try {
    const factfinderDoc = await db.collection('factfinder').doc(prospectId).get();

    if (!factfinderDoc.exists) {
      return false;
    }

    const data = factfinderDoc.data();
    return data?.promotion_status === 'complete' && !!data?.neon_client_id;
  } catch (error) {
    console.error('Error checking promotion status:', error);
    return false;
  }
}

/**
 * Marks factfinder as promoted
 */
export async function markAsPromoted(
  prospectId: string,
  neonClientId: string
): Promise<void> {
  await db
    .collection('factfinder')
    .doc(prospectId)
    .update({
      promotion_status: 'complete',
      neon_client_id: neonClientId,
      promoted_at: Date.now(),
    });
}

/**
 * Marks factfinder promotion as failed
 */
export async function markPromotionFailed(
  prospectId: string,
  errorMessage: string
): Promise<void> {
  await db
    .collection('factfinder')
    .doc(prospectId)
    .update({
      promotion_status: 'failed',
      promotion_error: errorMessage,
      promotion_failed_at: Date.now(),
    });
}

/**
 * Gets all required data for promotion
 */
export async function fetchPromotionData(prospectId: string) {
  const [factfinder, monteCarlo, insuranceSplit, compliance, savings] = await Promise.all([
    db.collection('factfinder').doc(prospectId).get(),
    db.collection('montecarlo').doc(prospectId).get(),
    db.collection('insurance_split').doc(prospectId).get(),
    db.collection('compliance').doc(prospectId).get(),
    db.collection('savings_scenarios').doc(prospectId).get(),
  ]);

  return {
    factfinder: factfinder.exists ? factfinder.data() : null,
    monteCarlo: monteCarlo.exists ? monteCarlo.data() : null,
    insuranceSplit: insuranceSplit.exists ? insuranceSplit.data() : null,
    compliance: compliance.exists ? compliance.data() : null,
    savings: savings.exists ? savings.data() : null,
  };
}
