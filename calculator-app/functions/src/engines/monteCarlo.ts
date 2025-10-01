import type { MonteCarloData, SimulationResult } from '@/types';

export interface MonteCarloInput {
  baseline: number; // Average annual claims cost
  volatility: number; // Volatility multiplier (e.g., 0.2 for 20% volatility)
  simulations: number; // Number of simulations to run
}

/**
 * Monte Carlo Simulation Engine
 * Simulates future claims costs based on historical baseline and volatility
 */
export function runMonteCarloSimulation(
  input: MonteCarloInput
): Omit<MonteCarloData, 'prospect_id' | 'timestamp'> {
  const { baseline, volatility, simulations } = input;
  const results: SimulationResult[] = [];

  // Run simulations
  for (let i = 0; i < simulations; i++) {
    // Generate random value using normal distribution approximation
    const randomFactor = generateNormalRandom();
    const projectedCost = baseline * (1 + volatility * randomFactor);

    results.push({
      run: i + 1,
      projectedCost: Math.max(0, projectedCost), // Ensure non-negative
    });
  }

  // Sort results to calculate percentiles
  const sortedCosts = results
    .map((r) => r.projectedCost)
    .sort((a, b) => a - b);

  // Calculate percentiles
  const p10Index = Math.floor(simulations * 0.1);
  const p50Index = Math.floor(simulations * 0.5);
  const p90Index = Math.floor(simulations * 0.9);

  return {
    baseline,
    volatility,
    simulations: results,
    percentiles: {
      p10: sortedCosts[p10Index],
      p50: sortedCosts[p50Index],
      p90: sortedCosts[p90Index],
    },
  };
}

/**
 * Generate a random number approximating normal distribution
 * Uses Box-Muller transform
 */
function generateNormalRandom(): number {
  let u1 = 0;
  let u2 = 0;

  // Ensure we don't get 0 which would cause Math.log(0)
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();

  // Box-Muller transform
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  return z0;
}
