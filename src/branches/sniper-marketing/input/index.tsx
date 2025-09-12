'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { composio } from '@/lib/composio-integration';

interface SniperMarketingInput {
  targetAudience: string;
  productService: string;
  uniqueValueProp: string;
  marketingGoals: string;
  budget: number;
  timeline: string;
  currentChannels: string[];
  competitorAnalysis: string;
}

export default function SniperMarketingInput() {
  const [formData, setFormData] = useState<SniperMarketingInput>({
    targetAudience: '',
    productService: '',
    uniqueValueProp: '',
    marketingGoals: '',
    budget: 0,
    timeline: '',
    currentChannels: [],
    competitorAnalysis: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Process through Composio MCP server
      const result = await composio.executeTool('sniper_marketing_analyzer', {
        input: formData,
        process: 'analyze_and_strategize'
      });
      
      // Navigate to middle (engine) component
      console.log('Sniper Marketing Analysis:', result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🎯 Sniper Marketing Input
          </CardTitle>
          <p className="text-gray-600 text-center">
            Precise targeting for maximum marketing impact
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Audience
                </label>
                <Textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  placeholder="Describe your ideal customer profile..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product/Service
                </label>
                <Textarea
                  value={formData.productService}
                  onChange={(e) => setFormData({...formData, productService: e.target.value})}
                  placeholder="What are you selling?"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Unique Value Proposition
                </label>
                <Textarea
                  value={formData.uniqueValueProp}
                  onChange={(e) => setFormData({...formData, uniqueValueProp: e.target.value})}
                  placeholder="What makes you different?"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Marketing Goals
                </label>
                <Textarea
                  value={formData.marketingGoals}
                  onChange={(e) => setFormData({...formData, marketingGoals: e.target.value})}
                  placeholder="What do you want to achieve?"
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget ($)
                </label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: parseFloat(e.target.value)})}
                  placeholder="Monthly marketing budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Timeline
                </label>
                <Input
                  value={formData.timeline}
                  onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                  placeholder="e.g., 3 months, Q1 2024"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Competitor Analysis
              </label>
              <Textarea
                value={formData.competitorAnalysis}
                onChange={(e) => setFormData({...formData, competitorAnalysis: e.target.value})}
                placeholder="Who are your main competitors? What are they doing?"
                className="min-h-[120px]"
              />
            </div>

            <Button type="submit" className="w-full">
              🚀 Analyze & Generate Strategy
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}