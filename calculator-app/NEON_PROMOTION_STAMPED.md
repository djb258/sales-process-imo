# 🚀 Neon Promotion Layer - STAMPED Doctrine

## Overview

The IMO Calculator promotes validated prospects from **Firebase (SPVPET schema) → Neon (STAMPED schema)** when they become clients.

**STAMPED Doctrine** requires:
- `section_number`: Doctrine numbering system
- `column_number`: Unique column identifier
- `column_description`: Human-readable field name
- `column_format`: Data type/format specification
- `timestamp_last_touched`: Last modification timestamp

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Firebase Factfinder (SPVPET Schema)                         │
│  status = "client" triggers promotion                        │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  Gatekeeper Validator                                        │
│  - Checks factfinder completeness                            │
│  - Validates all engine outputs exist                        │
│  - Verifies data integrity                                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  STAMPED Schema Mapper                                       │
│  Maps SPVPET → STAMPED:                                      │
│  - Factfinder → Client                                       │
│  - Insurance Split → Employees                               │
│  - Compliance → Compliance Flags                             │
│  - Monte Carlo + Split → Financial Models                    │
│  - Savings → Savings Scenarios                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  Composio MCP (Port 3001)                                    │
│  ALL Neon operations go through MCP                          │
│  Tools: NEON_INSERT, NEON_INSERT_BATCH, NEON_QUERY          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL (STAMPED Tables)                            │
│  - clients                                                   │
│  - employees                                                 │
│  - compliance_flags                                          │
│  - financial_models                                          │
│  - savings_scenarios                                         │
│  - promotion_log                                             │
└──────────────────────────────────────────────────────────────┘
```

---

## Neon Tables (STAMPED Schema)

### 1. `clients` Table

```sql
CREATE TABLE clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  ein TEXT,
  industry TEXT,
  state TEXT NOT NULL,
  employee_count INTEGER NOT NULL,
  renewal_date TIMESTAMP,
  total_annual_cost DECIMAL(12, 2) NOT NULL,
  current_carrier TEXT,
  funding_type TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  promoted_at BIGINT NOT NULL,
  stamped_metadata JSONB -- STAMPED column metadata array
);
```

**Example Row**:
```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "prospect_id": "prospect-abc-123",
  "company_name": "Acme Corp",
  "state": "PA",
  "employee_count": 100,
  "total_annual_cost": 1000000.00,
  "stamped_metadata": [
    {
      "section_number": "1.1",
      "column_number": "C001",
      "column_description": "Company Name",
      "column_format": "string",
      "value": "Acme Corp",
      "timestamp_last_touched": 1696108800000
    }
  ]
}
```

### 2. `employees` Table

```sql
CREATE TABLE employees (
  employee_id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  dependent_count INTEGER,
  age_bracket TEXT,
  utilization_tier TEXT CHECK (utilization_tier IN ('high', 'standard')),
  created_at BIGINT NOT NULL,
  stamped_metadata JSONB
);
```

**Example Rows** (derived from Insurance Split 10/85 rule):
- High utilizers: `{client_id}-EMP-H-1`, `{client_id}-EMP-H-2`, ... (top 10%)
- Standard utilizers: `{client_id}-EMP-S-1`, `{client_id}-EMP-S-2`, ... (remaining 90%)

### 3. `compliance_flags` Table

```sql
CREATE TABLE compliance_flags (
  compliance_id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  requirement_type TEXT CHECK (requirement_type IN ('federal', 'state', 'local')),
  requirement_name TEXT NOT NULL,
  requirement_description TEXT NOT NULL,
  required BOOLEAN NOT NULL,
  deadline TIMESTAMP,
  category TEXT,
  created_at BIGINT NOT NULL,
  stamped_metadata JSONB
);
```

### 4. `financial_models` Table

```sql
CREATE TABLE financial_models (
  model_id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  model_type TEXT CHECK (model_type IN ('monte_carlo', 'insurance_split')),

  -- Monte Carlo fields
  baseline DECIMAL(12, 2),
  volatility DECIMAL(6, 4),
  simulations INTEGER,
  p10 DECIMAL(12, 2),
  p50 DECIMAL(12, 2),
  p90 DECIMAL(12, 2),
  p95 DECIMAL(12, 2),
  p99 DECIMAL(12, 2),
  mean DECIMAL(12, 2),
  std_dev DECIMAL(12, 2),

  -- Insurance Split fields
  high_utilizers_count INTEGER,
  high_utilizers_cost DECIMAL(12, 2),
  high_utilizers_avg DECIMAL(12, 2),
  standard_utilizers_count INTEGER,
  standard_utilizers_cost DECIMAL(12, 2),
  standard_utilizers_avg DECIMAL(12, 2),
  cost_multiplier DECIMAL(6, 2),

  created_at BIGINT NOT NULL,
  stamped_metadata JSONB
);
```

### 5. `savings_scenarios` Table

```sql
CREATE TABLE savings_scenarios (
  scenario_id TEXT PRIMARY KEY,
  client_id UUID REFERENCES clients(client_id),
  actual_cost DECIMAL(12, 2) NOT NULL,
  with_savings_cost DECIMAL(12, 2) NOT NULL,
  without_savings_cost DECIMAL(12, 2) NOT NULL,
  savings_amount DECIMAL(12, 2) NOT NULL,
  savings_percentage DECIMAL(5, 2) NOT NULL,
  cost_increase DECIMAL(12, 2) NOT NULL,
  increase_percentage DECIMAL(5, 2) NOT NULL,
  retro_description TEXT,
  forward_description TEXT,
  created_at BIGINT NOT NULL,
  stamped_metadata JSONB
);
```

### 6. `promotion_log` Table

```sql
CREATE TABLE promotion_log (
  log_id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL,
  client_id UUID,
  timestamp BIGINT NOT NULL,
  agent_execution_signature TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  blueprint_version_hash TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  records_created JSONB -- {clients: 1, employees: 100, ...}
);
```

---

## Promotion Workflow

### 1. Trigger

**Factfinder status changes to "client"**:
```typescript
await db.collection('factfinder').doc(prospectId).update({
  status: 'client'
});
```

This triggers the `promoteToNeon` Cloud Function.

### 2. Gatekeeper Validation

**File**: `functions/src/stamped/gatekeeper.ts`

**Checks**:
- ✅ Factfinder exists and is validated
- ✅ Company name, state, employee count present
- ✅ Total annual cost > 0
- ✅ Monte Carlo data exists with percentiles
- ✅ Insurance Split data exists with high/standard breakdown
- ✅ Compliance requirements exist
- ✅ Savings scenarios exist
- ✅ Data integrity (costs match across collections)

**Example**:
```typescript
import { validateProspectForPromotion } from './stamped/gatekeeper';

