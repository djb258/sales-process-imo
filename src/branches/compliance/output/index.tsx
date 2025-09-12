'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const complianceGaps = [
  {
    area: 'Data Privacy (GDPR)',
    severity: 'High',
    description: 'Missing consent management system and data mapping',
    remediation: 'Implement consent management platform within 30 days',
    cost: 25000,
    timeline: '30 days'
  },
  {
    area: 'Security Controls (SOC 2)',
    severity: 'Medium', 
    description: 'Incomplete access control documentation',
    remediation: 'Update access control policies and procedures',
    cost: 15000,
    timeline: '45 days'
  },
  {
    area: 'Financial Reporting (SOX)',
    severity: 'Medium',
    description: 'Internal control testing documentation gaps',
    remediation: 'Establish quarterly control testing procedures',
    cost: 20000,
    timeline: '60 days'
  }
];

const actionItems = [
  {
    priority: 'Critical',
    task: 'Implement GDPR Consent Management',
    deadline: '30 days',
    owner: 'Legal/IT Team',
    status: 25,
    description: 'Deploy consent management platform and update privacy policies'
  },
  {
    priority: 'High',
    task: 'SOC 2 Documentation Update',
    deadline: '45 days', 
    owner: 'Security Team',
    status: 0,
    description: 'Complete access control documentation and policy updates'
  },
  {
    priority: 'High',
    task: 'SOX Control Testing Framework',
    deadline: '60 days',
    owner: 'Finance Team', 
    status: 10,
    description: 'Establish quarterly internal control testing procedures'
  }
];

const complianceScore = {
  overall: 72,
  breakdown: {
    'Data Privacy': 60,
    'Security': 75,
    'Financial': 80,
    'Operational': 85
  }
};

export default function ComplianceOutput() {
  const handleExport = (format: string) => {
    console.log(`Exporting compliance report as ${format}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'destructive';
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
            ⚖️ Compliance Assessment Report
          </CardTitle>
          <p className="text-gray-600 text-center">
            Comprehensive regulatory compliance analysis and remediation plan
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
          <TabsTrigger value="roadmap">Action Roadmap</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{complianceScore.overall}/100</div>
                <p className="text-sm text-gray-600">Compliance readiness</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Critical Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {complianceGaps.filter(g => g.severity === 'High').length}
                </div>
                <p className="text-sm text-gray-600">Require immediate attention</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Remediation Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${complianceGaps.reduce((sum, gap) => sum + gap.cost, 0).toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total investment needed</p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Key Finding:</strong> Your organization has a moderate compliance risk profile with {complianceGaps.length} gaps identified. 
              Priority should be given to GDPR compliance gaps which present the highest regulatory risk.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(complianceScore.breakdown).map(([area, score]) => (
                  <div key={area} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{area}</span>
                      <span className="text-sm font-medium">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <div className="grid gap-6">
            {complianceGaps.map((gap, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{gap.area}</span>
                    <Badge variant={getSeverityColor(gap.severity) as any}>
                      {gap.severity} Risk
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Gap Description</h4>
                      <p className="text-sm text-gray-600">{gap.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Recommended Action</h4>
                      <p className="text-sm text-blue-600">{gap.remediation}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Estimated Cost</p>
                        <p className="font-semibold">${gap.cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Timeline</p>
                        <p className="font-semibold">{gap.timeline}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <div className="grid gap-4">
            {actionItems.map((action, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{action.task}</h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <Badge variant={getSeverityColor(action.priority) as any}>
                      {action.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{action.status}%</span>
                    </div>
                    <Progress value={action.status} className="h-2" />
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Owner: <strong>{action.owner}</strong></span>
                      <span className="text-gray-600">Due: <strong>{action.deadline}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ongoing Compliance Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quarterly Reviews</h4>
                    <p className="text-sm text-gray-600">Schedule regular compliance assessments</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Automated Monitoring</h4>
                    <p className="text-sm text-gray-600">Implement continuous compliance tracking</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Training Programs</h4>
                    <p className="text-sm text-gray-600">Regular employee compliance training</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Third-party Audits</h4>
                    <p className="text-sm text-gray-600">Annual external compliance validation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold mb-2">Export Compliance Report</h3>
              <p className="text-sm text-gray-600">Download your comprehensive compliance assessment</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                📄 Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')}>
                📊 Export Excel  
              </Button>
              <Button variant="outline" onClick={() => handleExport('audit')}>
                🔍 Audit Trail
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}