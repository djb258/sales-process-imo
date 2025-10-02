# 🎨 Builder.io Integration Guide - IMO Calculator

## Overview

The IMO Calculator is now integrated with **Builder.io** as the presentation layer, while maintaining Firebase as the system of record and keeping all calculation logic locked in Cloud Functions.

**Architecture**:
```
┌─────────────────┐
│   Builder.io    │  ← Presentation Layer (Colors, Text, Layout)
│  Visual Editor  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ React Components│  ← Registered Components (Factfinder, Dashboard, Charts)
│  + Firestore    │
│     Hooks       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Firestore     │  ← System of Record (Schema Locked)
│   Collections   │     - /factfinder/{prospect_id}
│                 │     - /montecarlo/{prospect_id}
│                 │     - /insurance_split/{prospect_id}
│                 │     - /compliance/{prospect_id}
│                 │     - /savings_scenarios/{prospect_id}
│                 │     - /sniper_marketing/{prospect_id}
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Cloud Functions │  ← Calculation Engines (LOCKED)
│   (Protected)   │     - Monte Carlo
│                 │     - Insurance Split
│                 │     - Compliance Matcher
│                 │     - Savings Vehicle
└─────────────────┘
```

---

## 🎯 What Can Be Edited in Builder.io

### ✅ EDITABLE (Presentation Only)

| Element | What You Can Edit | Example |
|---------|-------------------|---------|
| **Colors** | Primary, accent, CTA gradients, chart colors | Change blue to purple |
| **Text** | Titles, descriptions, button labels, CTA copy | "Get Started" → "Book Now" |
| **Layout** | Grid vs stacked, spacing, card styles | Tight spacing → Loose spacing |
| **Features** | Show/hide export button, loading spinner | Hide export button |
| **Styling** | Shadows, borders, rounded corners | Shadow: lg → xl |

### ❌ NOT EDITABLE (Protected Logic)

| Element | Why It's Locked |
|---------|-----------------|
| **Monte Carlo Formula** | Statistical accuracy (10,000 iterations with Box-Muller) |
| **Insurance Split Rule** | Industry standard (10/85 rule) |
| **Compliance Rules** | Legal requirements from JSON dataset |
| **Savings Calculations** | Financial formulas (60% with / 160% without) |
| **Firestore Schema** | Data consistency across all prospects |

---

## 🚀 Setup Instructions

### 1. Install Dependencies

Already installed via npm:
```bash
npm install @builder.io/react zod
```

### 2. Get Builder.io API Key

1. Go to https://builder.io
2. Create account / Sign in
3. Create new space: "IMO Calculator"
4. Copy **Public API Key** from Settings

### 3. Add API Key to Environment

Create or update `.env`:
```bash
VITE_BUILDER_API_KEY=your_builder_public_api_key_here
```

### 4. Initialize Builder.io Components

Import in your main app entry point (`src/main.tsx` or `src/App.tsx`):

```typescript
import './builder/builder-components';

// This registers all components with Builder.io
```

### 5. Create Builder.io Pages

#### Option A: Import JSON Templates

1. Go to Builder.io dashboard
2. Navigate to "Content" → "Pages"
3. Click "Import"
4. Upload `src/builder/page-templates.json`
5. This creates 5 pre-configured page templates

#### Option B: Manual Setup

1. Create new page in Builder.io
2. Set URL path: `/dashboard/:prospectId`
3. Drag "Dashboard Layout" component from left sidebar
4. Configure props in right sidebar

---

## 📋 Registered Components

### 1. Factfinder Form

**Component Name**: `Factfinder Form`

**Props**:
```typescript
{
  prospectId?: string;              // Auto-generated if empty
  onSubmitSuccess?: string;         // Redirect URL (default: /dashboard/:prospectId)
  primaryColor?: string;            // Button color (default: #3b82f6)
  formTitle?: string;               // Form title
  submitButtonText?: string;        // Submit button label
  cardStyle?: {
    shadow: 'sm' | 'md' | 'lg' | 'xl';
    rounded: 'md' | 'lg' | 'xl' | '2xl';
    padding: '4' | '6' | '8' | '10';
  };
}
```

