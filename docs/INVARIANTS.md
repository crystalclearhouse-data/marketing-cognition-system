# Invariants

This document defines the immutable rules that govern the Sonia-Fred execution loop. These constraints are enforced in code and cannot be violated without system failure.

## Core Invariants

### 1. No Agent-to-Agent Direct Messaging

**Rule**: Sonia and Fred never communicate directly.

**Enforcement**:
- Architecture: No shared channels, sockets, or message queues between agents
- All communication occurs via Canonical Record writes and reads
- Agents operate in separate processes with no IPC

**Violation**: Hard error. System will not function with direct agent communication.

**Rationale**: Eliminates race conditions, ensures audit trail, maintains single source of truth.

---

### 2. No Execution Without Canonical Record

**Rule**: Every action must have a corresponding CR entry.

**Enforcement**:
- Fred's executor requires a CR record ID
- No action methods can be called without CR context
- All execution results are written back to CR

**Violation**: Hard error. Execution without CR is rejected.

**Rationale**: Ensures accountability, auditability, and replay capability.

---

### 3. No State Mutation Without `last_actor` Update

**Rule**: Every CR update must explicitly set `last_actor`.

**Enforcement**:
- `CanonicalRecordReader.updateRecord()` requires `last_actor` in updates
- Database trigger auto-updates `updated_at` on every mutation
- Application code validates `last_actor` presence before writes

**Violation**: Hard error. Updates without `last_actor` are rejected.

**Rationale**: Tracks ownership, prevents ambiguous state, enables debugging.

---

### 4. Fred Owns Timing

**Rule**: Fred controls when execution occurs.

**Enforcement**:
- Fred polls CR at configured intervals
- Sonia never waits for Fred's response
- No external systems can trigger Fred directly

**Violation**: Architectural violation. External triggers are ignored.

**Rationale**: Prevents thundering herd, enables backpressure, maintains predictability.

---

### 5. Sonia Owns Structure

**Rule**: Sonia defines the normalized payload schema.

**Enforcement**:
- Fred never modifies `normalized_payload`
- Fred reads `normalized_payload` as immutable input
- Schema changes require Sonia updates

**Violation**: Logical error. Fred modifications to payload are ignored.

**Rationale**: Clear responsibility boundaries, schema evolution control.

---

### 6. Canonical Record Is Law

**Rule**: CR is the single source of truth for all agent state.

**Enforcement**:
- No agent maintains local state across executions
- All status changes recorded in CR
- No side channels for state propagation

**Violation**: Architectural violation. Out-of-band state is not recognized.

**Rationale**: Eliminates state drift, enables disaster recovery, supports debugging.

---

### 7. Humans Only Touch REVIEW States

**Rule**: Automated agents do not override records in `status=review`.

**Enforcement**:
- Fred skips records with `status=review`
- Sonia does not overwrite existing `review` records
- Human intervention required to change `review` status

**Violation**: Logical error. Agent modifications to review records are blocked.

**Rationale**: Preserves human judgment, prevents automation override.

---

## Status Transition Invariants

### 8. Status Transitions Are One-Way

**Rule**: Status flows in defined directions only.

**Valid Transitions**:
```
new → cleaned → executed
          ↘ → failed
          ↘ → review
```

**Invalid Transitions**:
- `executed` → `cleaned` (no backwards)
- `failed` → `executed` (no direct recovery)
- `review` → `cleaned` (requires human reset)

**Enforcement**:
- Application logic validates transitions
- Database constraints prevent invalid states

**Violation**: Hard error. Invalid transitions are rejected.

**Rationale**: Prevents loops, maintains audit trail, enforces lifecycle.

---

### 9. Only Sonia Writes `status=cleaned`

**Rule**: Fred never sets `status=cleaned`.

**Enforcement**:
- Sonia's CR writer is the only code path to `status=cleaned`
- Fred only writes: `executed`, `failed`, `review`

**Violation**: Logic error. Fred cannot write `cleaned` status.

**Rationale**: Clear ownership, prevents circular processing.

---

### 10. Only Fred Writes `verdict`

**Rule**: Sonia never sets `verdict` field.

**Enforcement**:
- Verdict field is null when Sonia writes CR
- Fred's decision engine is the only code path to verdict
- Sonia does not read or modify verdict

**Violation**: Logic error. Sonia cannot write verdict.

**Rationale**: Separation of concerns, decision authority clarity.

---

## Execution Invariants

### 11. Fail-Closed Decision Logic

**Rule**: When uncertain, Fred assigns `verdict=REVIEW`.

**Enforcement**:
- Unknown action types → `REVIEW`
- Missing required fields → `FAIL`
- Allowlist-based: only known-safe actions → `SAFE`

