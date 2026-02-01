# Architecture

## System Overview

The Marketing Cognition System implements a deterministic, fail-closed execution loop where **Sonia** (organizer) feeds **Fred** (executor) through a shared **Canonical Record (CR)**. All state lives in the CR. No direct agent communication occurs.

## Core Components

### Sonia (Organizer Agent)

**Purpose**: Structural observation, normalization, and preparation of actionable data.

**Responsibilities**:
- Scans repository for structural issues, tasks, and signals
- Detects TODO/FIXME patterns in code
- Tracks unchecked tasks in markdown files
- Monitors git activity signals
- Calculates repository health score (0-100 scale)
- Normalizes findings into structured actions array
- Writes to Canonical Record with `status=cleaned`
- Never waits for execution response

**Cannot**:
- Execute actions
- Decide outcomes
- Communicate directly with Fred

**File**: `sonia.agent.js` (~700 LOC)

**Modules**:
- `RepositoryScanner`: File and structure analysis
- `GitHubIntegration`: GitHub App authentication
- `ClaudeIntegration`: Optional AI analysis
- `SupabaseIntegration`: Legacy persistence
- `CanonicalRecordWriter`: CR write operations
- `StatusReportGenerator`: Human-readable reports
- `SoniaAgent`: Main orchestrator

### Fred (Executor Agent)

**Purpose**: Deterministic decision-making and safe action execution.

**Responsibilities**:
- Polls Canonical Record for `status=cleaned` records
- Evaluates each action in actions array
- Assigns verdict: SAFE, REVIEW, or FAIL
- Executes SAFE actions only
- Updates CR with verdict and execution results
- Owns execution timing

**Cannot**:
- Ask questions or request clarification
- Modify Sonia's normalized data
- Execute without CR record

**File**: `fred.agent.js` (~420 LOC)

**Modules**:
- `SupabaseClient`: Database operations
- `CanonicalRecordReader`: CR read and update operations
- `DecisionEngine`: Deterministic evaluation logic
- `Executor`: Safe action execution
- `FredAgent`: Main orchestrator with polling loop

**Safe Action Types**:
- `create_github_issue`: GitHub issue creation
- `update_status_report`: Status report updates
- `log_finding`: Finding persistence
- `notify_webhook`: Webhook notifications

### Canonical Record (CR)

**Purpose**: Single source of truth for all agent state.

**Implementation**: PostgreSQL/Supabase table

**Schema**:
```sql
CREATE TABLE canonical_records (
  id UUID PRIMARY KEY,
  source TEXT CHECK (source IN ('sonia', 'human', 'webhook')),
  status TEXT CHECK (status IN ('new', 'cleaned', 'executed', 'failed', 'review')),
  payload JSONB NOT NULL,
  normalized_payload JSONB,
  verdict TEXT CHECK (verdict IN ('SAFE', 'REVIEW', 'FAIL')),
  next_action TEXT,
  last_actor TEXT CHECK (last_actor IN ('sonia', 'fred')),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Indexed Fields**:
- `(status, last_actor)` for Fred's polling queries
- `created_at DESC` for chronological queries

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Input Sources                            │
│         (Files, Webhooks, Human Input, Scans)               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
                ┌───────────────┐
                │     SONIA     │  - Reads raw input
                │   (Normalizer)│  - Normalizes to JSON
                └───────┬───────┘  - Writes to CR (status=cleaned)
                        │          - last_actor=sonia
                        │
                        ▼
                ┌───────────────────┐
                │ CANONICAL RECORD  │  - Single source of truth
                │   (Supabase DB)   │  - All state stored here
                └───────┬───────────┘  - Indexed for polling
                        │
                        ▼
                ┌───────────────┐
                │      FRED     │  - Polls for status=cleaned
                │  (Executor)   │  - Evaluates actions
                └───────┬───────┘  - Executes SAFE verdicts
                        │          - Updates CR (last_actor=fred)
                        │
                        ▼
                ┌───────────────────┐
                │   Execution       │  - GitHub issues
                │   (External       │  - Webhooks
                │    Systems)       │  - Logs
                └───────────────────┘
```

## State Transitions

```
new → cleaned → executed ✓
            ↘ → failed ✗
            ↘ → review ⏸
```