**Data Flow**:
```
User fills form → Validates with Zod → Saves to /factfinder/{prospect_id}
→ Triggers Cloud Function → Runs all engines → Saves to Firestore
```

**What You Can Edit**:
- ✅ Form title and description
- ✅ Button colors and labels
- ✅ Card styling (shadows, borders, padding)
- ✅ Redirect URL after submission

**What You CANNOT Edit**:
- ❌ Form validation rules (schema locked)
- ❌ Firestore collection paths
- ❌ Required fields

---

### 2. Dashboard Layout

**Component Name**: `Dashboard Layout`

**Props**:
```typescript
{
  prospectId: string;               // Required: Prospect ID to fetch data
  defaultTab?: 'factfinder' | 'montecarlo' | 'compliance' | 'sniper';
  colors?: {
    primary: string;
    accent: string;
    success: string;
    danger: string;
  };
  text?: {
    mainTitle: string;
    exportButtonLabel: string;
  };
  features?: {
    showExportButton: boolean;
    showLoadingSpinner: boolean;
    enableRealTimeUpdates: boolean;
  };
  layout?: {
    stickyHeader: boolean;
    maxWidth: '5xl' | '6xl' | '7xl' | 'full';
    spacing: 'tight' | 'normal' | 'loose';
  };
}
```

**Data Flow**:
```
Component renders → useFirestoreDoc hooks fetch data → Real-time updates
→ Displays charts, tables, narratives from Firestore
```

**What You Can Edit**:
- ✅ Color scheme (primary, accent, success, danger)
- ✅ Dashboard title and button labels
- ✅ Show/hide features (export button, loading spinner)
- ✅ Layout options (sticky header, max width, spacing)
- ✅ Default active tab

**What You CANNOT Edit**:
- ❌ Tab structure (Factfinder, Monte Carlo, Compliance, Sniper)
- ❌ Data fetching logic
- ❌ Chart calculations

---

### 3. Sniper Marketing

**Component Name**: `Sniper Marketing`

**Props**:
```typescript
{
  prospectId: string;
  sectionTitle?: string;
  cta?: {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    gradient: string;              // CSS gradient string
  };
  cardStyle?: {
    showIcons: boolean;
    coloredBorders: boolean;
    animation: 'none' | 'fade' | 'slide' | 'scale';
  };
  overrideNarratives?: {           // Advanced: Override auto-generated narratives
    risk?: string;
    savings?: string;
    compliance?: string;
    strategy?: string;
  };
}
```

**Data Flow**:
```
useSniperMarketing(prospectId) → Fetches /sniper_marketing/{prospect_id}
→ Displays 4 narrative cards (Risk, Savings, Compliance, Strategy)
→ Shows CTA box with custom gradient
```

**What You Can Edit**:
- ✅ Section title
- ✅ CTA title, description, button text, URL
- ✅ CTA gradient background
- ✅ Card styling (icons, borders, animations)
- ✅ Override narratives (advanced)

**What You CANNOT Edit**:
- ❌ Narrative generation logic
- ❌ Data-driven insights

---

### 4. Compliance Checklist

**Component Name**: `Compliance Checklist`

**Props**:
```typescript
{
  prospectId: string;
  title?: string;
  showDeadlines?: boolean;
  expandable?: boolean;
  colors?: {
    federal: string;
    state: string;
    local: string;
  };
}
```

**What You Can Edit**:
- ✅ Section title
- ✅ Show/hide deadlines
- ✅ Enable/disable expand/collapse
- ✅ Color coding for Federal/State/Local

**What You CANNOT Edit**:
- ❌ Compliance rules (from JSON dataset)
- ❌ Requirement matching logic

---

### 5. Chart Components

#### Monte Carlo Line Chart

```typescript
{
  prospectId: string;
  height?: number;                 // Chart height in pixels
  showLegend?: boolean;
  lineColor?: string;              // Line color (default: #8b5cf6)
}
```

#### Insurance Split Pie Chart

