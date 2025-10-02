import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { MonteCarloData } from '@/types';

interface MonteCarloLineChartProps {
  data: MonteCarloData;
}

export const MonteCarloLineChart: React.FC<MonteCarloLineChartProps> = ({ data }) => {
  // Take a sample of simulations for visualization (showing all 1000 would be cluttered)
  const sampleSize = 100;
  const step = Math.floor(data.simulations.length / sampleSize);
  const chartData = data.simulations
    .filter((_, index) => index % step === 0)
    .map((sim) => ({
      run: sim.run,
      cost: Math.round(sim.projectedCost),
    }));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Monte Carlo Risk Simulation</h3>
      <p className="text-sm text-gray-600 mb-6">
        {data.simulations.length} simulations showing projected cost variability
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="run"
            label={{ value: 'Simulation Run', position: 'insideBottom', offset: -5 }}
            stroke="#6b7280"
          />
          <YAxis
            label={{ value: 'Projected Cost ($)', angle: -90, position: 'insideLeft' }}
            stroke="#6b7280"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected Cost']}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          />
          <Legend />

          {/* Baseline reference line */}
          <ReferenceLine
            y={data.baseline}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            label={{ value: 'Baseline', fill: '#3b82f6', fontSize: 12 }}
          />

          {/* Percentile reference lines */}
          <ReferenceLine
            y={data.percentiles.p10}
            stroke="#22c55e"
            strokeDasharray="3 3"
            label={{ value: 'P10', fill: '#22c55e', fontSize: 10 }}
          />
          <ReferenceLine
            y={data.percentiles.p90}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'P90', fill: '#ef4444', fontSize: 10 }}
          />

          <Line
            type="monotone"
            dataKey="cost"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            name="Projected Cost"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">10th Percentile</div>
          <div className="text-2xl font-bold text-green-700">
            ${data.percentiles.p10.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-1">Best Case</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Median (P50)</div>
          <div className="text-2xl font-bold text-blue-700">
            ${data.percentiles.p50.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">Expected</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 font-medium">90th Percentile</div>
          <div className="text-2xl font-bold text-red-700">
            ${data.percentiles.p90.toLocaleString()}
          </div>
          <div className="text-xs text-red-600 mt-1">Worst Case</div>
        </div>
      </div>
    </div>
  );
};
