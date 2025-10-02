/**
 * Zod Schemas for Firestore Collections
 * Validates all data before saving to Firestore
 * Ensures schema consistency across Builder.io edits
 */

import { z } from 'zod';

// ============================================================================
// FACTFINDER SCHEMA
// ============================================================================

export const FactfinderSchema = z.object({
  // Prospect metadata
  prospect_id: z.string().min(1),
  validated: z.boolean().default(false),
  timestamp: z.number().optional(),

  // Company information
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    employeeCount: z.number().min(1, 'Employee count must be at least 1'),
    state: z.string().length(2, 'State must be 2-letter code (e.g., PA)'),
    industry: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
    contactPhone: z.string().optional(),
  }),

  // Current insurance details
  insurance: z.object({
    currentCarrier: z.string().optional(),
    renewalDate: z.string().optional(), // ISO date string
    participationRate: z.number().min(0).max(100).optional(),
    fundingType: z.enum(['fully_insured', 'self_funded', 'level_funded']).optional(),
  }),

  // Claims data
  claims: z.object({
    totalAnnualCost: z.number().min(0, 'Total annual cost must be positive'),
    claimsHistory: z
      .array(
        z.object({
          year: z.number(),
          amount: z.number(),
        })
      )
      .optional(),
  }),

  // Plan details
  plans: z
    .array(
      z.object({
        type: z.enum(['medical', 'dental', 'vision', 'life', 'disability']),
        carrier: z.string().optional(),
        monthlyCost: z.number().optional(),
        deductible: z.number().optional(),
        oopMax: z.number().optional(),
      })
    )
    .optional(),
});

export type FactfinderData = z.infer<typeof FactfinderSchema>;

// ============================================================================
// MONTE CARLO SCHEMA
// ============================================================================

export const MonteCarloSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  baseline: z.number(),
  volatility: z.number(),
  simulations: z.number(),

  percentiles: z.object({
    p10: z.number(),
    p50: z.number(),
    p90: z.number(),
  }),

  summary: z
    .object({
      min: z.number(),
      max: z.number(),
      mean: z.number(),
      stdDev: z.number(),
      p95: z.number().optional(),
      p99: z.number().optional(),
    })
    .optional(),

  results: z
    .array(
      z.object({
        run: z.number(),
        projectedCost: z.number(),
      })
    )
    .optional(),
});

export type MonteCarloData = z.infer<typeof MonteCarloSchema>;

// ============================================================================
// INSURANCE SPLIT SCHEMA (10/85 Rule)
// ============================================================================

export const InsuranceSplitSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  totalEmployees: z.number(),
  totalAnnualCost: z.number(),

  highUtilizers: z.object({
    count: z.number(),
    costTotal: z.number(),
    avgPerEmployee: z.number(),
    percentageOfEmployees: z.number(),
    percentageOfCost: z.number(),
  }),

  standardUtilizers: z.object({
    count: z.number(),
    costTotal: z.number(),
    avgPerEmployee: z.number(),
    percentageOfEmployees: z.number(),
    percentageOfCost: z.number(),
  }),

  costMultiplier: z.number().optional(),
});

export type InsuranceSplitData = z.infer<typeof InsuranceSplitSchema>;

// ============================================================================
// COMPLIANCE SCHEMA
// ============================================================================

export const ComplianceRequirementSchema = z.object({
  name: z.string(),
  description: z.string(),
  required: z.boolean(),
  deadline: z.string().optional(),
  category: z.string().optional(),
  threshold: z.number().optional(),
  maxThreshold: z.number().optional(),
});

export const ComplianceSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  employeeCount: z.number(),
  state: z.string(),

  requirements: z.object({
    federal: z.array(ComplianceRequirementSchema),
    state: z.array(ComplianceRequirementSchema),
    local: z.array(ComplianceRequirementSchema),
  }),
});

export type ComplianceRequirement = z.infer<typeof ComplianceRequirementSchema>;
export type ComplianceData = z.infer<typeof ComplianceSchema>;

// ============================================================================
// SAVINGS VEHICLE SCHEMA
// ============================================================================

export const SavingsScenarioSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  actual: z.number(),
  withSavings: z.number(),
  withoutSavings: z.number(),

  scenarios: z.object({
    retro: z.object({
      description: z.string(),
      impact: z.number(),
    }),
    forward: z.object({
      description: z.string(),
      impact: z.number(),
    }),
  }),

  // Enhanced fields
  actualClaims: z.number().optional(),
  withSavingsAmount: z.number().optional(),
  withoutSavingsAmount: z.number().optional(),
  savingsAmount: z.number().optional(),
  costIncrease: z.number().optional(),
  savingsPercentage: z.number().optional(),
  increasePercentage: z.number().optional(),
});

