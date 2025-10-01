import type { SavingsScenarioData } from '@/types';

export interface SavingsVehicleInput {
  actualCost: number; // Current/actual annual cost
}

/**
 * Savings Vehicle Impact Engine
 * Calculates retro and forward scenarios for savings vehicles
 *
 * Scenarios:
 * - Actual: Current cost ($X)
 * - With Savings: 60% of actual (40% reduction)
 * - Without Savings: 160% of actual (60% increase)
 */
export function calculateSavingsImpact(
  input: SavingsVehicleInput
): Omit<SavingsScenarioData, 'prospect_id' | 'timestamp'> {
  const { actualCost } = input;

  const withSavings = actualCost * 0.6; // 60% of actual
  const withoutSavings = actualCost * 1.6; // 160% of actual

  // Calculate impact amounts
  const savingsImpact = actualCost - withSavings; // How much saved
  const costIncrease = withoutSavings - actualCost; // How much additional cost

  return {
    actual: actualCost,
    withSavings,
    withoutSavings,
    scenarios: {
      retro: {
        description: `If savings vehicle had been in place, cost would have been $${withSavings.toLocaleString()} instead of $${actualCost.toLocaleString()}, saving $${savingsImpact.toLocaleString()} (40% reduction).`,
        impact: -savingsImpact, // Negative = savings
      },
      forward: {
        description: `Without a savings vehicle going forward, projected cost could reach $${withoutSavings.toLocaleString()} instead of maintaining $${actualCost.toLocaleString()}, an increase of $${costIncrease.toLocaleString()} (60% increase).`,
        impact: costIncrease, // Positive = cost increase
      },
    },
  };
}

/**
 * Calculate multi-year projections with savings vehicle
 */
export interface MultiYearProjectionInput {
  actualCost: number;
  years: number;
  annualGrowthRate: number; // e.g., 0.05 for 5% annual growth
}

export interface YearProjection {
  year: number;
  withSavings: number;
  withoutSavings: number;
  savings: number;
}

export function calculateMultiYearProjection(
  input: MultiYearProjectionInput
): YearProjection[] {
  const { actualCost, years, annualGrowthRate } = input;
  const projections: YearProjection[] = [];

  for (let year = 1; year <= years; year++) {
    // Base cost grows each year
    const baseCost = actualCost * Math.pow(1 + annualGrowthRate, year);

    // With savings vehicle (60% of base)
    const withSavings = baseCost * 0.6;

    // Without savings vehicle (160% of base)
    const withoutSavings = baseCost * 1.6;

    // Annual savings
    const savings = withoutSavings - withSavings;

    projections.push({
      year,
      withSavings,
      withoutSavings,
      savings,
    });
  }

  return projections;
}
