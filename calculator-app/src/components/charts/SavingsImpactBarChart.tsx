import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SavingsScenarioData } from '@/types';

interface SavingsImpactBarChartProps {
  data: SavingsScenarioData;
}

export const SavingsImpactBarChart: React.FC<SavingsImpactBarChartProps> = ({ data }) => {
  const chartData = [
    {
      scenario: 'Without Savings',
      cost: data.withoutSavings,
      color: '#ef4444',
      description: '160% of actual',
    },
    {
      scenario: 'Actual Cost',
      cost: data.actual,
      color: '#3b82f6',
      description: 'Current baseline',
    },
    {
      scenario: 'With Savings',
      cost: data.withSavings,
      color: '#22c55e',
      description: '60% of actual',
    },
  ];

  const savingsAmount = data.actual - data.withSavings;
  const potentialIncrease = data.withoutSavings - data.actual;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Savings Vehicle Impact Analysis</h3>
      <p className="text-sm text-gray-600 mb-6">
        Comparison of costs with and without savings vehicles
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="scenario"
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Annual Cost ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="cost" name="Annual Cost" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Scenario Cards */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Retrospective Scenario */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-900">Retrospective Scenario</h4>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
              Savings
            </span>
          </div>
          <p className="text-sm text-green-800 mb-4">{data.scenarios.retro.description}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700">
              ${savingsAmount.toLocaleString()}
            </span>
            <span className="text-sm text-green-600">potential savings</span>
          </div>
          <div className="mt-2 text-xs text-green-600">
            40% reduction from actual cost
          </div>
        </div>

        {/* Forward Scenario */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-red-900">Forward Scenario</h4>
            <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
              Risk
            </span>
          </div>
          <p className="text-sm text-red-800 mb-4">{data.scenarios.forward.description}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-red-700">
              ${potentialIncrease.toLocaleString()}
            </span>
            <span className="text-sm text-red-600">potential increase</span>
          </div>
          <div className="mt-2 text-xs text-red-600">
            60% increase from actual cost
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Summary</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Actual Cost:</span>
            <div className="font-semibold text-blue-900 text-lg">
              ${data.actual.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-blue-700">With Savings Vehicle:</span>
            <div className="font-semibold text-green-600 text-lg">
              ${data.withSavings.toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-blue-700">Without Savings Vehicle:</span>
            <div className="font-semibold text-red-600 text-lg">
              ${data.withoutSavings.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
