# Neon Promotion Layer - IMO Calculator

## Overview

The **Neon Promotion Layer** bridges Firebase (staging) and Neon (vault) by automatically promoting validated prospects to clients. When a prospect's status changes to `"client"`, data flows from Firebase's SPVPET schema to Neon's STAMPED schema with full validation, transformation, and audit logging.

---

## Architecture

### Data Flow

```
Firebase Factfinder (SPVPET)
    ↓ [Trigger: status = "client"]
Gatekeeper Validation
    ↓ [All engines verified]
Schema Transformation (SPVPET → STAMPED)
    ↓ [Mapping applied]
Neon Insert (via MCP)
    ↓ [5 tables updated]
Audit Logging (promotion_log)
    ↓ [Event recorded]
Confirmation (Firestore updated)
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **spvpet_to_stamped.json** | `functions/src/data/` | Schema mapping configuration |
| **promoteToNeon.ts** | `functions/src/` | Main Cloud Function (trigger + orchestration) |
| **gatekeeperValidator.ts** | `functions/src/utils/` | Pre-promotion validation logic |
| **stampedTransformer.ts** | `functions/src/utils/` | SPVPET → STAMPED transformation |
| **neonMcpClient.ts** | `functions/src/utils/` | Neon database client (via MCP) |
| **stamped.ts** | `functions/src/types/` | TypeScript type definitions |

---

## Schema Mapping: SPVPET → STAMPED

### Section 1: Clients Table

| SPVPET (Firebase) | STAMPED (Neon) | Description |
|-------------------|----------------|-------------|
| `prospect_id` | `client_id` | Unique identifier (promoted) |
| `company.name` | `company_name` | Legal company name |
| `company.ein` | `company_ein` | Employer Identification Number (formatted) |
| `company.industry` | `industry_classification` | Industry code/name |
| `company.employeeCount` | `employee_count` | Total employees |
| `company.state` | `primary_state` | Primary state (2-letter code) |
| `company.renewalDate` | `renewal_date` | Policy renewal date (ISO 8601) |
| `timestamp` | `promotion_timestamp` | Promotion timestamp |

### Section 2: Employees Table

| SPVPET (Firebase) | STAMPED (Neon) | Description |
|-------------------|----------------|-------------|
| `prospect_id` | `client_id` | Foreign key to clients |
| `census.employees[].id` | `employee_id` | Employee identifier |
| `census.employees[].age` | `age` | Employee age |
| `census.employees[].gender` | `gender` | Gender (M/F/X) |
| `census.employees[].dependents` | `dependent_count` | Number of dependents |
| `census.employees[].coverage_tier` | `coverage_tier` | Coverage type |
| `census.employees[].annual_claims` | `annual_claims_cost` | Annual claims cost |

### Section 3: Compliance Flags Table

| SPVPET (Firebase) | STAMPED (Neon) | Description |
|-------------------|----------------|-------------|
| `prospect_id` | `client_id` | Foreign key to clients |
| `matched.federal[]` | `federal_requirements` | Federal compliance (JSONB array) |
| `matched.state[]` | `state_requirements` | State compliance (JSONB array) |
| `matched.local[]` | `local_requirements` | Local compliance (JSONB array) |
| `aca_applicable` | `aca_applicable` | ACA applicability flag |
| `erisa_plan` | `erisa_plan` | ERISA plan flag |
| `timestamp` | `compliance_check_date` | Compliance check timestamp |

### Section 4: Financial Models Table

| SPVPET (Firebase) | STAMPED (Neon) | Description |
|-------------------|----------------|-------------|
| `prospect_id` | `client_id` | Foreign key to clients |
| `montecarlo.summary.p50` | `mc_p50_cost` | Monte Carlo 50th percentile |
| `montecarlo.summary.p95` | `mc_p95_cost` | Monte Carlo 95th percentile |
| `montecarlo.iterations` | `mc_iterations` | Number of simulation iterations |
| `montecarlo.volatility` | `mc_volatility_factor` | Volatility factor used |
| `insurance_split.high_utilizers.count` | `high_cost_utilizer_count` | High utilizer count (10%) |
| `insurance_split.high_utilizers.cost_total` | `high_cost_utilizers_total` | High utilizer costs (85% rule) |
| `insurance_split.low_utilizers.count` | `low_cost_utilizer_count` | Low utilizer count (90%) |
| `insurance_split.low_utilizers.cost_total` | `low_cost_utilizers_total` | Low utilizer costs (15% rule) |
| `timestamp` | `model_run_timestamp` | Model execution timestamp |

### Section 5: Savings Scenarios Table

| SPVPET (Firebase) | STAMPED (Neon) | Description |
|-------------------|----------------|-------------|
| `prospect_id` | `client_id` | Foreign key to clients |
| `retro.total_savings` | `retro_total_savings` | Retrospective total savings |
| `retro.percent_saved` | `retro_percent_saved` | Retrospective percent saved |
| `forward.projected_savings_year1` | `forward_savings_year1` | Year 1 projected savings |
| `forward.projected_savings_year3` | `forward_savings_year3` | Year 3 projected savings |
| `forward.projected_savings_year5` | `forward_savings_year5` | Year 5 projected savings |
| `assumptions.trend_factor` | `trend_factor` | Healthcare cost trend factor |
| `timestamp` | `calculation_timestamp` | Calculation timestamp |

---

## Promotion Lifecycle

### 1. Trigger

**Event:** Firestore document update on `/factfinder/{prospectId}` where `status` changes to `"client"`

**Function:** `promoteToNeon` Cloud Function activates

**Condition:** Status must transition from non-`"client"` to `"client"` (prevents duplicate promotions)

### 2. Validation (Gatekeeper)

**Checks:**
- ✅ Factfinder completeness (company, claims, census)
- ✅ Monte Carlo simulation exists (minimum 1,000 iterations)
- ✅ Insurance split calculated (10/85 rule)
- ✅ Compliance requirements matched (federal + state)
- ✅ Savings scenarios calculated (retro + forward)
- ✅ Data freshness (all engine outputs < 24 hours old)

**Outcome:**
- **Pass:** Proceed to transformation
- **Fail:** Update Firestore with `promotion_status: "validation_failed"` + error details

### 3. Transformation

**Process:** `StampedTransformer.transformFirebaseToNeon()`

**Steps:**
1. Transform factfinder → Client (Section 1)
2. Transform census → Employees[] (Section 2)
3. Transform compliance → ComplianceFlag (Section 3)
4. Transform montecarlo + insurance_split → FinancialModel (Section 4)
5. Transform savings → SavingsScenario (Section 5)

**Transformations Applied:**
- `format_ein`: Add hyphen to EIN (XX-XXXXXXX)
- `uppercase`: State codes, gender
- `parse_date`: Convert to ISO 8601
- `parse_currency`: Remove $, commas → decimal
- `json_array`: Convert arrays to JSONB-compatible format

### 4. Insert (Neon via MCP)

**Client:** `NeonMcpClient.insertStampedPayload()`

**Sequence:**
1. Insert into `clients` table (1 record)
2. Insert into `employees` table (N records)
3. Insert into `compliance_flags` table (1 record)
4. Insert into `financial_models` table (1 record)
5. Insert into `savings_scenarios` table (1 record)

**MCP Endpoint:** `POST {NEON_MCP_ENDPOINT}/neon/insert`

**Payload Format (HEIR/ORBT compliant):**
```json
{
  "tool": "neon_insert_client",
  "data": {
    "table": "clients",
    "record": { /* STAMPED client object */ }
  },
  "unique_id": "HEIR-2025-10-01-CLIENT-ABC123",
  "process_id": "PRC-PROMO-1696176000000",
  "orbt_layer": 2,
  "blueprint_version": "1.0"
}
```

**Retry Logic:** 3 attempts with exponential backoff (2s, 4s, 8s)

### 5. Audit Logging

**Table:** `promotion_log` in Neon

**Fields:**
- `promotion_id`: Unique promotion event ID
- `prospect_id`: Source prospect ID from Firebase
- `client_id`: Target client ID in Neon
- `promotion_timestamp`: Unix timestamp
- `agent_execution_signature`: `"firebase_cloud_function:promoteToNeon"`
- `schema_version`: `"1.0.0"`
- `blueprint_version_hash`: SHA-256 hash (16 chars)
- `status`: `"completed"`, `"failed"`, `"rolled_back"`, or `"pending"`
- `error_message`: Error details if failed
- `records_inserted`: Count per table (clients: 1, employees: N, etc.)

### 6. Confirmation

**Update Firestore `/factfinder/{prospectId}`:**
```json
{
  "promotion_status": "completed",
  "neon_client_id": "client_id_value",
  "promotion_timestamp": 1696176000000,
  "promotion_id": "promo_1696176000000_abc123",
  "records_inserted": {
    "clients": 1,
    "employees": 25,
    "compliance_flags": 1,
    "financial_models": 1,
    "savings_scenarios": 1
  }
}
```

---

## Test Instructions

### Prerequisites

1. **MCP Server Running:**
   ```bash
   # Ensure Composio MCP server is running on port 3001
   curl http://localhost:3001/mcp/health
   ```

2. **Neon MCP Endpoint Configured:**
   ```bash
   export NEON_MCP_ENDPOINT=http://localhost:3001/neon/insert
   ```

3. **Firebase Functions Deployed:**
   ```bash
   cd functions
   npm run deploy
   ```

### Test Scenario: Manual Promotion

**Step 1: Create Test Prospect**

```javascript
// In Firebase console or via SDK
db.collection('factfinder').doc('test_prospect_001').set({
  prospect_id: 'test_prospect_001',
  status: 'prospect',
  validated: true,
  company: {
    name: 'Test Company LLC',
    ein: '123456789',
    employeeCount: 50,
    state: 'CA',
    industry: 'Technology',
    renewalDate: '2025-12-31'
  },
  claims: {
    totalAnnualCost: 500000
  },
  census: {
    employees: [
      { id: 'emp_001', age: 35, gender: 'M', dependents: 2, coverage_tier: 'family', annual_claims: 15000 }
    ]
  },
  timestamp: Date.now()
});
```

**Step 2: Run Engines (processFactfinder)**

```javascript
// Trigger via HTTP function
const functions = require('firebase-functions-test')();
await functions.wrap(triggerProcessing)({ prospectId: 'test_prospect_001' });
```

**Wait for engine outputs to be created:**
- `/montecarlo/test_prospect_001`
- `/insurance_split/test_prospect_001`
- `/compliance/test_prospect_001`
- `/savings_scenarios/test_prospect_001`

**Step 3: Trigger Promotion**

```javascript
// Update status to "client"
db.collection('factfinder').doc('test_prospect_001').update({
  status: 'client',
  timestamp: Date.now()
});
```

**Step 4: Verify Promotion**

```javascript
// Check Firestore for promotion status
const factfinder = await db.collection('factfinder').doc('test_prospect_001').get();
console.log(factfinder.data().promotion_status); // Should be "completed"
console.log(factfinder.data().neon_client_id); // Should be "test_prospect_001"
```

**Step 5: Verify Neon Data**

```sql
-- Query Neon database
SELECT * FROM clients WHERE client_id = 'test_prospect_001';
SELECT * FROM employees WHERE client_id = 'test_prospect_001';
SELECT * FROM compliance_flags WHERE client_id = 'test_prospect_001';
SELECT * FROM financial_models WHERE client_id = 'test_prospect_001';
SELECT * FROM savings_scenarios WHERE client_id = 'test_prospect_001';
SELECT * FROM promotion_log WHERE prospect_id = 'test_prospect_001';
```

### Expected Results

✅ **Success Indicators:**
- Firestore `promotion_status` = `"completed"`
- All 5 Neon tables populated
- `promotion_log` entry with `status` = `"completed"`
- `records_inserted` counts match expectations

❌ **Failure Indicators:**
- Firestore `promotion_status` = `"validation_failed"` or `"insert_failed"`
- `promotion_errors` array populated
- `promotion_log` entry with `status` = `"failed"` and `error_message`

---

## Rollback Instructions

### Manual Rollback (If Promotion Fails Mid-Process)

**Step 1: Identify Failed Promotion**

```javascript
// Check Firestore
const factfinder = await db.collection('factfinder').doc(prospectId).get();
const promotionId = factfinder.data().promotion_id;
const clientId = factfinder.data().neon_client_id;
```

**Step 2: Delete Partial Neon Records**

```sql
-- Delete in reverse order (respect foreign keys)
DELETE FROM savings_scenarios WHERE client_id = '{clientId}';
DELETE FROM financial_models WHERE client_id = '{clientId}';
DELETE FROM compliance_flags WHERE client_id = '{clientId}';
DELETE FROM employees WHERE client_id = '{clientId}';
DELETE FROM clients WHERE client_id = '{clientId}';
```

**Step 3: Update Promotion Log**

```sql
UPDATE promotion_log
SET status = 'rolled_back',
    error_message = 'Manual rollback due to [reason]'
