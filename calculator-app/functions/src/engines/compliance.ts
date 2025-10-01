import type { ComplianceData, ComplianceRequirement } from '@/types';
import complianceRulesData from '../data/complianceRules.json';

export interface ComplianceInput {
  employeeCount: number;
  state: string;
}

interface ComplianceRule {
  threshold: number;
  requirement: string;
  description: string;
  required: boolean;
  maxThreshold?: number;
  deadline?: string;
  category?: string;
}

/**
 * Enhanced Compliance Matcher Engine
 * Uses static JSON dataset to match requirements based on employee count and state
 */
export function matchComplianceRequirements(
  input: ComplianceInput
): Omit<ComplianceData, 'prospect_id' | 'timestamp'> {
  const { employeeCount, state } = input;

  const federal = matchFederalRequirements(employeeCount);
  const stateReqs = matchStateRequirements(employeeCount, state);
  const local = matchLocalRequirements(employeeCount, state);

  return {
    employeeCount,
    state,
    requirements: {
      federal,
      state: stateReqs,
      local,
    },
  };
}

/**
 * Match federal requirements from JSON dataset
 */
function matchFederalRequirements(
  employeeCount: number
): ComplianceRequirement[] {
  const rules = complianceRulesData.federal as ComplianceRule[];

  return rules
    .filter((rule) => employeeCount >= rule.threshold)
    .map((rule) => ({
      name: rule.requirement,
      description: rule.description,
      required: rule.required,
      deadline: rule.deadline,
    }));
}

/**
 * Match state-specific requirements from JSON dataset
 */
function matchStateRequirements(
  employeeCount: number,
  state: string
): ComplianceRequirement[] {
  const stateUpper = state.toUpperCase();
  const stateRules = (complianceRulesData.state as any)[stateUpper] as
    | ComplianceRule[]
    | undefined;

  if (!stateRules) {
    // Return generic state requirements if state not in dataset
    return [
      {
        name: 'State Tax Filings',
        description: `${state} state tax filings for health benefit plans`,
        required: true,
        deadline: 'Quarterly',
      },
    ];
  }

  return stateRules
    .filter((rule) => {
      // Check minimum threshold
      if (employeeCount < rule.threshold) return false;

      // Check maximum threshold if specified
      if (rule.maxThreshold && employeeCount > rule.maxThreshold) return false;

      return true;
    })
    .map((rule) => ({
      name: rule.requirement,
      description: rule.description,
      required: rule.required,
      deadline: rule.deadline,
    }));
}

/**
 * Match local requirements from JSON dataset
 */
function matchLocalRequirements(
  employeeCount: number,
  state: string
): ComplianceRequirement[] {
  const requirements: ComplianceRequirement[] = [];

  // Check if state has local rules
  Object.entries(complianceRulesData.local).forEach(([localId, localData]) => {
    const local = localData as any;

    if (local.state === state) {
      const matchedReqs = (local.requirements as ComplianceRule[])
        .filter((rule) => employeeCount >= rule.threshold)
        .map((rule) => ({
          name: `${local.name}: ${rule.requirement}`,
          description: rule.description,
          required: rule.required,
        }));

      requirements.push(...matchedReqs);
    }
  });

  return requirements;
}

// Remove old placeholder functions - now using JSON dataset

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use matchFederalRequirements instead
 */
function getFederalRequirements(employeeCount: number): ComplianceRequirement[] {
  const requirements: ComplianceRequirement[] = [];

  // COBRA (20+ employees)
  if (employeeCount >= 20) {
    requirements.push({
      name: 'COBRA',
      description: 'Consolidated Omnibus Budget Reconciliation Act - continuation of health coverage',
      required: true,
    });
  }

  // ACA (50+ employees)
  if (employeeCount >= 50) {
    requirements.push({
      name: 'ACA Employer Mandate',
      description: 'Affordable Care Act - must offer health insurance to full-time employees',
      required: true,
    });
    requirements.push({
      name: 'ACA Reporting (Form 1095-C)',
      description: 'File forms 1094-C and 1095-C with the IRS',
      required: true,
      deadline: 'March 1 (paper) / March 31 (electronic)',
    });
  }

  // ERISA (all employer-sponsored plans)
  if (employeeCount >= 1) {
    requirements.push({
      name: 'ERISA',
      description: 'Employee Retirement Income Security Act - governs employee benefit plans',
      required: true,
    });
    requirements.push({
      name: 'Form 5500',
      description: 'Annual filing for benefit plans (due 7 months after plan year ends)',
      required: true,
      deadline: 'July 31 (for calendar year plans)',
    });
  }

  // HIPAA (all sizes)
  requirements.push({
    name: 'HIPAA Privacy & Security',
    description: 'Health Insurance Portability and Accountability Act - protect health information',
    required: true,
  });

  return requirements;
}

/**
 * State-specific compliance requirements
 * Note: This is a simplified version. In production, this would be much more comprehensive.
 */
function getStateRequirements(employeeCount: number, state: string): ComplianceRequirement[] {
  const requirements: ComplianceRequirement[] = [];
  const stateUpper = state.toUpperCase();

  // California-specific
  if (stateUpper === 'CA') {
    if (employeeCount >= 5) {
      requirements.push({
        name: 'CA Health Insurance Mandate',
        description: 'California requires employers with 5+ employees to offer health insurance',
        required: true,
      });
    }
    requirements.push({
      name: 'Cal-COBRA',
      description: 'California continuation coverage (2-19 employees)',
      required: employeeCount >= 2 && employeeCount < 20,
    });
  }

  // New York-specific
  if (stateUpper === 'NY') {
    requirements.push({
      name: 'NY Paid Family Leave',
      description: 'Employers must provide paid family leave insurance',
      required: true,
    });
    requirements.push({
      name: 'NY Health Insurance Continuation',
      description: 'Mini-COBRA for employers with fewer than 20 employees',
      required: employeeCount < 20,
    });
  }

  // Massachusetts-specific
  if (stateUpper === 'MA') {
    if (employeeCount >= 11) {
      requirements.push({
        name: 'MA Health Care Reform',
        description: 'Employers with 11+ employees must offer health insurance',
        required: true,
      });
    }
  }

  // Generic state requirements (apply to all states)
  requirements.push({
    name: 'State Tax Filings',
    description: `${state} state tax filings for health benefit plans`,
    required: true,
    deadline: 'Quarterly',
  });

  return requirements;
}

/**
 * Local compliance requirements
 * These vary by city/county
 */
function getLocalRequirements(employeeCount: number, state: string): ComplianceRequirement[] {
  const requirements: ComplianceRequirement[] = [];
  const stateUpper = state.toUpperCase();

  // San Francisco Health Care Security Ordinance
  if (stateUpper === 'CA') {
    requirements.push({
      name: 'SF Health Care Security Ordinance',
      description: 'San Francisco employers must contribute to employee health coverage',
      required: false, // Only if business is in SF
    });
  }

  // NYC requirements
  if (stateUpper === 'NY') {
    requirements.push({
      name: 'NYC Paid Safe and Sick Leave',
      description: 'New York City employers must provide paid safe and sick leave',
      required: false, // Only if business is in NYC
    });
  }

  return requirements;
}
