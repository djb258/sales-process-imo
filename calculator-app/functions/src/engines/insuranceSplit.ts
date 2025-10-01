import type { InsuranceSplitData } from '@/types';

export interface InsuranceSplitInput {
  totalEmployees: number;
  totalAnnualCost: number;
}

/**
 * Insurance Split Engine (10/85 Rule)
 * 10% of employees drive 85% of insurance costs
 */
export function calculateInsuranceSplit(
  input: InsuranceSplitInput
): Omit<InsuranceSplitData, 'prospect_id' | 'timestamp'> {
  const { totalEmployees, totalAnnualCost } = input;

  // Calculate 10% of employees
  const highCostEmployees = Math.ceil(totalEmployees * 0.1);
  const lowCostEmployees = totalEmployees - highCostEmployees;

  // 85% of cost goes to top 10% of employees
  const highCostShare = totalAnnualCost * 0.85;
  const lowCostShare = totalAnnualCost * 0.15;

  // Average cost per employee in each group
  const averageCostHighGroup = highCostEmployees > 0 ? highCostShare / highCostEmployees : 0;
  const averageCostLowGroup = lowCostEmployees > 0 ? lowCostShare / lowCostEmployees : 0;

  return {
    totalEmployees,
    highCostEmployees,
    highCostPercentage: 85,
    breakdown: {
      top10Percent: {
        employeeCount: highCostEmployees,
        costShare: highCostShare,
        averageCost: averageCostHighGroup,
      },
      remaining90Percent: {
        employeeCount: lowCostEmployees,
        costShare: lowCostShare,
        averageCost: averageCostLowGroup,
      },
    },
  };
}
