# Error Handling System - IMO Calculator

## Overview

The **Unified Error Management System** provides centralized error tracking, classification, and recovery across all IMO Calculator processes. Errors are logged to Firebase for real-time monitoring and mirrored to Neon for long-term audit compliance.

---

## Architecture

### Data Flow

```
Cloud Function Error
    ↓
ErrorLogger.logError()
    ↓
Severity Classification (auto or manual)
    ↓
Write to Firebase /error_log/{error_id}
    ↓
[If HIGH/CRITICAL] Mirror to Neon shq.error_log
    ↓
[If threshold met] Send notification (Slack/webhook)
    ↓
Resolution workflow (unresolved → in_progress → resolved → archived)
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **errorLog.ts** | `functions/src/types/` | Error schema definitions (TypeScript) |
| **errorClassifier.ts** | `functions/src/utils/` | Automatic severity classification |
| **errorLogger.ts** | `functions/src/lib/` | Main error logging utility |
| **neon_error_log_schema.sql** | `functions/src/data/` | Neon database schema (SQL) |

---

## Error Schema

### Firebase Collection: `/error_log/{error_id}`

```typescript
{
  error_id: string;              // Unique error ID (e.g., "err_1696176000000_a1b2c3d4")
  prospect_id: string | null;    // Associated prospect (if applicable)
  client_id: string | null;      // Associated client (if promoted)
  process: string;               // Process identifier (see ErrorProcess enum)
  message: string;               // Sanitized error message
  severity: string;              // low | medium | high | critical
  timestamp: string;             // ISO 8601 timestamp
  agent_execution_signature: string;
  blueprint_version_hash: string;
  resolution_status: string;     // unresolved | in_progress | resolved | wont_fix | archived
  resolution_notes: string;
  error_code: string;            // Generated code (e.g., "ERR-NEO-3A7F2B")
  stack_trace: string;           // Stack trace summary (first 3-4 frames)
  request_payload: any;          // Original request data
  retry_count: number;           // Number of retry attempts
  function_name: string;         // Cloud Function name
  environment: string;           // production | development
  created_at: string;
  updated_at: string;
  resolved_at: string;
}
```

### Neon Table: `shq.error_log`

Same schema as Firebase, with additional STAMPED compliance fields:
- `section_number` = 6 (Error & Audit Logs)
- `column_number` = auto-incremented
- `timestamp_last_touched` = Unix milliseconds (auto-updated)

---

## Severity Classification

### Automatic Classification Rules

The system automatically classifies errors based on **message keywords**, **process type**, and **retry count**.

#### Severity Levels

| Severity | Description | Examples | Neon Mirror | Notification |
|----------|-------------|----------|-------------|--------------|
| **LOW** | Non-critical UI bugs, validation warnings | Dashboard rendering errors, form validation | ❌ No | ❌ No |
| **MEDIUM** | Degraded functionality, retry failures | API timeouts, connection errors | ❌ No | ❌ No |
| **HIGH** | Data integrity issues, promotion failures | Neon promotion failed, compliance violation | ✅ Yes | ✅ Yes |
| **CRITICAL** | System failures, data loss, security breaches | Database corruption, unauthorized access | ✅ Yes | ✅ Yes |

#### Keyword-Based Classification

**CRITICAL Keywords:**
- "data loss", "corruption", "security breach", "unauthorized access", "sql injection", "system crash"

**HIGH Keywords:**
- "promotion failed", "compliance violation", "validation failed", "schema mismatch", "data integrity"

**MEDIUM Keywords:**
- "retry exceeded", "timeout", "connection refused", "service unavailable", "rate limit"

#### Process-Based Classification

If no keywords match, severity is determined by process type:

| Process | Default Severity | Reason |
|---------|------------------|--------|
| `neon_promotion` | HIGH | Affects data integrity and client records |
| `compliance_matching` | HIGH | Regulatory compliance risk |
| `schema_transformation` | HIGH | Data mapping errors cause downstream failures |
| `activecampaign_sync` | MEDIUM | External integration, can be retried |
| `pdf_generation` | MEDIUM | User experience impact, not data integrity |
| `monte_carlo_simulation` | MEDIUM | Engine failure, can be re-run |
| `dashboard_rendering` | LOW | UI-only issue, no data impact |

#### Retry Count Escalation

- **≥5 retries** → Escalate to HIGH (persistent failures)
- **≥3 retries** → Escalate to MEDIUM

---

## Error Process Identifiers

Standardized process names for error context:

```typescript
enum ErrorProcess {
  // Engines
  MONTE_CARLO = 'monte_carlo_simulation',
  INSURANCE_SPLIT = 'insurance_split_calculation',
  COMPLIANCE_MATCHING = 'compliance_matching',
  SAVINGS_CALCULATION = 'savings_calculation',

