'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { composio } from '@/lib/composio-integration';

interface ComplianceInput {
  industry: string;
  businessType: string;
  regulations: string[];
  currentCompliance: string;
  riskAreas: string[];
  documents: string[];
  auditHistory: string;
  budget: number;
  timeline: string;
  goals: string;
  jurisdiction: string;
}

const industries = [
  'Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 
  'Retail', 'Energy', 'Real Estate', 'Education', 'Government'
];

const regulations = [
  'GDPR', 'HIPAA', 'SOX', 'PCI DSS', 'CCPA', 'FDA', 'OSHA', 'SEC', 'FTC'
];

const riskAreas = [
  'Data Privacy', 'Financial Reporting', 'Cybersecurity', 'Employee Safety',
  'Environmental', 'Anti-Money Laundering', 'Consumer Protection', 'Tax Compliance'
];

export default function ComplianceInput() {
  const [formData, setFormData] = useState<ComplianceInput>({
    industry: '',
    businessType: '',
    regulations: [],
    currentCompliance: '',
    riskAreas: [],
    documents: [],
    auditHistory: '',
    budget: 0,
    timeline: '',
    goals: '',
    jurisdiction: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await composio.executeTool('compliance_analyzer', {
        input: formData,
        process: 'comprehensive_compliance_audit'
      });
      console.log('Compliance Analysis:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            ⚖️ Compliance Assessment Input
          </CardTitle>
          <p className="text-gray-600 text-center">
            Comprehensive regulatory compliance analysis and planning
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({...formData, industry: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <Input
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  placeholder="e.g., Corporation, LLC, Partnership"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget ($)</label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                  placeholder="Annual compliance budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jurisdiction</label>
                <Input
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({...formData, jurisdiction: e.target.value})}
                  placeholder="Primary operating jurisdiction"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Applicable Regulations</label>
              <div className="grid grid-cols-3 gap-2">
                {regulations.map((reg) => (
                  <div key={reg} className="flex items-center space-x-2">
                    <Checkbox
                      id={reg}
                      checked={formData.regulations.includes(reg)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({...formData, regulations: [...formData.regulations, reg]});
                        } else {
                          setFormData({...formData, regulations: formData.regulations.filter(r => r !== reg)});
                        }
                      }}
                    />
                    <label htmlFor={reg} className="text-sm">{reg}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Risk Areas</label>
              <div className="grid grid-cols-2 gap-2">
                {riskAreas.map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.riskAreas.includes(area)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({...formData, riskAreas: [...formData.riskAreas, area]});
                        } else {
                          setFormData({...formData, riskAreas: formData.riskAreas.filter(a => a !== area)});
                        }
                      }}
                    />
                    <label htmlFor={area} className="text-sm">{area}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current Compliance Status</label>
              <Textarea
                value={formData.currentCompliance}
                onChange={(e) => setFormData({...formData, currentCompliance: e.target.value})}
                placeholder="Describe your current compliance posture..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Compliance Goals</label>
              <Textarea
                value={formData.goals}
                onChange={(e) => setFormData({...formData, goals: e.target.value})}
                placeholder="What compliance objectives do you want to achieve?"
                className="min-h-[100px]"
              />
            </div>

            <Button type="submit" className="w-full">
              🔍 Analyze Compliance Requirements
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}