WHERE promotion_id = '{promotionId}';
```

**Step 4: Reset Firestore Status**

```javascript
await db.collection('factfinder').doc(prospectId).update({
  status: 'prospect',
  promotion_status: 'rolled_back',
  promotion_timestamp: Date.now(),
  promotion_errors: ['Manual rollback executed']
});
```

### Automated Rollback (Future Enhancement)

**Planned Feature:** `rollbackPromotion` Cloud Function

```javascript
// Future implementation
export const rollbackPromotion = functions.https.onCall(async (data, context) => {
  const { promotionId } = data;
  // 1. Fetch promotion_log entry
  // 2. Delete all records_inserted (if partial success)
  // 3. Update promotion_log status to 'rolled_back'
  // 4. Reset Firestore status
  return { success: true, message: 'Rollback completed' };
});
```

---

## Environment Variables

Add to `.env` or Firebase Functions config:

```bash
# Neon MCP Configuration
NEON_MCP_ENDPOINT=http://localhost:3001/neon/insert

# Optional: Override defaults
NEON_MCP_TIMEOUT=30000        # 30 seconds
NEON_MCP_RETRIES=3            # 3 attempts
```

Deploy to Firebase Functions:

```bash
firebase functions:config:set neon.mcp_endpoint="http://localhost:3001/neon/insert"
```

---

## Monitoring & Debugging

### Cloud Function Logs

```bash
# View promotion function logs
firebase functions:log --only promoteToNeon

