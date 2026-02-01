# Sonia Agent Documentation

## Overview

**SONIA** (Structural Observation and Normalization Intelligence Agent) is a deterministic, read-only agent designed to scan repositories for structural issues, tasks, and activity signals.

## Core Principles

- ✅ **Read-Only**: Never modifies files without human approval
- ✅ **Deterministic**: Same input produces same output
- ✅ **Observable**: All actions logged and traceable
- ✅ **Fail-Safe**: Proposes changes, requires human approval

## Features

### 1. Repository Scanning
- Scans for missing required directories and files
- Detects TODO/FIXME comments in code
- Identifies unchecked tasks in markdown files
- Monitors repository activity via Git history

### 2. Health Metrics
- Calculates overall repository health score (0-100)
- Tracks structural issues, tasks, and signals
- Provides actionable insights

### 3. GitHub Integration
- Authenticates via GitHub App credentials
- Proposes issues based on findings (dry-run mode)
- Requires human approval before creating issues

### 4. Optional Integrations
- **Claude API**: For advanced code analysis (when `CLAUDE_API_KEY` is set)
- **Supabase**: For persistent logging (when `SUPABASE_URL` and `SUPABASE_KEY` are set)

## Installation

The agent is already included in the repository. Ensure dependencies are installed:

```bash
npm install
```

## Usage

### Basic Execution

Run the agent using npm:

```bash
npm run sonia
```

Or directly with Node:

```bash
node sonia.agent.js
```

### Output Files

After execution, Sonia generates:

1. **`SONIA_STATUS.md`** - Human-readable status report in the repository root
2. **`.sonia/sonia-findings.json`** - Detailed findings in JSON format
3. **`.sonia/github-proposals.json`** - Proposed GitHub issues (dry-run)

### Configuration

#### Environment Variables

Create a `.env.local` file (already gitignored) with:

```bash
# GitHub App Credentials (for issue creation)
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----"

# Optional: Claude API
CLAUDE_API_KEY=your_claude_api_key

# Optional: Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Disable GitHub integration (default: enabled)
ENABLE_GITHUB=false
```

## Workflow Integration

### GitHub Actions

Create `.github/workflows/sonia-scan.yml`:

```yaml
name: Sonia Agent Scan

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday
  workflow_dispatch: # Manual trigger

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Sonia Agent
        run: npm run sonia
        env:
          GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
          GITHUB_INSTALLATION_ID: ${{ secrets.GITHUB_INSTALLATION_ID }}
          GITHUB_PRIVATE_KEY: ${{ secrets.GITHUB_PRIVATE_KEY }}
      
      - name: Upload Status Report
        uses: actions/upload-artifact@v3
        with:
          name: sonia-report
          path: |
            SONIA_STATUS.md
            .sonia/sonia-findings.json
```

### Webhook Integration

To trigger Sonia on specific GitHub events:

1. Set up a webhook receiver endpoint
2. On webhook trigger, execute `npm run sonia`
3. Review generated proposals in `.sonia/github-proposals.json`
4. Manually approve and create issues as needed

## Understanding the Output

### SONIA_STATUS.md

```markdown
# SONIA STATUS REPORT

**Generated**: 2026-01-26T09:48:30.157Z
**Agent Version**: 1.0.0
**Repository**: crystalclearhouse-data/marketing-cognition-system

## Health Metrics
- **Health Score**: 100/100
- **Structural Issues**: 0
- **Tasks Found**: 4
- **Signals Detected**: 1

## Structural Findings
✅ No structural issues detected.

## Tasks & TODOs
### Unchecked Tasks (4)
- execution/day-0.md: 13 unchecked items
...
```

### Health Score Calculation

- **100**: Perfect health, no issues
- **-10 points**: Each structural error
- **-5 points**: Each structural warning
- **0**: Minimum score (severe issues)

## Development

### Module Structure

```
sonia.agent.js
├── RepositoryScanner      # Scans files and structure
├── GitHubIntegration      # GitHub API operations
├── ClaudeIntegration      # Claude API analysis
├── SupabaseIntegration    # Persistent storage
├── StatusReportGenerator  # Markdown report creation
└── SoniaAgent             # Main orchestrator
```

### Extending Sonia

Add custom scanners by modifying `RepositoryScanner`:

```javascript
async scanCustomMetric() {
  Logger.info('Scanning custom metric...');
  
  // Your scanning logic here
  
  this.findings.custom.push({
    type: 'custom_finding',
    severity: 'info',
    message: 'Custom metric detected',
  });
}
```

Then call it in the `scan()` method:

```javascript
async scan() {
  Logger.info('Starting repository scan...');
  
  await this.scanStructure();
  await this.scanTasks();
  await this.scanSignals();
  await this.scanCustomMetric(); // Add this
  await this.calculateMetrics();
  
  Logger.success('Repository scan complete');
  return this.findings;
}
```

## Testing

### Manual Testing

```bash
# Run the agent
npm run sonia

# View the report
cat SONIA_STATUS.md

# Check JSON findings
cat .sonia/sonia-findings.json
```

### Automated Testing

Create tests in `__tests__/sonia.test.js`:

```javascript
const { SoniaAgent, RepositoryScanner } = require('../sonia.agent');

describe('Sonia Agent', () => {
  test('Scanner detects missing directories', async () => {
    const scanner = new RepositoryScanner('/path/to/test/repo');
    const findings = await scanner.scan();
    
    expect(findings).toBeDefined();
    expect(findings.metrics.health_score).toBeGreaterThanOrEqual(0);
  });
});
```

## Security Considerations

- ✅ Never commits sensitive data
- ✅ Operates in read-only mode by default
- ✅ Requires explicit approval for GitHub operations
- ✅ Credentials stored in `.env.local` (gitignored)
- ✅ Fail-safe design: errors don't modify state

## Troubleshooting

### "GitHub credentials not found"

Create `.env.local` with GitHub App credentials (see Configuration section).

### "Module not found" errors

Run `npm install` to install dependencies.

### GitHub API rate limits

Use GitHub App authentication (higher rate limits) instead of personal access tokens.

### No TODOs detected

Ensure code files are in `src/`, `scripts/`, or `tools/` directories.

## Roadmap

Future enhancements:
- [ ] Real-time file watching for continuous monitoring
- [ ] Integration with more CI/CD platforms
- [ ] Custom rule definitions via config file
- [ ] Interactive CLI for selective issue creation
- [ ] Dependency vulnerability scanning
- [ ] Code quality metrics (cyclomatic complexity, etc.)

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review this documentation
3. Create a new issue with logs and context

---

**Version**: 1.0.0  
**License**: ISC  
**Repository**: https://github.com/crystalclearhouse-data/marketing-cognition-system