  // Output
  PDF_GENERATION = 'pdf_generation',
  DASHBOARD_RENDERING = 'dashboard_rendering',

  // Integrations
  ACTIVECAMPAIGN_SYNC = 'activecampaign_sync',
  NEON_PROMOTION = 'neon_promotion',

  // Validation
  FACTFINDER_VALIDATION = 'factfinder_validation',
  GATEKEEPER_VALIDATION = 'gatekeeper_validation',

  // Infrastructure
  MCP_CLIENT = 'mcp_client',
  FIREBASE_OPERATION = 'firebase_operation',
  NEON_OPERATION = 'neon_operation',
}
```

---

## Logging Flow

### 1. Basic Error Logging

```typescript
import { ErrorLogger } from './lib/errorLogger';
import { ErrorProcess } from './types/errorLog';

try {
  // Your code here
  await someOperation();
} catch (error) {
  await ErrorLogger.logError({
    prospect_id: 'prospect_123',
    process: ErrorProcess.NEON_PROMOTION,
    message: error.message,
    stack_trace: error.stack,
    function_name: 'promoteToNeon',
  });

  throw error; // Re-throw if needed
}
```

**What happens:**
1. Error is logged to Firebase `/error_log/{error_id}`
2. Severity is auto-classified based on message and process
3. If severity is HIGH/CRITICAL → mirrored to Neon `shq.error_log`
4. If severity meets threshold → notification sent (Slack/webhook)

### 2. Error Handling with Automatic Retry

```typescript
import { ErrorLogger } from './lib/errorLogger';
import { ErrorProcess } from './types/errorLog';

const result = await ErrorLogger.withErrorHandling(
  ErrorProcess.ACTIVECAMPAIGN_SYNC,
  async () => {
    // Your operation that might fail
    return await syncToActiveCampaign(prospectId);
  },
  {
    prospectId: 'prospect_123',
    functionName: 'syncActiveCampaign',
    maxRetries: 3, // Optional, defaults to 3
  }
);
```

**What happens:**
1. Executes the function
2. If error occurs and is **transient** (timeout, network error):
   - Retries with exponential backoff (2s, 4s, 8s...)
   - Logs error only on final attempt
3. If error is **non-transient** (validation error, not found):
   - Logs immediately and throws
4. Returns result on success

**Transient error keywords:**
- "timeout", "connection refused", "network error", "service unavailable", "rate limit"

### 3. Explicit Severity Override

```typescript
import { ErrorLogger } from './lib/errorLogger';
import { ErrorProcess, ErrorSeverity } from './types/errorLog';

await ErrorLogger.logError({
  prospect_id: 'prospect_123',
  process: ErrorProcess.COMPLIANCE_MATCHING,
  message: 'Failed to match ACA requirements',
  severity: ErrorSeverity.CRITICAL, // Force critical severity
  error_code: 'COMP-ACA-001',
  request_payload: { state: 'CA', employeeCount: 50 },
  function_name: 'matchComplianceRequirements',
});
```

---

## Resolution Workflow

### Resolution States

```
unresolved → in_progress → resolved → archived
                         ↘ wont_fix
```

| Status | Description |
|--------|-------------|
| `unresolved` | Error logged, no action taken yet |
| `in_progress` | Under investigation by human/agent |
| `resolved` | Fixed and verified, ready for archival |
| `wont_fix` | Acknowledged but not actionable (e.g., third-party API issue) |
| `archived` | Resolved and promoted to Neon for long-term audit |

### Updating Resolution Status

```typescript
import { ErrorLogger } from './lib/errorLogger';
import { ResolutionStatus } from './types/errorLog';

await ErrorLogger.resolveError({
  error_id: 'err_1696176000000_a1b2c3d4',
  resolution_status: ResolutionStatus.RESOLVED,
  resolution_notes: 'Fixed schema mapping for employeeTotal field. Deployed to production.',
  resolved_by: 'agent_claude_4.1',
});
```

**What happens:**
1. Updates Firebase `/error_log/{error_id}` with new status and notes
2. Sets `updated_at` timestamp
3. If status = `resolved`, sets `resolved_at` timestamp
4. If status = `resolved`, mirrors updated entry to Neon with status = `archived`

---

## Querying Errors

### Get Error by ID

```typescript
const error = await ErrorLogger.getError('err_1696176000000_a1b2c3d4');
console.log(error?.message);
```

### Get Errors by Prospect

```typescript
const errors = await ErrorLogger.getErrorsByProspect('prospect_123');
console.log(`Found ${errors.length} errors for prospect_123`);
```

### Get Unresolved Errors

```typescript
const unresolvedErrors = await ErrorLogger.getUnresolvedErrors(50);
unresolvedErrors.forEach((err) => {
  console.log(`${err.error_id}: ${err.severity} - ${err.message}`);
});
```

### Get Errors by Severity

```typescript
import { ErrorSeverity } from './types/errorLog';