# Filter for specific prospect
firebase functions:log --only promoteToNeon | grep "test_prospect_001"
```

### Firestore Monitoring

```javascript
// Listen for promotion status changes
db.collection('factfinder')
  .where('promotion_status', 'in', ['validation_failed', 'insert_failed', 'completed'])
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      console.log('Promotion event:', change.doc.id, change.doc.data().promotion_status);
    });
  });
```

### Neon Audit Log Queries

```sql
-- Recent promotions
SELECT promotion_id, prospect_id, status, promotion_timestamp
FROM promotion_log
ORDER BY promotion_timestamp DESC
LIMIT 10;

-- Failed promotions
SELECT *
FROM promotion_log
WHERE status = 'failed'
ORDER BY promotion_timestamp DESC;

-- Promotion success rate
SELECT status, COUNT(*) as count
FROM promotion_log
GROUP BY status;
```

---

## Common Issues & Solutions

### Issue 1: Validation Fails (Gatekeeper)

**Symptom:** `promotion_status` = `"validation_failed"`

**Solution:**
1. Check `promotion_errors` array in Firestore
2. Verify all engine outputs exist and are recent (< 24 hours)
3. Re-run `triggerProcessing` to regenerate engine outputs
4. Retry promotion by updating status to `"client"` again

### Issue 2: MCP Endpoint Unreachable

**Symptom:** `promotion_status` = `"insert_failed"`, error mentions timeout or connection

**Solution:**
1. Verify MCP server is running: `curl http://localhost:3001/mcp/health`
2. Check `NEON_MCP_ENDPOINT` environment variable
3. Ensure network connectivity between Firebase Functions and MCP server
4. Review MCP server logs for errors

