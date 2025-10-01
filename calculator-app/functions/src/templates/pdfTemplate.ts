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
}

export function generatePdfHtml(data: PdfTemplateData): string {
  const { factfinder, monteCarlo, insuranceSplit, compliance, savings, generatedDate } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IMO Calculator Report - ${factfinder.company.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1f2937;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }

    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 257mm;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    .logo {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 20px;
      letter-spacing: 2px;
    }

    .cover-title {
      font-size: 42px;
      font-weight: bold;
      margin-bottom: 30px;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 24px;
      margin-bottom: 50px;
      opacity: 0.9;
    }

    .cover-meta {
      font-size: 16px;
      opacity: 0.8;
    }

    h1 {
      font-size: 28px;
      color: #1d4ed8;
      margin-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }

    h2 {
      font-size: 20px;
      color: #1e40af;
      margin-top: 30px;
      margin-bottom: 15px;
    }

    h3 {
      font-size: 16px;
      color: #1e3a8a;
      margin-top: 20px;
      margin-bottom: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      border: 1px solid #d1d5db;
      padding: 10px;
      text-align: left;
    }

    th {
      background-color: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }

    .info-item {
      background: #f9fafb;
      padding: 12px;
      border-left: 3px solid #3b82f6;
    }

    .info-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .stat-card {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border: 1px solid #93c5fd;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      color: #1e3a8a;
    }

    .success-box {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 15px 0;
    }

    .warning-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 15px 0;
    }

    .danger-box {
      background: #fee2e2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin: 15px 0;
    }

    .info-box {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 15px 0;
    }

    .checklist {
      list-style: none;
      margin: 15px 0;
    }

    .checklist li {
      padding: 10px;
      margin: 8px 0;
      background: #f9fafb;
      border-left: 3px solid #22c55e;
      position: relative;
      padding-left: 35px;
    }

    .checklist li:before {
      content: "✓";
      position: absolute;
      left: 10px;
      top: 10px;
      color: #22c55e;
      font-weight: bold;
      font-size: 16px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 10px;
    }

    .page-number {
      position: absolute;
      bottom: 15mm;
      right: 20mm;
      color: #6b7280;
      font-size: 10px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="page cover-page">
    <div class="logo">IMO</div>
    <h1 class="cover-title">Insurance Cost Analysis Report</h1>
    <p class="cover-subtitle">${factfinder.company.name}</p>
    <div class="cover-meta">
      <p>Generated: ${generatedDate}</p>
      <p style="margin-top: 10px;">Prospect ID: ${factfinder.prospect_id || 'N/A'}</p>
    </div>
  </div>

  <!-- FACTFINDER SNAPSHOT PAGE -->
  <div class="page">
    <h1>📋 Factfinder Snapshot</h1>

    <h2>Company Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Company Name</div>
        <div class="info-value">${factfinder.company.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Industry</div>
        <div class="info-value">${factfinder.company.industry}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Employee Count</div>
        <div class="info-value">${factfinder.company.employeeCount}</div>
      </div>
      <div class="info-item">
        <div class="info-label">State</div>
        <div class="info-value">${factfinder.company.state}</div>
      </div>
    </div>

    <h2>Census Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Average Age</div>
        <div class="info-value">${factfinder.census.averageAge} years</div>
      </div>
      <div class="info-item">
        <div class="info-label">Male Employees</div>
        <div class="info-value">${factfinder.census.maleCount}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Female Employees</div>
        <div class="info-value">${factfinder.census.femaleCount}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Dependents</div>
        <div class="info-value">${factfinder.census.dependents}</div>
      </div>
    </div>

    <h2>Claims History</h2>
    <div class="stat-card">
      <div class="stat-value">$${factfinder.claims.totalAnnualCost.toLocaleString()}</div>
      <div class="stat-label">Average Annual Cost</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Total Cost</th>
          <th>Claim Count</th>
        </tr>
      </thead>
      <tbody>
        ${factfinder.claims.historicalData
          .map(
            (record) => `
          <tr>
            <td>${record.year}</td>
            <td>$${record.totalCost.toLocaleString()}</td>
            <td>${record.claimCount}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="page-number">Page 1</div>
  </div>

  <!-- MONTE CARLO PAGE -->
  ${
    monteCarlo
      ? `
  <div class="page">
    <h1>📊 Monte Carlo Risk Analysis</h1>

    <div class="info-box">
      <strong>Simulation Details:</strong> ${monteCarlo.simulations.length} simulations run with ${(monteCarlo.volatility * 100).toFixed(0)}% volatility to project cost variability.
    </div>

    <h2>Baseline & Percentiles</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Baseline Cost</div>
        <div class="info-value">$${monteCarlo.baseline.toLocaleString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Volatility</div>
        <div class="info-value">${(monteCarlo.volatility * 100).toFixed(0)}%</div>
      </div>
    </div>

    <h3>Risk Exposure</h3>
    <div class="success-box">
      <strong>10th Percentile (Best Case):</strong> $${monteCarlo.percentiles.p10.toLocaleString()}
    </div>
    <div class="info-box">
      <strong>50th Percentile (Expected):</strong> $${monteCarlo.percentiles.p50.toLocaleString()}
    </div>
    <div class="danger-box">
      <strong>90th Percentile (Worst Case):</strong> $${monteCarlo.percentiles.p90.toLocaleString()}
    </div>

    ${
      insuranceSplit
        ? `
    <h2>Insurance Split Analysis (10/85 Rule)</h2>
    <div class="warning-box">
      <strong>Key Finding:</strong> 10% of employees (${insuranceSplit.breakdown.top10Percent.employeeCount} people) drive 85% of insurance costs ($${insuranceSplit.breakdown.top10Percent.costShare.toLocaleString()}).
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee Group</th>
          <th>Count</th>
          <th>Cost Share</th>
          <th>Avg Cost/Employee</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Top 10%</strong></td>
          <td>${insuranceSplit.breakdown.top10Percent.employeeCount}</td>
          <td>$${insuranceSplit.breakdown.top10Percent.costShare.toLocaleString()} (85%)</td>
          <td>$${insuranceSplit.breakdown.top10Percent.averageCost.toLocaleString()}</td>
        </tr>
        <tr>
          <td><strong>Remaining 90%</strong></td>
          <td>${insuranceSplit.breakdown.remaining90Percent.employeeCount}</td>
          <td>$${insuranceSplit.breakdown.remaining90Percent.costShare.toLocaleString()} (15%)</td>
          <td>$${insuranceSplit.breakdown.remaining90Percent.averageCost.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    `
        : ''
    }

    ${
      savings
        ? `
    <h2>Savings Vehicle Impact</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Actual Cost</div>
        <div class="info-value">$${savings.actual.toLocaleString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">With Savings (60%)</div>
        <div class="info-value" style="color: #22c55e;">$${savings.withSavings.toLocaleString()}</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Without Savings (160%)</div>
        <div class="info-value" style="color: #ef4444;">$${savings.withoutSavings.toLocaleString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Potential Savings</div>
        <div class="info-value" style="color: #22c55e;">$${(savings.actual - savings.withSavings).toLocaleString()}</div>
      </div>
    </div>

    <div class="success-box">
      <strong>Retrospective:</strong> ${savings.scenarios.retro.description}
    </div>
    <div class="danger-box">
      <strong>Forward:</strong> ${savings.scenarios.forward.description}
    </div>
    `
        : ''
    }

    <div class="page-number">Page 2</div>
  </div>
  `
      : ''
  }

  <!-- COMPLIANCE PAGE -->
  ${
    compliance
      ? `
  <div class="page">
    <h1>✅ Compliance Requirements</h1>

    <div class="info-box">
      <strong>Context:</strong> Based on ${compliance.employeeCount} employees in ${compliance.state}.
    </div>

    <h2>Federal Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.federal
        .filter((req) => req.required)
        .map(
          (req) => `
        <li>
          <strong>${req.name}</strong><br>
          ${req.description}
          ${req.deadline ? `<br><em>Deadline: ${req.deadline}</em>` : ''}
        </li>
      `
        )
        .join('')}
    </ul>

    ${
      compliance.requirements.state.length > 0
        ? `
    <h2>${compliance.state} State Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.state
        .filter((req) => req.required)
        .map(
          (req) => `
        <li>
          <strong>${req.name}</strong><br>
          ${req.description}
          ${req.deadline ? `<br><em>Deadline: ${req.deadline}</em>` : ''}
        </li>
      `
        )
        .join('')}
    </ul>
    `
        : ''
    }

    ${
      compliance.requirements.local.length > 0
        ? `
    <h2>Local Requirements</h2>
    <ul class="checklist">
      ${compliance.requirements.local
        .filter((req) => req.required)
        .map(
          (req) => `
        <li>
          <strong>${req.name}</strong><br>
          ${req.description}
        </li>
      `
        )
        .join('')}
    </ul>
    `
        : ''
    }

    <div class="page-number">Page 3</div>
  </div>
  `
      : ''
  }

  <!-- SUMMARY PAGE -->
  <div class="page">
    <h1>🎯 Your Path Forward</h1>

    <h2>Key Findings</h2>
    <div class="info-box">
      <strong>Company:</strong> ${factfinder.company.name}<br>
      <strong>Employees:</strong> ${factfinder.company.employeeCount}<br>
      <strong>Average Annual Cost:</strong> $${factfinder.claims.totalAnnualCost.toLocaleString()}
    </div>

    ${
      savings
        ? `
    <div class="success-box">
      <strong>Savings Opportunity:</strong> $${(savings.actual - savings.withSavings).toLocaleString()} annually (40% reduction)
    </div>
    `
        : ''
    }

    ${
      monteCarlo
        ? `
    <div class="warning-box">
      <strong>Risk Exposure:</strong> Costs could range from $${monteCarlo.percentiles.p10.toLocaleString()} to $${monteCarlo.percentiles.p90.toLocaleString()}
    </div>
    `
        : ''
    }

    <h2>Recommended Next Steps</h2>
    <ol style="margin-left: 20px; line-height: 2;">
      <li>Schedule a risk assessment meeting to discuss findings</li>
      <li>Review compliance requirements with legal/HR teams</li>
      <li>Explore savings vehicle options to capture cost reductions</li>
      <li>Implement targeted wellness programs for high-cost employees</li>
      <li>Develop a comprehensive insurance strategy for ${new Date().getFullYear() + 1}</li>
    </ol>

    <div style="margin-top: 50px; padding: 30px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 8px; text-align: center;">
      <h2 style="color: #1e40af; margin-bottom: 15px;">Ready to Take Action?</h2>
      <p style="font-size: 14px; color: #1e3a8a;">
        Let's work together to reduce your insurance costs while maintaining excellent employee benefits.
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
        Contact us to schedule your consultation
      </p>
    </div>

    <div class="footer">
      <p>This report was generated on ${generatedDate} for ${factfinder.company.name}.</p>
      <p>© ${new Date().getFullYear()} IMO Calculator. All rights reserved.</p>
      <p style="margin-top: 10px;">🤖 Generated with IMO Calculator - https://imo-calculator.example.com</p>
    </div>

    <div class="page-number">Page 4</div>
  </div>

</body>
</html>
  `;
}
