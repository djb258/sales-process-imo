import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Download, Loader2, FileText, BarChart3 } from 'lucide-react';
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

// Chart components
import { MonteCarloLineChart } from './charts/MonteCarloLineChart';
import { InsuranceSplitPieChart } from './charts/InsuranceSplitPieChart';
import { SavingsImpactBarChart } from './charts/SavingsImpactBarChart';

// Other components
import { ComplianceChecklist } from './ComplianceChecklist';
import { SniperMarketing } from './SniperMarketing';

interface DashboardEnhancedProps {
  prospectId: string;
}

export const DashboardEnhanced: React.FC<DashboardEnhancedProps> = ({ prospectId }) => {
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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
    setPdfUrl(null);

    try {
      const functions = getFunctions();
      const generatePdf = httpsCallable(functions, 'generatePdf');
      const result = await generatePdf({ prospectId });

      const data = result.data as { downloadUrl: string };
      setPdfUrl(data.downloadUrl);

      // Auto-download
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!factfinder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
          <p className="text-gray-600">
            No data found for Prospect ID: <code className="bg-gray-100 px-2 py-1 rounded">{prospectId}</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">IMO Calculator Dashboard</h1>
              </div>
              <p className="text-gray-600">
                <span className="font-semibold">{factfinder.company.name}</span>
                <span className="mx-2">•</span>
                <span className="text-sm">Prospect ID: {prospectId}</span>
              </p>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="btn btn-success flex items-center gap-2 whitespace-nowrap"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF Report
                </>
              )}
            </button>
          </div>

          {pdfUrl && (
            <div className="mt-3 p-3 bg-success-50 border border-success-200 rounded-lg text-sm">
              <span className="text-success-800">
                ✓ PDF generated successfully!{' '}
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Click here to download
                </a>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto">
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
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'factfinder' && <FactfinderTab data={factfinder} />}

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
          <SniperMarketing
            factfinder={factfinder}
            monteCarlo={monteCarlo}
            savings={savings}
          />
        )}
      </main>
    </div>
  );
};

// Tab Button Component
interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`tab-button ${active ? 'tab-button-active' : 'tab-button-inactive'}`}
  >
    {label}
  </button>
);

// Factfinder Tab
const FactfinderTab: React.FC<{ data: FactfinderData }> = ({ data }) => (
  <div className="space-y-6">
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Factfinder Summary</h2>

      {/* Company Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Company Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoRow label="Company Name" value={data.company.name} />
          <InfoRow label="Industry" value={data.company.industry} />
          <InfoRow label="Employee Count" value={data.company.employeeCount.toString()} />
          <InfoRow label="State" value={data.company.state} />
        </div>
      </div>

      {/* Census Summary */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-900">Census Summary</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <InfoRow label="Average Age" value={data.census.averageAge.toString()} />
          <InfoRow label="Male Employees" value={data.census.maleCount.toString()} />
          <InfoRow label="Female Employees" value={data.census.femaleCount.toString()} />
          <InfoRow label="Dependents" value={data.census.dependents.toString()} />
        </div>
      </div>

      {/* Claims History */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Claims History</h3>
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 mb-1">Average Annual Cost</div>
          <div className="text-3xl font-bold text-green-900">
            ${data.claims.totalAnnualCost.toLocaleString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                  Year
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                  Total Cost
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border">
                  Claim Count
                </th>
              </tr>
            </thead>
            <tbody>
              {data.claims.historicalData.map((record) => (
                <tr key={record.year} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border text-gray-900">{record.year}</td>
                  <td className="px-4 py-3 border text-gray-900">
                    ${record.totalCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 border text-gray-900">{record.claimCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Info Row helper component
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="font-semibold text-gray-900">{value}</div>
  </div>
);

// Monte Carlo Tab
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
  <div className="space-y-6">
    {/* Sub-tabs */}
    <div className="bg-white rounded-lg border border-gray-200 p-2 flex gap-2">
      <SubTabButton
        label="Risk Simulation"
        active={subTab === 'risk-simulation'}
        onClick={() => setSubTab('risk-simulation')}
      />
      <SubTabButton
        label="Insurance Split"
        active={subTab === 'insurance-split'}
        onClick={() => setSubTab('insurance-split')}
      />
      <SubTabButton
        label="Savings Impact"
        active={subTab === 'savings-impact'}
        onClick={() => setSubTab('savings-impact')}
      />
    </div>

    {/* Sub-tab Content */}
    {subTab === 'risk-simulation' && monteCarlo && (
      <MonteCarloLineChart data={monteCarlo} />
    )}

    {subTab === 'insurance-split' && insuranceSplit && (
      <InsuranceSplitPieChart data={insuranceSplit} />
    )}

    {subTab === 'savings-impact' && savings && (
      <SavingsImpactBarChart data={savings} />
    )}

    {!monteCarlo && subTab === 'risk-simulation' && <NoDataMessage />}
    {!insuranceSplit && subTab === 'insurance-split' && <NoDataMessage />}
    {!savings && subTab === 'savings-impact' && <NoDataMessage />}
  </div>
);

// Compliance Tab
interface ComplianceTabProps {
  data: ComplianceData | null;
  subTab: ComplianceSubTab;
  setSubTab: (tab: ComplianceSubTab) => void;
}

const ComplianceTab: React.FC<ComplianceTabProps> = ({ data, subTab, setSubTab }) => {
  if (!data) return <NoDataMessage />;

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 flex gap-2">
        <SubTabButton
          label="Federal Requirements"
          active={subTab === 'federal'}
          onClick={() => setSubTab('federal')}
        />
        <SubTabButton
          label="State Requirements"
          active={subTab === 'state'}
          onClick={() => setSubTab('state')}
        />
        <SubTabButton
          label="Local Requirements"
          active={subTab === 'local'}
          onClick={() => setSubTab('local')}
        />
      </div>

      {/* Compliance Info Banner */}
      <div className="card bg-blue-50 border-blue-200">
        <p className="text-blue-800">
          <strong>Compliance Context:</strong> Based on {data.employeeCount} employees in{' '}
          {data.state}, the following requirements apply.
        </p>
      </div>

      {/* Sub-tab Content */}
      {subTab === 'federal' && (
        <ComplianceChecklist
          requirements={data.requirements.federal}
          title="Federal Compliance Requirements"
          description="Requirements applicable to all US employers"
        />
      )}

      {subTab === 'state' && (
        <ComplianceChecklist
          requirements={data.requirements.state}
          title={`${data.state} State Compliance Requirements`}
          description={`State-specific requirements for ${data.state}`}
        />
      )}

      {subTab === 'local' && (
        <ComplianceChecklist
          requirements={data.requirements.local}
          title="Local Compliance Requirements"
          description="City and county-specific requirements (if applicable)"
        />
      )}
    </div>
  );
};

// Sub-tab Button Component
const SubTabButton: React.FC<TabButtonProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-all ${
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

// No Data Message Component
const NoDataMessage: React.FC = () => (
  <div className="card text-center py-12">
    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-600">No data available for this section.</p>
  </div>
);