**Status Definitions**:
- `new`: Raw input, not yet processed
- `cleaned`: Normalized by Sonia, ready for Fred
- `executed`: Successfully executed by Fred
- `failed`: Execution failed or validation failed
- `review`: Requires human intervention

## Decision Logic

Fred evaluates actions using a deterministic allowlist:

1. **Check payload structure**: Must contain `actions` array
2. **Evaluate each action individually**:
   - Missing `action_type` → FAIL
   - Unknown `action_type` → REVIEW
   - Missing required fields → FAIL
   - All checks pass → SAFE
3. **Aggregate verdict**:
   - Any FAIL → overall FAIL
   - Any REVIEW → overall REVIEW
   - All SAFE → overall SAFE

## Execution Model

**Fred Polling**:
- Interval: 30 seconds (configurable via `FRED_POLL_INTERVAL`)
- Query: `WHERE status='cleaned' AND last_actor='sonia'`
- Processing: Sequential, one record at a time

**Sonia Execution**:
- Trigger: Manual (`npm run sonia`) or scheduled
- Mode: Fire-and-forget (does not wait for Fred)
- Output: CR record + local files

**Loop Closure**:
Sonia can optionally monitor for:
- `status=failed`: Re-normalize or fix input
- `status=review`: Generate human-readable summary
- `status=executed`: No action (silence = success)

## Normalized Payload Structure

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
      },
      "timestamp": "2026-01-26T10:00:00Z"
    }
  ]
}
```

## Configuration

**Environment Variables**:
- `SUPABASE_URL`: Required for CR operations
- `SUPABASE_KEY`: Required for CR operations
- `GITHUB_OWNER`: Repository owner (default: auto-detect)
- `GITHUB_REPO`: Repository name (default: auto-detect)
- `GITHUB_APP_ID`: For GitHub issue creation
- `GITHUB_INSTALLATION_ID`: For GitHub issue creation
- `GITHUB_PRIVATE_KEY`: For GitHub issue creation
- `FRED_POLL_INTERVAL`: Polling interval in ms (default: 30000)
- `FRED_DRY_RUN`: Dry-run mode (default: false)
- `ENABLE_GITHUB`: Enable GitHub integration (default: true)

**Files**:
- `tools/canonical_record_schema.sql`: Database schema
- `.env.example`: Configuration template
- `package.json`: Includes `sonia` and `fred` scripts

## Failure Modes

**Sonia Failures**:
- Missing dependencies → Exit with error
- Supabase unavailable → Fall back to local files
- Invalid findings → Log warning, continue

**Fred Failures**:
- CR unavailable → Log error, retry on next poll
- Action execution fails → Update CR to `status=failed`
- Unknown action type → Update CR to `status=review`

**CR Failures**:
- Connection lost → Agents log errors
- Schema mismatch → Hard error on startup
- Constraint violation → Rejected with error

## Observability

**Sonia Output**:
- `SONIA_STATUS.md`: Human-readable status report
- `.sonia/sonia-findings.json`: Machine-readable findings
- `.sonia/github-proposals.json`: Proposed issues
- Console logs with [SONIA INFO] prefix

**Fred Output**:
- Console logs with [FRED INFO] prefix
- CR updates with execution results
- `.sonia/logs/*.json`: Individual finding logs

**CR Queries**:
```sql
-- View recent records
SELECT id, source, status, verdict, last_actor, created_at
FROM canonical_records
ORDER BY created_at DESC LIMIT 10;

-- Count by status
SELECT status, COUNT(*)
FROM canonical_records
GROUP BY status;

-- Find stuck records
SELECT id, created_at
FROM canonical_records
WHERE status = 'cleaned'
  AND last_actor = 'sonia'
  AND created_at < NOW() - INTERVAL '1 hour';
```

## Technology Stack

- **Language**: JavaScript (Node.js 18+)
- **Database**: PostgreSQL/Supabase
- **HTTP Client**: Native fetch API
- **GitHub Integration**: @octokit/auth-app
- **Testing**: Jest with ts-jest

## Design Philosophy

1. **Correctness over novelty**: Predictable behavior prioritized
2. **Clarity over cleverness**: Simple, explicit code
3. **Stability over velocity**: Conservative changes
4. **Observability**: All state changes logged
5. **Fail-closed**: Default to human review when uncertain
