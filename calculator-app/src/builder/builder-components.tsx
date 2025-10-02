/**
 * Builder.io Component Registration via Composio MCP
 * Exposes React components to Builder.io visual editor
 *
 * 🚨 CRITICAL: All Builder.io API calls go through Composio MCP on port 3001
 * This file only defines component metadata for local registration
 * Actual Builder.io operations use composio-builder.ts
 *
 * IMPORTANT: This file registers PRESENTATION ONLY
 * All calculation logic remains locked in Firebase Functions
 */

// Import components
import { Factfinder } from '../components/Factfinder';
import { DashboardEnhanced } from '../components/DashboardEnhanced';
import { SniperMarketing } from '../components/SniperMarketing';
import { ComplianceChecklist } from '../components/ComplianceChecklist';
import { MonteCarloLineChart } from '../components/charts/MonteCarloLineChart';
import { InsuranceSplitPieChart } from '../components/charts/InsuranceSplitPieChart';
import { SavingsImpactBarChart } from '../components/charts/SavingsImpactBarChart';

// Check MCP server availability (do NOT initialize Builder.io SDK directly)
const MCP_URL = import.meta.env.IMOCREATOR_MCP_URL || 'http://localhost:3001';

// Verify MCP server is running
async function verifyMCPServer() {
  try {
    const response = await fetch(`${MCP_URL}/mcp/health`);
    if (response.ok) {
      console.log('✅ Composio MCP server connected (port 3001)');
      console.log('✅ Builder.io operations will use MCP');
    } else {
      console.warn('⚠️  Composio MCP server not responding. Start with: node server.js');
    }
  } catch (error) {
    console.warn('⚠️  Cannot reach Composio MCP server on port 3001');
    console.warn('   Start server: cd mcp-servers/composio-mcp && node server.js');
  }
}

verifyMCPServer();

// ============================================================================
// COMPONENT METADATA DEFINITIONS
// ============================================================================

/**
 * Component metadata for Builder.io
 * These definitions are used by VSCode Builder.io extension
 * Actual registration happens via Composio MCP
 */

export const COMPONENT_REGISTRY = {
  factfinder: {
    component: Factfinder,
    metadata: {
  name: 'Factfinder Form',
  description: 'Input form for prospect data (writes to /factfinder/{prospect_id})',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/forms.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      defaultValue: '',
      helperText: 'Prospect ID (auto-generated if empty)',
    },
    {
      name: 'onSubmitSuccess',
      type: 'string',
      defaultValue: '/dashboard/:prospectId',
      helperText: 'Redirect URL after successful submission',
    },
    // Styling props
    {
      name: 'primaryColor',
      type: 'color',
      defaultValue: '#3b82f6',
      helperText: 'Primary button and accent color',
    },
    {
      name: 'formTitle',
      type: 'string',
      defaultValue: 'Factfinder - Company Information',
      helperText: 'Main form title',
    },
    {
      name: 'submitButtonText',
      type: 'string',
      defaultValue: 'Submit & Generate Report',
      helperText: 'Submit button label',
    },
    {
      name: 'cardStyle',
      type: 'object',
      defaultValue: {
        shadow: 'lg',
        rounded: 'xl',
        padding: '6',
      },
      subFields: [
        { name: 'shadow', type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
        { name: 'rounded', type: 'string', enum: ['md', 'lg', 'xl', '2xl'] },
        { name: 'padding', type: 'string', enum: ['4', '6', '8', '10'] },
      ],
    },
  ],

  // Override props to allow customization
  override: true,
});

// ============================================================================
// DASHBOARD COMPONENT
// ============================================================================

