import React from 'react';
import { Target, TrendingUp, Shield, DollarSign, Users, Zap } from 'lucide-react';
import type { FactfinderData, MonteCarloData, SavingsScenarioData } from '@/types';

interface SniperMarketingProps {
  factfinder: FactfinderData;
  monteCarlo?: MonteCarloData | null;
  savings?: SavingsScenarioData | null;
}

export const SniperMarketing: React.FC<SniperMarketingProps> = ({
  factfinder,
  monteCarlo,
  savings,
}) => {
  // Generate narrative bullets based on data
  const narratives = generateNarratives(factfinder, monteCarlo, savings);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Sniper Marketing Insights</h2>
        </div>
        <p className="text-primary-100">
          Tailored messaging and value propositions for {factfinder.company.name}
        </p>
      </div>

      {/* Key Narratives */}
      <div className="grid md:grid-cols-2 gap-6">
        {narratives.map((narrative, index) => (
          <NarrativeCard key={index} {...narrative} />
        ))}
      </div>

      {/* Action Items */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommended Next Steps</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <p className="text-sm text-blue-800">
              Schedule a risk assessment meeting to discuss Monte Carlo findings and cost volatility
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <p className="text-sm text-blue-800">
              Review compliance requirements with legal/HR teams to ensure full coverage
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <p className="text-sm text-blue-800">
              Explore savings vehicle options to capture the 40% potential cost reduction
            </p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </div>
            <p className="text-sm text-blue-800">
              Implement targeted wellness programs for the high-cost 10% employee group
            </p>
          </li>
        </ul>
      </div>

      {/* Quote/CTA */}
      <div className="card bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <div className="flex items-start gap-4">
          <Zap className="w-12 h-12 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Path to Insurance Savings Starts Here
            </h3>
            <p className="text-gray-700 mb-4">
              Based on our analysis, {factfinder.company.name} has significant opportunities to
              reduce insurance costs while improving employee benefits and maintaining full compliance.
            </p>
            <button className="btn btn-success">
              Schedule Consultation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Narrative Card Component
interface NarrativeCardData {
  icon: React.ReactNode;
  title: string;
  message: string;
  category: 'risk' | 'savings' | 'compliance' | 'strategy';
}

const NarrativeCard: React.FC<NarrativeCardData> = ({ icon, title, message, category }) => {
  const colors = {
    risk: 'from-red-50 to-orange-50 border-red-200',
    savings: 'from-green-50 to-emerald-50 border-green-200',
    compliance: 'from-blue-50 to-indigo-50 border-blue-200',
    strategy: 'from-purple-50 to-pink-50 border-purple-200',
  };

  return (
    <div className={`card bg-gradient-to-br ${colors[category]}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Generate narratives based on data
function generateNarratives(
  factfinder: FactfinderData,
  monteCarlo?: MonteCarloData | null,
  savings?: SavingsScenarioData | null
): NarrativeCardData[] {
  const narratives: NarrativeCardData[] = [];

  // Risk narrative
  if (monteCarlo) {
    const riskRange = monteCarlo.percentiles.p90 - monteCarlo.percentiles.p10;
    const riskPercentage = ((riskRange / monteCarlo.baseline) * 100).toFixed(0);

    narratives.push({
      icon: <TrendingUp className="w-8 h-8 text-red-600" />,
      title: 'Cost Volatility Risk',
      message: `Your insurance costs show a ${riskPercentage}% variability range. Without proactive management, you could face unexpected cost spikes up to $${monteCarlo.percentiles.p90.toLocaleString()} annually. We can help stabilize these costs through strategic planning.`,
      category: 'risk',
    });
  }

  // Savings narrative
  if (savings) {
    const savingsAmount = savings.actual - savings.withSavings;
    const savingsPercent = ((savingsAmount / savings.actual) * 100).toFixed(0);

    narratives.push({
      icon: <DollarSign className="w-8 h-8 text-green-600" />,
      title: 'Immediate Savings Opportunity',
      message: `Our analysis reveals a potential ${savingsPercent}% cost reduction opportunity worth $${savingsAmount.toLocaleString()} annually. By implementing strategic savings vehicles, you could reinvest these funds into employee wellness or business growth.`,
      category: 'savings',
    });
  }

  // Compliance narrative
  const employeeCount = factfinder.company.employeeCount;
  narratives.push({
    icon: <Shield className="w-8 h-8 text-blue-600" />,
    title: 'Compliance Confidence',
    message: `With ${employeeCount} employees in ${factfinder.company.state}, you have specific federal and state compliance obligations. Our comprehensive checklist ensures you meet all requirements, avoiding costly penalties and protecting your business.`,
    category: 'compliance',
  });

  // Strategy narrative (10/85 rule)
  narratives.push({
    icon: <Users className="w-8 h-8 text-purple-600" />,
    title: 'Targeted Cost Management',
    message: `Statistically, 10% of your workforce drives 85% of insurance costs. By identifying and supporting this group with tailored wellness initiatives, you can significantly reduce overall expenses while improving employee health outcomes.`,
    category: 'strategy',
  });

  return narratives;
}
