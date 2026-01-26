# Sonia-Fred Execution Loop

## Mission Statement

**"Build a fail-closed execution loop where structure feeds action and state is law."**

## Overview

The Sonia-Fred loop is a deterministic, event-driven execution system where:
- **Sonia** (Organizer) normalizes inputs and prepares structured data
- **Fred** (Executor) makes decisions and executes actions
- **Canonical Record (CR)** serves as the single source of truth
- **No direct agent communication** - all state lives in the CR

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Input Sources                            │
│         (Files, Webhooks, Human Input, Scans)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │     SONIA     │  Organizer (Write-Only)
                │   (Normalizer)│  - Reads raw input
                └───────┬───────┘  - Normalizes to JSON
                        │          - Writes to CR
                        │          - Emits event
                        ▼
                ┌───────────────────┐
                │ CANONICAL RECORD  │  Single Source of Truth
                │   (Supabase DB)   │  - All state stored here
                └───────┬───────────┘  - No agent-to-agent talk
                        │
                        ▼
                ┌───────────────┐
                │      FRED     │  Executor (Decision + Action)
                │  (Executor)   │  - Polls CR for cleaned records
                └───────┬───────┘  - Evaluates deterministically
                        │          - Executes SAFE actions
                        │          - Updates CR status
                        ▼
                ┌───────────────────┐
                │   Execution      │
                │  (GitHub, n8n,   │
                │   Webhooks, etc) │
                └──────────────────┘
```

## Canonical Record Schema

The CR is the law. All state lives here.

### Fields

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `id` | UUID | - | Unique identifier |
| `source` | enum | `sonia`, `human`, `webhook` | Who created this record |
| `status` | enum | `new`, `cleaned`, `executed`, `failed`, `review` | Current state |
| `payload` | JSON | - | Raw input data |
| `normalized_payload` | JSON | - | Structured, validated data (by Sonia) |
| `verdict` | enum | `SAFE`, `REVIEW`, `FAIL` | Fred's decision |
| `next_action` | string | - | Optional guidance for next step |
| `last_actor` | enum | `sonia`, `fred` | Who last touched this record |
| `created_at` | timestamp | - | When record was created |
| `updated_at` | timestamp | - | When record was last modified |

### Status Flow

```
new → cleaned → executed ✓
            ↘ → failed ✗
            ↘ → review ⏸
```

## Agent Behavior

### Sonia (Organizer)

**Constraints:**
- ❌ Cannot execute
- ❌ Cannot decide outcomes
- ✅ Only writes CR state

**Trigger Sources:**
- Repository scan findings
- New file uploads
- Webhook intake
- Text input

**Actions:**
1. Read raw input
2. Normalize into structured JSON payload
3. Create CR with:
   - `status = cleaned`
   - `last_actor = sonia`
   - `normalized_payload = {...}`
4. Emit event (webhook/queue)
5. Exit (never waits for response)

**Example normalized_payload:**
```json
{
  "timestamp": "2026-01-26T10:00:00Z",
  "health_score": 95,
  "actions": [
    {
      "action_type": "create_github_issue",
      "title": "[SONIA] Missing file: config.json",
      "body": "Required configuration file missing...",
      "labels": ["bug", "sonia-agent"],
      "priority": "high"
    },
    {
      "action_type": "log_finding",
      "finding_summary": {
        "structural": 1,
        "tasks": 4,
        "signals": 2
      }
    }
  ]
}
```

### Fred (Executor)

**Constraints:**
- ❌ Never asks questions
- ❌ Cannot modify Sonia's normalized data
- ✅ Owns timing and execution

**Trigger:**
Polls CR for records where:
- `status = cleaned`
- `last_actor = sonia`

**Actions:**
1. Read `normalized_payload`
2. Evaluate deterministically
3. Assign verdict:
   - `SAFE` → execute
   - `REVIEW` → hold for human
   - `FAIL` → stop
4. If `SAFE`: Execute via configured executors
5. Update CR:
   - `status = executed | failed | review`
   - `verdict = SAFE | FAIL | REVIEW`
   - `last_actor = fred`

**Decision Logic:**
- Allowlist-based: only predefined action types are `SAFE`
- Missing fields → `FAIL`
- Unknown action type → `REVIEW`
- All checks pass → `SAFE`

**Safe Action Types:**
- `create_github_issue`
- `update_status_report`
- `log_finding`
- `notify_webhook`

## Loop Closure

**Sonia listens for:**
- `status = failed` → re-normalize/fix input
- `status = review` → generate human-readable summary
- `status = executed` → do nothing (silence = success)

**Fred never re-processes:**
- Once `status = executed`, record is final
- Failed records can be reset by humans only

## Enforcement Rules

These are hard-coded constraints:

1. ❌ **No agent-to-agent direct messaging** - All communication via CR
2. ❌ **No execution without CR** - Every action must have a CR entry
3. ❌ **No state mutation without `last_actor` update** - Enforces ownership
4. ✅ **Fred owns timing** - Sonia never waits for Fred
5. ✅ **Sonia owns structure** - Fred never modifies normalized data
6. ✅ **Humans only touch REVIEW states** - Agents can't override reviews

Any violation → hard error.

## Setup

### 1. Database Setup

Run the Canonical Record schema:

```bash
# If using Supabase
psql -U postgres -h your-db.supabase.co -d postgres < tools/canonical_record_schema.sql

