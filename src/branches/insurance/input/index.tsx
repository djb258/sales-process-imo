'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { composio } from '@/lib/composio-integration';

interface InsuranceInput {
  clientType: 'individual' | 'business' | 'commercial';
  insuranceTypes: string[];
  currentCoverage: string;
  assets: {
    property: number;
    vehicles: number;
    business: number;
    personal: number;
  };
  riskFactors: string[];
  claims: {
    history: string;
    frequency: number;
    amount: number;
  };
  budget: {
    current: number;
    preferred: number;
  };
  demographics: {
    age: number;
    location: string;
    occupation: string;
    creditScore: number;
  };
  goals: string;
  timeline: string;
}

const insuranceTypes = [
  'Auto Insurance',
  'Home Insurance',
  'Life Insurance',
  'Health Insurance',
  'Business Insurance',
  'Liability Insurance',
  'Disability Insurance',
  'Umbrella Insurance'
];

const riskFactors = [
  'High-risk occupation',
  'Previous claims',
  'Poor credit history',
  'High-value assets',
  'Geographic risks',
  'Age factors',
  'Health conditions',
  'Driving record'
];

export default function InsuranceInput() {
  const [formData, setFormData] = useState<InsuranceInput>({
    clientType: 'individual',
    insuranceTypes: [],
    currentCoverage: '',
    assets: { property: 0, vehicles: 0, business: 0, personal: 0 },
    riskFactors: [],
    claims: { history: '', frequency: 0, amount: 0 },
    budget: { current: 0, preferred: 0 },
    demographics: { age: 0, location: '', occupation: '', creditScore: 0 },
    goals: '',
    timeline: ''
  });

  const handleInsuranceTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      insuranceTypes: checked 
        ? [...prev.insuranceTypes, type]
        : prev.insuranceTypes.filter(t => t !== type)
    }));
  };

  const handleRiskFactorChange = (factor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: checked 
        ? [...prev.riskFactors, factor]
        : prev.riskFactors.filter(f => f !== factor)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Process through Composio MCP server
      const result = await composio.executeTool('insurance_analyzer', {
        input: formData,
        process: 'risk_assessment_and_quote'
      });
      
      console.log('Insurance Analysis:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🛡️ Insurance Needs Assessment
          </CardTitle>
          <p className="text-gray-600 text-center">
            Comprehensive insurance analysis and quote generation
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Client Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Client Type</label>
              <Select 
                value={formData.clientType} 
                onValueChange={(value: 'individual' | 'business' | 'commercial') => 
                  setFormData({...formData, clientType: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Insurance Types */}
            <div>
              <label className="block text-sm font-medium mb-2">Insurance Types Needed</label>
              <div className="grid grid-cols-2 gap-2">
                {insuranceTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.insuranceTypes.includes(type)}
                      onCheckedChange={(checked) => handleInsuranceTypeChange(type, checked as boolean)}
                    />
                    <label htmlFor={type} className="text-sm">{type}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div>
              <label className="block text-sm font-medium mb-2">Asset Values</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Property ($)</label>
                  <Input
                    type="number"
                    value={formData.assets.property}
                    onChange={(e) => setFormData({
                      ...formData, 
                      assets: {...formData.assets, property: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Vehicles ($)</label>
                  <Input
                    type="number"
                    value={formData.assets.vehicles}
                    onChange={(e) => setFormData({
                      ...formData, 
                      assets: {...formData.assets, vehicles: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Business ($)</label>
                  <Input
                    type="number"
                    value={formData.assets.business}
                    onChange={(e) => setFormData({
                      ...formData, 
                      assets: {...formData.assets, business: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Personal ($)</label>
                  <Input
                    type="number"
                    value={formData.assets.personal}
                    onChange={(e) => setFormData({
                      ...formData, 
                      assets: {...formData.assets, personal: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Age</label>
                <Input
                  type="number"
                  value={formData.demographics.age}
                  onChange={(e) => setFormData({
                    ...formData,
                    demographics: {...formData.demographics, age: parseFloat(e.target.value) || 0}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={formData.demographics.location}
                  onChange={(e) => setFormData({
                    ...formData,
                    demographics: {...formData.demographics, location: e.target.value}
                  })}
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Occupation</label>
                <Input
                  value={formData.demographics.occupation}
                  onChange={(e) => setFormData({
                    ...formData,
                    demographics: {...formData.demographics, occupation: e.target.value}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Credit Score</label>
                <Input
                  type="number"
                  value={formData.demographics.creditScore}
                  onChange={(e) => setFormData({
                    ...formData,
                    demographics: {...formData.demographics, creditScore: parseFloat(e.target.value) || 0}
                  })}
                  placeholder="300-850"
                />
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <label className="block text-sm font-medium mb-2">Risk Factors</label>
              <div className="grid grid-cols-2 gap-2">
                {riskFactors.map((factor) => (
                  <div key={factor} className="flex items-center space-x-2">
                    <Checkbox
                      id={factor}
                      checked={formData.riskFactors.includes(factor)}
                      onCheckedChange={(checked) => handleRiskFactorChange(factor, checked as boolean)}
                    />
                    <label htmlFor={factor} className="text-sm">{factor}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Premium ($)</label>
                <Input
                  type="number"
                  value={formData.budget.current}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: {...formData.budget, current: parseFloat(e.target.value) || 0}
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Budget ($)</label>
                <Input
                  type="number"
                  value={formData.budget.preferred}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: {...formData.budget, preferred: parseFloat(e.target.value) || 0}
                  })}
                />
              </div>
            </div>

            {/* Goals and Timeline */}
            <div>
              <label className="block text-sm font-medium mb-2">Insurance Goals</label>
              <Textarea
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
                placeholder="What are you looking to achieve with your insurance coverage?"
                className="min-h-[100px]"
              />
            </div>

            <Button type="submit" className="w-full">
              🔍 Analyze Coverage & Generate Quotes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}