# 🔥 CRITICAL: Composio MCP Integration - Sales Process IMO

## ⚠️ MANDATORY ARCHITECTURE RULE

**🚨 ALL EXTERNAL API CALLS MUST GO THROUGH COMPOSIO MCP SERVER - NO EXCEPTIONS 🚨**

This is not a suggestion or best practice - it is a **HARD REQUIREMENT** for this system.

---

## 🛑 WHAT THIS MEANS

### ✅ ALLOWED
- Making API calls through Composio MCP server on port 3001
- Using HEIR/ORBT payload format for all requests
- Referencing connected accounts via Composio
- Extending Composio with new service integrations

### ❌ STRICTLY FORBIDDEN
- Direct API calls to Google services (Gmail, Drive, Calendar, Sheets)
- Custom OAuth implementations
- Direct HTTP requests to third-party APIs
- Environment variables for API keys (except Composio's own key)
- Bypassing MCP for "just this one request"
- Creating custom wrappers around third-party SDKs

---

## 🎯 WHY THIS ARCHITECTURE EXISTS

1. **Centralized Authentication**: All service credentials managed in one place
2. **HEIR/ORBT Compliance**: Every API call generates proper audit trails
3. **Caching & Rate Limiting**: MCP handles these automatically
4. **Error Handling**: Consistent error responses across all services
5. **Monitoring**: Single point for observability and logging
6. **Security**: No API keys scattered across codebase
7. **Maintainability**: One integration point to update, not dozens

---

## 🚀 COMPOSIO MCP SERVER

**Status**: ACTIVE on port 3001
**Location**: `C:\Users\CUSTOM PC\Desktop\Cursor Builds\scraping-tool\imo-creator\mcp-servers\composio-mcp`

### Start Server (REQUIRED BEFORE ANY API CALLS)
```bash
cd "C:\Users\CUSTOM PC\Desktop\Cursor Builds\scraping-tool\imo-creator\mcp-servers\composio-mcp"
node server.js
```

### Verify Server is Running
```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_composio_stats", "data": {}, "unique_id": "HEIR-2025-10-TEST-01", "process_id": "PRC-TEST-001", "orbt_layer": 2, "blueprint_version": "1.0"}'
```

---

## 📋 HEIR/ORBT PAYLOAD FORMAT (MANDATORY)

**Every single Composio call MUST use this exact format:**

```json
{
  "tool": "tool_name_here",
  "data": {
    // Tool-specific parameters go here
  },
  "unique_id": "HEIR-YYYY-MM-SYSTEM-MODE-VN",
  "process_id": "PRC-SYSTEM-EPOCHTIMESTAMP",
  "orbt_layer": 2,
  "blueprint_version": "1.0"
}
```

### ID Generation Rules
- `unique_id`: Must follow Barton Doctrine format (HEIR-YYYY-MM-SYSTEM-MODE-VN)
- `process_id`: Process identifier with timestamp (PRC-SYSTEM-EPOCHTIMESTAMP)
- `orbt_layer`: ORBT framework layer (typically 2 for API operations)
- `blueprint_version`: Current blueprint version (1.0)

---

## ✅ VERIFIED CONNECTED SERVICES

### Gmail Accounts (3 Active)
- **service@svg.agency**: `ca_BSkcAvhBMH92`
- **djb258@gmail.com**: `ca_Dh-5OnHENWcG`
- **dbarton@svg.agency**: `ca_TcSBw5YRBVbN`

### Google Drive Accounts (3 Active)
- **service@svg.agency**: `ca_CWoInx__nXq-`
- **djb258@gmail.com**: `ca_ovFzduXza8Ax`
- **dbarton@svg.agency**: `ca_6XD0QaOwLDR8`

### Google Calendar Account (1 Active)
- **service@svg.agency**: `ca_nJ2cJ6Ltzq4l`

### Google Sheets Account (1 Active)
- **service@svg.agency**: `ca_yGbhTw96db32`

### Million Verifier (Email Validation)
- **API Key**: `7hLlWoR3DCDoDwDllpafUh4U9`
- **Tools**: VERIFY_EMAIL, BATCH_VERIFY, GET_CREDITS, GET_RESULTS

### Vercel (Deployment)
- **Connected Account**: `ca_vkXglNynIxjm`
- **Projects**: imo-creator, imo-creator2

### GitHub (Available)
- Repository management, issues, PRs, releases

---

## 💻 IMPLEMENTATION EXAMPLES

### Example 1: Send Email via Gmail (CORRECT WAY)
```javascript
// ✅ CORRECT: Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'GMAIL_SEND_EMAIL',
    data: {
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: 'This is a test',
      account_id: 'ca_BSkcAvhBMH92' // service@svg.agency
    },
    unique_id: 'HEIR-2025-10-EMAIL-SEND-01',
    process_id: 'PRC-EMAIL-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});

// ❌ WRONG: Direct Gmail API call
const gmail = google.gmail('v1');
await gmail.users.messages.send({ ... }); // NEVER DO THIS
```

### Example 2: List Google Drive Files (CORRECT WAY)
```javascript
// ✅ CORRECT: Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'GOOGLEDRIVE_LIST_FILES',
    data: {
      account_id: 'ca_CWoInx__nXq-', // service@svg.agency
      folder_id: 'root',
      page_size: 100
    },
    unique_id: 'HEIR-2025-10-DRIVE-LIST-01',
    process_id: 'PRC-DRIVE-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});

// ❌ WRONG: Direct Drive API call
const drive = google.drive('v3');
await drive.files.list({ ... }); // NEVER DO THIS
```

### Example 3: Verify Email with Million Verifier (CORRECT WAY)
```javascript
// ✅ CORRECT: Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'VERIFY_EMAIL',
    data: {
      email: 'test@example.com'
    },
    unique_id: 'HEIR-2025-10-VERIFY-01',
    process_id: 'PRC-VERIFY-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});

// ❌ WRONG: Direct Million Verifier API call
const mvResponse = await fetch('https://api.millionverifier.com/...'); // NEVER DO THIS
```

---

## 🔧 SALES PROCESS INTEGRATION

### Architecture for Sales Process IMO
```
┌────────────────────────────┐
│  Sales Process IMO         │
│  (Blueprint UI)            │
└──────────┬─────────────────┘
           │
           │ ALL API CALLS
           ▼
┌────────────────────────────┐
│  Composio MCP Server       │
│  Port 3001                 │
│  (MANDATORY GATEWAY)       │
└──────────┬─────────────────┘
           │
           ├─► Gmail (Outreach)
           ├─► Drive (Documents)
           ├─► Calendar (Scheduling)
           ├─► Sheets (Lead Tracking)
           ├─► Million Verifier (Email Validation)
           └─► GitHub/Vercel (Deployment)
```

### Required Environment Variables
```bash
# Composio Configuration (REQUIRED)
COMPOSIO_API_KEY=ak_t-F0AbvfZHUZSUrqAGNn
MCP_API_URL=https://backend.composio.dev

# MCP Server Configuration
IMOCREATOR_MCP_URL=http://localhost:3001
IMOCREATOR_SIDECAR_URL=http://localhost:8000
IMOCREATOR_BEARER_TOKEN=local-dev-token

# Doctrine ID Generation
DOCTRINE_DB=shq
DOCTRINE_SUBHIVE=03
DOCTRINE_APP=sales
DOCTRINE_VER=1

# ❌ NO DIRECT SERVICE API KEYS ALLOWED
# No GOOGLE_API_KEY
# No GMAIL_CLIENT_SECRET
# No DRIVE_API_KEY
# Everything goes through Composio!
```

---

## 🧪 TESTING & VERIFICATION

### 1. Verify MCP Server is Running
```bash
curl http://localhost:3001/mcp/health
```

### 2. List All Connected Accounts
```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "manage_connected_account",
    "data": {"action": "list"},
    "unique_id": "HEIR-2025-10-LIST-01",
    "process_id": "PRC-LIST-001",
    "orbt_layer": 2,
    "blueprint_version": "1.0"
  }'
```

### 3. Test Gmail Integration
```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "GMAIL_GET_PROFILE",
    "data": {"account_id": "ca_BSkcAvhBMH92"},
    "unique_id": "HEIR-2025-10-GMAIL-TEST-01",
    "process_id": "PRC-GMAIL-TEST-001",
    "orbt_layer": 2,
    "blueprint_version": "1.0"
  }'
```

---

## 🚨 ENFORCEMENT & CODE REVIEW

### Code Review Checklist
Before any PR is merged, verify:

- [ ] No direct API calls to external services
- [ ] No custom OAuth implementations
- [ ] All API requests go through `http://localhost:3001/tool`
- [ ] All requests use HEIR/ORBT payload format
- [ ] No hardcoded API keys (except COMPOSIO_API_KEY in .env)
- [ ] Connected account IDs are referenced, not recreated
- [ ] Error handling accounts for MCP response format

### Automated Checks (TODO)
```bash
# Check for forbidden patterns
grep -r "googleapis" src/  # Should find NOTHING
grep -r "OAuth" src/       # Should find NOTHING (except in docs)
grep -r "CLIENT_SECRET" .  # Should find NOTHING (except in docs)
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- **Composio Docs**: https://docs.composio.dev
- **MCP Specification**: https://modelcontextprotocol.io
- **HEIR/ORBT Framework**: See heir.doctrine.yaml

### Related Files
- `src/server/main.py` - FastAPI backend (must use Composio)
- `tools/blueprint_*.py` - Blueprint tools (must use Composio)
- `.env.example` - Environment template

### Troubleshooting
1. **MCP server not responding**: Check if it's running on port 3001
2. **Authentication errors**: Verify COMPOSIO_API_KEY is set correctly
3. **Invalid account ID**: Check connected accounts list
4. **HEIR validation fails**: Ensure unique_id and process_id follow format

---

## 🔐 SECURITY NOTES

- **Never commit** `.env` files with real API keys
- **Rotate** Composio API key regularly
- **Monitor** MCP server logs for suspicious activity
- **Audit** all API calls through HEIR/ORBT compliance tracking
- **Limit** account access to only what's needed

---

## ✅ QUICK REFERENCE

### Do's
✅ Use Composio MCP for all external APIs
✅ Follow HEIR/ORBT payload format
✅ Reference connected account IDs
✅ Start MCP server before development
✅ Test with curl before implementing

### Don'ts
❌ Make direct API calls
❌ Implement custom OAuth
❌ Store service API keys
❌ Bypass MCP "just this once"
❌ Create custom SDK wrappers

---

**Last Updated**: 2025-10-01
**Status**: ACTIVE - MANDATORY COMPLIANCE REQUIRED
**Maintained By**: Sales Process IMO Team
**Related Project**: imo-creator (parent architecture)