```typescript
{
  prospectId: string;
  height?: number;
  colors?: {
    high: string;                  // High utilizers color
    standard: string;              // Standard utilizers color
  };
}
```

#### Savings Impact Bar Chart

```typescript
{
  prospectId: string;
  height?: number;
  colors?: {
    actual: string;
    withSavings: string;
    withoutSavings: string;
  };
}
```

**What You Can Edit**:
- ✅ Chart height
- ✅ Bar/line/pie colors
- ✅ Show/hide legend

**What You CANNOT Edit**:
- ❌ Chart data (from Firestore)
- ❌ Percentile calculations
- ❌ Cost breakdowns

---

### 6. Custom Components

#### Card

```typescript
{
  title?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'md' | 'lg' | 'xl' | '2xl';
  children?: ReactNode;            // Can contain other components
}
```

#### CTA Button

```typescript
{
  text: string;
  url?: string;
  gradient?: string;               // CSS gradient
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  openInNewTab?: boolean;
}
```

---

## 🎨 Editing Workflow

### Scenario 1: Change Dashboard Colors

**Goal**: Change primary color from blue (#3b82f6) to purple (#8b5cf6)

**Steps**:
1. Open Builder.io dashboard
2. Navigate to `/dashboard/:prospectId` page
3. Select "Dashboard Layout" component
4. In right sidebar, find "Colors" section
5. Change `primary` from `#3b82f6` to `#8b5cf6`
6. Click "Publish"

**Result**: All primary-colored elements (buttons, tabs, headers) now use purple

**Schema Impact**: ❌ None - Firestore data unchanged

---

### Scenario 2: Customize CTA Text

**Goal**: Change "Book a Call" to "Schedule Consultation"

**Steps**:
1. Open Builder.io dashboard
2. Navigate to page with Sniper Marketing component
3. Select "Sniper Marketing" component
4. In right sidebar, expand "CTA" section
5. Change `buttonText` from `Book a Call` to `Schedule Consultation`
6. Click "Publish"

**Result**: CTA button displays new text

**Schema Impact**: ❌ None - Firestore data unchanged

---

### Scenario 3: Change Chart Colors

**Goal**: Make savings chart green instead of blue

**Steps**:
1. Open Builder.io dashboard
2. Find "Savings Impact Bar Chart" component
3. In right sidebar, expand "Colors" section
4. Change `withSavings` from `#3b82f6` to `#10b981`
5. Click "Publish"

**Result**: "With Savings" bar now renders in green

**Schema Impact**: ❌ None - Chart data from Firestore unchanged

---

### Scenario 4: Hide Export Button

**Goal**: Remove PDF export button from dashboard

**Steps**:
1. Open Builder.io dashboard
2. Select "Dashboard Layout" component
3. In right sidebar, expand "Features" section
4. Toggle `showExportButton` to `false`
5. Click "Publish"

**Result**: Export button no longer visible

**Schema Impact**: ❌ None - PDF generation still works via API

---

### Scenario 5: Add Custom Section

**Goal**: Add a custom hero banner above dashboard

**Steps**:
1. Open Builder.io dashboard
2. Click "+ Add Block" before Dashboard Layout
3. Drag "Box" component
4. Configure:
   - Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
   - Padding: `48px`
5. Inside Box, add "Text" component:
   - Text: `<h1>Welcome to Your Dashboard</h1>`
   - Color: `white`
6. Click "Publish"

**Result**: Custom hero banner displays above dashboard

**Schema Impact**: ❌ None - Pure presentation layer

---

## 🔒 Schema Protection

### Firestore Schema Validation

All data is validated with **Zod schemas** before saving:

```typescript
import { validateFactfinder } from '@/schemas/firestore';

// In component
const handleSubmit = async (data) => {
  try {
    // Zod validates schema
    const validated = validateFactfinder(data);

    // Only valid data reaches Firestore
    await saveToFirestore(validated);
  } catch (error) {
    // Schema violation - prevents save
    console.error('Validation failed:', error);
  }
};
```

**Protection Level**:
- ❌ Cannot save data with wrong types (e.g., string instead of number)
- ❌ Cannot save missing required fields
- ❌ Cannot save invalid email formats
- ❌ Cannot modify collection structure

---

### Engine Protection

Calculation engines are **locked in Cloud Functions** and never exposed to Builder.io:

```typescript
// Cloud Function (NOT accessible from Builder.io)
export const processFactfinder = functions.firestore
  .document('factfinder/{prospectId}')
  .onWrite(async (change, context) => {
    // Run Monte Carlo (10k iterations)
    const monteCarloData = runMonteCarloSimulation({ ... });

    // Run Insurance Split (10/85 rule)
    const insuranceSplitData = calculateInsuranceSplit({ ... });

    // Match Compliance (JSON dataset)
    const complianceData = matchComplianceRequirements({ ... });

    // Calculate Savings
    const savingsData = calculateSavingsImpact({ ... });

    // Save all to Firestore
    await saveAllResults();
  });
```

**Builder.io CANNOT**:
- ❌ Modify Monte Carlo iterations (locked at 10,000)
- ❌ Change Insurance Split ratio (locked at 10/85)
- ❌ Edit compliance rules (JSON dataset)
- ❌ Alter savings percentages (60% / 160%)

**Builder.io CAN ONLY**:
- ✅ Display results with custom colors
- ✅ Format numbers with custom styling
- ✅ Add explanatory text around data

---

## 🧪 Testing Builder.io Changes

### Preview Mode

1. Make changes in Builder.io editor
2. Click "Preview" (top right)
3. See changes in real-time without publishing
4. Test on different screen sizes with responsive preview

### A/B Testing

Builder.io supports A/B testing for presentation elements:

```typescript
// Create variant in Builder.io
// Variant A: Blue CTA button
// Variant B: Purple CTA button

// Builder.io automatically splits traffic 50/50
// Track conversions to determine winner
```

### Rollback

If something breaks:
1. Go to Builder.io dashboard
2. Click "History" tab
3. Select previous version
4. Click "Restore"

All changes are versioned, so you can always roll back.

---

## 🔗 Data Binding Examples

### Fetch Data from Firestore

```typescript
import { useDashboardData } from '@/hooks/useFirestoreDoc';

function MyBuilderComponent({ prospectId }) {
  const { data, loading, error } = useDashboardData(prospectId);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>{data.factfinder?.company.name}</h1>
      <p>Employees: {data.factfinder?.company.employeeCount}</p>
      <Chart data={data.monteCarlo} />
    </div>
  );
}
```

### Save Data to Firestore

```typescript
import { useSaveFactfinder } from '@/hooks/useFirestoreDoc';

function MyForm() {
  const { saveFactfinder, saving } = useSaveFactfinder();

  const handleSubmit = async (formData) => {
    const result = await saveFactfinder('prospect-123', {
      company: {
        name: formData.companyName,
        employeeCount: formData.employees,
        state: formData.state,
      },
      // ... rest of data
    });

    if (result.success) {
      console.log('Saved to /factfinder/prospect-123');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Real-Time Updates

```typescript
import { useFactfinder } from '@/hooks/useFirestoreDoc';

function LiveDashboard({ prospectId }) {
  // Auto-updates when Firestore changes
  const { data } = useFactfinder(prospectId);

  return (
    <div>
      <h2>{data?.company.name}</h2>
      {/* Updates in real-time when Cloud Function completes */}
      <p>Processing: {data?.validated ? '✅ Complete' : '⏳ In Progress'}</p>
    </div>
  );
}
```

---

## 📁 File Structure

```
calculator-app/
├── src/
│   ├── builder/
│   │   ├── builder-components.tsx      ✅ Component registration
│   │   └── page-templates.json         ✅ Pre-built page templates
│   ├── hooks/
│   │   └── useFirestoreDoc.ts          ✅ Firestore data hooks
│   ├── schemas/
│   │   └── firestore.ts                ✅ Zod validation schemas
│   ├── components/
│   │   ├── Factfinder.tsx              📝 Form component
│   │   ├── DashboardEnhanced.tsx       📊 Dashboard component
│   │   ├── SniperMarketing.tsx         🎯 Marketing component
│   │   ├── ComplianceChecklist.tsx     ✅ Compliance component
│   │   └── charts/                     📈 Chart components
│   └── firebase/
│       └── config.ts                   🔥 Firebase initialization
├── functions/
│   └── src/
│       ├── engines/                    🔒 Protected calculation engines
│       └── index.ts                    ⚙️ Cloud Functions
├── .env                                🔑 VITE_BUILDER_API_KEY
└── BUILDER_IO_INTEGRATION.md           📖 This file
```

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Try to edit engine logic in Builder.io

```typescript
// This won't work - engines are in Cloud Functions
<MonteCarloChart iterations={5000} /> // ❌ iterations is locked at 10,000
```

### ✅ DO: Edit presentation of engine results

```typescript
// This works - you can customize how results are displayed
<MonteCarloChart lineColor="#ff00ff" height={600} /> // ✅ Presentation only
```

---

### ❌ DON'T: Modify Firestore schema in Builder.io

```typescript
// This will fail validation
saveFactfinder(prospectId, {
  company: {
    employeeCount: "100"  // ❌ Wrong type (should be number)
  }
});
```

### ✅ DO: Use validated data structures

```typescript
// This passes validation
saveFactfinder(prospectId, {
  company: {
    employeeCount: 100  // ✅ Correct type
  }
});
```

---

### ❌ DON'T: Hardcode prospect data

```typescript
// Bad - data should come from Firestore
<Dashboard
  companyName="Acme Corp"
  employeeCount={100}
/>
```

### ✅ DO: Fetch data with hooks

```typescript
// Good - data from Firestore with real-time updates
function DashboardPage({ prospectId }) {
  const { data } = useDashboardData(prospectId);
  return <Dashboard prospectId={prospectId} />;
}
```

---

## 🎓 Training Checklist

Before editing in Builder.io, make sure you understand:

- [ ] Builder.io edits **presentation only** (colors, text, layout)
- [ ] Firestore is the **system of record** (all data lives here)
- [ ] Cloud Functions are **protected** (calculation logic cannot be changed)
- [ ] All data is **validated with Zod** before saving
- [ ] Changes in Builder.io are **versioned** and can be rolled back
- [ ] Preview mode lets you **test without publishing**
- [ ] Real-time updates from Firestore happen **automatically**

---

## 📞 Support & Resources

### Documentation
- **Builder.io Docs**: https://www.builder.io/c/docs
- **Zod Validation**: https://zod.dev/
- **Firebase Firestore**: https://firebase.google.com/docs/firestore

### Code References
- **Component Registration**: `src/builder/builder-components.tsx`
- **Firestore Hooks**: `src/hooks/useFirestoreDoc.ts`
- **Validation Schemas**: `src/schemas/firestore.ts`
- **Engine Logic**: `functions/src/engines/` (view only)

### Getting Help
1. Check Builder.io preview mode for errors
2. Check browser console for validation errors
3. Review Zod schema in `src/schemas/firestore.ts`
4. Check Firebase console for Firestore data

---

## 🎉 Quick Wins

### 5-Minute Customizations

1. **Change Brand Colors** (2 min)
   - Edit Dashboard Layout → Colors → Primary/Accent

2. **Update CTA Button** (1 min)
   - Edit Sniper Marketing → CTA → Button Text

3. **Adjust Chart Colors** (2 min)
   - Edit Chart Component → Colors → Bar/Line/Pie colors

4. **Hide/Show Features** (1 min)
   - Edit Dashboard Layout → Features → Toggle checkboxes

5. **Change Section Titles** (1 min)
   - Edit Component → Text → Title/Description

---

**Status**: ✅ Builder.io Integration Complete
**Last Updated**: 2025-10-01
**Version**: 1.0.0
**Protected Logic**: All calculation engines remain locked in Cloud Functions
**Editable**: Colors, text, layout, styling (presentation layer only)
