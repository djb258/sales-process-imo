import type { InsuranceSplitData } from '@/types';

export interface InsuranceSplitInput {
  employeeTotal: number;
  totalClaims: number;
}

export interface UtilizerGroup {
  count: number;
  costTotal: number;
  avgPerEmployee: number;
  percentageOfEmployees: number;
  percentageOfCost: number;
}

/**
 * Enhanced Insurance Split Engine (10/85 Rule)
 *
 * Industry Standard: 10% of employees (high utilizers) drive 85% of insurance costs
 * This engine calculates the precise breakdown and provides detailed metrics
 */
export function calculateInsuranceSplit(
  input: InsuranceSplitInput
): Omit<InsuranceSplitData, 'prospect_id' | 'timestamp'> {
  const { employeeTotal, totalClaims } = input;

  // High utilizers = 10% of employees → 85% of cost
  const highUtilizersCount = Math.ceil(employeeTotal * 0.10);
  const highUtilizersCost = totalClaims * 0.85;
  const highUtilizersAvg =
    highUtilizersCount > 0 ? highUtilizersCost / highUtilizersCount : 0;

  // Standard utilizers = 90% of employees → 15% of cost
  const standardUtilizersCount = employeeTotal - highUtilizersCount;
  const standardUtilizersCost = totalClaims * 0.15;
  const standardUtilizersAvg =
    standardUtilizersCount > 0
      ? standardUtilizersCost / standardUtilizersCount
      : 0;

  // Calculate cost multiplier (how many times more do high utilizers cost)
  const costMultiplier =
    standardUtilizersAvg > 0 ? highUtilizersAvg / standardUtilizersAvg : 0;

  return {
    totalEmployees: employeeTotal,
    highCostEmployees: highUtilizersCount,
    highCostPercentage: 85,
    breakdown: {
      top10Percent: {
        employeeCount: highUtilizersCount,
        costShare: highUtilizersCost,
        averageCost: highUtilizersAvg,
      },
      remaining90Percent: {
        employeeCount: standardUtilizersCount,
        costShare: standardUtilizersCost,
        averageCost: standardUtilizersAvg,
      },
    },
    // Enhanced fields matching Firestore schema
    employeeTotal,
    totalClaims,
    highUtilizers: {
      count: highUtilizersCount,
      costTotal: highUtilizersCost,
      avgPerEmployee: highUtilizersAvg,
      percentageOfEmployees: 10,
      percentageOfCost: 85,
    },
    standardUtilizers: {
      count: standardUtilizersCount,
      costTotal: standardUtilizersCost,
      avgPerEmployee: standardUtilizersAvg,
      percentageOfEmployees: 90,
      percentageOfCost: 15,
    },
    costMultiplier, // How many times more expensive high utilizers are
  } as any; // Type assertion for extended fields
}

/**
 * Calculate potential savings from targeted interventions
 *
 * Assumes targeting high utilizers with wellness programs can reduce their costs
 */
export function calculateTargetedSavings(
  insuranceSplit: ReturnType<typeof calculateInsuranceSplit>,
  reductionPercentage: number = 0.20 // 20% reduction default
): {
  currentHighUtilizerCost: number;
  projectedHighUtilizerCost: number;
  savings: number;
  newTotalCost: number;
} {
  const currentHighCost = insuranceSplit.highUtilizers.costTotal;
  const reduction = currentHighCost * reductionPercentage;
  const projectedHighCost = currentHighCost - reduction;
  const newTotalCost =
    projectedHighCost + insuranceSplit.standardUtilizers.costTotal;

  return {
    currentHighUtilizerCost: currentHighCost,
    projectedHighUtilizerCost: projectedHighCost,
    savings: reduction,
    newTotalCost,
  };
}

/**
 * Identify risk factors for becoming a high utilizer
 * Based on industry data and actuarial tables
 */
export function identifyRiskFactors(
  averageAge: number,
  chronicConditionRate: number = 0.25 // 25% default
): {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendations: string[];
} {
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
  let riskScore = 0;

  // Age-based risk
  if (averageAge > 50) {
    riskFactors.push('Average age > 50 years');
    riskScore += 2;
  } else if (averageAge > 40) {
    riskFactors.push('Average age 40-50 years');
    riskScore += 1;
  }

  // Chronic condition risk
  if (chronicConditionRate > 0.30) {
    riskFactors.push('High chronic condition rate (>30%)');
    riskScore += 2;
  } else if (chronicConditionRate > 0.20) {
    riskFactors.push('Moderate chronic condition rate (20-30%)');
    riskScore += 1;
  }

  // Generate recommendations based on risk
  if (riskScore >= 3) {
    recommendations.push('Implement comprehensive wellness program');
    recommendations.push('Offer chronic disease management');
    recommendations.push('Provide preventive care incentives');
    return { riskLevel: 'high', riskFactors, recommendations };
  } else if (riskScore >= 1) {
    recommendations.push('Consider targeted health screenings');
    recommendations.push('Promote preventive care benefits');
    return { riskLevel: 'medium', riskFactors, recommendations };
  } else {
    recommendations.push('Maintain current wellness initiatives');
    return { riskLevel: 'low', riskFactors, recommendations };
  }
}
