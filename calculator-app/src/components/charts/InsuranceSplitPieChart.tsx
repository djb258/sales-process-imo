import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { InsuranceSplitData } from '@/types';

interface InsuranceSplitPieChartProps {
  data: InsuranceSplitData;
}

const COLORS = {
  top10: '#ef4444', // red - high cost
  remaining90: '#22c55e', // green - low cost
};

export const InsuranceSplitPieChart: React.FC<InsuranceSplitPieChartProps> = ({ data }) => {
  const pieData = [
    {
      name: 'Top 10% Employees',
      value: data.breakdown.top10Percent.costShare,
      percentage: 85,
      employeeCount: data.breakdown.top10Percent.employeeCount,
      avgCost: data.breakdown.top10Percent.averageCost,
    },
    {
      name: 'Remaining 90% Employees',
      value: data.breakdown.remaining90Percent.costShare,
      percentage: 15,
      employeeCount: data.breakdown.remaining90Percent.employeeCount,
      avgCost: data.breakdown.remaining90Percent.averageCost,
    },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Insurance Cost Distribution (10/85 Rule)</h3>
      <p className="text-sm text-gray-600 mb-6">
        10% of employees typically drive 85% of insurance costs
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS.top10 : COLORS.remaining90}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown Stats */}
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-red-900">Top 10% Employees</h4>
              <span className="text-sm font-medium text-red-600">High Cost Group</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-700">Employee Count:</span>
                <span className="font-semibold text-red-900">
                  {data.breakdown.top10Percent.employeeCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Total Cost Share:</span>
                <span className="font-semibold text-red-900">
                  ${data.breakdown.top10Percent.costShare.toLocaleString()} (85%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Avg Cost/Employee:</span>
                <span className="font-semibold text-red-900">
                  ${data.breakdown.top10Percent.averageCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-green-900">Remaining 90% Employees</h4>
              <span className="text-sm font-medium text-green-600">Low Cost Group</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Employee Count:</span>
                <span className="font-semibold text-green-900">
                  {data.breakdown.remaining90Percent.employeeCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Total Cost Share:</span>
                <span className="font-semibold text-green-900">
                  ${data.breakdown.remaining90Percent.costShare.toLocaleString()} (15%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Avg Cost/Employee:</span>
                <span className="font-semibold text-green-900">
                  ${data.breakdown.remaining90Percent.averageCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Key Insight:</strong> Identifying and managing the high-cost 10% can significantly
          reduce overall insurance expenses. Targeted wellness programs and cost-sharing strategies
          for this group can yield substantial savings.
        </p>
      </div>
    </div>
  );
};
