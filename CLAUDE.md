# 🚀 Claude Bootstrap Guide - Sales Process IMO

## 📋 INSTANT REPO OVERVIEW

**Repository Name**: Sales Process IMO
**Primary Purpose**: Blueprint-based sales process planning with SSOT manifest and progress tracking
**Parent Architecture**: imo-creator
**Integration Hub**: Composio MCP server (port 3001) - **MANDATORY FOR ALL API CALLS**

## ⚠️ CRITICAL ARCHITECTURE RULE

**🚨 ALL EXTERNAL API CALLS MUST GO THROUGH COMPOSIO MCP SERVER - NO EXCEPTIONS 🚨**

See `COMPOSIO_INTEGRATION.md` for complete details. This is not negotiable.

---

## 🎯 CRITICAL PATHS & COMMANDS

### Immediate Startup Sequence
```bash
# 1. Start Composio MCP Server (MANDATORY - MUST RUN FIRST)
cd "C:\Users\CUSTOM PC\Desktop\Cursor Builds\scraping-tool\imo-creator\mcp-servers\composio-mcp"
node server.js

# 2. Navigate to Sales Process IMO repo
cd "C:\Users\CUSTOMER PC\Cursor Repo\sales\sales-process-imo"

# 3. Setup Python environment (first time)
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 4. Generate progress and visuals for sales blueprint
python tools/blueprint_score.py sales-example
python tools/blueprint_visual.py sales-example

# 5. (Optional) Run FastAPI backend
uvicorn src.server.main:app --port 7002 --reload

# 6. Open Sales Process UI
# Open docs/blueprints/ui/overview.html in browser
```

### Verify Composio MCP is Running
```bash
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_composio_stats", "data": {}, "unique_id": "HEIR-2025-10-SALES-TEST-01", "process_id": "PRC-SALES-TEST-001", "orbt_layer": 2, "blueprint_version": "1.0"}'
```

---

## 📁 REPOSITORY STRUCTURE

```
sales-process-imo/
├── 🔥 COMPOSIO_INTEGRATION.md    # CRITICAL: Read FIRST - Mandatory architecture rules
├── 🚀 CLAUDE.md                  # This bootstrap file
├── docs/
│   └── blueprints/
│       ├── ui/                   # 4-page HTML UI (overview, input, middle, output)
│       └── sales-example/        # Sales process blueprint manifests
├── tools/
│   ├── blueprint_score.py        # Progress calculation (done/wip/todo)
│   └── blueprint_visual.py       # Mermaid diagram generation
├── src/
│   └── server/
│       └── main.py              # FastAPI backend (uses Composio MCP)
├── packages/
│   ├── heir/                    # HEIR compliance validation
│   └── sidecar/                 # Event logging for telemetry
├── heir.doctrine.yaml           # HEIR metadata and compliance config
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
└── README.md                    # General documentation
```

---

## 🎯 SALES PROCESS SPECIFIC FEATURES

### What Makes This Different from Parent IMO Creator

1. **Sales-Focused Blueprints**: Stages tailored for sales workflows
   - Prospecting & Lead Generation
   - Qualification & Discovery
   - Proposal & Negotiation
   - Closing & Onboarding

2. **Sales-Specific Integrations** (ALL through Composio MCP):
   - **Gmail**: Sales outreach emails (3 accounts available)
   - **Google Sheets**: Lead tracking & pipeline management
   - **Google Calendar**: Meeting scheduling & follow-ups
   - **Million Verifier**: Email validation before outreach
   - **Google Drive**: Proposal & contract storage

3. **SSOT Manifest for Sales**: YAML-based sales pipeline configuration
   - Flexible stages per sales bucket (Input → Middle → Output)
   - Automatic progress scoring (done/wip/todo)
   - Visual progress tracking with Mermaid diagrams

---

## ✅ AVAILABLE INTEGRATIONS (via Composio MCP)

### Connected Google Accounts
- **service@svg.agency**: Gmail, Drive, Calendar, Sheets
- **djb258@gmail.com**: Gmail, Drive
- **dbarton@svg.agency**: Gmail, Drive

### Other Services
- **Million Verifier**: Email validation (API key configured)
- **Vercel**: Deployment platform
- **GitHub**: Repository management

### 🚨 REMINDER
**NEVER** make direct API calls. **ALWAYS** go through Composio MCP on port 3001.
See `COMPOSIO_INTEGRATION.md` for payload format and examples.

---

## 🚨 NEVER DO THESE THINGS