### Issue 3: Schema Mismatch

**Symptom:** Insert fails with "column does not exist" or type errors

**Solution:**
1. Verify Neon table schemas match STAMPED definitions in `stamped.ts`
2. Run Neon migrations to add missing columns
3. Update `spvpet_to_stamped.json` if field names changed
4. Re-deploy functions after schema updates

### Issue 4: Duplicate Promotions

**Symptom:** Multiple `promotion_log` entries for same `prospect_id`

**Prevention:**
- Cloud Function checks `oldData.status` to prevent re-triggering
- Manually verify status before updating to `"client"`

**Cleanup:**
```sql
-- Identify duplicates
SELECT prospect_id, COUNT(*) as count
FROM promotion_log
GROUP BY prospect_id
HAVING COUNT(*) > 1;

-- Mark older entries as rolled_back
UPDATE promotion_log
SET status = 'rolled_back'
WHERE promotion_id IN (
  SELECT promotion_id FROM promotion_log
  WHERE prospect_id = '{prospectId}'
  ORDER BY promotion_timestamp ASC
  LIMIT 1 OFFSET 1
);
```

---

## Future Enhancements

- [ ] **Incremental Updates:** Support partial promotions (e.g., only update compliance flags)
- [ ] **Bulk Promotion:** Batch promote multiple prospects in single transaction
- [ ] **Webhook Notifications:** Trigger external systems on promotion completion
- [ ] **Automated Rollback:** One-click rollback via HTTP function
- [ ] **Data Validation Dashboard:** Real-time monitoring of promotion health
- [ ] **Schema Versioning:** Support multiple STAMPED schema versions
- [ ] **Promotion Scheduling:** Delay promotion until specific date/time
- [ ] **Dry Run Mode:** Test promotion without writing to Neon

---

## Support & Contact

**Documentation:** `NEON_PROMOTION_README.md` (this file)
**Schema Config:** `functions/src/data/spvpet_to_stamped.json`
**Type Definitions:** `functions/src/types/stamped.ts`
**Cloud Function:** `functions/src/promoteToNeon.ts`

**For Issues:**
1. Check Cloud Function logs: `firebase functions:log`
2. Query `promotion_log` table in Neon
3. Review Firestore `promotion_errors` field
4. Verify MCP server health and logs

---

**Last Updated:** 2025-10-01
**Schema Version:** 1.0.0
**Compatible With:** Firebase Functions v4.x, Neon Postgres, MCP Protocol
