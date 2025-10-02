import type { SavingsScenarioData } from '@/types';

export interface SavingsVehicleInput {
  actualClaims: number; // Current/actual annual claims cost
}

/**
 * Enhanced Savings Vehicle Impact Engine
 * Calculates retro and forward scenarios for savings vehicles
 *
 * Formula:
 * - Actual: Current cost ($X)
 * - With Savings: 60% of actual (40% reduction)
 * - Without Savings: 160% of actual (60% increase)
 */
export function calculateSavingsImpact(
  input: SavingsVehicleInput
): Omit<SavingsScenarioData, 'prospect_id' | 'timestamp'> {
  const { actualClaims } = input;

  // Calculate scenarios
  const withSavings = actualClaims * 0.6; // 60% of actual
  const withoutSavings = actualClaims * 1.6; // 160% of actual

  // Calculate impact amounts
  const savingsAmount = actualClaims - withSavings; // 40% savings
  const costIncrease = withoutSavings - actualClaims; // 60% increase

  // Calculate percentages
  const savingsPercentage = ((savingsAmount / actualClaims) * 100).toFixed(1);
  const increasePercentage = ((costIncrease / actualClaims) * 100).toFixed(1);

  return {
    actual: actualClaims,
    withSavings,
    withoutSavings,
    scenarios: {
      retro: {
        description: `If savings vehicle had been in place, cost would have been $${withSavings.toLocaleString()} instead of $${actualClaims.toLocaleString()}, saving $${savingsAmount.toLocaleString()} (${savingsPercentage}% reduction).`,
        impact: -savingsAmount, // Negative = savings
      },
      forward: {
        description: `Without a savings vehicle going forward, projected cost could reach $${withoutSavings.toLocaleString()} instead of maintaining $${actualClaims.toLocaleString()}, an increase of $${costIncrease.toLocaleString()} (${increasePercentage}% increase).`,
        impact: costIncrease, // Positive = cost increase
      },
    },
    // Enhanced fields matching Firestore schema
    actualClaims,
    withSavingsAmount: withSavings,
    withoutSavingsAmount: withoutSavings,
    savingsAmount,
    costIncrease,
    savingsPercentage: parseFloat(savingsPercentage),
    increasePercentage: parseFloat(increasePercentage),
  } as any; // Type assertion for extended fields
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
