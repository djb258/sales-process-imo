# IMO Calculator App

A TypeScript + React calculator app following the IMO doctrine (Input → Middle → Output) for insurance cost analysis.

## 🎯 Architecture

### I (Input) - Factfinder
Collects:
- Company information
- Census data
- Claims history
- State location

### M (Middle) - Static Engines
1. **Monte Carlo Simulation** - Risk analysis with volatility modeling
2. **Insurance Split (10/85 rule)** - 10% of employees drive 85% of costs
3. **Compliance Matcher** - Federal, state, and local requirements
4. **Savings Vehicle Impact** - Retro and forward scenario analysis

### O (Output) - Dashboard + PDF
- Multi-tab dashboard (Factfinder, Monte Carlo, Compliance, Sniper Marketing)
- Sub-tabs for detailed analysis
- PDF export with unique URL
- Firestore-backed storage

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd calculator-app
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### 2. Configure Firebase
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Firebase credentials
# Get these from Firebase Console > Project Settings
```

### 3. Run Development Server
```bash
# Start Vite dev server
npm run dev

# In another terminal, start Firebase emulators (optional)
npm run functions:serve
```

### 4. Access the App
- **Factfinder Form**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard/{prospect_id}

## 📁 Project Structure

```
calculator-app/
├── src/
│   ├── components/
│   │   ├── Factfinder.tsx      # Input form
│   │   └── Dashboard.tsx       # Output dashboard
│   ├── engines/
│   │   ├── monteCarlo.ts       # Monte Carlo simulation
│   │   ├── insuranceSplit.ts   # 10/85 rule engine
│   │   ├── compliance.ts       # Compliance matcher
│   │   └── savingsVehicle.ts   # Savings impact calculator
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── lib/
│   │   └── firebase.ts         # Firebase initialization
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── functions/
│   └── src/
│       ├── index.ts            # Cloud Functions
│       └── engines/            # Shared engine logic
├── public/
├── firebase.json               # Firebase configuration
├── vite.config.ts              # Vite configuration
└── package.json
```

## 🔧 Firestore Collections

### `/factfinder/{prospect_id}`
- Company, census, claims data
- `validated: true` triggers Cloud Function processing

### `/montecarlo/{prospect_id}`
- Simulation results
- Percentiles (p10, p50, p90)

### `/insurance_split/{prospect_id}`
- Top 10% vs remaining 90% breakdown
- Cost share analysis

### `/compliance/{prospect_id}`
- Federal, state, local requirements
- Deadlines and descriptions

### `/savings_scenarios/{prospect_id}`
- Actual, withSavings, withoutSavings
- Retro and forward scenarios

### `/presentations/{prospect_id}`
- Dashboard URL
- Generated timestamp

### `/pdfs/{prospect_id}`
- Download URL
- Storage path

## 🎨 Builder.io Integration

The Factfinder component is designed to be Builder.io-friendly:

1. **Clean component structure** - Simple props and state management
2. **Inline styles** - Easy to customize in Builder.io visual editor
3. **Form validation** - react-hook-form integration
4. **Builder.io SDK** - Ready to import as a custom component

To register with Builder.io:
```typescript
import { Builder } from '@builder.io/react';
import { Factfinder } from './components/Factfinder';

Builder.registerComponent(Factfinder, {
  name: 'IMO Factfinder',
  inputs: [
    // Define any custom props here
  ],
});
```

## ⚡ Firebase Cloud Functions

### `processFactfinder`
- **Trigger**: Firestore write to `factfinder/{prospectId}` where `validated = true`
- **Action**: Runs all engines and saves results to respective collections

### `generatePdf`
- **Type**: HTTPS Callable Function
- **Input**: `{ prospectId: string }`
- **Output**: `{ downloadUrl: string }`

### `triggerProcessing`
- **Type**: HTTPS Callable Function (for testing)
- **Input**: `{ prospectId: string }`
- **Action**: Manually triggers factfinder processing

## 🧪 Testing

### Test Factfinder Flow
1. Fill out the form at http://localhost:3000
2. Submit the form
3. Note the `prospect_id` returned
4. Navigate to `/dashboard/{prospect_id}`
5. Verify all tabs display data

### Test Cloud Functions Locally
```bash
# Start Firebase emulators
firebase emulators:start

# Test in another terminal
curl -X POST http://localhost:5001/your-project/us-central1/generatePdf \
  -H "Content-Type: application/json" \
  -d '{"data": {"prospectId": "test-123"}}'
```

## 🚀 Deployment

### Deploy Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the dist/ folder
```

### Deploy Firebase Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## ⚠️ IMPORTANT: Composio MCP Integration

**ALL EXTERNAL API CALLS MUST GO THROUGH COMPOSIO MCP SERVER - NO EXCEPTIONS**

See `../COMPOSIO_INTEGRATION.md` for complete details.

This calculator app is optimized for **low frequency usage** (5-10 runs per week), prioritizing clarity over scale.

## 📊 Dashboard Features

### Main Tabs
1. **Factfinder** - Summary of input data
2. **Monte Carlo** - Risk analysis with sub-tabs:
   - Risk Simulation
   - Insurance Split
   - Savings Impact
3. **Compliance** - Requirements with sub-tabs:
   - Federal
   - State
   - Local
4. **Sniper Marketing** - (Placeholder for future features)

### PDF Export
- Click "Export PDF" button on dashboard
- Generates comprehensive PDF with all tabs
- Returns unique download URL
- Stored in `/pdfs/{prospect_id}` collection

## 🔐 Security Notes

- Never commit `.env` files
- Keep Firebase credentials secure
- Use Firestore security rules in production
- Validate all user inputs on backend

## 📝 Next Steps

1. **Implement actual PDF generation** - Currently a placeholder
2. **Add chart visualizations** - Use Recharts for Monte Carlo results
3. **Enhance compliance rules** - Add more state-specific requirements
4. **Build Sniper Marketing tab** - Custom marketing insights
5. **Add authentication** - Firebase Auth integration
6. **Implement caching** - Reduce Firestore reads

## 💡 Tips

- **Low frequency, high clarity**: Code is optimized for readability
- **Builder.io ready**: Components designed for visual editing
- **Type-safe**: Full TypeScript coverage
- **Firebase-first**: Leverages Firestore and Cloud Functions

---

**Built with**: React, TypeScript, Vite, Firebase, IMO Doctrine

**Status**: Initial scaffold complete, ready for enhancement
