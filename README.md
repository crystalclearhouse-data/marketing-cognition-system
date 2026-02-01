# Marketing Cognition System

The "forever-compounding" engine for marketing: **Sense → Decide → Act → Measure → Remember → Evolve**.

## The Loop

1.  **Sense**: Gather signals (questions, objections, wins, losses) from the market.
2.  **Decide**: Use Decision Rules to pivot, kill, or scale campaigns.
3.  **Act**: Execute campaigns and content.
4.  **Measure**: Track leading indicators and KPIs.
5.  **Remember**: Log insights in the Memory Vault.
6.  **Evolve**: Update Core Beliefs and Language Rules based on evidence.

## Weekly Cadence

This system runs on a **Weekly Cognition Review**.
- Review Signals Inbox.
- Review Active Experiments.
- Decide next week's Actions.
- Update Beliefs if necessary.

See [execution/weekly.md](execution/weekly.md) for the checklist.

## Execution Infrastructure

This repository implements a deterministic, fail-closed execution loop where **Sonia** (organizer) feeds **Fred** (executor) through a shared **Canonical Record**.

Execution and agent behavior are governed by strict invariants:
- See **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** for system design
- See **[INVARIANTS.md](docs/INVARIANTS.md)** for enforcement rules
- See **[SECRETS_GOVERNANCE.md](docs/SECRETS_GOVERNANCE.md)** for security policy

### Quick Start

```bash
# Run Sonia (organizer)
npm run sonia

# Run Fred (executor, continuous)
npm run fred

# View the status report
cat SONIA_STATUS.md
```

## Sonia Agent

**Sonia** (Structural Observation and Normalization Intelligence Agent) is an automated agent that monitors repository health and structure.

### Features
- 🔍 Scans repository structure for issues
- 📋 Detects and tracks TODOs and tasks
- 📊 Generates health metrics and reports
- 🤖 Proposes GitHub issues automatically (with human approval)
- 🔒 Read-only, deterministic, and fail-safe by design

See [docs/SONIA_AGENT.md](docs/SONIA_AGENT.md) for full documentation.

## Fred Agent

**Fred** is the execution agent that reads from the Canonical Record, makes deterministic decisions, and executes safe actions.

### Features
- 🔄 Polls Canonical Record for work
- ⚖️ Deterministic decision engine (SAFE/REVIEW/FAIL)
- 🎯 Allowlist-based execution safety
- 📝 Full audit trail in Canonical Record

See [docs/SONIA_FRED_LOOP.md](docs/SONIA_FRED_LOOP.md) for implementation details.

