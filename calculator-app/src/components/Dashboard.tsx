import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  FactfinderData,
  MonteCarloData,
  InsuranceSplitData,
  ComplianceData,
  SavingsScenarioData,
  DashboardTab,
  MonteCarloSubTab,
  ComplianceSubTab,
} from '@/types';

interface DashboardProps {
  prospectId: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ prospectId }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('factfinder');
  const [monteCarloSubTab, setMonteCarloSubTab] = useState<MonteCarloSubTab>('risk-simulation');
  const [complianceSubTab, setComplianceSubTab] = useState<ComplianceSubTab>('federal');

  const [factfinder, setFactfinder] = useState<FactfinderData | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloData | null>(null);
  const [insuranceSplit, setInsuranceSplit] = useState<InsuranceSplitData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [savings, setSavings] = useState<SavingsScenarioData | null>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [prospectId]);

  const loadData = async () => {
    setLoading(true);

    try {
      const [ffDoc, mcDoc, isDoc, compDoc, savDoc] = await Promise.all([
        getDoc(doc(db, 'factfinder', prospectId)),
        getDoc(doc(db, 'montecarlo', prospectId)),
        getDoc(doc(db, 'insurance_split', prospectId)),
        getDoc(doc(db, 'compliance', prospectId)),
        getDoc(doc(db, 'savings_scenarios', prospectId)),
      ]);

      if (ffDoc.exists()) setFactfinder(ffDoc.data() as FactfinderData);
      if (mcDoc.exists()) setMonteCarlo(mcDoc.data() as MonteCarloData);
      if (isDoc.exists()) setInsuranceSplit(isDoc.data() as InsuranceSplitData);
      if (compDoc.exists()) setCompliance(compDoc.data() as ComplianceData);
      if (savDoc.exists()) setSavings(savDoc.data() as SavingsScenarioData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);

    try {
      const functions = getFunctions();
      const generatePdf = httpsCallable(functions, 'generatePdf');
      const result = await generatePdf({ prospectId });

      const data = result.data as { downloadUrl: string };
      window.open(data.downloadUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!factfinder) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>No data found for Prospect ID: {prospectId}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>IMO Calculator Dashboard</h1>
          <p style={{ color: '#666' }}>
            {factfinder.company.name} | Prospect ID: {prospectId}
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          style={{
            padding: '10px 20px',
            background: exporting ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Main Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <TabButton
            label="Factfinder"
            active={activeTab === 'factfinder'}
            onClick={() => setActiveTab('factfinder')}
          />
          <TabButton
            label="Monte Carlo"
            active={activeTab === 'montecarlo'}
            onClick={() => setActiveTab('montecarlo')}
          />
          <TabButton
            label="Compliance"
            active={activeTab === 'compliance'}
            onClick={() => setActiveTab('compliance')}
          />
          <TabButton
            label="Sniper Marketing"
            active={activeTab === 'sniper'}
            onClick={() => setActiveTab('sniper')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '400px' }}>
        {activeTab === 'factfinder' && (
          <FactfinderTab data={factfinder} />
        )}

        {activeTab === 'montecarlo' && (
          <MonteCarloTab
            monteCarlo={monteCarlo}
            insuranceSplit={insuranceSplit}
            savings={savings}
            subTab={monteCarloSubTab}
            setSubTab={setMonteCarloSubTab}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceTab
            data={compliance}
            subTab={complianceSubTab}
            setSubTab={setComplianceSubTab}
          />
        )}

        {activeTab === 'sniper' && (
          <SniperMarketingTab />
        )}
      </div>
    </div>
  );
};

// Helper Component: Tab Button
interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '12px 24px',
      background: active ? '#007bff' : 'transparent',
      color: active ? 'white' : '#333',
      border: 'none',
      borderBottom: active ? '3px solid #007bff' : '3px solid transparent',
      cursor: 'pointer',
      fontWeight: active ? 'bold' : 'normal',
      fontSize: '16px',
    }}
  >
    {label}
  </button>
);

