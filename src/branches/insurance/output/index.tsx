'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const quotes = [
  {
    id: 1,
    provider: 'State Farm',
    type: 'Auto + Home Bundle',
    premium: 2400,
    deductible: 1000,
    coverage: 500000,
    features: ['Multi-policy discount', '24/7 claims', 'Accident forgiveness', 'Good driver discount'],
    rating: 4.5,
    savings: 720,
    recommended: true
  },
  {
    id: 2,
    provider: 'Progressive',
    type: 'Auto Insurance',
    premium: 1800,
    deductible: 500,
    coverage: 300000,
    features: ['Name your price', 'Snapshot discount', 'Pet protection', 'Online claims'],
    rating: 4.2,
    savings: 480,
    recommended: false
  },
  {
    id: 3,
    provider: 'Allstate',
    type: 'Home Insurance',
    premium: 1200,
    deductible: 2500,
    coverage: 750000,
    features: ['Claim-free bonus', 'New home discount', 'Green home discount', 'Safe driving bonus'],
    rating: 4.3,
    savings: 300,
    recommended: false
  },
  {
    id: 4,
    provider: 'GEICO',
    type: 'Umbrella Policy',
    premium: 300,
    deductible: 0,
    coverage: 1000000,
    features: ['Worldwide coverage', 'Legal defense', 'No deductible', 'Easy claims'],
    rating: 4.4,
    savings: 150,
    recommended: true
  },
  {
    id: 5,
    provider: 'Liberty Mutual',
    type: 'Life Insurance',
    premium: 960,
    deductible: 0,
    coverage: 250000,
    features: ['Term life', 'Convertible', 'No medical exam', 'Level premiums'],
    rating: 4.1,
    savings: 240,
    recommended: false
  }
];

const costComparison = quotes.map(q => ({
  name: q.provider,
  premium: q.premium,
  savings: q.savings,
  coverage: q.coverage / 1000
}));

const coverageBreakdown = [
  { name: 'Auto Coverage', value: 35, amount: 300000 },
  { name: 'Home Coverage', value: 45, amount: 500000 },
  { name: 'Life Coverage', value: 15, amount: 250000 },
  { name: 'Umbrella', value: 5, amount: 1000000 }
];

const riskFactors = [
  { factor: 'Location Risk', impact: 'Medium', score: 7, description: 'Moderate weather risks in your area' },
  { factor: 'Driving History', impact: 'Low', score: 3, description: 'Clean driving record for 5+ years' },
  { factor: 'Credit Score', impact: 'Low', score: 2, description: 'Excellent credit history' },
  { factor: 'Property Age', impact: 'Medium', score: 6, description: '15-year-old home needs updates' },
  { factor: 'Occupation', impact: 'Low', score: 2, description: 'Low-risk professional occupation' }
];

const actionItems = [
  {
    priority: 'High',
    task: 'Schedule State Farm consultation',
    deadline: '3 days',
    description: 'Meet with agent to finalize bundle discount and coverage details'
  },
  {
    priority: 'High',
    task: 'Compare umbrella policy options',
    deadline: '1 week',
    description: 'Evaluate GEICO vs State Farm umbrella coverage'
  },
  {
    priority: 'Medium',
    task: 'Home security system installation',
    deadline: '30 days',
    description: 'Install monitored security system for additional discounts'
  },
  {
    priority: 'Medium',
    task: 'Annual coverage review',
    deadline: '12 months',
    description: 'Schedule yearly review to adjust coverage as needed'
  }
];

export default function InsuranceOutput() {
  const [selectedQuote, setSelectedQuote] = useState(quotes[0]);

  const handleExport = (format: string) => {
    console.log(`Exporting insurance analysis as ${format}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const totalSavings = quotes.reduce((sum, quote) => sum + quote.savings, 0);
  const totalPremium = quotes.reduce((sum, quote) => sum + quote.premium, 0);
  const recommendedQuotes = quotes.filter(q => q.recommended);
  const recommendedPremium = recommendedQuotes.reduce((sum, quote) => sum + quote.premium, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            🛡️ Insurance Analysis & Recommendations
          </CardTitle>
          <p className="text-gray-600 text-center">
            Comprehensive insurance coverage analysis with competitive quotes
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="actions">Action Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{quotes.length}</div>
                <p className="text-sm text-gray-600">Insurance providers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Potential Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">${totalSavings}</div>
                <p className="text-sm text-gray-600">Annual savings</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">${recommendedPremium}</div>
                <p className="text-sm text-gray-600">Best value options</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coverage Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">$2.05M</div>
                <p className="text-sm text-gray-600">Total protection</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost vs Coverage Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="premium" fill="#8884d8" name="Annual Premium ($)" />
                  <Bar dataKey="savings" fill="#82ca9d" name="Annual Savings ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              <strong>Recommendation:</strong> The State Farm bundle offers the best value with ${quotes[0].savings} in annual savings 
              and comprehensive coverage. Combined with GEICO's umbrella policy, you'll have optimal protection at competitive rates.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="quotes" className="space-y-6">
          <div className="grid gap-6">
            {quotes.map((quote) => (
              <Card key={quote.id} className={`relative ${quote.recommended ? 'ring-2 ring-blue-500' : ''}`}>
                {quote.recommended && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-blue-600">Recommended</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <div>
                      <span className="text-xl">{quote.provider}</span>
                      <p className="text-sm text-gray-600 font-normal">{quote.type}</p>
                    </div>
                    <Badge variant="secondary">⭐ {quote.rating}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Annual Premium</p>
                      <p className="text-xl font-bold">${quote.premium}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Coverage</p>
                      <p className="text-xl font-bold">${quote.coverage.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deductible</p>
                      <p className="text-xl font-bold">${quote.deductible}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Annual Savings</p>
                      <p className="text-xl font-bold text-green-600">${quote.savings}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Key Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {quote.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="mt-4 w-full" 
                    variant={quote.recommended ? "default" : "outline"}
                    onClick={() => setSelectedQuote(quote)}
                  >
                    {quote.recommended ? 'Get This Quote' : 'Learn More'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Coverage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={coverageBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {coverageBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coverageBreakdown.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{item.name}</h3>
                    <Badge style={{ backgroundColor: COLORS[index] }} className="text-white">
                      ${item.amount.toLocaleString()}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2">{item.value}% of total</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  <strong>Overall Risk Score: 4.0/10 (Low-Medium Risk)</strong><br/>
                  You qualify for preferred rates with most insurance providers.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {riskFactors.map((risk, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{risk.factor}</h3>
                      <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getImpactColor(risk.impact)}>
                        {risk.impact} Impact
                      </Badge>
                      <p className="text-sm mt-1">Score: {risk.score}/10</p>
                    </div>
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
                      {action.priority} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                  <div className="flex justify-between items-center text-sm">
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
              <h3 className="font-semibold mb-2">Export Insurance Analysis</h3>
              <p className="text-sm text-gray-600">Download your complete insurance recommendation report</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                📄 Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                📊 Export Excel
              </Button>
              <Button variant="outline" onClick={() => handleExport('quote')}>
                💾 Save Quotes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}