Builder.registerComponent(DashboardEnhanced, {
  name: 'Dashboard Layout',
  description: 'Main dashboard with tabs, charts, and data display (reads from Firestore)',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/layout-dashboard.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
      helperText: 'Prospect ID to fetch data for',
    },
    {
      name: 'defaultTab',
      type: 'string',
      enum: ['factfinder', 'montecarlo', 'compliance', 'sniper'],
      defaultValue: 'factfinder',
      helperText: 'Default active tab',
    },
    // Color customization
    {
      name: 'colors',
      type: 'object',
      defaultValue: {
        primary: '#3b82f6',
        accent: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
      },
      subFields: [
        { name: 'primary', type: 'color' },
        { name: 'accent', type: 'color' },
        { name: 'success', type: 'color' },
        { name: 'danger', type: 'color' },
      ],
    },
    // Text customization
    {
      name: 'text',
      type: 'object',
      defaultValue: {
        mainTitle: 'IMO Calculator Dashboard',
        exportButtonLabel: 'Export to PDF',
      },
      subFields: [
        { name: 'mainTitle', type: 'string' },
        { name: 'exportButtonLabel', type: 'string' },
      ],
    },
    // Feature toggles
    {
      name: 'features',
      type: 'object',
      defaultValue: {
        showExportButton: true,
        showLoadingSpinner: true,
        enableRealTimeUpdates: true,
      },
      subFields: [
        { name: 'showExportButton', type: 'boolean' },
        { name: 'showLoadingSpinner', type: 'boolean' },
        { name: 'enableRealTimeUpdates', type: 'boolean' },
      ],
    },
    // Layout options
    {
      name: 'layout',
      type: 'object',
      defaultValue: {
        stickyHeader: true,
        maxWidth: '7xl',
        spacing: 'normal',
      },
      subFields: [
        { name: 'stickyHeader', type: 'boolean' },
        { name: 'maxWidth', type: 'string', enum: ['5xl', '6xl', '7xl', 'full'] },
        { name: 'spacing', type: 'string', enum: ['tight', 'normal', 'loose'] },
      ],
    },
  ],

  override: true,
});

// ============================================================================
// SNIPER MARKETING COMPONENT
// ============================================================================

Builder.registerComponent(SniperMarketing, {
  name: 'Sniper Marketing',
  description: 'Dynamic marketing narratives with CTA (reads from /sniper_marketing/{prospect_id})',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/bullseye.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
      helperText: 'Prospect ID to fetch marketing data for',
    },
    // Title customization
    {
      name: 'sectionTitle',
      type: 'string',
      defaultValue: 'Strategic Recommendations',
      helperText: 'Main section title',
    },
    // CTA customization
    {
      name: 'cta',
      type: 'object',
      defaultValue: {
        title: 'Ready to Take Action?',
        description: 'Schedule a consultation to implement these strategies',
        buttonText: 'Book a Call',
        buttonUrl: '/contact',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      subFields: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'longText' },
        { name: 'buttonText', type: 'string' },
        { name: 'buttonUrl', type: 'url' },
        { name: 'gradient', type: 'string' },
      ],
    },
    // Card styling
    {
      name: 'cardStyle',
      type: 'object',
      defaultValue: {
        showIcons: true,
        coloredBorders: true,
        animation: 'fade',
      },
      subFields: [
        { name: 'showIcons', type: 'boolean' },
        { name: 'coloredBorders', type: 'boolean' },
        { name: 'animation', type: 'string', enum: ['none', 'fade', 'slide', 'scale'] },
      ],
    },
    // Override narratives (optional)
    {
      name: 'overrideNarratives',
      type: 'object',
      advanced: true,
      helperText: 'Override auto-generated narratives (leave empty to use Firestore data)',
      subFields: [
        { name: 'risk', type: 'longText' },
        { name: 'savings', type: 'longText' },
        { name: 'compliance', type: 'longText' },
        { name: 'strategy', type: 'longText' },
      ],
    },
  ],

  override: true,
});

// ============================================================================
// COMPLIANCE CHECKLIST COMPONENT
// ============================================================================

Builder.registerComponent(ComplianceChecklist, {
  name: 'Compliance Checklist',
  description: 'Displays federal/state/local compliance requirements',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/checklist.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
    },
    {
      name: 'title',
      type: 'string',
      defaultValue: 'Compliance Requirements',
    },
    {
      name: 'showDeadlines',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Show deadline dates for requirements',
    },
    {
      name: 'expandable',
      type: 'boolean',
      defaultValue: true,
      helperText: 'Allow collapsing/expanding requirement cards',
    },
    {
      name: 'colors',
      type: 'object',
      defaultValue: {
        federal: '#3b82f6',
        state: '#10b981',
        local: '#f59e0b',
      },
      subFields: [
        { name: 'federal', type: 'color' },
        { name: 'state', type: 'color' },
        { name: 'local', type: 'color' },
      ],
    },
  ],

  override: true,
});

// ============================================================================
// CHART COMPONENTS
// ============================================================================

Builder.registerComponent(MonteCarloLineChart, {
  name: 'Monte Carlo Line Chart',
  description: 'Displays Monte Carlo simulation results with percentiles',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/chart-line.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 400,
      helperText: 'Chart height in pixels',
    },
    {
      name: 'showLegend',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'lineColor',
      type: 'color',
      defaultValue: '#8b5cf6',
    },
  ],

  override: true,
  noWrap: true,
});