// Tab Component: Factfinder
const FactfinderTab: React.FC<{ data: FactfinderData }> = ({ data }) => (
  <div style={{ padding: '20px' }}>
    <h2>Factfinder Summary</h2>

    <div style={{ marginBottom: '30px' }}>
      <h3>Company Information</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Company Name</td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.company.name}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Industry</td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.company.industry}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Employees</td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.company.employeeCount}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>State</td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.company.state}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style={{ marginBottom: '30px' }}>
      <h3>Census Summary</h3>
      <p>Average Age: {data.census.averageAge}</p>
      <p>Male: {data.census.maleCount} | Female: {data.census.femaleCount}</p>
      <p>Dependents: {data.census.dependents}</p>
    </div>

    <div>
      <h3>Claims History</h3>
      <p><strong>Average Annual Cost:</strong> ${data.claims.totalAnnualCost.toLocaleString()}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px', border: '1px solid #ddd', background: '#f8f9fa' }}>Year</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', background: '#f8f9fa' }}>Total Cost</th>
            <th style={{ padding: '8px', border: '1px solid #ddd', background: '#f8f9fa' }}>Claim Count</th>
          </tr>
        </thead>
        <tbody>
          {data.claims.historicalData.map((record) => (
            <tr key={record.year}>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.year}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>${record.totalCost.toLocaleString()}</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.claimCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Tab Component: Monte Carlo
interface MonteCarloTabProps {
  monteCarlo: MonteCarloData | null;
  insuranceSplit: InsuranceSplitData | null;
  savings: SavingsScenarioData | null;
  subTab: MonteCarloSubTab;
  setSubTab: (tab: MonteCarloSubTab) => void;
}

const MonteCarloTab: React.FC<MonteCarloTabProps> = ({
  monteCarlo,
  insuranceSplit,
  savings,
  subTab,
  setSubTab,
}) => (
  <div style={{ padding: '20px' }}>
    <h2>Monte Carlo Analysis</h2>

    {/* Sub-tabs */}
    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <TabButton
        label="Risk Simulation"
        active={subTab === 'risk-simulation'}
        onClick={() => setSubTab('risk-simulation')}
      />
      <TabButton
        label="Insurance Split"
        active={subTab === 'insurance-split'}
        onClick={() => setSubTab('insurance-split')}
      />
      <TabButton
        label="Savings Impact"
        active={subTab === 'savings-impact'}
        onClick={() => setSubTab('savings-impact')}
      />
    </div>

    {subTab === 'risk-simulation' && monteCarlo && (
      <div>
        <h3>Risk Simulation Results</h3>
        <p><strong>Baseline Cost:</strong> ${monteCarlo.baseline.toLocaleString()}</p>
        <p><strong>Volatility:</strong> {(monteCarlo.volatility * 100).toFixed(0)}%</p>
        <p><strong>Simulations:</strong> {monteCarlo.simulations.length}</p>

        <div style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
          <h4>Percentiles</h4>
          <p><strong>10th Percentile:</strong> ${monteCarlo.percentiles.p10.toLocaleString()}</p>
          <p><strong>50th Percentile (Median):</strong> ${monteCarlo.percentiles.p50.toLocaleString()}</p>
          <p><strong>90th Percentile:</strong> ${monteCarlo.percentiles.p90.toLocaleString()}</p>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Note: Chart visualization would be rendered here using Recharts
        </p>
      </div>
    )}

    {subTab === 'insurance-split' && insuranceSplit && (
      <div>
        <h3>Insurance Split Analysis (10/85 Rule)</h3>
        <p style={{ marginBottom: '20px' }}>
          This analysis shows how 10% of employees typically drive 85% of insurance costs.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '5px' }}>
            <h4>Top 10% of Employees</h4>
            <p><strong>Count:</strong> {insuranceSplit.breakdown.top10Percent.employeeCount}</p>
            <p><strong>Cost Share:</strong> ${insuranceSplit.breakdown.top10Percent.costShare.toLocaleString()} (85%)</p>
            <p><strong>Avg Cost/Employee:</strong> ${insuranceSplit.breakdown.top10Percent.averageCost.toLocaleString()}</p>
          </div>

          <div style={{ background: '#d1ecf1', padding: '20px', borderRadius: '5px' }}>
            <h4>Remaining 90% of Employees</h4>
            <p><strong>Count:</strong> {insuranceSplit.breakdown.remaining90Percent.employeeCount}</p>
            <p><strong>Cost Share:</strong> ${insuranceSplit.breakdown.remaining90Percent.costShare.toLocaleString()} (15%)</p>
            <p><strong>Avg Cost/Employee:</strong> ${insuranceSplit.breakdown.remaining90Percent.averageCost.toLocaleString()}</p>
          </div>
        </div>
      </div>
    )}

    {subTab === 'savings-impact' && savings && (
      <div>
        <h3>Savings Vehicle Impact</h3>

        <div style={{ marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '5px' }}>
          <h4>Cost Comparison</h4>
          <p><strong>Actual Cost:</strong> ${savings.actual.toLocaleString()}</p>
          <p><strong>With Savings (60%):</strong> ${savings.withSavings.toLocaleString()}</p>
          <p><strong>Without Savings (160%):</strong> ${savings.withoutSavings.toLocaleString()}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h4>Retrospective Scenario</h4>
          <p>{savings.scenarios.retro.description}</p>
          <p><strong>Impact:</strong> ${Math.abs(savings.scenarios.retro.impact).toLocaleString()} saved</p>
        </div>

        <div>
          <h4>Forward Scenario</h4>
          <p>{savings.scenarios.forward.description}</p>
          <p><strong>Impact:</strong> ${savings.scenarios.forward.impact.toLocaleString()} additional cost</p>
        </div>
      </div>
    )}
  </div>
);

