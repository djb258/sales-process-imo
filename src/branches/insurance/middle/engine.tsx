'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { composio } from '@/lib/composio-integration';

interface InsuranceQuote {
  provider: string;
  type: string;
  premium: number;
  deductible: number;
  coverage: number;
  features: string[];
  rating: number;
}

interface RiskAssessment {
  riskLevel: 'Low' | 'Medium' | 'High';
  factors: string[];
  score: number;
  recommendations: string[];
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
  result?: any;
}

export default function InsuranceEngine() {
  const [processing, setProcessing] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'profile', name: 'Analyzing Client Profile', status: 'processing', progress: 0 },
    { id: 'risk', name: 'Conducting Risk Assessment', status: 'pending', progress: 0 },
    { id: 'market', name: 'Scanning Insurance Market', status: 'pending', progress: 0 },
    { id: 'quotes', name: 'Generating Competitive Quotes', status: 'pending', progress: 0 },
    { id: 'compliance', name: 'Ensuring Regulatory Compliance', status: 'pending', progress: 0 },
    { id: 'optimization', name: 'Optimizing Coverage Options', status: 'pending', progress: 0 },
  ]);

  useEffect(() => {
    processInsuranceAnalysis();
  }, []);

  const processInsuranceAnalysis = async () => {
    for (let i = 0; i < steps.length; i++) {
      // Update current step to processing
      setSteps(prev => prev.map((step, index) => 
        index === i 
          ? { ...step, status: 'processing' as const }
          : step
      ));
      setCurrentStep(i);

      // Simulate processing with Composio integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 25) {
        setSteps(prev => prev.map((step, index) => 
          index === i 
            ? { ...step, progress }
            : step
        ));
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      // Complete step
      setSteps(prev => prev.map((step, index) => 
        index === i 
          ? { ...step, status: 'completed' as const, progress: 100 }
          : step
      ));

      // Use Composio for actual processing
      try {
        const stepResult = await composio.executeTool('insurance_processor', {
          step: steps[i].id,
          data: `Processing ${steps[i].name}`
        });
        console.log(`Step ${steps[i].id} completed:`, stepResult);
      } catch (error) {
        console.error(`Step ${steps[i].id} failed:`, error);
      }
    }

    // Generate final results
    const finalQuotes: InsuranceQuote[] = [
      {
        provider: 'State Farm',
        type: 'Auto + Home Bundle',
        premium: 2400,
        deductible: 1000,
        coverage: 500000,
        features: ['Multi-policy discount', '24/7 claims', 'Accident forgiveness'],
        rating: 4.5
      },
      {
        provider: 'Progressive',
        type: 'Auto Insurance',
        premium: 1800,
        deductible: 500,
        coverage: 300000,
        features: ['Name your price', 'Snapshot discount', 'Pet protection'],
        rating: 4.2
      },
      {
        provider: 'Allstate',
        type: 'Home Insurance',
        premium: 1200,
        deductible: 2500,
        coverage: 750000,
        features: ['Claim-free bonus', 'New home discount', 'Green home discount'],
        rating: 4.3
      },
      {
        provider: 'GEICO',
        type: 'Umbrella Policy',
        premium: 300,
        deductible: 0,
        coverage: 1000000,
        features: ['Worldwide coverage', 'Legal defense', 'No deductible'],
        rating: 4.4
      }
    ];

    const assessment: RiskAssessment = {
      riskLevel: 'Medium',
      factors: ['Geographic location', 'Driving history', 'Property age'],
      score: 72,
      recommendations: [
        'Consider umbrella policy for additional protection',
        'Install security system for home discount',
        'Maintain good driving record for continued savings',
        'Review coverage annually'
      ]
    };

    setQuotes(finalQuotes);
    setRiskAssessment(assessment);
    setProcessing(false);
  };

  const handleProceedToOutput = () => {
    console.log('Proceeding to output with quotes:', quotes, 'and risk assessment:', riskAssessment);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (processing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              ⚙️ Insurance Analysis Engine
            </CardTitle>
            <p className="text-gray-600 text-center">
              Processing your insurance needs and generating quotes...
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{step.name}</span>
                      <Badge variant={
                        step.status === 'completed' ? 'default' : 
                        step.status === 'processing' ? 'secondary' : 'outline'
                      }>
                        {step.status}
                      </Badge>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            ⚙️ Insurance Analysis Complete
          </CardTitle>
          <p className="text-gray-600 text-center">
            Your personalized insurance recommendations are ready
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Risk Assessment */}
            {riskAssessment && (
              <Alert>
                <AlertDescription>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Risk Assessment</span>
                    <Badge className={`${getRiskColor(riskAssessment.riskLevel)} border`}>
                      {riskAssessment.riskLevel} Risk (Score: {riskAssessment.score}/100)
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Key Factors:</strong> {riskAssessment.factors.join(', ')}</p>
                    <div className="text-sm">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {riskAssessment.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Quotes Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Top Insurance Quotes ({quotes.length} found)</h3>
              <div className="grid gap-4">
                {quotes.map((quote, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{quote.provider}</h4>
                        <p className="text-sm text-gray-600">{quote.type}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span><strong>Premium:</strong> ${quote.premium}/year</span>
                          <span><strong>Coverage:</strong> ${quote.coverage.toLocaleString()}</span>
                          <span><strong>Deductible:</strong> ${quote.deductible}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {quote.features.slice(0, 2).map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {quote.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{quote.features.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        ⭐ {quote.rating}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button onClick={handleProceedToOutput} className="w-full">
              📋 View Detailed Quotes & Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}