❌ **NEVER** make direct Google API calls (Gmail, Drive, etc.)
❌ **NEVER** implement custom OAuth flows
❌ **NEVER** use service API keys directly (except COMPOSIO_API_KEY)
❌ **NEVER** bypass Composio MCP "just this once"
❌ **NEVER** create custom SDK wrappers for external services
❌ **NEVER** commit .env files with real API keys
❌ **NEVER** skip HEIR/ORBT payload format for Composio calls

---

## 🎯 COMMON TASK PATTERNS

### 1. Working with Sales Blueprints
```bash
# Create new sales blueprint
cp docs/blueprints/sales-example docs/blueprints/my-sales-process

# Edit manifest
# Edit docs/blueprints/my-sales-process/manifest.yaml

# Generate progress scores
python tools/blueprint_score.py my-sales-process

# Generate visual diagrams
python tools/blueprint_visual.py my-sales-process

# View in UI
# Open docs/blueprints/ui/overview.html?blueprint=my-sales-process
```

### 2. Sending Sales Emails (via Composio MCP)
```javascript
// ✅ CORRECT WAY - Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'GMAIL_SEND_EMAIL',
    data: {
      to: 'prospect@example.com',
      subject: 'Sales Follow-up',
      body: 'Thank you for your interest...',
      account_id: 'ca_BSkcAvhBMH92' // service@svg.agency
    },
    unique_id: 'HEIR-2025-10-SALES-EMAIL-01',
    process_id: 'PRC-SALES-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});

// ❌ WRONG WAY - Direct API call
// const gmail = google.gmail('v1');
// await gmail.users.messages.send({ ... }); // NEVER DO THIS
```

### 3. Tracking Leads in Google Sheets (via Composio MCP)
```javascript
// ✅ CORRECT WAY - Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'GOOGLESHEETS_APPEND_ROW',
    data: {
      spreadsheet_id: 'your-spreadsheet-id',
      range: 'Leads!A:F',
      values: [['Lead Name', 'Email', 'Status', 'Stage', 'Value', 'Date']],
      account_id: 'ca_yGbhTw96db32' // service@svg.agency
    },
    unique_id: 'HEIR-2025-10-SALES-LEAD-01',
    process_id: 'PRC-SALES-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});
```

### 4. Validating Prospect Emails (via Composio MCP)
```javascript
// ✅ CORRECT WAY - Through Composio MCP
const response = await fetch('http://localhost:3001/tool', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'VERIFY_EMAIL',
    data: {
      email: 'prospect@example.com'
    },
    unique_id: 'HEIR-2025-10-SALES-VERIFY-01',
    process_id: 'PRC-SALES-' + Date.now(),
    orbt_layer: 2,
    blueprint_version: '1.0'
  })
});
```

---

## 🔧 ENVIRONMENT CONFIGURATION

### Required Environment Variables (.env)
```bash
# Composio Configuration (MANDATORY)
COMPOSIO_API_KEY=ak_t-F0AbvfZHUZSUrqAGNn
MCP_API_URL=https://backend.composio.dev

# MCP Server Configuration
IMOCREATOR_MCP_URL=http://localhost:3001
IMOCREATOR_SIDECAR_URL=http://localhost:8000
IMOCREATOR_BEARER_TOKEN=local-dev-token

# Doctrine ID Generation (Sales Process)
DOCTRINE_DB=shq
DOCTRINE_SUBHIVE=03
DOCTRINE_APP=sales
DOCTRINE_VER=1

# Optional: LLM Integration
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
LLM_DEFAULT_PROVIDER=openai

# CORS Configuration
ALLOW_ORIGIN=https://your-vercel-domain.vercel.app
PORT=7002

# ❌ NO DIRECT SERVICE API KEYS
# Everything goes through Composio MCP!
```

---

## 📖 ESSENTIAL DOCUMENTATION FILES (PRIORITY ORDER)

1. **COMPOSIO_INTEGRATION.md** - MANDATORY architecture rules (READ FIRST!)
2. **CLAUDE.md** - This bootstrap file
3. **README.md** - General project documentation
4. **heir.doctrine.yaml** - HEIR compliance configuration
5. **docs/composio_connection.md** - Additional Composio details (if exists)

---

## 🔄 TYPICAL SALES PROCESS WORKFLOW

1. **Start Session**
   - Read COMPOSIO_INTEGRATION.md + CLAUDE.md
   - Start Composio MCP server (port 3001)
   - Verify MCP connectivity