export type SavingsScenarioData = z.infer<typeof SavingsScenarioSchema>;

// ============================================================================
// SNIPER MARKETING SCHEMA
// ============================================================================

export const SniperMarketingSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  narratives: z.object({
    risk: z.string(),
    savings: z.string(),
    compliance: z.string(),
    strategy: z.string(),
  }),

  actionSteps: z.array(z.string()),

  cta: z
    .object({
      title: z.string(),
      description: z.string(),
      buttonText: z.string(),
      buttonUrl: z.string().optional(),
    })
    .optional(),
});

export type SniperMarketingData = z.infer<typeof SniperMarketingSchema>;

// ============================================================================
// PRESENTATION SCHEMA
// ============================================================================

export const PresentationSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  dashboardUrl: z.string(),
  generatedAt: z.number(),

  sections: z.object({
    factfinder: z.boolean(),
    monteCarlo: z.boolean(),
    compliance: z.boolean(),
    sniperMarketing: z.boolean(),
  }),
});

export type PresentationData = z.infer<typeof PresentationSchema>;

// ============================================================================
// PDF METADATA SCHEMA
// ============================================================================

export const PdfMetadataSchema = z.object({
  prospect_id: z.string(),
  timestamp: z.number(),

  downloadUrl: z.string(),
  storagePath: z.string(),
  generatedAt: z.number(),
  fileSize: z.number(),
  generated_by: z.string().optional(),
});

export type PdfMetadataData = z.infer<typeof PdfMetadataSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates Factfinder data before saving to Firestore
 * @throws ZodError if validation fails
 */
export function validateFactfinder(data: unknown): FactfinderData {
  return FactfinderSchema.parse(data);
}

/**
 * Validates Factfinder data and returns errors instead of throwing
 */
export function validateFactfinderSafe(data: unknown) {
  return FactfinderSchema.safeParse(data);
}

/**
 * Validates Monte Carlo data
 */
export function validateMonteCarlo(data: unknown): MonteCarloData {
  return MonteCarloSchema.parse(data);
}

/**
 * Validates Insurance Split data
 */
export function validateInsuranceSplit(data: unknown): InsuranceSplitData {
  return InsuranceSplitSchema.parse(data);
}

/**
 * Validates Compliance data
 */
export function validateCompliance(data: unknown): ComplianceData {
  return ComplianceSchema.parse(data);
}

/**
 * Validates Savings Scenario data
 */
export function validateSavingsScenario(data: unknown): SavingsScenarioData {
  return SavingsScenarioSchema.parse(data);
}

/**
 * Validates Sniper Marketing data
 */
export function validateSniperMarketing(data: unknown): SniperMarketingData {
  return SniperMarketingSchema.parse(data);
}

// ============================================================================
// BUILDER.IO PROP SCHEMAS
// ============================================================================

/**
 * Schema for Builder.io customizable props
 * These are PRESENTATION ONLY - no business logic
 */
export const BuilderPropsSchema = z.object({
  // Color customization
  colors: z
    .object({
      primary: z.string().default('#3b82f6'),
      accent: z.string().default('#8b5cf6'),
      success: z.string().default('#10b981'),
      danger: z.string().default('#ef4444'),
      ctaGradient: z.string().default('linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
    })
    .optional(),

  // Text customization
  text: z
    .object({
      mainTitle: z.string().default('IMO Calculator'),
      subtitle: z.string().optional(),
      ctaLabel: z.string().default('Get Started'),
      ctaDescription: z.string().optional(),
    })
    .optional(),

  // Layout customization
  layout: z
    .object({
      mode: z.enum(['grid', 'stacked']).default('grid'),
      showSidebar: z.boolean().default(true),
      cardSpacing: z.enum(['tight', 'normal', 'loose']).default('normal'),
    })
    .optional(),

  // Feature toggles (presentation only)
  features: z
    .object({
      showCharts: z.boolean().default(true),
      showCompliance: z.boolean().default(true),
      showMarketing: z.boolean().default(true),
      showExportButton: z.boolean().default(true),
    })
    .optional(),
});

export type BuilderProps = z.infer<typeof BuilderPropsSchema>;

/**
 * Validates Builder.io props before applying
 */
export function validateBuilderProps(data: unknown): BuilderProps {
  return BuilderPropsSchema.parse(data);
}