const result = await validateProspectForPromotion('prospect-123');

if (!result.canPromote) {
  console.error('Validation failed:', result.errors);
  // ["Monte Carlo simulation does not exist", ...]
}
```

### 3. Schema Mapping (SPVPET → STAMPED)

**File**: `functions/src/stamped/schema-mapper.ts`

**Mappers**:

```typescript
// Factfinder → Client
const neonClient = mapFactfinderToClient(prospectId, factfinder);
// Adds STAMPED metadata for each field

// Insurance Split → Employees (10/85 rule)
const neonEmployees = mapInsuranceSplitToEmployees(clientId, insuranceSplit);
// Creates employee records: 10 high utilizers + 90 standard

// Compliance → Compliance Flags
const neonFlags = mapComplianceToFlags(clientId, compliance);
// Separates federal, state, local requirements

// Monte Carlo → Financial Model
const monteCarloModel = mapMonteCarloToFinancialModel(clientId, monteCarlo);
// Includes baseline, volatility, P10/P50/P90/P95/P99

// Insurance Split → Financial Model
const insuranceSplitModel = mapInsuranceSplitToFinancialModel(clientId, insuranceSplit);
// Includes high/standard utilizer breakdown, cost multiplier

// Savings → Savings Scenario
const savingsScenario = mapSavingsToScenario(clientId, savings);
// Includes retro/forward descriptions, percentages
```

### 4. Insert via Composio MCP

**File**: `functions/src/stamped/neon-mcp.ts`

**ALL Neon operations go through Composio MCP on port 3001**:

```typescript
import { promoteProspectToNeon } from './stamped/neon-mcp';