2. **Setup Sales Blueprint**
   - Create/edit manifest.yaml for sales stages
   - Define Input → Middle → Output buckets
   - Generate progress scores and visuals

3. **Implement Sales Features**
   - Build email outreach flows (via Composio MCP)
   - Set up lead tracking (via Composio MCP)
   - Schedule follow-ups (via Composio MCP)

4. **Test & Deploy**
   - Test all Composio integrations with curl
   - Verify HEIR/ORBT payload compliance
   - Deploy to Vercel (via Composio MCP)

---

## 🧪 DEBUGGING QUICK REFERENCE

### MCP Server Issues
```bash
# Check if Composio MCP is running
curl http://localhost:3001/mcp/health

# List all connected accounts
curl -X POST http://localhost:3001/tool \
  -H "Content-Type: application/json" \
  -d '{"tool": "manage_connected_account", "data": {"action": "list"}, "unique_id": "HEIR-2025-10-DEBUG-01", "process_id": "PRC-DEBUG-001", "orbt_layer": 2, "blueprint_version": "1.0"}'
```

### FastAPI Server Issues
```bash
# Check server status
curl http://localhost:7002/health

# View logs
uvicorn src.server.main:app --port 7002 --reload
```

### Blueprint Generation Issues
```bash
# Validate manifest YAML
python -c "import yaml; yaml.safe_load(open('docs/blueprints/sales-example/manifest.yaml'))"

# Re-run scoring
python tools/blueprint_score.py sales-example

# Re-generate visuals
python tools/blueprint_visual.py sales-example
```

---

## 💡 OPTIMIZATION TIPS

- **Always start MCP server first** - Nothing works without it
- **Use Task tool** for complex multi-file operations
- **Batch curl commands** for parallel testing
- **Reference COMPOSIO_INTEGRATION.md** for working examples
- **Keep MCP server running** throughout development session
- **Follow HEIR/ORBT format** strictly for audit compliance

---

## 🆘 EMERGENCY CONTACTS & RESOURCES

### Documentation
- **Composio Docs**: https://docs.composio.dev
- **MCP Specification**: https://modelcontextprotocol.io
- **HEIR Framework**: See heir.doctrine.yaml

### Troubleshooting
1. **MCP not responding**: Check port 3001, restart server
2. **Auth errors**: Verify COMPOSIO_API_KEY in .env
3. **Invalid account**: Check connected accounts list
4. **HEIR validation fails**: Ensure unique_id/process_id format is correct

---

## 🎯 SALES PROCESS USE CASES

### Common Sales Operations (All via Composio MCP)

1. **Prospecting**
   - Import leads from CSV → Google Sheets
   - Validate emails with Million Verifier
   - Send initial outreach via Gmail

2. **Qualification**
   - Schedule discovery calls via Google Calendar
   - Store call notes in Google Drive
   - Update lead status in Google Sheets

3. **Proposal**
   - Generate proposal docs in Google Drive
   - Send proposals via Gmail
   - Track proposal status in Google Sheets

4. **Closing**
   - Schedule closing calls via Google Calendar
   - Send contracts via Gmail + Drive
   - Update won/lost status in Sheets

5. **Onboarding**
   - Send welcome emails via Gmail
   - Create onboarding folders in Drive
   - Schedule onboarding calls via Calendar

**Remember**: Every single one of these operations MUST go through Composio MCP on port 3001.

---

## 🔒 SECURITY & COMPLIANCE

### Code Review Checklist
- [ ] No direct API calls to external services
- [ ] All requests use Composio MCP endpoint
- [ ] HEIR/ORBT payload format followed
- [ ] No hardcoded API keys (except COMPOSIO_API_KEY in .env)
- [ ] Connected account IDs referenced correctly
- [ ] Error handling accounts for MCP response format

### Automated Checks
```bash
# Check for forbidden patterns (should find NOTHING)
grep -r "googleapis" src/
grep -r "OAuth" src/
grep -r "CLIENT_SECRET" .
grep -r "GMAIL_API_KEY" .
```

---

**🎯 GOLDEN RULE**: This repository is a sales-focused implementation of the IMO Creator architecture. All external API calls MUST go through Composio MCP server - no exceptions, no shortcuts, no "just this once". This is the foundation of the entire system.

---

**Last Updated**: 2025-10-01
**Status**: Active - Sales Process Implementation
**Parent Project**: imo-creator
**Deployment**: Vercel + Render hybrid
