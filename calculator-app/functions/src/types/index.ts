// IMO Calculator Types

export interface ProspectId {
  id: string;
  timestamp: number;
}

// ===== FACTFINDER COLLECTION =====
export interface FactfinderData {
  prospect_id: string;
  company: {
    name: string;
    industry: string;
    employeeCount: number;
    state: string;
  };
  census: {
    averageAge: number;
    maleCount: number;
    femaleCount: number;
    dependents: number;
  };
  claims: {
    historicalData: ClaimRecord[];
    totalAnnualCost: number;
  };
  validated: boolean;
  timestamp: number;
}

export interface ClaimRecord {
  year: number;
  totalCost: number;
  claimCount: number;
}

// ===== MONTE CARLO COLLECTION =====
export interface MonteCarloData {
  prospect_id: string;
  baseline: number;
  volatility: number;
  simulations: SimulationResult[];
  percentiles: {
    p10: number;
    p50: number;
    p90: number;
  };
  timestamp: number;
}

export interface SimulationResult {
  run: number;
  projectedCost: number;
}

// ===== INSURANCE SPLIT COLLECTION =====
export interface InsuranceSplitData {
  prospect_id: string;
  totalEmployees: number;
  highCostEmployees: number; // 10%
  highCostPercentage: number; // 85%
  breakdown: {
    top10Percent: {
      employeeCount: number;
      costShare: number; // 85%
      averageCost: number;
    };
    remaining90Percent: {
      employeeCount: number;
      costShare: number; // 15%
      averageCost: number;
    };
  };
  timestamp: number;
}

// ===== COMPLIANCE COLLECTION =====
export interface ComplianceData {
  prospect_id: string;
  employeeCount: number;
  state: string;
  requirements: {
    federal: ComplianceRequirement[];
    state: ComplianceRequirement[];
    local: ComplianceRequirement[];
  };
  timestamp: number;
}

export interface ComplianceRequirement {
  name: string;
  description: string;
  required: boolean;
  deadline?: string;
}

// ===== SAVINGS SCENARIOS COLLECTION =====
export interface SavingsScenarioData {
  prospect_id: string;
  actual: number;
  withSavings: number; // 60% of actual
  withoutSavings: number; // 160% of actual
  scenarios: {
    retro: {
      description: string;
      impact: number;
    };
    forward: {
      description: string;
      impact: number;
    };
  };
  timestamp: number;
}

// ===== PRESENTATIONS COLLECTION =====
export interface PresentationData {
  prospect_id: string;
  dashboardUrl: string;
  generatedAt: number;
  sections: {
    factfinder: boolean;
    monteCarlo: boolean;
    compliance: boolean;
    sniperMarketing: boolean;
  };
  timestamp: number;
}

// ===== PDFS COLLECTION =====
export interface PdfData {
  prospect_id: string;
  downloadUrl: string;
  storagePath: string;
  generatedAt: number;
  fileSize: number;
  timestamp: number;
}

// ===== DASHBOARD TAB TYPES =====
export type DashboardTab = 'factfinder' | 'montecarlo' | 'compliance' | 'sniper';
export type MonteCarloSubTab = 'risk-simulation' | 'insurance-split' | 'savings-impact';
export type ComplianceSubTab = 'federal' | 'state' | 'local';