Builder.registerComponent(InsuranceSplitPieChart, {
  name: 'Insurance Split Pie Chart',
  description: 'Displays 10/85 insurance cost split',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/chart-pie.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 400,
    },
    {
      name: 'colors',
      type: 'object',
      defaultValue: {
        high: '#ef4444',
        standard: '#10b981',
      },
      subFields: [
        { name: 'high', type: 'color' },
        { name: 'standard', type: 'color' },
      ],
    },
  ],

  override: true,
  noWrap: true,
});

Builder.registerComponent(SavingsImpactBarChart, {
  name: 'Savings Impact Bar Chart',
  description: 'Displays savings vehicle comparison (actual vs with/without)',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/chart-bar.png',

  inputs: [
    {
      name: 'prospectId',
      type: 'string',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 400,
    },
    {
      name: 'colors',
      type: 'object',
      defaultValue: {
        actual: '#3b82f6',
        withSavings: '#10b981',
        withoutSavings: '#ef4444',
      },
      subFields: [
        { name: 'actual', type: 'color' },
        { name: 'withSavings', type: 'color' },
        { name: 'withoutSavings', type: 'color' },
      ],
    },
  ],

  override: true,
  noWrap: true,
});

// ============================================================================
// CUSTOM BUILDER.IO COMPONENTS
// ============================================================================

/**
 * Card Component (Builder.io friendly)
 */
interface CardProps {
  title?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
  children?: React.ReactNode;
}

function Card({ title, description, backgroundColor, textColor, shadow, rounded, children }: CardProps) {
  return (
    <div
      className={`bg-white shadow-${shadow || 'lg'} rounded-${rounded || 'xl'} p-6`}
      style={{ backgroundColor, color: textColor }}
    >
      {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
}

Builder.registerComponent(Card, {
  name: 'Card',
  description: 'Customizable card container',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/layout-cards.png',

  inputs: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'longText' },
    { name: 'backgroundColor', type: 'color', defaultValue: '#ffffff' },
    { name: 'textColor', type: 'color', defaultValue: '#000000' },
    { name: 'shadow', type: 'string', enum: ['sm', 'md', 'lg', 'xl'], defaultValue: 'lg' },
    { name: 'rounded', type: 'string', enum: ['md', 'lg', 'xl', '2xl'], defaultValue: 'xl' },
  ],

  canHaveChildren: true,
  defaultChildren: [
    {
      '@type': '@builder.io/sdk:Element',
      component: { name: 'Text', options: { text: 'Card content goes here' } },
    },
  ],
});

/**
 * CTA Button Component
 */
interface CtaButtonProps {
  text: string;
  url?: string;
  gradient?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  openInNewTab?: boolean;
}

function CtaButton({ text, url, gradient, size, fullWidth, openInNewTab }: CtaButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <a
      href={url || '#'}
      target={openInNewTab ? '_blank' : '_self'}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={`inline-block font-semibold text-white rounded-lg transition-transform hover:scale-105 ${
        sizeClasses[size || 'md']
      } ${fullWidth ? 'w-full text-center' : ''}`}
      style={{ background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
    >
      {text}
    </a>
  );
}

Builder.registerComponent(CtaButton, {
  name: 'CTA Button',
  description: 'Call-to-action button with gradient',
  image: 'https://tabler-icons.io/static/tabler-icons/icons-png/hand-click.png',

  inputs: [
    { name: 'text', type: 'string', required: true, defaultValue: 'Get Started' },
    { name: 'url', type: 'url', defaultValue: '#' },
    {
      name: 'gradient',
      type: 'string',
      defaultValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      helperText: 'CSS gradient string',
    },
    { name: 'size', type: 'string', enum: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
    { name: 'fullWidth', type: 'boolean', defaultValue: false },
    { name: 'openInNewTab', type: 'boolean', defaultValue: false },
  ],

  noWrap: true,
});

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Get Builder.io page data for a specific path
 */
export async function getBuilderContent(model: string, url: string) {
  try {
    const content = await Builder.get(model, { url }).promise();
    return content;
  } catch (error) {
    console.error(`Error fetching Builder.io content for ${model}:`, error);
    return null;
  }
}

/**
 * Check if Builder.io is initialized
 */
export function isBuilderInitialized(): boolean {
  return !!BUILDER_API_KEY;
}

export { Builder };
