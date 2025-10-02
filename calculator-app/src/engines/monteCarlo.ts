import type { MonteCarloData, SimulationResult } from '@/types';

export interface MonteCarloInput {
  totalClaims: number; // Mean of total annual claims
  volatilityPct: number; // Volatility percentage (e.g., 0.2 for 20%)
  iterations?: number; // Number of iterations (default 10,000)
}

export interface MonteCarloSummary {
  min: number;
  max: number;
  median: number;
  mean: number;
  p90: number;
  p95: number;
  p99: number;
  stdDev: number;
}

/**
 * Enhanced Monte Carlo Simulation Engine
 * Uses normal distribution with Box-Muller transform
 * Runs 10,000 iterations by default for statistical accuracy
 */
export function runMonteCarloSimulation(
  input: MonteCarloInput
): Omit<MonteCarloData, 'prospect_id' | 'timestamp'> {
  const { totalClaims, volatilityPct, iterations = 10000 } = input;
  const results: SimulationResult[] = [];

  // Calculate standard deviation from volatility percentage
  const sigma = totalClaims * volatilityPct;

  // Run Monte Carlo iterations
  for (let i = 0; i < iterations; i++) {
    // Generate random value using normal distribution
    const randomValue = generateNormalDistribution(totalClaims, sigma);
    const projectedCost = Math.max(0, randomValue); // Ensure non-negative

    results.push({
      run: i + 1,
      projectedCost,
    });
  }

  // Sort results for percentile calculations
  const sortedCosts = results
    .map((r) => r.projectedCost)
    .sort((a, b) => a - b);

  // Calculate summary statistics
  const summary = calculateSummaryStats(sortedCosts, totalClaims);

  return {
    baseline: totalClaims,
    volatility: volatilityPct,
    simulations: results,
    percentiles: {
      p10: summary.p90, // Note: Using lower percentiles for "best case"
      p50: summary.median,
      p90: summary.p90,
    },
    // Additional enhanced fields
    iterations,
    meanClaims: totalClaims,
    volatilityPct,
    summary,
  } as any; // Type assertion to handle extended fields
}

/**
 * Generate a random number from normal distribution
 * Using Box-Muller transform for accurate normal distribution
 *
 * @param mean - Mean (μ) of the distribution
 * @param stdDev - Standard deviation (σ) of the distribution
 * @returns Random value from N(mean, stdDev²)
 */
function generateNormalDistribution(mean: number, stdDev: number): number {
  let u1 = 0;
  let u2 = 0;

  // Ensure we don't get 0 which would cause Math.log(0)
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  // Box-Muller transform to generate standard normal (mean=0, stdDev=1)
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  // Transform to desired mean and standard deviation
  return mean + stdDev * z0;
}

/**
 * Calculate comprehensive summary statistics
 */
function calculateSummaryStats(
  sortedCosts: number[],
  mean: number
): MonteCarloSummary {
  const n = sortedCosts.length;

  // Percentile indices
  const p10Index = Math.floor(n * 0.1);
  const p50Index = Math.floor(n * 0.5);
  const p90Index = Math.floor(n * 0.9);
  const p95Index = Math.floor(n * 0.95);
  const p99Index = Math.floor(n * 0.99);

  // Calculate actual mean from simulations
  const actualMean =
    sortedCosts.reduce((sum, val) => sum + val, 0) / n;

  // Calculate standard deviation
  const variance =
    sortedCosts.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    min: sortedCosts[0],
    max: sortedCosts[n - 1],
    median: sortedCosts[p50Index],
    mean: actualMean,
    p90: sortedCosts[p90Index],
    p95: sortedCosts[p95Index],
    p99: sortedCosts[p99Index],
    stdDev,
  };
}

/**
 * Calculate Value at Risk (VaR) and Conditional Value at Risk (CVaR)
 * Useful for risk management analysis
 */
export function calculateRiskMetrics(
  sortedCosts: number[],
  confidenceLevel: number = 0.95
): { var: number; cvar: number } {
  const n = sortedCosts.length;
  const varIndex = Math.floor(n * confidenceLevel);
  const varValue = sortedCosts[varIndex];

  // CVaR = average of all values beyond VaR
  const tailValues = sortedCosts.slice(varIndex);
  const cvarValue =
    tailValues.reduce((sum, val) => sum + val, 0) / tailValues.length;

  return {
    var: varValue,
    cvar: cvarValue,
  };
}
