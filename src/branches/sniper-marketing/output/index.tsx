'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const campaignROIData = [
  { name: 'LinkedIn Ads', investment: 2500, returns: 8000, roi: 3.2 },
  { name: 'Google Ads', investment: 3000, returns: 8400, roi: 2.8 },
  { name: 'Email Campaign', investment: 500, returns: 2050, roi: 4.1 },
  { name: 'Content Marketing', investment: 1500, returns: 4500, roi: 3.0 },
];

const budgetAllocation = [
  { name: 'LinkedIn Ads', value: 35, amount: 2500 },
  { name: 'Google Ads', value: 43, amount: 3000 },
  { name: 'Email Campaign', value: 7, amount: 500 },
  { name: 'Content Marketing', value: 21, amount: 1500 },
];

const performanceMetrics = [
  { metric: 'Customer Acquisition Cost', current: '$125', target: '$100', status: 'improving' },
  { metric: 'Conversion Rate', current: '3.2%', target: '4.0%', status: 'on-track' },
  { metric: 'Lifetime Value', current: '$850', target: '$1000', status: 'improving' },
  { metric: 'Marketing ROI', current: '3.1x', target: '3.5x', status: 'on-track' },
];

const actionItems = [
  {
    priority: 'High',
    task: 'Launch LinkedIn precision targeting campaign',
    deadline: '7 days',
    owner: 'Marketing Team',
    description: 'Target decision makers in specific industries with value proposition messaging'
  },
  {
    priority: 'High',
    task: 'Set up Google Ads search campaigns',
    deadline: '10 days',
    owner: 'Digital Marketing',
    description: 'Focus on high-intent keywords with optimized landing pages'
  },
  {
    priority: 'Medium',
    task: 'Develop email nurture sequences',
    deadline: '14 days',
    owner: 'Content Team',
    description: 'Create 5-part educational email series for lead nurturing'
  },
  {
    priority: 'Medium',
    task: 'Content calendar for thought leadership',
    deadline: '21 days',
    owner: 'Content Team',
    description: 'Weekly blog posts and LinkedIn articles showcasing expertise'
  },
];

export default function SniperMarketingOutput() {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  const handleExport = async (format: string) => {
    // Use Composio for export functionality
    console.log(`Exporting sniper marketing strategy as ${format}`);
    // Implementation would use Composio's export tools
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            🎯 Sniper Marketing Strategy Output
          </CardTitle>
          <p className="text-gray-600 text-center">
            Precision-targeted marketing strategy with actionable insights
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="actions">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">$7,500</div>
                <p className="text-sm text-gray-600">Monthly marketing budget</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">$22,950</div>
                <p className="text-sm text-gray-600">Projected monthly returns</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">3.06x</div>
                <p className="text-sm text-gray-600">Return on investment</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign ROI Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignROIData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="investment" fill="#8884d8" name="Investment" />
                  <Bar dataKey="returns" fill="#82ca9d" name="Returns" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid gap-6">
            {campaignROIData.map((campaign, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{campaign.name}</span>
                    <Badge variant="secondary">{campaign.roi}x ROI</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Investment</p>
                      <p className="text-xl font-semibold">${campaign.investment}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Returns</p>
                      <p className="text-xl font-semibold text-green-600">${campaign.returns}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="text-xl font-semibold text-blue-600">${campaign.returns - campaign.investment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={budgetAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgetAllocation.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge style={{ backgroundColor: COLORS[index] }} className="text-white">
                      ${item.amount}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">{item.value}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{metric.metric}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-600">Current</p>
                          <p className="text-xl font-bold">{metric.current}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Target</p>
                          <p className="text-xl font-bold text-green-600">{metric.target}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant={metric.status === 'improving' ? 'default' : 'secondary'}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-4">
            {actionItems.map((action, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{action.task}</h3>
                    <Badge variant={getPriorityColor(action.priority) as any}>
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Owner: <strong>{action.owner}</strong></span>
                    <span className="text-gray-600">Deadline: <strong>{action.deadline}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold mb-2">Export Strategy</h3>
              <p className="text-sm text-gray-600">Download your complete sniper marketing strategy</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
              >
                📄 Export PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                📊 Export CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExport('json')}
              >
                💾 Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}