const criticalErrors = await ErrorLogger.getErrorsBySeverity(ErrorSeverity.CRITICAL, 20);
```

---

## Neon Database Queries

### Unresolved High/Critical Errors

```sql
SELECT * FROM shq.critical_errors_unresolved
ORDER BY timestamp DESC;
```

### Error Statistics by Process

```sql
SELECT * FROM shq.error_stats_by_process
ORDER BY total_errors DESC;
```

### Recent Errors (Last 24 Hours)

```sql
SELECT * FROM shq.errors_recent_24h;
```

### Most Common Error Messages (Last 7 Days)

```sql
SELECT message, COUNT(*) as count
FROM shq.error_log
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY message
ORDER BY count DESC
LIMIT 10;
```

### Errors for Specific Prospect

```sql
SELECT * FROM shq.error_log
WHERE prospect_id = 'prospect_123'
ORDER BY timestamp DESC;
```

### Resolution Success Rate

```sql
SELECT
  resolution_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM shq.error_log
GROUP BY resolution_status
ORDER BY count DESC;
```

---

## Notification Configuration

### Environment Variables

```bash
# Error notification webhook (Slack, Discord, etc.)
ERROR_NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Notification severity threshold (only send for HIGH and above)
ERROR_NOTIFICATION_THRESHOLD=high

# Blueprint version hash (for tracking)
BLUEPRINT_VERSION_HASH=abc123def456

# Agent signature
AGENT_SIGNATURE=firebase_cloud_function:imo_calculator
```

### Slack Notification Format

When an error meets the severity threshold, a structured notification is sent:

```json
{
  "text": "🚨 HIGH Error Detected",
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "🚨 HIGH Error: neon_promotion" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Error ID:*\nerr_1696176000000_a1b2c3d4" },
        { "type": "mrkdwn", "text": "*Prospect ID:*\nprospect_123" },
        { "type": "mrkdwn", "text": "*Process:*\nneon_promotion" },
        { "type": "mrkdwn", "text": "*Severity:*\nhigh" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*Message:*\n```Field mapping failed: employeeTotal undefined```" }
    }
  ]
}
```

---

## Test Cases

### Test Case 1: Simulate ActiveCampaign API Down

**Scenario:** ActiveCampaign MCP server is unreachable

**Setup:**
```bash
# Stop ActiveCampaign MCP server or set invalid endpoint
export ACTIVECAMPAIGN_MCP_ENDPOINT=http://localhost:9999/invalid
```

**Trigger:**
```typescript
// In your ActiveCampaign sync function
try {
  await syncToActiveCampaign('prospect_123', {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  });
} catch (error) {
  // Error will be logged automatically if using withErrorHandling
}
```

**Expected Results:**
1. ✅ Error logged to Firebase `/error_log/{error_id}`
2. ✅ Message contains "connection refused" or "service unavailable"
3. ✅ Severity = `MEDIUM` (ActiveCampaign sync + transient error keyword)
4. ✅ Retry count = 3 (after exponential backoff retries)
5. ✅ Error NOT mirrored to Neon (MEDIUM < HIGH threshold)
6. ✅ No notification sent (MEDIUM < HIGH threshold)

**Verification:**
```typescript
const errors = await ErrorLogger.getErrorsByProspect('prospect_123');
const acError = errors.find((e) => e.process === ErrorProcess.ACTIVECAMPAIGN_SYNC);
console.log(acError?.severity); // Should be "medium"
console.log(acError?.retry_count); // Should be 3
```

---

### Test Case 2: Simulate Neon Insert Failure

**Scenario:** Neon promotion fails due to schema mismatch

**Setup:**
```typescript
// Corrupt factfinder data to cause schema transformation error
await db.collection('factfinder').doc('test_prospect_002').set({
  prospect_id: 'test_prospect_002',
  status: 'client',
  validated: true,
  company: {
    // Missing required field: employeeCount
    name: 'Test Company',
    ein: '12-3456789',
    state: 'CA',
  },
  claims: {
    totalAnnualCost: 100000,
  },
  timestamp: Date.now(),
});
```

**Trigger:**
```bash
# Trigger promotion by setting status to "client"
# promoteToNeon function will automatically run
```

**Expected Results:**
1. ✅ Error logged to Firebase `/error_log/{error_id}`
2. ✅ Message contains "employeeCount" or "field mapping failed"
3. ✅ Severity = `HIGH` (neon_promotion process = HIGH by default)
4. ✅ Process = `neon_promotion`
5. ✅ Error mirrored to Neon `shq.error_log` (HIGH ≥ threshold)
6. ✅ Notification sent via webhook (HIGH ≥ threshold)
7. ✅ Firestore `/factfinder/test_prospect_002` updated with `promotion_status: "validation_failed"`

**Verification:**

**Firebase:**
```typescript
const errors = await ErrorLogger.getErrorsBySeverity(ErrorSeverity.HIGH);
const neonError = errors.find((e) => e.prospect_id === 'test_prospect_002');
console.log(neonError?.message); // Should mention "employeeCount"
```

**Neon:**
```sql
SELECT * FROM shq.error_log
WHERE prospect_id = 'test_prospect_002'
  AND process = 'neon_promotion';
