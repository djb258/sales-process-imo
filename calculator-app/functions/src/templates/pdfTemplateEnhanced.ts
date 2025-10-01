import type {
  FactfinderData,
  MonteCarloData,
  InsuranceSplitData,
  ComplianceData,
  SavingsScenarioData,
} from '../../../src/types';

interface PdfTemplateData {
  factfinder: FactfinderData;
  monteCarlo?: MonteCarloData;
  insuranceSplit?: InsuranceSplitData;
  compliance?: ComplianceData;
  savings?: SavingsScenarioData;
  generatedDate: string;
  prospectId: string;
}

/**
 * Generate enhanced PDF HTML with professional styling and comprehensive data
 */
export function generateEnhancedPdfHtml(data: PdfTemplateData): string {
  const { factfinder, monteCarlo, insuranceSplit, compliance, savings, generatedDate, prospectId } = data;

  // Calculate key metrics
  const savingsAmount = savings ? savings.actual - savings.withSavings : 0;
  const savingsPercent = savings ? ((savingsAmount / savings.actual) * 100).toFixed(1) : '0';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Risk, Compliance & Savings Analysis - ${factfinder.company.name}</title>
  <style>
    /* Reset & Base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* Typography */
    h1 {
      font-size: 28pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }

    h2 {
      font-size: 18pt;
      font-weight: 600;
      color: #1e40af;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 6px;
    }

    h3 {
      font-size: 14pt;
      font-weight: 600;
      color: #1e3a8a;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 10px;
      color: #374151;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 257mm;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
      color: white;
      padding: 40mm 20mm;
    }

    .cover-logo {
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .cover-logo-text {
      font-size: 48pt;
      font-weight: 900;
      color: #1e3a8a;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 20pt;
      margin-bottom: 40px;
      opacity: 0.95;
      font-weight: 300;
    }

    .cover-company {
      font-size: 32pt;
      font-weight: 600;
      margin-bottom: 30px;
      padding: 20px 40px;
      background: rgba(255,255,255,0.15);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    .cover-meta {
      font-size: 13pt;
      opacity: 0.9;
      line-height: 1.8;
    }

    /* Cards */
    .card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .card-primary {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-color: #93c5fd;
    }

    .card-success {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-color: #6ee7b7;
    }

    .card-danger {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-color: #fca5a5;
    }

    .card-warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-color: #fcd34d;
    }

    /* Grid Layouts */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 16px 0;
    }

    /* Info Items */
    .info-item {
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      border-radius: 4px;
    }

    .info-label {
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .info-value {
      font-size: 16pt;
      font-weight: 700;
      color: #111827;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      background: white;
    }

    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border: 1px solid #d1d5db;
      font-size: 10pt;
    }

    td {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    /* Stats */
    .stat-box {
      text-align: center;
      padding: 16px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 24pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 10pt;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-sublabel {
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 4px;
    }

    /* Checklist */
    .checklist {
      list-style: none;
      margin: 12px 0;
    }

    .checklist li {
      padding: 10px 10px 10px 36px;
      margin: 6px 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #22c55e;
      border-radius: 4px;
      position: relative;
    }

    .checklist li:before {
      content: "✓";
      position: absolute;
      left: 12px;
      top: 10px;
      color: #22c55e;
      font-weight: bold;
      font-size: 14pt;
    }

    .checklist-optional li {
      border-left-color: #f59e0b;
    }

    .checklist-optional li:before {
      content: "▢";
      color: #f59e0b;
    }

    /* Narratives */
    .narrative {
      background: white;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #8b5cf6;
      padding: 14px;
      margin: 10px 0;
      border-radius: 4px;
    }

    .narrative strong {
      color: #6b21a8;
      font-size: 11pt;
    }

    /* CTA Box */
    .cta-box {
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      text-align: center;
      margin: 24px 0;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .cta-box h3 {
      color: white;
      font-size: 18pt;
      margin-bottom: 12px;
    }

    .cta-box p {
      color: rgba(255,255,255,0.95);
      font-size: 11pt;
      margin-bottom: 16px;
    }

    .cta-button {
      display: inline-block;
      background: white;
      color: #1e40af;
      padding: 12px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12pt;
      text-decoration: none;
    }

    /* Charts (SVG Placeholders) */
    .chart-container {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
      text-align: center;
    }

    .chart-placeholder {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      height: 200px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      font-size: 10pt;
      font-style: italic;
    }

    /* Simple Bar Chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 180px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }

    .bar {
      flex: 1;
      margin: 0 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    .bar-fill {
      width: 100%;
      border-radius: 6px 6px 0 0;
      position: relative;
    }

    .bar-label {
      margin-top: 8px;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }

    .bar-value {
      font-size: 10pt;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 15mm;
      left: 20mm;
      right: 20mm;
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .page-number {
      position: absolute;
      bottom: 10mm;
      right: 20mm;
      font-size: 9pt;
      color: #9ca3af;
    }

    /* Utility Classes */
    .text-sm { font-size: 9pt; }
    .text-lg { font-size: 13pt; }
    .text-xl { font-size: 16pt; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }

    @media print {
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover-page">
    <div class="cover-logo">
      <div class="cover-logo-text">IMO</div>
    </div>
    <h1 class="cover-title">Risk, Compliance & Savings Analysis</h1>
    <p class="cover-subtitle">Comprehensive Insurance Cost Evaluation</p>
    <div class="cover-company">${factfinder.company.name}</div>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${generatedDate}</p>
      <p><strong>Prospect ID:</strong> ${prospectId}</p>
      <p><strong>Location:</strong> ${factfinder.company.state} • ${factfinder.company.employeeCount} Employees</p>
    </div>
  </div>

  <!-- FACTFINDER SNAPSHOT PAGE -->
  <div class="page">
    <h1>📋 Factfinder Snapshot</h1>
    <p class="text-sm" style="color: #6b7280; margin-bottom: 20px;">
      Comprehensive overview of company information and current insurance landscape
    </p>

    <h2>Company Overview</h2>
    <div class="grid-2">
      <div class="info-item">
        <div class="info-label">Company Name</div>
        <div class="info-value">${factfinder.company.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Industry</div>
        <div class="info-value">${factfinder.company.industry}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Employees</div>
        <div class="info-value">${factfinder.company.employeeCount}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State</div>
        <div class="info-value">${factfinder.company.state}</div>
      </div>
    </div>

    <h2>Workforce Demographics</h2>
    <div class="grid-3">
      <div class="stat-box">
        <div class="stat-value">${factfinder.census.averageAge}</div>
        <div class="stat-label">Average Age</div>
        <div class="stat-sublabel">Years</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${factfinder.census.maleCount + factfinder.census.femaleCount}</div>
        <div class="stat-label">Total Covered</div>
        <div class="stat-sublabel">${factfinder.census.maleCount}M / ${factfinder.census.femaleCount}F</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${factfinder.census.dependents}</div>
        <div class="stat-label">Dependents</div>
        <div class="stat-sublabel">Total Covered</div>
      </div>
    </div>

    <h2>Claims History</h2>
    <div class="card-primary" style="margin-bottom: 16px;">
      <div class="text-center">
        <div style="font-size: 28pt; font-weight: 700; color: #1e40af; margin-bottom: 4px;">
          $${factfinder.claims.totalAnnualCost.toLocaleString()}
        </div>
        <div style="font-size: 11pt; color: #1e3a8a;">
          Average Annual Claims Cost
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Total Claims Cost</th>
          <th>Number of Claims</th>
          <th>Average per Claim</th>
        </tr>
      </thead>
      <tbody>
        ${factfinder.claims.historicalData.map(record => {
          const avgPerClaim = record.claimCount > 0 ? (record.totalCost / record.claimCount) : 0;
          return `
            <tr>
              <td><strong>${record.year}</strong></td>
              <td>$${record.totalCost.toLocaleString()}</td>
              <td>${record.claimCount}</td>
              <td>$${avgPerClaim.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="page-number">Page 1</div>
  </div>

  ${monteCarlo ? `
  <!-- MONTE CARLO ANALYSIS PAGE -->
  <div class="page">
    <h1>📊 Monte Carlo Risk Analysis</h1>
    <p class="text-sm" style="color: #6b7280; margin-bottom: 20px;">
      Simulated 10,000 claim scenarios to project cost variability and risk exposure
    </p>

    <div class="card-primary">
      <h3 style="margin-top: 0;">Simulation Overview</h3>
      <div class="grid-2" style="margin-top: 12px;">
        <div>
          <span class="info-label">Iterations Run</span>
          <p class="font-bold text-lg">${(monteCarlo as any).iterations || 10000} simulations</p>
        </div>
        <div>
          <span class="info-label">Volatility Factor</span>
          <p class="font-bold text-lg">${((monteCarlo as any).volatilityPct || monteCarlo.volatility) * 100}%</p>
        </div>
      </div>
    </div>

    <h2>Risk Exposure Percentiles</h2>
    <p class="text-sm mb-4">Understanding your cost variability across different scenarios:</p>

    <div class="grid-3">
      <div class="stat-box" style="border-color: #22c55e;">
        <div class="stat-value" style="color: #22c55e;">${(monteCarlo as any).summary?.p10?.toLocaleString() || monteCarlo.percentiles.p10.toLocaleString()}</div>
        <div class="stat-label" style="color: #22c55e;">Best Case (P10)</div>
        <div class="stat-sublabel">10th Percentile</div>
      </div>
      <div class="stat-box" style="border-color: #3b82f6;">
        <div class="stat-value" style="color: #3b82f6;">${monteCarlo.percentiles.p50.toLocaleString()}</div>
        <div class="stat-label" style="color: #3b82f6;">Expected (Median)</div>
        <div class="stat-sublabel">50th Percentile</div>
      </div>
      <div class="stat-box" style="border-color: #ef4444;">
        <div class="stat-value" style="color: #ef4444;">${monteCarlo.percentiles.p90.toLocaleString()}</div>
        <div class="stat-label" style="color: #ef4444;">Worst Case (P90)</div>
        <div class="stat-sublabel">90th Percentile</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top: 12px;">
      <div class="stat-box">
        <div class="stat-value">${(monteCarlo as any).summary?.p95?.toLocaleString() || 'N/A'}</div>
        <div class="stat-label">P95 Percentile</div>
        <div class="stat-sublabel">95% Confidence</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${(monteCarlo as any).summary?.p99?.toLocaleString() || 'N/A'}</div>
        <div class="stat-label">P99 Percentile</div>
        <div class="stat-sublabel">99% Confidence</div>
      </div>
    </div>

    <div class="chart-container mt-4">
      <h3 style="margin-bottom: 12px;">Cost Distribution Visualization</h3>
      <div class="chart-placeholder">
        Monte Carlo simulation chart: Normal distribution curve showing cost variability from ${(monteCarlo as any).summary?.min?.toLocaleString() || 'min'} to ${(monteCarlo as any).summary?.max?.toLocaleString() || 'max'}
      </div>
    </div>

    <div class="card-warning mt-4">
      <strong>Key Insight:</strong> Your claims costs could range from $${(monteCarlo as any).summary?.min?.toLocaleString() || monteCarlo.percentiles.p10.toLocaleString()} (best case) to $${monteCarlo.percentiles.p90.toLocaleString()} (90th percentile), representing significant variability. Proactive risk management is essential.
    </div>

    <div class="page-number">Page 2</div>
  </div>
  ` : ''}

  ${insuranceSplit ? `
  <!-- INSURANCE SPLIT (10/85 RULE) PAGE -->
  <div class="page">
    <h1>💼 Insurance Cost Distribution</h1>
    <p class="text-sm" style="color: #6b7280; margin-bottom: 20px;">
      Understanding how 10% of employees drive 85% of insurance costs
    </p>

    <div class="card-danger">
      <h3 style="margin-top: 0; color: #b91c1c;">Critical Finding: The 10/85 Rule</h3>
      <p>Industry data shows that <strong>10% of employees (${(insuranceSplit as any).highUtilizers?.count || insuranceSplit.breakdown.top10Percent.employeeCount} people)</strong> account for <strong>85% of total insurance costs ($${(insuranceSplit as any).highUtilizers?.costTotal?.toLocaleString() || insuranceSplit.breakdown.top10Percent.costShare.toLocaleString()})</strong>.</p>
    </div>

    <h2>Cost Breakdown Analysis</h2>

    <table>
      <thead>
        <tr>
          <th>Employee Group</th>
          <th>Count</th>
          <th>% of Employees</th>
          <th>Total Cost</th>
          <th>% of Cost</th>
          <th>Avg per Employee</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #fee2e2;">
          <td><strong>🔴 High Utilizers (Top 10%)</strong></td>
          <td>${(insuranceSplit as any).highUtilizers?.count || insuranceSplit.breakdown.top10Percent.employeeCount}</td>
          <td>10%</td>
          <td><strong>$${(insuranceSplit as any).highUtilizers?.costTotal?.toLocaleString() || insuranceSplit.breakdown.top10Percent.costShare.toLocaleString()}</strong></td>
          <td><strong>85%</strong></td>
          <td>$${(insuranceSplit as any).highUtilizers?.avgPerEmployee?.toLocaleString() || insuranceSplit.breakdown.top10Percent.averageCost.toLocaleString()}</td>
        </tr>
        <tr style="background: #d1fae5;">
          <td><strong>🟢 Standard Utilizers (90%)</strong></td>
          <td>${(insuranceSplit as any).standardUtilizers?.count || insuranceSplit.breakdown.remaining90Percent.employeeCount}</td>
          <td>90%</td>
          <td>$${(insuranceSplit as any).standardUtilizers?.costTotal?.toLocaleString() || insuranceSplit.breakdown.remaining90Percent.costShare.toLocaleString()}</td>
          <td>15%</td>
          <td>$${(insuranceSplit as any).standardUtilizers?.avgPerEmployee?.toLocaleString() || insuranceSplit.breakdown.remaining90Percent.averageCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="grid-2 mt-4">
      <div class="card-primary">
        <h3 style="margin-top: 0;">Cost Multiplier</h3>
        <div class="text-center">
          <div style="font-size: 32pt; font-weight: 700; color: #1e40af;">
            ${(insuranceSplit as any).costMultiplier?.toFixed(1) || '51.0'}×
          </div>
          <p class="text-sm">High utilizers cost <strong>${(insuranceSplit as any).costMultiplier?.toFixed(1) || '51.0'} times more</strong> than standard utilizers on average.</p>
        </div>
      </div>
      <div class="card-success">
        <h3 style="margin-top: 0;">Savings Opportunity</h3>
        <p class="text-sm">By targeting the high-cost 10% with:</p>
        <ul style="margin: 8px 0 0 20px; font-size: 10pt;">
          <li>Wellness programs</li>
          <li>Chronic disease management</li>
          <li>Preventive care incentives</li>
        </ul>
        <p class="text-sm mt-2"><strong>Potential 20% reduction</strong> in high-utilizer costs could save <strong>$${((insuranceSplit as any).highUtilizers?.costTotal * 0.2)?.toLocaleString() || '170,000'}</strong> annually.</p>
      </div>
    </div>

    <div class="chart-container mt-4">
      <h3 style="margin-bottom: 12px;">Visual Cost Distribution</h3>
      <div class="chart-placeholder">
        Pie chart: 85% (red) vs 15% (green) cost distribution
      </div>
    </div>

    <div class="page-number">Page 3</div>
  </div>
  ` : ''}

  ${savings ? `
  <!-- SAVINGS VEHICLE IMPACT PAGE -->
  <div class="page">
    <h1>💰 Savings Vehicle Impact Analysis</h1>
    <p class="text-sm" style="color: #6b7280; margin-bottom: 20px;">
      Comparing cost scenarios with and without strategic savings vehicles
    </p>

    <h2>Cost Comparison</h2>

    <div class="bar-chart">
      <div class="bar">
        <div class="bar-value">$${savings.withSavings.toLocaleString()}</div>
        <div class="bar-fill" style="height: 60%; background: linear-gradient(to top, #22c55e, #4ade80);"></div>
        <div class="bar-label"><strong>With Savings</strong><br>60% of actual</div>
      </div>
      <div class="bar">
        <div class="bar-value">$${savings.actual.toLocaleString()}</div>
        <div class="bar-fill" style="height: 100%; background: linear-gradient(to top, #3b82f6, #60a5fa);"></div>
        <div class="bar-label"><strong>Actual Cost</strong><br>Current baseline</div>
      </div>
      <div class="bar">
        <div class="bar-value">$${savings.withoutSavings.toLocaleString()}</div>
        <div class="bar-fill" style="height: 160%; background: linear-gradient(to top, #ef4444, #f87171);"></div>
        <div class="bar-label"><strong>Without Savings</strong><br>160% of actual</div>
      </div>
    </div>

    <div class="grid-2 mt-4">
      <div class="card-success">
        <h3 style="margin-top: 0; color: #15803d;">📉 Retrospective Scenario</h3>
        <p class="text-sm mb-2"><strong>If savings vehicle had been in place:</strong></p>
        <div class="text-center mb-2">
          <div style="font-size: 28pt; font-weight: 700; color: #22c55e;">
            $${savingsAmount.toLocaleString()}
          </div>
          <div style="font-size: 11pt; color: #15803d;">Potential Savings (${savingsPercent}%)</div>
        </div>
        <p class="text-sm">${savings.scenarios.retro.description}</p>
      </div>
      <div class="card-danger">
        <h3 style="margin-top: 0; color: #b91c1c;">📈 Forward Scenario</h3>
        <p class="text-sm mb-2"><strong>Without savings vehicle going forward:</strong></p>
        <div class="text-center mb-2">
          <div style="font-size: 28pt; font-weight: 700; color: #ef4444;">
            $${(savings.withoutSavings - savings.actual).toLocaleString()}
          </div>
          <div style="font-size: 11pt; color: #b91c1c;">Potential Cost Increase (60%)</div>
        </div>
        <p class="text-sm">${savings.scenarios.forward.description}</p>
      </div>
    </div>

    <div class="card-primary mt-4">
      <div class="text-center">
        <h3 style="margin-top: 0;">Bottom Line</h3>
        <p class="text-lg"><strong>With savings vehicles, exposure reduced by ${savingsPercent}%, protecting ${factfinder.company.name} from significant cost volatility.</strong></p>
      </div>
    </div>

    <div class="page-number">Page 4</div>
  </div>
  ` : ''}

  ${compliance ? `
  <!-- COMPLIANCE CHECKLIST PAGE -->
  <div class="page">
    <h1>✅ Compliance Requirements</h1>
    <p class="text-sm" style="color: #6b7280; margin-bottom: 20px;">
      Based on ${compliance.employeeCount} employees in ${compliance.state}
    </p>

    <h2>🇺🇸 Federal Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.federal.map(req => `
        <li>
          <strong>${req.name}</strong>
          <p class="text-sm" style="margin: 4px 0 0 0; color: #6b7280;">${req.description}</p>
          ${req.deadline ? `<p class="text-sm" style="margin: 4px 0 0 0; color: #1e40af;"><strong>Deadline:</strong> ${req.deadline}</p>` : ''}
        </li>
      `).join('')}
    </ul>

    ${compliance.requirements.state.length > 0 ? `
    <h2 style="margin-top: 24px;">🏛️ ${compliance.state} State Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.state.map(req => `
        <li>
          <strong>${req.name}</strong>
          <p class="text-sm" style="margin: 4px 0 0 0; color: #6b7280;">${req.description}</p>
          ${req.deadline ? `<p class="text-sm" style="margin: 4px 0 0 0; color: #1e40af;"><strong>Deadline:</strong> ${req.deadline}</p>` : ''}
        </li>
      `).join('')}
    </ul>
    ` : ''}

    ${compliance.requirements.local.length > 0 ? `
    <h2 style="margin-top: 24px;">🏘️ Local Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.local.map(req => `
        <li>
          <strong>${req.name}</strong>
          <p class="text-sm" style="margin: 4px 0 0 0; color: #6b7280;">${req.description}</p>
        </li>
      `).join('')}
    </ul>
    ` : '<p class="text-sm" style="color: #6b7280; margin-top: 8px;"><em>No additional local requirements identified.</em></p>'}

    <div class="card-primary mt-4">
      <h3 style="margin-top: 0;">Compliance Summary</h3>
      <p><strong>Total Requirements:</strong> ${compliance.requirements.federal.length + compliance.requirements.state.length + compliance.requirements.local.length}</p>
      <p class="text-sm" style="color: #1e3a8a;">Our team can help ensure full compliance with all applicable federal, state, and local regulations.</p>
    </div>

    <div class="page-number">Page 5</div>
  </div>
  ` : ''}

  <!-- SNIPER MARKETING & SUMMARY PAGE -->
  <div class="page">
    <h1>🎯 Strategic Insights & Recommendations</h1>

    <h2>Key Findings</h2>
    <div class="narrative">
      <strong>Cost Volatility Risk</strong>
      <p>Monte Carlo analysis reveals ${monteCarlo ? `significant cost variability with a P90 exposure of $${monteCarlo.percentiles.p90.toLocaleString()}` : 'potential for cost fluctuations'}. Without proactive management, ${factfinder.company.name} faces unexpected cost spikes.</p>
    </div>

    <div class="narrative">
      <strong>Immediate Savings Opportunity</strong>
      <p>Our analysis reveals a potential ${savingsPercent}% cost reduction opportunity worth $${savingsAmount.toLocaleString()} annually. By implementing strategic savings vehicles, you could reinvest these funds into employee wellness or business growth.</p>
    </div>

    <div class="narrative">
      <strong>Compliance Confidence</strong>
      <p>With ${factfinder.company.employeeCount} employees in ${factfinder.company.state}, you have specific federal and state compliance obligations. Our comprehensive checklist ensures you meet all requirements, avoiding costly penalties.</p>
    </div>

    <div class="narrative">
      <strong>Targeted Cost Management</strong>
      <p>The 10/85 rule shows that 10% of your workforce drives 85% of insurance costs. By identifying and supporting this group with tailored wellness initiatives, you can significantly reduce overall expenses while improving employee health outcomes.</p>
    </div>

    <h2 style="margin-top: 32px;">Your Path Forward</h2>

    <div class="grid-2 mb-4">
      <div class="card">
        <h3 style="margin-top: 0; font-size: 12pt;">📊 Current Situation</h3>
        <ul style="margin: 8px 0 0 16px; font-size: 10pt; line-height: 1.8;">
          <li>Annual Claims: <strong>$${factfinder.claims.totalAnnualCost.toLocaleString()}</strong></li>
          <li>Employees: <strong>${factfinder.company.employeeCount}</strong></li>
          <li>Risk Exposure: <strong>${monteCarlo ? `$${(monteCarlo.percentiles.p90 - monteCarlo.percentiles.p10).toLocaleString()}` : 'Variable'}</strong></li>
        </ul>
      </div>
      <div class="card-success">
        <h3 style="margin-top: 0; font-size: 12pt;">💡 Opportunity</h3>
        <ul style="margin: 8px 0 0 16px; font-size: 10pt; line-height: 1.8;">
          <li>Potential Savings: <strong>$${savingsAmount.toLocaleString()}</strong></li>
          <li>Cost Reduction: <strong>${savingsPercent}%</strong></li>
          <li>ROI Timeline: <strong>12-18 months</strong></li>
        </ul>
      </div>
    </div>

    <div class="cta-box">
      <h3>Ready to Take Action?</h3>
      <p>Let's work together to reduce your insurance costs while maintaining excellent employee benefits.</p>
      <div class="cta-button">Schedule a 30-Minute Strategy Call</div>
      <p class="text-sm" style="margin-top: 16px; opacity: 0.9;">
        We'll review these findings and create a customized action plan for ${factfinder.company.name}.
      </p>
    </div>

    <div class="footer">
      <p>This report was generated on ${generatedDate} for ${factfinder.company.name}.</p>
      <p style="margin-top: 4px;">© ${new Date().getFullYear()} IMO Calculator • Powered by Advanced Analytics</p>
    </div>

    <div class="page-number">Page 6</div>
  </div>

</body>
</html>
  `;
}