const result = await promoteProspectToNeon(
  prospectId,
  neonClient,
  neonEmployees,
  neonComplianceFlags,
  neonFinancialModels,
  neonSavingsScenario
);

// MCP calls (behind the scenes):
// POST http://localhost:3001/tool
// {
//   "tool": "NEON_INSERT",
//   "data": { "table": "clients", "data": {...} },
//   "unique_id": "HEIR-2025-10-CALC-INSERT-CLIENT-001",
//   "process_id": "PRC-CALC-1696108800",
//   "orbt_layer": 2,
//   "blueprint_version": "1.0"
// }
```

### 5. Audit Logging

```typescript
import { createPromotionLog, insertPromotionLog } from './stamped';

const log = createPromotionLog(
  prospectId,
  neonClientId,
  'success',
  {
    clients: 1,
    employees: 100,
    compliance_flags: 8,
    financial_models: 2,
    savings_scenarios: 1
  }
);

await insertPromotionLog(log);
// Inserts into Neon promotion_log table via MCP
```

### 6. Confirm in Firebase

```typescript
import { markAsPromoted } from './stamped/gatekeeper';

await markAsPromoted(prospectId, neonClientId);
// Updates factfinder with:
// - promotion_status = "complete"
// - neon_client_id = "550e8400-..."
// - promoted_at = 1696108800
```

---

## Usage Examples

### Manual Promotion Trigger

```bash
# Via Firebase Cloud Function
curl -X POST https://us-central1-PROJECT.cloudfunctions.net/triggerPromotion \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data": {"prospectId": "prospect-123"}}'
```

### Check Promotion Status

```bash
curl -X POST https://us-central1-PROJECT.cloudfunctions.net/getPromotionStatus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data": {"prospectId": "prospect-123"}}'
```

**Response**:
```json
{
  "prospectId": "prospect-123",
  "status": "client",
  "promotionStatus": "complete",
  "neonClientId": "550e8400-e29b-41d4-a716-446655440000",
  "promotedAt": 1696108800000,
  "promotionError": null
}
```

### Query Neon Client

```typescript
import { getNeonClientByProspectId } from './stamped/neon-mcp';

const result = await getNeonClientByProspectId('prospect-123');

if (result.success) {
  console.log('Neon Client:', result.data);
  // {
  //   client_id: "550e8400-...",
  //   prospect_id: "prospect-123",
  //   company_name: "Acme Corp",
  //   stamped_metadata: [...]
  // }
}
```

---

## STAMPED Metadata Example

Every field in Neon includes STAMPED metadata:

```json
{
  "section_number": "1.1",
  "column_number": "C003",
  "column_description": "Employee Count",
  "column_format": "integer",
  "value": 100,
  "timestamp_last_touched": 1696108800000
}
```

**Section Numbers**:
- `1.1` - Company Information
- `1.2` - Insurance Details
- `1.3` - Contact Information
- `2.1` - Employee Data
- `3.1` - Federal Compliance
- `3.2` - State Compliance
- `3.3` - Local Compliance
- `4.1` - Monte Carlo Model
- `4.2` - Monte Carlo Percentiles
- `4.3` - Insurance Split Model
- `5.1` - Savings Costs
- `5.2` - Savings Calculations

---

## Error Handling

### Gatekeeper Failures

**Scenario**: Factfinder incomplete
```
[PROMOTE] Gatekeeper validation failed: [
  "Monte Carlo simulation does not exist",
  "Company name is required"
]
```

**Result**:
- Promotion fails
- `promotion_status = "failed"`
- `promotion_error` set in Firebase
- Failed log inserted into `promotion_log`

### MCP Connection Failures

**Scenario**: Composio MCP not running
```
[PROMOTE] Neon MCP server not available on port 3001
```

**Result**:
- Promotion fails immediately
- No data written to Neon
- Error logged

### Partial Insertion Failures

**Scenario**: Client inserted, but employees fail
```
[PROMOTE] Failed to insert employees: Connection timeout
```

**Result**:
- Client exists in Neon
- Promotion marked as "partial"
- Can retry employees only

---

## Testing

### 1. Test Gatekeeper

```bash
cd calculator-app/functions
npx tsx src/stamped/gatekeeper.ts
```

### 2. Test Schema Mapper

```bash
npx tsx src/stamped/schema-mapper.ts
```

### 3. Test Full Promotion (Local)

```bash
# Start Firebase emulator
firebase emulators:start