```

**Slack:**
- Check webhook URL for notification with error details

---

### Test Case 3: Error Recovery and Resolution

**Scenario:** Resolve an error after fixing the underlying issue

**Setup:**
1. Create error from Test Case 2 (Neon promotion failure)
2. Fix factfinder data:

```typescript
await db.collection('factfinder').doc('test_prospect_002').update({
  'company.employeeCount': 50,
});
```

3. Retry promotion:

```typescript
await db.collection('factfinder').doc('test_prospect_002').update({
  status: 'client',
  timestamp: Date.now(),
});
```

**Resolution:**
```typescript
// Get error ID from previous failure
const errors = await ErrorLogger.getErrorsByProspect('test_prospect_002');
const errorToResolve = errors[0];

// Mark as resolved
await ErrorLogger.resolveError({
  error_id: errorToResolve.error_id,
  resolution_status: ResolutionStatus.RESOLVED,
  resolution_notes: 'Added missing employeeCount field to factfinder. Promotion succeeded on retry.',
  resolved_by: 'agent_test',
});
```

**Expected Results:**
1. ✅ Firebase error entry updated:
   - `resolution_status` = `"resolved"`
   - `resolution_notes` = filled
   - `resolved_at` = current timestamp
2. ✅ Neon error entry created with `resolution_status` = `"archived"`
3. ✅ Promotion succeeds on retry
4. ✅ New promotion_log entry shows `status: "completed"`

**Verification:**
```typescript
const resolvedError = await ErrorLogger.getError(errorToResolve.error_id);
console.log(resolvedError?.resolution_status); // "resolved"
console.log(resolvedError?.resolved_at); // timestamp
```

```sql
SELECT * FROM shq.error_log
WHERE error_id = '{error_id}'
  AND resolution_status = 'archived';
```

---

## Integration with Existing Functions

All major Cloud Functions now have automatic error handling:

### ✅ Wrapped Functions

1. **processFactfinder** → Wraps all 4 engine processes (Monte Carlo, Insurance Split, Compliance, Savings)
2. **generatePdf** → Wraps PDF generation with retry (maxRetries=1)
3. **promoteToNeon** → Logs errors on promotion failure

### Example: Monte Carlo Engine Error

**Before (no error handling):**
```typescript
const monteCarloData = runMonteCarloSimulation({
  baseline: factfinder.claims.totalAnnualCost,
  volatility: 0.2,
  simulations: 10000,
});
```

**After (with error handling):**
```typescript
await ErrorLogger.withErrorHandling(
  ErrorProcess.MONTE_CARLO,
  async () => {
    const monteCarloData = runMonteCarloSimulation({
      baseline: factfinder.claims.totalAnnualCost,
      volatility: 0.2,
      simulations: 10000,
    });

    await db.collection('montecarlo').doc(prospectId).set({
      prospect_id: prospectId,
      ...monteCarloData,
      timestamp: Date.now(),
    });
  },
  { prospectId, functionName: 'processFactfinder:monteCarlo' }
);
```

**Benefits:**
- Automatic retry on transient errors
- Error logging to Firebase + Neon
- Severity classification
- Stack trace capture
- No need to manually handle try/catch

---

## Best Practices

### 1. Always Use ErrorLogger for External Operations

```typescript
// ✅ GOOD: Wrapped in error handler
await ErrorLogger.withErrorHandling(
  ErrorProcess.ACTIVECAMPAIGN_SYNC,
  async () => await mcpClient.syncContact(prospectId),
  { prospectId, functionName: 'syncActiveCampaign' }
);