// Tab Component: Compliance
interface ComplianceTabProps {
  data: ComplianceData | null;
  subTab: ComplianceSubTab;
  setSubTab: (tab: ComplianceSubTab) => void;
}

const ComplianceTab: React.FC<ComplianceTabProps> = ({ data, subTab, setSubTab }) => {
  if (!data) return <p>No compliance data available.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Compliance Requirements</h2>
      <p style={{ marginBottom: '20px' }}>
        Based on {data.employeeCount} employees in {data.state}
      </p>

      {/* Sub-tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <TabButton
          label="Federal"
          active={subTab === 'federal'}
          onClick={() => setSubTab('federal')}
        />
        <TabButton
          label="State"
          active={subTab === 'state'}
          onClick={() => setSubTab('state')}
        />
        <TabButton
          label="Local"
          active={subTab === 'local'}
          onClick={() => setSubTab('local')}
        />
      </div>

      {subTab === 'federal' && (
        <RequirementsList requirements={data.requirements.federal} />
      )}

      {subTab === 'state' && (
        <RequirementsList requirements={data.requirements.state} />
      )}

      {subTab === 'local' && (
        <RequirementsList requirements={data.requirements.local} />
      )}
    </div>
  );
};

const RequirementsList: React.FC<{ requirements: any[] }> = ({ requirements }) => (
  <div>
    {requirements.length === 0 ? (
      <p>No requirements found.</p>
    ) : (
      requirements.map((req, index) => (
        <div key={index} style={{
          marginBottom: '20px',
          padding: '15px',
          background: req.required ? '#d4edda' : '#f8f9fa',
          borderRadius: '5px',
        }}>
          <h4>{req.name} {req.required && <span style={{ color: '#155724' }}>(Required)</span>}</h4>
          <p>{req.description}</p>
          {req.deadline && (
            <p><strong>Deadline:</strong> {req.deadline}</p>
          )}
        </div>
      ))
    )}
  </div>
);

// Tab Component: Sniper Marketing (Placeholder)
const SniperMarketingTab: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Sniper Marketing</h2>
    <p style={{ color: '#666' }}>Coming soon...</p>
  </div>
);