**Violation**: Logic error. Optimistic execution is blocked.

**Rationale**: Safety over convenience, human-in-loop for edge cases.

---

### 12. Actions Are Idempotent

**Rule**: Executing the same action twice produces the same result.

**Enforcement**:
- Action executors check for existing state before creating
- GitHub issue creation checks for duplicates
- Log writes use unique timestamps

**Violation**: Best-effort. Duplicate detection may fail.

**Rationale**: Enables retry, prevents duplicate side effects.

---

### 13. No Silent Failures

**Rule**: All failures are logged and reflected in CR.

**Enforcement**:
- Try-catch blocks in all execution paths
- Failed actions update CR with `status=failed`
- Console logs for all error conditions

**Violation**: Bug. Silent failures are system defects.

**Rationale**: Observability, debugging support, accountability.

---

## Data Invariants

### 14. Normalized Payload Contains Actions Array

**Rule**: Sonia always writes `normalized_payload.actions` as an array.

**Enforcement**:
- Sonia's normalizer creates actions array
- Fred's decision engine validates array presence
- Empty arrays are valid (no-op)

**Violation**: Hard error. Fred rejects payloads without actions array.

**Rationale**: Consistent interface, enables batch processing.

---

### 15. Action Objects Have `action_type`

**Rule**: Every action must have an `action_type` field.

**Enforcement**:
- Fred's decision engine checks each action
- Missing `action_type` → `verdict=FAIL`

**Violation**: Execution blocked. Invalid actions are not executed.

**Rationale**: Type safety, execution routing.

---

### 16. CR Fields Are Immutable After Write

**Rule**: Once written, `payload` and `created_at` never change.

**Enforcement**:
- Application code does not modify these fields
- Database trigger prevents `created_at` updates

**Violation**: Logic error. Immutable fields cannot be changed.

**Rationale**: Audit trail integrity, historical accuracy.

---

## Operational Invariants

### 17. Fred Polls, Never Pushes

**Rule**: Fred actively polls for work; Sonia does not push to Fred.

**Enforcement**:
- Fred's main loop uses `setInterval` for polling
- No webhook endpoints in Fred
- No event emitters from Sonia to Fred

**Violation**: Architectural violation. Push-based triggers are ignored.

**Rationale**: Backpressure control, Fred controls load.

---

### 18. Sonia Is Stateless Across Runs

**Rule**: Sonia does not maintain state between executions.

**Enforcement**:
- Sonia reads repository state fresh each run
- No persistent memory in Sonia
- All state written to CR or files

**Violation**: Logic error. Sonia state is not preserved.

**Rationale**: Reproducibility, idempotency, debugging simplicity.

---

### 19. No Infinite Loops

**Rule**: The system cannot create self-reinforcing execution cycles.

**Enforcement**:
- Status transitions are one-way
- Sonia does not auto-trigger on Fred's execution results
- Fred does not create new `cleaned` records

**Violation**: Architectural guarantee. Loops are structurally impossible.

**Rationale**: Stability, predictable resource usage.

---

### 20. Graceful Degradation

**Rule**: System operates with reduced functionality when dependencies are unavailable.

**Enforcement**:
- Sonia falls back to local files if Supabase unavailable
- Fred logs errors and retries if CR unavailable
- GitHub integration is optional

**Violation**: Degraded mode. Some features unavailable.

**Rationale**: Resilience, partial operation better than total failure.

---

## Verification

These invariants are verified through:

1. **Type System**: TypeScript/JSDoc type hints
2. **Runtime Checks**: Explicit validation in code
3. **Database Constraints**: Enums and check constraints
4. **Unit Tests**: Test suite validates behavior
5. **Code Review**: Manual verification during review
6. **Architecture Review**: Periodic validation of structure

---

## Modification Policy

These invariants are **immutable** by design. Changing them requires:

1. Architectural justification
2. Impact analysis
3. Migration plan
4. Breaking change notice
5. Major version bump

Proposals to modify invariants must demonstrate:
- Why the existing invariant is insufficient
- How the change maintains system integrity
- What backwards compatibility impact exists

---

## Enforcement Priority

**Hard Errors** (system fails):
- No execution without CR
- No state mutation without `last_actor`
- Invalid status transitions

**Logic Errors** (blocked but system continues):
- Agent communication attempts
- Invalid verdict writes
- Payload schema violations

**Degraded Mode** (logged but system adapts):
- Supabase unavailable
- GitHub API unavailable
- Optional integrations missing

---

*Last Updated: 2026-01-26*  
*Version: 1.0.0*
