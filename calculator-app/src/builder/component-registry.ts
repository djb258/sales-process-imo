/**
 * Component Registry for Builder.io via Composio MCP
 *
 * 🚨 CRITICAL: This file ONLY defines component metadata
 * All Builder.io API operations use composio-builder.ts → Composio MCP
 * NO direct Builder.io SDK usage allowed
 *
 * Usage:
 * - VSCode Builder.io extension reads this registry
 * - Component metadata is sent to Builder.io via Composio MCP
 * - React components are imported and rendered by Builder.io pages
 */

import { Factfinder } from '../components/Factfinder';
import { DashboardEnhanced } from '../components/DashboardEnhanced';
import { SniperMarketing } from '../components/SniperMarketing';
import { ComplianceChecklist } from '../components/ComplianceChecklist';
import { MonteCarloLineChart } from '../components/charts/MonteCarloLineChart';
import { InsuranceSplitPieChart } from '../components/charts/InsuranceSplitPieChart';
import { SavingsImpactBarChart } from '../components/charts/SavingsImpactBarChart';

// ============================================================================
// COMPONENT REGISTRY
// ============================================================================

export const IMO_COMPONENTS = {
  'Factfinder Form': {
    component: Factfinder,
    props: {
      prospectId: { type: 'string', default: '' },
      onSubmitSuccess: { type: 'string', default: '/dashboard/:prospectId' },
      primaryColor: { type: 'color', default: '#3b82f6' },
      formTitle: { type: 'string', default: 'Factfinder - Company Information' },
      submitButtonText: { type: 'string', default: 'Submit & Generate Report' },
    },
    description: 'Input form for prospect data (writes to /factfinder/{prospect_id})',
  },

  'Dashboard Layout': {
    component: DashboardEnhanced,
    props: {
      prospectId: { type: 'string', required: true },
      defaultTab: { type: 'enum', values: ['factfinder', 'montecarlo', 'compliance', 'sniper'], default: 'factfinder' },
      colors: {
        type: 'object',
        fields: {
          primary: { type: 'color', default: '#3b82f6' },
          accent: { type: 'color', default: '#8b5cf6' },
          success: { type: 'color', default: '#10b981' },
          danger: { type: 'color', default: '#ef4444' },
        },
      },
    },
    description: 'Main dashboard with tabs, charts, and data display',
  },

  'Sniper Marketing': {
    component: SniperMarketing,
    props: {
      prospectId: { type: 'string', required: true },
      sectionTitle: { type: 'string', default: 'Strategic Recommendations' },
      cta: {
        type: 'object',
        fields: {
          title: { type: 'string', default: 'Ready to Take Action?' },
          description: { type: 'string', default: 'Schedule a consultation' },
          buttonText: { type: 'string', default: 'Book a Call' },
          buttonUrl: { type: 'string', default: '/contact' },
          gradient: { type: 'string', default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
        },
      },
    },
    description: 'Dynamic marketing narratives with CTA',
  },

  'Compliance Checklist': {
    component: ComplianceChecklist,
    props: {
      prospectId: { type: 'string', required: true },
      title: { type: 'string', default: 'Compliance Requirements' },
      showDeadlines: { type: 'boolean', default: true },
      expandable: { type: 'boolean', default: true },
      colors: {
        type: 'object',
        fields: {
          federal: { type: 'color', default: '#3b82f6' },
          state: { type: 'color', default: '#10b981' },
          local: { type: 'color', default: '#f59e0b' },
        },
      },
    },
    description: 'Displays federal/state/local compliance requirements',
  },

  'Monte Carlo Line Chart': {
    component: MonteCarloLineChart,
    props: {
      prospectId: { type: 'string', required: true },
      height: { type: 'number', default: 400 },
      showLegend: { type: 'boolean', default: true },
      lineColor: { type: 'color', default: '#8b5cf6' },
    },
    description: 'Displays Monte Carlo simulation results with percentiles',
  },

  'Insurance Split Pie Chart': {
    component: InsuranceSplitPieChart,
    props: {
      prospectId: { type: 'string', required: true },
      height: { type: 'number', default: 400 },
      colors: {
        type: 'object',
        fields: {
          high: { type: 'color', default: '#ef4444' },
          standard: { type: 'color', default: '#10b981' },
        },
      },
    },
    description: 'Displays 10/85 insurance cost split',
  },

  'Savings Impact Bar Chart': {
    component: SavingsImpactBarChart,
    props: {
      prospectId: { type: 'string', required: true },
      height: { type: 'number', default: 400 },
      colors: {
        type: 'object',
        fields: {
          actual: { type: 'color', default: '#3b82f6' },
          withSavings: { type: 'color', default: '#10b981' },
          withoutSavings: { type: 'color', default: '#ef4444' },
        },
      },
    },
    description: 'Displays savings vehicle comparison',
  },
};

// ============================================================================
// MCP SERVER CHECK
// ============================================================================

const MCP_URL = import.meta.env.VITE_IMOCREATOR_MCP_URL || 'http://localhost:3001';

export async function checkMCPConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}/mcp/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Auto-check on module load
checkMCPConnection().then((connected) => {
  if (connected) {
    console.log('✅ Composio MCP connected (port 3001) - Builder.io operations ready');
  } else {
    console.warn('⚠️  Composio MCP not connected');
    console.warn('   Start: cd mcp-servers/composio-mcp && node server.js');
  }
});

export default IMO_COMPONENTS;