# Start Composio MCP
cd mcp-servers/composio-mcp && node server.js

# Trigger promotion
curl -X POST http://localhost:5001/PROJECT/us-central1/triggerPromotion \
  -H "Content-Type: application/json" \
  -d '{"data": {"prospectId": "test-prospect-1"}}'
```

### 4. Test Neon MCP

```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "NEON_QUERY",
    "data": {
      "query": "SELECT * FROM clients LIMIT 1"
    },
    "unique_id": "HEIR-2025-10-TEST-01",
    "process_id": "PRC-TEST-001",
    "orbt_layer": 2,
    "blueprint_version": "1.0"
  }'
```

---

## Deployment

### 1. Deploy Cloud Functions

```bash
cd calculator-app/functions
npm run build
firebase deploy --only functions:promoteToNeon,functions:triggerPromotion,functions:getPromotionStatus
```

### 2. Create Neon Tables

```bash
# Connect to Neon via MCP
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "NEON_EXECUTE",
    "data": {
      "sql": "CREATE TABLE IF NOT EXISTS clients (...)"
    },
    "unique_id": "HEIR-2025-10-SETUP-01",
    "process_id": "PRC-SETUP-001",
    "orbt_layer": 2,
    "blueprint_version": "1.0"
  }'
```

Or use Neon Console to run SQL migrations.

### 3. Test End-to-End

1. Create factfinder via form
2. Wait for engines to process
3. Update status to "client":
   ```typescript
   await db.collection('factfinder').doc(prospectId).update({ status: 'client' });
   ```
4. Check Neon for new client:
   ```sql
   SELECT * FROM clients WHERE prospect_id = 'prospect-123';
   ```

---

## File Structure

```
functions/src/
├── stamped/
│   ├── schema-mapper.ts        # SPVPET → STAMPED mappers
│   ├── gatekeeper.ts           # Validation logic
│   └── neon-mcp.ts             # Neon MCP operations
├── promoteToNeon.ts            # Main Cloud Function
└── index.ts                    # Exports promoteToNeon

NEON_PROMOTION_STAMPED.md       # This file
```

---

## Integration with Sales Process

This promotion layer integrates with the broader sales process:

**Pipeline**:
1. **Factfinder** → Prospect fills form
2. **Engines** → Monte Carlo, Insurance Split, Compliance, Savings
3. **Dashboard** → Prospect reviews results
4. **PDF** → Export report
5. **ActiveCampaign Sync** → Prospect added to CRM
6. **Status Update** → Sales rep marks as "client"
7. **Neon Promotion** → Data promoted to STAMPED schema
8. **Client Management** → Ongoing client operations in Neon

---

## Monitoring

### Promotion Logs

```sql
SELECT * FROM promotion_log
WHERE status = 'failed'
ORDER BY timestamp DESC
LIMIT 10;
```

### Promotion Success Rate

```sql
SELECT
  status,
  COUNT(*) as count
FROM promotion_log
GROUP BY status;
```

### Recent Promotions

```sql
SELECT
  prospect_id,
  client_id,
  timestamp,
  records_created
FROM promotion_log
WHERE status = 'success'
ORDER BY timestamp DESC
LIMIT 20;
```

---

**Status**: ✅ Neon Promotion Layer Complete
**Last Updated**: 2025-10-01
**Schema Version**: 2.0.0 (STAMPED)
**Architecture**: Firebase (SPVPET) → Composio MCP → Neon (STAMPED)
**Critical Rule**: ALL Neon operations MUST go through Composio MCP on port 3001