# Or apply via Supabase dashboard SQL editor
```

### 2. Environment Configuration

Create `.env.local`:

```bash
# Supabase (Required for CR)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# GitHub (Optional, for issue creation)
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."

# Fred Configuration
FRED_POLL_INTERVAL=30000  # Poll every 30 seconds
FRED_DRY_RUN=true         # Set to false for actual execution
```

### 3. Run the Agents

**Terminal 1 - Sonia (runs once or on schedule):**
```bash
npm run sonia
```

**Terminal 2 - Fred (runs continuously):**
```bash
npm run fred
```

## Usage Examples

### Example 1: Basic Flow

```bash
# 1. Sonia scans repository
npm run sonia
# → Creates CR with status=cleaned

# 2. Fred polls and finds the record
# → Evaluates: verdict=SAFE
# → Executes actions
# → Updates CR: status=executed
```

### Example 2: Review Required

```bash
# 1. Sonia encounters unknown action type
# → Creates CR with normalized_payload containing unknown action

# 2. Fred evaluates
# → verdict=REVIEW
# → status=review
# → Waits for human intervention

# 3. Human reviews in Supabase dashboard
# → Updates record or creates new cleaned record
```

### Example 3: Failed Execution

```bash
# 1. Fred attempts to execute
# → GitHub API returns 403
# → status=failed
# → verdict=FAIL

# 2. Sonia polls for failed records
# → Generates error report
# → Optionally creates new CR with retry logic
```

## Monitoring

### Check CR Status

```sql
-- View recent records
SELECT id, source, status, verdict, last_actor, created_at
FROM canonical_records
ORDER BY created_at DESC
LIMIT 10;

-- Count by status
SELECT status, COUNT(*)
FROM canonical_records
GROUP BY status;

-- Find stuck records (cleaned but not processed)
SELECT id, created_at, normalized_payload->>'actions'
FROM canonical_records
WHERE status = 'cleaned'
  AND last_actor = 'sonia'
  AND created_at < NOW() - INTERVAL '1 hour';
```

### Fred Logs

```bash
# View Fred's polling activity
npm run fred | grep "FRED INFO"

# Check for errors
npm run fred | grep "FRED ERROR"
```

## Troubleshooting

### Fred not processing records

1. Check Fred is running: `ps aux | grep fred.agent.js`
2. Verify Supabase connection: Check `SUPABASE_URL` and `SUPABASE_KEY`
3. Check CR table exists: `SELECT * FROM canonical_records LIMIT 1;`
4. Look for `status=cleaned` and `last_actor=sonia` records

### Sonia not writing to CR

1. Verify `SUPABASE_URL` is set in environment
2. Check Supabase dashboard for API errors
3. Run with debug: `node sonia.agent.js 2>&1 | grep -i supabase`

### Infinite loops

The architecture prevents infinite loops:
- Sonia only writes new records
- Fred only processes `cleaned` records once
- Status transitions are one-way: `cleaned → executed | failed | review`

### Silent failures

Check:
1. Fred logs: `npm run fred | tail -100`
2. CR table: Look for `status=failed` records
3. Sonia logs: Check if CR write succeeded

## Testing

### Test Sonia → CR Writing

```bash
# Run Sonia
npm run sonia

# Check CR table
# Should see new record with status=cleaned
```

### Test Fred Decision Logic

```bash
# Start Fred in dry-run mode
FRED_DRY_RUN=true npm run fred

# Watch logs for decision outputs
```

### Test Full Loop

```bash
# Terminal 1: Start Fred
npm run fred

# Terminal 2: Run Sonia
npm run sonia

# Terminal 3: Monitor CR
watch -n 5 "psql ... -c 'SELECT status, last_actor, verdict FROM canonical_records ORDER BY updated_at DESC LIMIT 5;'"
```

## Definition of Done

✅ A new intake flows: Sonia → CR → Fred → execution  
✅ No infinite loops  
✅ No silent failures  
✅ CR always reflects reality  
✅ Violations result in hard errors  

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-26  
**Mission:** "Build a fail-closed execution loop where structure feeds action and state is law."
