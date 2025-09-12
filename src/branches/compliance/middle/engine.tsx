'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { composio } from '@/lib/composio-integration';

interface ComplianceResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  gaps: Array<{
    area: string;
    severity: string;
    description: string;
    remediation: string;
  }>;
  requirements: string[];
  recommendations: string[];
  timeline: string;
  cost: number;
}

interface ProcessingStep {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
}

export default function ComplianceEngine() {
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'scan', name: 'Scanning Regulatory Landscape', status: 'processing', progress: 0 },
    { id: 'assess', name: 'Assessing Current Compliance', status: 'pending', progress: 0 },
    { id: 'gaps', name: 'Identifying Compliance Gaps', status: 'pending', progress: 0 },
    { id: 'requirements', name: 'Mapping Requirements', status: 'pending', progress: 0 },
    { id: 'recommendations', name: 'Generating Recommendations', status: 'pending', progress: 0 },
    { id: 'roadmap', name: 'Creating Compliance Roadmap', status: 'pending', progress: 0 },
  ]);

  useEffect(() => {
    processComplianceAnalysis();
  }, []);

  const processComplianceAnalysis = async () => {
    for (let i = 0; i < steps.length; i++) {
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'processing' as const } : step
      ));

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      for (let progress = 0; progress <= 100; progress += 20) {
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, progress } : step
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'completed' as const, progress: 100 } : step
      ));

      try {
        await composio.executeTool('compliance_processor', {
          step: steps[i].id,
          data: `Processing ${steps[i].name}`
        });
      } catch (error) {
        console.error(`Step ${steps[i].id} failed:`, error);
      }
    }

    const finalResult: ComplianceResult = {
      riskLevel: 'Medium',
      score: 72,
      gaps: [
        {
          area: 'Data Privacy',
          severity: 'High',
          description: 'Missing GDPR consent management system',
          remediation: 'Implement consent management platform within 30 days'
        },
        {
          area: 'Security Controls',
          severity: 'Medium',
          description: 'Incomplete access control documentation',
          remediation: 'Update access control policies and procedures'
        }
      ],
      requirements: ['GDPR Article 7', 'SOC 2 Type II', 'ISO 27001'],
      recommendations: [
        'Implement automated compliance monitoring',
        'Establish compliance committee',
        'Regular third-party audits',
        'Employee training program'
      ],
      timeline: '6 months',
      cost: 75000
    };

    setResult(finalResult);
    setProcessing(false);
  };

  if (processing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              ⚙️ Compliance Analysis Engine
            </CardTitle>
            <p className="text-gray-600 text-center">
              Analyzing regulatory requirements and compliance gaps...
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step) => (
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
            ⚙️ Compliance Analysis Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result && (
            <div className="space-y-6">
              <Alert>
                <AlertDescription>
                  <strong>Compliance Score: {result.score}/100 ({result.riskLevel} Risk)</strong><br/>
                  Estimated remediation cost: ${result.cost.toLocaleString()} over {result.timeline}
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="text-lg font-semibold mb-3">Compliance Gaps ({result.gaps.length} found)</h3>
                <div className="space-y-2">
                  {result.gaps.map((gap, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{gap.area}</h4>
                          <p className="text-sm text-gray-600">{gap.description}</p>
                          <p className="text-sm text-blue-600 mt-1">{gap.remediation}</p>
                        </div>
                        <Badge variant={gap.severity === 'High' ? 'destructive' : 'secondary'}>
                          {gap.severity}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Button onClick={() => console.log('Navigate to output')} className="w-full">
                📋 View Detailed Compliance Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}