// ❌ BAD: No error handling
await mcpClient.syncContact(prospectId);
```

### 2. Provide Context in Error Logs

```typescript
// ✅ GOOD: Includes prospect_id, request_payload, function_name
await ErrorLogger.logError({
  prospect_id: 'prospect_123',
  process: ErrorProcess.NEON_PROMOTION,
  message: error.message,
  stack_trace: error.stack,
  request_payload: { client_id: 'client_123', table: 'clients' },
  function_name: 'promoteToNeon',
});

// ❌ BAD: Minimal context
await ErrorLogger.logError({
  process: ErrorProcess.NEON_PROMOTION,
  message: error.message,
});
```

### 3. Use Explicit Severity for Critical Business Logic

```typescript
// ✅ GOOD: Force CRITICAL for compliance violations
if (complianceViolation) {
  await ErrorLogger.logError({
    prospect_id: prospectId,
    process: ErrorProcess.COMPLIANCE_MATCHING,
    message: 'ACA compliance requirement not met',
    severity: ErrorSeverity.CRITICAL,
  });
}
```

### 4. Sanitize Sensitive Data

Error messages are automatically sanitized to remove:
- API keys
- Tokens
- Passwords
- Secrets
- Bearer tokens

**Example:**
```typescript
// Original error message:
"Failed to authenticate with token=sk-ant-api03-abc123"

// Sanitized message (logged):
"Failed to authenticate with [REDACTED]"
```

### 5. Monitor Error Trends

```sql
-- Daily error count trend (last 30 days)
SELECT
  DATE(timestamp) as error_date,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count
FROM shq.error_log
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY error_date DESC;
```

---

## Troubleshooting

### Issue 1: Errors Not Appearing in Neon

**Symptom:** Errors logged to Firebase but not mirrored to Neon

**Possible Causes:**
1. Severity < HIGH (only HIGH/CRITICAL errors go to Neon)
2. MCP endpoint unreachable or misconfigured
3. Neon table schema not created

**Solution:**
```bash
# Check error severity
const error = await ErrorLogger.getError('err_xxx');
console.log(error.severity); // Must be 'high' or 'critical'

# Verify MCP endpoint
echo $NEON_MCP_ENDPOINT # Should be http://localhost:3001/neon/insert

# Create Neon table
psql -h your-neon-host -U your-user -d your-db -f functions/src/data/neon_error_log_schema.sql
```

---

### Issue 2: No Notifications Sent

**Symptom:** High/critical errors logged but no Slack notification

**Possible Causes:**
1. Webhook URL not configured
2. Severity threshold not met
3. Webhook endpoint down

**Solution:**
```bash
# Check environment variable
echo $ERROR_NOTIFICATION_WEBHOOK_URL

# Test webhook manually
curl -X POST $ERROR_NOTIFICATION_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test notification"}'

# Check Cloud Function logs
firebase functions:log --only errorLogger
```

---

### Issue 3: Too Many Retries Causing Timeouts

**Symptom:** Functions timing out due to excessive retry attempts

**Solution:**
```typescript
// Reduce maxRetries for long-running operations
await ErrorLogger.withErrorHandling(
  ErrorProcess.PDF_GENERATION,
  async () => generatePdf(prospectId),
  { prospectId, maxRetries: 1 } // Limit to 1 retry for slow operations
);
```

---

## Future Enhancements

- [ ] **Error Dashboard**: Real-time web UI for error monitoring
- [ ] **Automated Resolution**: AI agent suggests fixes for common errors
- [ ] **Error Grouping**: Cluster similar errors by error_code
- [ ] **Performance Metrics**: Track MTTR (Mean Time To Resolution)
- [ ] **Proactive Alerts**: Anomaly detection for error rate spikes
- [ ] **Integration with PagerDuty**: On-call escalation for critical errors
- [ ] **Error Replay**: Re-execute failed operations from error log

---

## Support & Contact

**Documentation:**
- `ERROR_HANDLING_README.md` (this file)
- `functions/src/types/errorLog.ts` (schema definitions)
- `functions/src/lib/errorLogger.ts` (main utility)
- `functions/src/data/neon_error_log_schema.sql` (Neon schema)

**For Issues:**
1. Check Firebase error logs: `firebase functions:log`
2. Query Neon error table: `SELECT * FROM shq.error_log WHERE ...`
3. Review error classification: `ErrorClassifier.classifySeverity()`

---

**Last Updated:** 2025-10-01
**Schema Version:** 1.0.0
**Compatible With:** Firebase Functions v4.x, Neon Postgres, MCP Protocol
